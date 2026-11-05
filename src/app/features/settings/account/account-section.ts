import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../../core/auth/session-store';
import {
  apiErrorCode,
  classifyHttpError,
  genericErrorMessage,
} from '../../../core/http/http-error';
import { Theme, ThemeService } from '../../../core/theme/theme';
import { CurrentUserStore } from '../../../core/user/current-user-store';
import { UserApi } from '../../../core/user/user-api';
import { AreaStatus } from '../../../shared/ui/area-status/area-status';
import { FormAlert } from '../../../shared/ui/form-alert/form-alert';
import { Icon } from '../../../shared/ui/icon/icon';
import { PasswordField } from '../../../shared/ui/password-field/password-field';
import { StrengthMeter } from '../../../shared/ui/strength-meter/strength-meter';
import { ToastService } from '../../../shared/ui/toast/toast';
import {
  nameValidator,
  newPasswordValidator,
  passwordsDiffer,
  requiredPasswordValidator,
} from '../../../shared/validators/auth-validators';
import { fieldError } from '../../../shared/validators/field-error';
import * as t from '../settings.messages';
import { DeleteAccountDialog } from './delete-account-dialog';

const NAME_ERRORS = { required: t.ERR_NAME_REQUIRED, nameLength: t.ERR_NAME_LENGTH };
const NEW_PASSWORD_ERRORS = {
  required: t.ERR_NEW_SHORT,
  passwordShort: t.ERR_NEW_SHORT,
  passwordLong: t.ERR_NEW_LONG,
};

/**
 * Conta section (#tab-conta of configuracoes.html, RF-04 to RF-07): profile, password, theme and account deletion.
 * Each card saves on its own (RN-21, RN-25).
 */
@Component({
  selector: 'ws-account-section',
  imports: [
    ReactiveFormsModule,
    AreaStatus,
    DeleteAccountDialog,
    FormAlert,
    Icon,
    PasswordField,
    StrengthMeter,
  ],
  templateUrl: './account-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSection {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(UserApi);
  private readonly currentUser = inject(CurrentUserStore);
  private readonly session = inject(SessionStore);
  private readonly toast = inject(ToastService);
  protected readonly theme = inject(ThemeService);

  protected readonly t = t;

  readonly user = this.currentUser.user;
  readonly status = this.currentUser.status;

  protected readonly profileForm = this.fb.group({ name: ['', nameValidator] });
  protected readonly passwordForm = this.fb.group(
    {
      current: ['', requiredPasswordValidator],
      next: ['', newPasswordValidator],
    },
    { validators: [passwordsDiffer] },
  );

  readonly savingProfile = signal(false);
  readonly profileSubmitted = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly changingPassword = signal(false);
  readonly passwordSubmitted = signal(false);
  readonly passwordError = signal<string | null>(null);
  /** "Senha atual incorreta." until the current password is typed again (RN-05). */
  readonly currentWrong = signal(false);
  /** The delete dialog is open. */
  readonly deleting = signal(false);

  protected readonly newPassword = toSignal(this.passwordForm.controls.next.valueChanges, {
    initialValue: '',
  });

  private readonly profileEvents = toSignal(this.profileForm.events);
  private readonly passwordEvents = toSignal(this.passwordForm.events);

  protected readonly nameError = computed(() => {
    this.profileEvents();
    return this.profileSubmitted()
      ? fieldError(this.profileForm.controls.name.errors, NAME_ERRORS)
      : null;
  });
  protected readonly currentError = computed(() => {
    this.passwordEvents();
    if (!this.passwordSubmitted()) {
      return null;
    }
    if (this.currentWrong()) {
      return t.ERR_CURRENT_WRONG;
    }
    return this.passwordForm.controls.current.errors?.['required'] ? t.ERR_CURRENT_REQUIRED : null;
  });
  protected readonly nextError = computed(() => {
    this.passwordEvents();
    if (!this.passwordSubmitted()) {
      return null;
    }
    const own = fieldError(this.passwordForm.controls.next.errors, NEW_PASSWORD_ERRORS);
    return own ?? (this.passwordForm.errors?.['samePassword'] ? t.ERR_NEW_SAME : null);
  });

  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly currentField = viewChild.required<PasswordField>('currentField');
  private readonly nextField = viewChild.required<PasswordField>('nextField');

  constructor() {
    // The name starts with the user's, while the field has not been touched.
    effect(() => {
      const user = this.user();
      untracked(() => {
        if (user && this.profileForm.pristine) {
          this.profileForm.reset({ name: user.name });
        }
      });
    });
    this.passwordForm.controls.current.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.currentWrong.set(false));
  }

  async saveProfile(): Promise<void> {
    if (this.savingProfile()) {
      return;
    }
    this.profileSubmitted.set(true);
    this.profileError.set(null);
    const name = this.profileForm.controls.name;
    if (name.invalid) {
      this.nameInput()?.nativeElement.focus();
      return;
    }

    this.savingProfile.set(true);
    try {
      const user = await firstValueFrom(this.api.updateProfile({ name: name.value.trim() }));
      this.currentUser.setUser(user);
      this.profileForm.reset({ name: user.name });
      this.profileSubmitted.set(false);
      this.toast.show(t.TOAST_PROFILE_SAVED);
    } catch (error) {
      this.profileError.set(genericErrorMessage(classifyHttpError(error)));
    } finally {
      this.savingProfile.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.changingPassword()) {
      return;
    }
    this.passwordSubmitted.set(true);
    this.passwordError.set(null);
    const { current, next } = this.passwordForm.controls;
    if (current.invalid) {
      this.currentField().focus();
      return;
    }
    if (next.invalid || this.passwordForm.errors?.['samePassword']) {
      this.nextField().focus();
      return;
    }

    this.changingPassword.set(true);
    try {
      const tokens = await firstValueFrom(
        this.api.changePassword({ current_password: current.value, new_password: next.value }),
      );
      // The other devices are out; this one goes on with the new pair (ADR-02).
      this.session.save(tokens);
      this.passwordForm.reset();
      this.passwordSubmitted.set(false);
      this.toast.show(t.TOAST_PASSWORD_CHANGED);
    } catch (error) {
      if (apiErrorCode(error) === 'INVALID_PASSWORD') {
        current.setValue('');
        this.currentWrong.set(true);
        this.currentField().focus();
      } else {
        this.passwordError.set(genericErrorMessage(classifyHttpError(error)));
      }
    } finally {
      this.changingPassword.set(false);
    }
  }

  protected setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  protected retryProfile(): void {
    void this.currentUser.load();
  }
}
