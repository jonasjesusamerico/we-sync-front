import { computed, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { startWith } from 'rxjs';

import { fieldErrorMessage, FieldKind } from './validation-messages';

/**
 * Mensagem do erro do campo, recalculada a cada evento do controle. `equal` sempre falso: o "tocado" muda sem
 * mudar o texto, e a tela precisa ser verificada de novo para o `mat-error` aparecer. Chame em contexto de injeção.
 */
export function controlErrorMessage(
  control: AbstractControl,
  kind: FieldKind,
): Signal<string | null> {
  const events = toSignal(control.events.pipe(startWith(null)), {
    initialValue: null,
    equal: () => false,
  });
  return computed(
    () => {
      events();
      return fieldErrorMessage(kind, control.errors);
    },
    { equal: () => false },
  );
}
