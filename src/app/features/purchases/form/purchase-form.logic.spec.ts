import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import {
  CONTRACT_PURCHASE,
  CONTRACT_REQUEST,
  purchase,
} from '../../../../testing/purchases-contract';
import { ListQuery } from '../list-query';
import {
  emptyFormValue,
  fromPurchase,
  initialDate,
  PurchaseFormValue,
  savedMessage,
  snapshotOf,
  toRequest,
} from './purchase-form.logic';

registerLocaleData(localePt);

const NOW = new Date(2026, 9, 22, 12, 0);
const origin = (year: number, month: number): ListQuery => ({
  year,
  month,
  status: null,
  categoryId: null,
  paymentMethodId: null,
  page: 1,
});
const ymd = (d: Date | null) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];
const value = (patch: Partial<PurchaseFormValue> = {}): PurchaseFormValue => ({
  date: new Date(2026, 9, 5),
  description: 'Mercado',
  amount: '1.234,56',
  categoryId: 1,
  paymentMethodId: 4,
  status: 'PAID',
  ...patch,
});

describe('lógica do formulário', () => {
  it('initialDate', () => {
    expect(initialDate(null, NOW)).toEqual({ year: 2026, month: 10, day: 22 });
    expect(initialDate(origin(2026, 10), NOW)).toEqual({ year: 2026, month: 10, day: 22 });
    expect(initialDate(origin(2026, 9), NOW)).toEqual({ year: 2026, month: 9, day: 1 });
    expect(initialDate(origin(2025, 10), NOW)).toEqual({ year: 2025, month: 10, day: 1 });
  });

  it('emptyFormValue', () => {
    const v = emptyFormValue(null, NOW);
    expect(ymd(v.date)).toEqual([2026, 10, 22]);
    expect(v).toMatchObject({
      description: '',
      amount: '',
      categoryId: null,
      paymentMethodId: null,
      status: 'PAID',
    });
  });

  it('fromPurchase', () => {
    const v = fromPurchase(CONTRACT_PURCHASE);
    expect(ymd(v.date)).toEqual([2026, 10, 5]);
    expect(v.date?.getHours()).toBe(0);
    expect(v).toMatchObject({
      description: 'Mercado',
      amount: '1.234,56',
      categoryId: 1,
      paymentMethodId: 4,
      status: 'PAID',
    });
  });

  it('fromPurchase sem zeros', () => {
    expect(fromPurchase(purchase({ amount: '89.9' })).amount).toBe('89,90');
  });

  it('toRequest', () => {
    expect(toRequest(value({ description: '  Mercado  ' }))).toEqual(CONTRACT_REQUEST);
  });

  it('toRequest ano curto', () => {
    const date = new Date(2000, 0, 1);
    date.setFullYear(50, 0, 2);
    expect(toRequest(value({ date })).purchase_date).toBe('0050-01-02');
  });

  it('fotografia ignora espaços e formato', () => {
    expect(snapshotOf(value({ description: 'Mercado' }))).toBe(
      snapshotOf(value({ description: 'Mercado ' })),
    );
    expect(snapshotOf(value({ amount: '10' }))).toBe(snapshotOf(value({ amount: '10,00' })));
  });

  it('fotografia com data vazia ou inválida', () => {
    expect(snapshotOf(value({ date: null }))).toBe(snapshotOf(value({ date: new Date(NaN) })));
  });

  it('fotografia muda', () => {
    expect(snapshotOf(value({ status: 'PAID' }))).not.toBe(
      snapshotOf(value({ status: 'PENDING' })),
    );
  });

  it('savedMessage', () => {
    expect(savedMessage('2026-10-10', { year: 2026, month: 10 })).toBe('Lançamento salvo.');
    expect(savedMessage('2026-09-10', { year: 2026, month: 10 })).toBe(
      'Lançamento salvo em setembro de 2026.',
    );
    expect(savedMessage('2025-10-10', { year: 2026, month: 10 })).toBe(
      'Lançamento salvo em outubro de 2025.',
    );
  });
});
