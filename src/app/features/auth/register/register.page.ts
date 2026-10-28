import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthApi } from '../../../core/auth/auth.api';
import { genericErrorMessage, MSG_SERVER } from '../../../core/http/error-messages';
import { FormAlertComponent } from '../../../shared/form-alert/form-alert.component';
import { PasswordFieldComponent } from '../../../shared/password-field/password-field.component';
import { controlErrorMessage } from '../../../shared/validators/control-error-message';
import { emailValidator } from '../../../shared/validators/email.validator';
import {
  confirmPasswordValidator,
  passwordValidator,
} from '../../../shared/validators/password.validators';
import {
  LABEL_CONFIRM_PASSWORD,
  LABEL_EMAIL,
  LABEL_LOGIN,
  LABEL_PASSWORD,
  LABEL_REGISTER,
  LoginNavigationState,
  MSG_EMAIL_TAKEN,
} from '../auth.messages';

type RegisterAlert = { kind: 'conflict' } | { kind: 'error'; message: string };

/** RF-02: cadastro. Sucesso leva ao login (RN-04); não abre sessão. */
@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatButton,
    MatProgressSpinner,
    PasswordFieldComponent,
    FormAlertComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: '../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [emailValidator]],
    password: ['', [passwordValidator]],
    confirmPassword: ['', [confirmPasswordValidator('password')]],
  });

  readonly submitting = signal(false);
  readonly alert = signal<RegisterAlert | null>(null);

  protected readonly emailError = controlErrorMessage(this.form.controls.email, 'email');
  protected readonly text = {
    email: LABEL_EMAIL,
    password: LABEL_PASSWORD,
    confirmPassword: LABEL_CONFIRM_PASSWORD,
    register: LABEL_REGISTER,
    login: LABEL_LOGIN,
    emailTaken: MSG_EMAIL_TAKEN,
  };

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() =>
        this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: true }),
      );
  }

  /** `state` do link "Entrar" do aviso de e-mail já cadastrado. */
  protected loginState(): LoginNavigationState {
    return { email: this.form.controls.email.value.trim() };
  }

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
      .register({ email, password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const state: LoginNavigationState = { email, notice: 'registered' };
          void this.router.navigate(['/login'], { state });
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.alert.set({ kind: 'conflict' });
          } else {
            this.alert.set({ kind: 'error', message: genericErrorMessage(error) ?? MSG_SERVER });
          }
        },
      });
  }
}
