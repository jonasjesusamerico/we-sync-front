import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { utf8ByteLength } from './utf8';

export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;

/** RN-02: 8 a 72 bytes em UTF-8, sem `trim`. */
export const passwordValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (value === '') {
    return { required: true };
  }
  const bytes = utf8ByteLength(value);
  if (bytes < PASSWORD_MIN_BYTES) {
    return { passwordMinBytes: true };
  }
  if (bytes > PASSWORD_MAX_BYTES) {
    return { passwordMaxBytes: true };
  }
  return null;
};

/** RN-03: aplicado no controle de confirmação; compara com o irmão `passwordControlName`. */
export function confirmPasswordValidator(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    if (value === '') {
      return { required: true };
    }
    const password = control.parent?.get(passwordControlName)?.value;
    if (value !== password) {
      return { passwordMismatch: true };
    }
    return null;
  };
}
