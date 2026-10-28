import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { map, startWith, switchMap } from 'rxjs';

import { fieldErrorMessage } from '../validators/validation-messages';

export const LABEL_SHOW_PASSWORD = 'Mostrar senha';
export const LABEL_HIDE_PASSWORD = 'Ocultar senha';

/** RF-04: campo de senha com botão de mostrar/ocultar e a mensagem de erro do campo (RF-05). */
@Component({
  selector: 'app-password-field',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatIconButton,
    MatSuffix,
    MatIcon,
    MatError,
  ],
  templateUrl: './password-field.component.html',
  styleUrl: './password-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly kind = input.required<'password' | 'confirmPassword'>();
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');

  protected readonly visible = signal(false);
  protected readonly toggleLabel = computed(() =>
    this.visible() ? LABEL_HIDE_PASSWORD : LABEL_SHOW_PASSWORD,
  );

  /** Emite o controle a cada evento dele (valor, status, tocado). */
  private readonly controlEvents = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map(() => control),
        ),
      ),
    ),
    { initialValue: null, equal: () => false },
  );

  /**
   * `equal` sempre falso: o "tocado" muda sem mudar o texto, e o componente precisa ser verificado de novo para
   * o `mat-error` aparecer.
   */
  protected readonly errorMessage = computed(
    () => {
      const control = this.controlEvents();
      return control ? fieldErrorMessage(this.kind(), control.errors) : null;
    },
    { equal: () => false },
  );

  protected toggle(): void {
    this.visible.update((value) => !value);
  }
}
