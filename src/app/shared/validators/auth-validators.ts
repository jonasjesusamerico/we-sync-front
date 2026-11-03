import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { codePoints, utf8Bytes } from './text-measure';

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const EMAIL_MAX_BYTES = 254;
export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;
/** Same regex as the API. */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const text = (control: AbstractControl): string =>
  typeof control.value === 'string' ? control.value : '';

/** RN-01: trimmed; '' → required; code points outside 2..60 → nameLength. */
export const nameValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = text(control).trim();
  if (value === '') {
    return { required: true };
  }
  const length = codePoints(value);
  return length < NAME_MIN || length > NAME_MAX ? { nameLength: true } : null;
};

/** RN-02: trimmed; '' → required; more than 254 bytes or outside EMAIL_PATTERN → email. */
export const emailValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = text(control).trim();
  if (value === '') {
    return { required: true };
  }
  return utf8Bytes(value) > EMAIL_MAX_BYTES || !EMAIL_PATTERN.test(value) ? { email: true } : null;
};

/** RN-03 (register): not trimmed; '' → required; < 8 bytes → passwordShort; > 72 bytes → passwordLong. */
export const newPasswordValidator: ValidatorFn = (control): ValidationErrors | null => {
  const value = text(control);
  if (value === '') {
    return { required: true };
  }
  const bytes = utf8Bytes(value);
  if (bytes < PASSWORD_MIN_BYTES) {
    return { passwordShort: true };
  }
  return bytes > PASSWORD_MAX_BYTES ? { passwordLong: true } : null;
};

/** Login password (RF-10): only required, not trimmed. */
export const requiredPasswordValidator: ValidatorFn = (control): ValidationErrors | null =>
  text(control) === '' ? { required: true } : null;
