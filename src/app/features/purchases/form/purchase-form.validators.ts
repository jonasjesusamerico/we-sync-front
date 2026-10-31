import { ValidationErrors, ValidatorFn } from '@angular/forms';

import { AMOUNT_MAX_CENTS, parseBrl } from '../money';
import {
  MSG_AMOUNT_MAX,
  MSG_AMOUNT_POSITIVE,
  MSG_AMOUNT_REQUIRED,
  MSG_CATEGORY_GONE,
  MSG_CATEGORY_REQUIRED,
  MSG_DATE_INVALID,
  MSG_DATE_REQUIRED,
  MSG_DESCRIPTION_MAX,
  MSG_DESCRIPTION_REQUIRED,
  MSG_PAYMENT_METHOD_GONE,
  MSG_PAYMENT_METHOD_REQUIRED,
} from '../purchase.messages';

export const DESCRIPTION_MAX_CHARS = 255;

/** RN-01: descrição obrigatória depois do `trim`, até 255 caracteres (code points, como a API). */
export const descriptionValidator: ValidatorFn = (control) => {
  const text = String(control.value ?? '').trim();
  if (text === '') {
    return { required: true };
  }
  return [...text].length > DESCRIPTION_MAX_CHARS ? { maxChars: true } : null;
};

/** RN-01: valor obrigatório, maior que zero e até R$ 99.999.999,99. */
export const amountValidator: ValidatorFn = (control) => {
  const cents = parseBrl(String(control.value ?? ''));
  if (cents === null) {
    return { required: true };
  }
  if (cents === 0) {
    return { notPositive: true };
  }
  return cents > AMOUNT_MAX_CENTS ? { max: true } : null;
};

export type PurchaseField = 'date' | 'description' | 'amount' | 'categoryId' | 'paymentMethodId';

/** Chave do erro → mensagem, na ordem em que são conferidas. */
const MESSAGES: Record<PurchaseField, readonly (readonly [string, string])[]> = {
  date: [
    ['matDatepickerParse', MSG_DATE_INVALID],
    ['required', MSG_DATE_REQUIRED],
  ],
  description: [
    ['required', MSG_DESCRIPTION_REQUIRED],
    ['maxChars', MSG_DESCRIPTION_MAX],
  ],
  amount: [
    ['required', MSG_AMOUNT_REQUIRED],
    ['notPositive', MSG_AMOUNT_POSITIVE],
    ['max', MSG_AMOUNT_MAX],
  ],
  categoryId: [
    ['gone', MSG_CATEGORY_GONE],
    ['required', MSG_CATEGORY_REQUIRED],
  ],
  paymentMethodId: [
    ['gone', MSG_PAYMENT_METHOD_GONE],
    ['required', MSG_PAYMENT_METHOD_REQUIRED],
  ],
};

export function purchaseFieldError(
  field: PurchaseField,
  errors: ValidationErrors | null,
): string | null {
  if (!errors) {
    return null;
  }
  return MESSAGES[field].find(([key]) => errors[key] != null)?.[1] ?? null;
}
