import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { utf8ByteLength } from './utf8';

export const EMAIL_MAX_BYTES = 254;
/** Igual ao da API (`auth.validateEmail`). */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * RN-01. Uma regra por vez: vazio, tamanho (em bytes, sobre o valor em minúsculas, como a API mede) e formato.
 * O `trim` vale só para validar; quem envia faz o `trim` de novo.
 */
export const emailValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return { required: true };
  }
  if (utf8ByteLength(value.toLowerCase()) > EMAIL_MAX_BYTES) {
    return { emailMaxBytes: true };
  }
  if (!EMAIL_PATTERN.test(value)) {
    return { emailFormat: true };
  }
  return null;
};
