import {
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
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../../core/auth/auth-api';
import { LoginNoticeState } from '../../../core/auth/login-notice';
import { sanitizeReturnUrl } from '../../../core/auth/return-url';
import { SessionStore } from '../../../core/auth/session-store';
import { RegisterRequest } from '../../../core/auth/session.models';
import { classifyHttpError, genericErrorMessage } from '../../../core/http/http-error';
import { AccessLayout } from '../../../layout/access/access-layout';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { PasswordField } from '../../../shared/ui/password-field/password-field';
import { StrengthMeter } from '../../../shared/ui/strength-meter/strength-meter';
import {
  emailValidator,
  nameValidator,
  newPasswordValidator,
} from '../../../shared/validators/auth-validators';
import { fieldError } from '../../../shared/validators/field-error';
import * as texts from '../auth.messages';

const NAME_ERRORS = { required: texts.MSG_NAME_REQUIRED, nameLength: texts.MSG_NAME_LENGTH };
const EMAIL_ERRORS = { required: texts.MSG_EMAIL_REQUIRED, email: texts.MSG_EMAIL_INVALID };
const PASSWORD_ERRORS = {
  required: texts.MSG_PASSWORD_REQUIRED,
  passwordShort: texts.MSG_PASSWORD_SHORT,
  passwordLong: texts.MSG_PASSWORD_LONG,
};

type RegisterError = { kind: 'taken' } | { kind: 'message'; text: string };

/** Register with automatic login (RF-09, ADR-11, DAS 3.2). */
@Component({
  selector: 'ws-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AccessLayout,
    FormAlert,
    Icon,
    PasswordField,
    StrengthMeter,
  ],
  templateUrl: './register-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authApi = inject(AuthApi);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  /** Query param (withComponentInputBinding). */
  readonly returnUrl = input<string>();

  protected readonly texts = texts;
  protected readonly form = this.fb.group({
    name: ['', nameValidator],
    email: ['', emailValidator],
    password: ['', newPasswordValidator],
  });
  protected readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<RegisterError | null>(null);
  readonly linkQuery = computed(() => {
    const raw = this.returnUrl();
    return raw ? { returnUrl: sanitizeReturnUrl(raw, this.router) } : {};
  });

  private readonly formEvents = toSignal(this.form.events);
  protected readonly nameError = computed(() => this.errorOf('name', NAME_ERRORS));
  protected readonly emailError = computed(() => this.errorOf('email', EMAIL_ERRORS));
  protected readonly passwordError = computed(() => this.errorOf('password', PASSWORD_ERRORS));

  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');
  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('emailInput');
  private readonly passwordField = viewChild.required(PasswordField);

  async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.error.set(null);
    const { name, email, password } = this.form.controls;
    if (name.invalid) {
      this.nameInput().nativeElement.focus();
      return;
    }
    if (email.invalid) {
      this.emailInput().nativeElement.focus();
      return;
    }
    if (password.invalid) {
      this.passwordField().focus();
      return;
    }

    this.submitting.set(true);
    const body: RegisterRequest = {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    };
    try {
      await firstValueFrom(this.authApi.register(body));
    } catch (error) {
      const kind = classifyHttpError(error);
      this.error.set(
        kind === 'conflict'
          ? { kind: 'taken' }
          : { kind: 'message', text: genericErrorMessage(kind) },
      );
      this.submitting.set(false);
      return;
    }

    try {
      const tokens = await firstValueFrom(
        this.authApi.login({ email: body.email, password: body.password }),
      );
      if (this.sessionStore.save(tokens)) {
        const target = sanitizeReturnUrl(this.returnUrl(), this.router);
        if (await this.router.navigateByUrl(target, { replaceUrl: true })) {
          return;
        }
      }
    } catch {
      // The account exists; the login page takes over (RN-05, exception).
    }
    const state: LoginNoticeState = { notice: 'account-created', email: body.email };
    const ok = await this.router
      .navigate(['/login'], { queryParams: this.linkQuery(), state, replaceUrl: true })
      .catch(() => false);
    if (!ok) {
      this.submitting.set(false);
    }
  }

  private errorOf(
    control: 'name' | 'email' | 'password',
    messages: Record<string, string>,
  ): string | null {
    this.formEvents();
    return this.submitted() ? fieldError(this.form.controls[control].errors, messages) : null;
  }
}
