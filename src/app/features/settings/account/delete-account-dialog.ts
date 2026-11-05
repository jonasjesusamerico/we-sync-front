import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionEnd } from '../../../core/auth/session-end';
import {
  apiErrorCode,
  classifyHttpError,
  genericErrorMessage,
} from '../../../core/http/http-error';
import { UserApi } from '../../../core/user/user-api';
import { FormDialog } from '../../../shared/ui/dialog/form-dialog';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { PasswordField } from '../../../shared/ui/password-field/password-field';
import { requiredPasswordValidator } from '../../../shared/validators/auth-validators';
import * as t from '../settings.messages';

/**
 * Delete the account (#delete-modal of configuracoes.html, RN-08 to RN-10, ADR-04, ADR-16): asks for the password;
 * 204 ends the session with the notice on the login page. Open while it exists (ws-form-dialog).
 */
@Component({
  selector: 'ws-delete-account-dialog',
  imports: [ReactiveFormsModule, FormDialog, FormAlert, Icon, PasswordField],
  templateUrl: './delete-account-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(UserApi);
  private readonly sessionEnd = inject(SessionEnd);

  /** Cancelar or Esc: the page removes the dialog. */
  readonly closed = output<void>();

  protected readonly t = t;
  protected readonly form = this.fb.group({ password: ['', requiredPasswordValidator] });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  /** "Senha incorreta." until the password is typed again (RN-09). */
  readonly wrong = signal(false);
  readonly error = signal<string | null>(null);

  private readonly formEvents = toSignal(this.form.events);
  protected readonly passwordError = computed(() => {
    this.formEvents();
    if (!this.submitted()) {
      return null;
    }
    if (this.wrong()) {
      return t.ERR_PASSWORD_WRONG;
    }
    return this.form.controls.password.errors?.['required'] ? t.ERR_PASSWORD_REQUIRED : null;
  });

  private readonly passwordField = viewChild.required(PasswordField);

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.wrong.set(false));
  }

  protected cancel(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.error.set(null);
    const password = this.form.controls.password;
    if (password.invalid) {
      this.passwordField().focus();
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(this.api.deleteAccount({ password: password.value }));
    } catch (error) {
      this.submitting.set(false);
      if (apiErrorCode(error) === 'INVALID_PASSWORD') {
        password.setValue('');
        this.wrong.set(true);
        this.passwordField().focus();
      } else {
        this.error.set(genericErrorMessage(classifyHttpError(error)));
      }
      return;
    }
    // The page goes away with the navigation; the button stays busy until then.
    this.sessionEnd.accountDeleted();
  }
}
