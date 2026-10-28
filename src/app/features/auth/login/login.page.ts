import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApi } from '../../../core/auth/auth.api';
import { sanitizeReturnUrl } from '../../../core/auth/return-url';
import { SessionStore } from '../../../core/auth/session.store';
import { genericErrorMessage, MSG_SERVER } from '../../../core/http/error-messages';
import { FormAlertComponent } from '../../../shared/form-alert/form-alert.component';
import { PasswordFieldComponent } from '../../../shared/password-field/password-field.component';
import { controlErrorMessage } from '../../../shared/validators/control-error-message';
import { emailValidator } from '../../../shared/validators/email.validator';
import { passwordValidator } from '../../../shared/validators/password.validators';
import {
  LABEL_EMAIL,
  LABEL_LOGIN,
  LABEL_PASSWORD,
  LoginNavigationState,
  MSG_INVALID_CREDENTIALS,
  MSG_REGISTERED,
  MSG_SESSION_EXPIRED,
} from '../auth.messages';

/**
 * Erro visível só com o campo tocado (e não por o formulário já ter sido enviado, como no padrão do Material).
 * Assim, depois do `401`, a senha limpa e "não tocada" não mostra `Informe a senha.` junto do aviso (RN-06). Um
 * envio inválido continua mostrando os erros, porque o `submit()` chama `markAllAsTouched()`.
 */
const touchedErrorStateMatcher: ErrorStateMatcher = {
  isErrorState: (control: AbstractControl | null) =>
    !!control && control.invalid && control.touched,
};

interface LoginAlert {
  kind: 'info' | 'error';
  message: string;
}

/** RF-03: login. Sucesso grava a sessão e volta à rota pedida (RN-09). */
@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatButton,
    MatProgressSpinner,
    PasswordFieldComponent,
    FormAlertComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: '../auth-page.scss',
  providers: [{ provide: ErrorStateMatcher, useValue: touchedErrorStateMatcher }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly navigationState = readNavigationState(inject(Location).getState());
  private readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: [this.navigationState.email ?? '', [emailValidator]],
    password: ['', [passwordValidator]],
  });

  readonly submitting = signal(false);
  readonly alert = signal<LoginAlert | null>(noticeAlert(this.navigationState.notice));

  protected readonly emailError = controlErrorMessage(this.form.controls.email, 'email');
  protected readonly text = {
    email: LABEL_EMAIL,
    password: LABEL_PASSWORD,
    login: LABEL_LOGIN,
  };

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.alert.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.form.controls.email.value.trim();
    const password = this.form.controls.password.value;
    this.submitting.set(true);
    this.api
      .login({ email, password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (tokens) => {
          const saved = this.store.save({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          if (!saved) {
            this.alert.set({ kind: 'error', message: MSG_SERVER });
            return;
          }
          void this.router.navigateByUrl(sanitizeReturnUrl(this.returnUrl, this.router), {
            replaceUrl: true,
          });
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.alert.set({ kind: 'error', message: MSG_INVALID_CREDENTIALS });
            const passwordControl = this.form.controls.password;
            passwordControl.reset('');
            passwordControl.markAsUntouched();
          } else {
            this.alert.set({ kind: 'error', message: genericErrorMessage(error) ?? MSG_SERVER });
          }
        },
      });
  }
}

/** Lê o `state` da navegação, ignorando campos de tipo errado ou fora da união. */
function readNavigationState(state: unknown): LoginNavigationState {
  if (typeof state !== 'object' || state === null) {
    return {};
  }
  const { email, notice } = state as Record<string, unknown>;
  const result: LoginNavigationState = {};
  if (typeof email === 'string') {
    result.email = email;
  }
  if (notice === 'registered' || notice === 'expired') {
    result.notice = notice;
  }
  return result;
}

function noticeAlert(notice: LoginNavigationState['notice']): LoginAlert | null {
  switch (notice) {
    case 'registered':
      return { kind: 'info', message: MSG_REGISTERED };
    case 'expired':
      return { kind: 'info', message: MSG_SESSION_EXPIRED };
    default:
      return null;
  }
}
