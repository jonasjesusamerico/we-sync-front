import { computed, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { startWith } from 'rxjs';

import { fieldErrorMessage, FieldKind } from './validation-messages';

/**
 * Mensagem do erro do campo, recalculada a cada evento do controle. `equal` sempre falso: o "tocado" muda sem
 * mudar o texto, e a tela precisa ser verificada de novo. Chame em contexto de injeção.
 */
export function controlErrorMessage(
  control: AbstractControl,
  kind: FieldKind,
): Signal<string | null> {
  return controlErrorFrom(control, (errors) => fieldErrorMessage(kind, errors));
}

/** Igual a `controlErrorMessage`, com a tradução dos erros escolhida por quem chama (feature 003). */
export function controlErrorFrom(
  control: AbstractControl,
  messageOf: (errors: ValidationErrors | null) => string | null,
): Signal<string | null> {
  const events = toSignal(control.events.pipe(startWith(null)), {
    initialValue: null,
    equal: () => false,
  });
  return computed(
    () => {
      events();
      return messageOf(control.errors);
    },
    { equal: () => false },
  );
}

/**
 * Mensagem para mostrar embaixo do campo: só com o campo tocado e inválido (`null` fora disso). Um envio inválido
 * mostra todos os erros porque o `submit` chama `markAllAsTouched()`; depois de um `reset`/`markAsUntouched`, o erro
 * some (RN-06 da 001). Chame em contexto de injeção.
 */
export function touchedErrorFrom(
  control: AbstractControl,
  messageOf: (errors: ValidationErrors | null) => string | null,
): Signal<string | null> {
  const message = controlErrorFrom(control, messageOf);
  return computed(() => {
    const text = message();
    return control.touched && control.invalid ? text : null;
  });
}

/** `touchedErrorFrom` com as mensagens comuns (e-mail, senha). */
export function touchedErrorMessage(
  control: AbstractControl,
  kind: FieldKind,
): Signal<string | null> {
  return touchedErrorFrom(control, (errors) => fieldErrorMessage(kind, errors));
}
