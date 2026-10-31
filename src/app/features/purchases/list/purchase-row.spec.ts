import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { purchase } from '../../../../testing/purchases-contract';
import { formatBrlCurrency, toPurchaseRow } from './purchase-row';

registerLocaleData(localePt);

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('toPurchaseRow', () => {
  it('toPurchaseRow', () => {
    const row = toPurchaseRow(purchase());
    expect(row.date).toBe('05/10/2026');
    expect(plain(row.amount)).toBe('R$ 1.234,56');
    expect(row.statusLabel).toBe('Pago');
    expect(row.canceled).toBe(false);
    expect(row.category).toBe('Alimentação');
    expect(row.paymentMethod).toBe('Pix');
    expect(row.id).toBe(42);
  });

  it('o espaço depois de R$ é U+00A0', () => {
    expect(formatBrlCurrency(123456)).toBe('R$ 1.234,56');
  });

  it('valor sem zeros à direita', () => {
    expect(plain(toPurchaseRow(purchase({ amount: '89.9' })).amount)).toBe('R$ 89,90');
    expect(plain(toPurchaseRow(purchase({ amount: '10' })).amount)).toBe('R$ 10,00');
  });

  it('cancelado', () => {
    const row = toPurchaseRow(purchase({ status: 'CANCELED' }));
    expect(row.canceled).toBe(true);
    expect(row.statusLabel).toBe('Cancelado');
  });
});
