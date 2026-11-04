import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parseIsoDate } from '../date/plain-date';
import { codePoints } from './text-measure';

const text = (control: AbstractControl): string =>
  typeof control.value === 'string' ? control.value : '';

/** Amount in cents below `min` → { minCents: true }. */
export const minCents =
  (min: number): ValidatorFn =>
  (control): ValidationErrors | null =>
    typeof control.value === 'number' && control.value >= min ? null : { minCents: true };

/** Empty after trimming → { required: true }. */
export const requiredTrimmed: ValidatorFn = (control): ValidationErrors | null =>
  text(control).trim() === '' ? { required: true } : null;

/** More than `max` code points after trimming → { maxCodePoints: { max } }. */
export const maxCodePointsTrimmed =
  (max: number): ValidatorFn =>
  (control): ValidationErrors | null =>
    codePoints(text(control).trim()) > max ? { maxCodePoints: { max } } : null;

/** Empty, not a calendar "YYYY-MM-DD" or a year outside 1–9999 → { required: true } (D-20). */
export const isoDate: ValidatorFn = (control): ValidationErrors | null =>
  parseIsoDate(text(control)) === null ? { required: true } : null;
