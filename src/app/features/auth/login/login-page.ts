import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { LoginNotice, readLoginNotice, withoutLoginNotice } from '../../../core/auth/login-notice';
import { sanitizeReturnUrl } from '../../../core/auth/return-url';
import { SessionStore } from '../../../core/auth/session-store';
import { TokenResponse } from '../../../core/auth/session.models';
import { MSG_SERVER } from '../../../core/http/error-messages';
import { classifyHttpError, genericErrorMessage } from '../../../core/http/http-error';
import { AccessLayout } from '../../../layout/access/access-layout';
import { FormAlert, FormAlertKind } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { PasswordField } from '../../../shared/ui/password-field/password-field';
import { SoonDirective } from '../../../shared/ui/soon/soon';
import {
  emailValidator,
  requiredPasswordValidator,
} from '../../../shared/validators/auth-validators';
import { fieldError } from '../../../shared/validators/field-error';
import * as texts from '../auth.messages';

const EMAIL_ERRORS = { required: texts.MSG_EMAIL_REQUIRED, email: texts.MSG_EMAIL_INVALID };
const PASSWORD_ERRORS = { required: texts.MSG_PASSWORD_REQUIRED };

/** Login (RF-08, DAS 3.1). */
@Component({
  selector: 'ws-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AccessLayout,
    FormAlert,
    Icon,
    PasswordField,
    SoonDirective,
  ],
  templateUrl: './login-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /** Query param (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  protected readonly texts = texts;
  protected readonly form = this.fb.group({
    email: ['', emailValidator],
    password: ['', requiredPasswordValidator],
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly notice = signal<LoginNotice | null>(
    readLoginNotice(this.router.currentNavigation()?.extras.state ?? this.location.getState()),
  );
  readonly error = signal<string | null>(null);
  readonly linkQuery = computed(() => {
    const raw = this.returnUrl();
    return raw ? { returnUrl: sanitizeReturnUrl(raw, this.router) } : {};
  });

  private readonly formEvents = toSignal(this.form.events);
  protected readonly emailError = computed(() => {
    this.formEvents();
    return this.submitted() ? fieldError(this.form.controls.email.errors, EMAIL_ERRORS) : null;
  });
  protected readonly passwordError = computed(() => {
    this.formEvents();
    return this.submitted()
      ? fieldError(this.form.controls.password.errors, PASSWORD_ERRORS)
      : null;
  });

  protected readonly alert = computed<{ kind: FormAlertKind; text: string } | null>(() => {
    const error = this.error();
    if (error) {
      return { kind: 'error', text: error };
    }
    const notice = this.notice();
    if (notice?.kind === 'session-expired') {
      return { kind: 'info', text: texts.MSG_SESSION_EXPIRED };
    }
    if (notice?.kind === 'account-created') {
      return { kind: 'success', text: texts.MSG_ACCOUNT_CREATED };
    }
    return null;
  });

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordField = viewChild.required(PasswordField);

  constructor() {
    const notice = this.notice();
    if (notice?.kind === 'account-created') {
      this.form.controls.email.setValue(notice.email);
    }
    afterNextRender(() => {
      if (notice?.kind === 'account-created') {
        this.passwordField().focus();
      }
      // ADR-15: the notice must not come back when the page is reloaded.
      const state = this.location.getState();
      if (readLoginNotice(state) || (state && typeof state === 'object' && 'notice' in state)) {
        this.location.replaceState(this.location.path(true), '', withoutLoginNotice(state));
      }
    });
  }

  async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.error.set(null);
    this.notice.set(null);
    const { email, password } = this.form.controls;
    if (email.invalid) {
      this.emailInput().nativeElement.focus();
      return;
    }
    if (password.invalid) {
      this.passwordField().focus();
      return;
    }

    this.submitting.set(true);
    let tokens: TokenResponse;
    try {
      tokens = await firstValueFrom(
        this.authApi.login({ email: email.value.trim(), password: password.value }),
      );
    } catch (error) {
      const kind = classifyHttpError(error);
      if (kind === 'unauthorized') {
        this.error.set(texts.MSG_INVALID_CREDENTIALS);
        password.setValue('');
        this.submitted.set(false);
        this.passwordField().focus();
      } else {
        this.error.set(genericErrorMessage(kind));
      }
      this.submitting.set(false);
      return;
    }

    if (!this.sessionStore.save(tokens)) {
      this.error.set(MSG_SERVER);
      this.submitting.set(false);
      return;
    }

    try {
      const target = sanitizeReturnUrl(this.returnUrl(), this.router);
      const ok = await this.router.navigateByUrl(target, { replaceUrl: true });
      if (!ok) {
        this.submitting.set(false);
      }
    } catch {
      this.error.set(MSG_SERVER);
      this.submitting.set(false);
    }
  }
}
