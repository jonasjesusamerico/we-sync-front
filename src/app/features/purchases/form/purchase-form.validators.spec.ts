import { FormControl } from '@angular/forms';

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
import {
  amountValidator,
  descriptionValidator,
  purchaseFieldError,
} from './purchase-form.validators';

const run = (validator: typeof amountValidator, value: unknown) =>
  validator(new FormControl(value));

describe('validadores do lançamento', () => {
  it('descrição', () => {
    const cases: [string, unknown][] = [
      ['', { required: true }],
      ['   ', { required: true }],
      ['a'.repeat(255), null],
      ['a'.repeat(256), { maxChars: true }],
      [' ' + 'a'.repeat(255) + ' ', null],
      ['😀'.repeat(255), null],
    ];
    for (const [value, expected] of cases) {
      expect(run(descriptionValidator, value)).toEqual(expected);
    }
  });

  it('valor', () => {
    const cases: [string, unknown][] = [
      ['', { required: true }],
      ['0', { notPositive: true }],
      ['0,00', { notPositive: true }],
      ['0,01', null],
      ['99.999.999,99', null],
      ['100.000.000,00', { max: true }],
      [',', { required: true }],
    ];
    for (const [value, expected] of cases) {
      expect(run(amountValidator, value)).toEqual(expected);
    }
  });

  it('mensagens', () => {
    expect(purchaseFieldError('date', { matDatepickerParse: { text: 'x' } })).toBe(
      MSG_DATE_INVALID,
    );
    expect(purchaseFieldError('date', { required: true })).toBe(MSG_DATE_REQUIRED);
    expect(purchaseFieldError('date', { matDatepickerParse: { text: 'x' }, required: true })).toBe(
      'Data inválida.',
    );
    expect(purchaseFieldError('description', { required: true })).toBe(MSG_DESCRIPTION_REQUIRED);
    expect(purchaseFieldError('description', { maxChars: true })).toBe(MSG_DESCRIPTION_MAX);
    expect(purchaseFieldError('amount', { required: true })).toBe(MSG_AMOUNT_REQUIRED);
    expect(purchaseFieldError('amount', { notPositive: true })).toBe(MSG_AMOUNT_POSITIVE);
    expect(purchaseFieldError('amount', { max: true })).toBe(MSG_AMOUNT_MAX);
    expect(purchaseFieldError('categoryId', { gone: true })).toBe(MSG_CATEGORY_GONE);
    expect(purchaseFieldError('categoryId', { required: true })).toBe(MSG_CATEGORY_REQUIRED);
    expect(purchaseFieldError('paymentMethodId', { gone: true })).toBe(MSG_PAYMENT_METHOD_GONE);
    expect(purchaseFieldError('paymentMethodId', { required: true })).toBe(
      MSG_PAYMENT_METHOD_REQUIRED,
    );
    expect(purchaseFieldError('amount', null)).toBeNull();
  });
});
