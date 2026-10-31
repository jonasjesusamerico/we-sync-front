import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

import { fieldErrorMessage } from '../validators/validation-messages';

export const LABEL_SHOW_PASSWORD = 'Mostrar senha';
export const LABEL_HIDE_PASSWORD = 'Ocultar senha';

let nextId = 0;

/** RF-04: campo de senha com botão de mostrar/ocultar e a mensagem de erro do campo (RF-05). */
@Component({
  selector: 'app-password-field',
  imports: [ReactiveFormsModule],
  templateUrl: './password-field.component.html',
  styles: `
    :host {
      display: block;
    }

    .toggle {
      font-size: 1.4rem;
      line-height: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFieldComponent {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly kind = input.required<'password' | 'confirmPassword'>();
  readonly autocomplete = input<'current-password' | 'new-password'>('current-password');

  protected readonly inputId = `password-field-${nextId++}`;
  protected readonly errorId = `${this.inputId}-error`;
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

  /** Erro embaixo do campo, só com o campo tocado e inválido (como `touchedErrorFrom`). */
  protected readonly errorMessage = computed(() => {
    const control = this.controlEvents();
    return control && control.touched && control.invalid
      ? fieldErrorMessage(this.kind(), control.errors)
      : null;
  });

  protected toggle(): void {
    this.visible.update((value) => !value);
  }
}
