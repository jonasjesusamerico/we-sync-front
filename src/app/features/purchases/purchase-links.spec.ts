import { DefaultUrlSerializer } from '@angular/router';
import {
  type PurchaseOrigin,
  destinationOf,
  initialDate,
  originFromUrl,
  originState,
  readPurchaseOrigin,
  savedToast,
} from './purchase-links';
import type { PurchaseListQuery } from './purchase-list-query';

const TODAY = { year: 2026, month: 11, day: 10 };
const url = (text: string) => new DefaultUrlSerializer().parse(text);

const SEPTEMBER_UBER: PurchaseListQuery = {
  year: 2026,
  month: 9,
  search: 'uber',
  categoryId: null,
  status: null,
  page: 2,
};
const FROM_PURCHASES: PurchaseOrigin = { screen: 'compras', query: SEPTEMBER_UBER };
const FROM_PURCHASES_NOV: PurchaseOrigin = {
  screen: 'compras',
  query: { ...SEPTEMBER_UBER, month: 11, search: '', page: 1 },
};
const FROM_HOME_SEP: PurchaseOrigin = { screen: 'inicio', year: 2026, month: 9 };
const FROM_HOME_NOV: PurchaseOrigin = { screen: 'inicio', year: 2026, month: 11 };

describe('purchase-links', () => {
  it('originFromUrl', () => {
    expect(originFromUrl(url('/compras?ano=2026&mes=9&busca=uber'), TODAY)).toEqual({
      screen: 'compras',
      query: { ...SEPTEMBER_UBER, page: 1 },
    });
    expect(originFromUrl(url('/inicio?ano=2026&mes=9'), TODAY)).toEqual(FROM_HOME_SEP);
    expect(originFromUrl(url('/inicio'), TODAY)).toEqual(FROM_HOME_NOV);
    expect(originFromUrl(url('/compras/nova'), TODAY)).toBeNull();
    expect(originFromUrl(url('/compras/42'), TODAY)).toBeNull();
    expect(originFromUrl(url('/login'), TODAY)).toBeNull();
    expect(originFromUrl(url('/'), TODAY)).toBeNull();
  });

  it('readPurchaseOrigin', () => {
    expect(readPurchaseOrigin(originState(FROM_PURCHASES), TODAY)).toEqual(FROM_PURCHASES);
    expect(readPurchaseOrigin(originState(FROM_HOME_SEP), TODAY)).toEqual(FROM_HOME_SEP);
    expect(readPurchaseOrigin(null, TODAY)).toBeNull();
    expect(readPurchaseOrigin({ wsOrigin: '/x' }, TODAY)).toBeNull();
    expect(
      readPurchaseOrigin({ wsOrigin: { screen: 'inicio', year: 2026, month: 13 } }, TODAY),
    ).toBeNull();
    expect(
      readPurchaseOrigin({ wsOrigin: { screen: 'inicio', year: '2026', month: 9 } }, TODAY),
    ).toBeNull();
    expect(readPurchaseOrigin({ wsOrigin: { screen: 'compras' } }, TODAY)).toBeNull();
    expect(readPurchaseOrigin({ wsOrigin: { screen: 'outra' } }, TODAY)).toBeNull();
  });

  it('readPurchaseOrigin normaliza a query de Compras', () => {
    const state = {
      wsOrigin: { screen: 'compras', query: { year: 2026, month: 9, search: ' x ', page: 0 } },
    };
    expect(readPurchaseOrigin(state, TODAY)).toEqual({
      screen: 'compras',
      query: { ...SEPTEMBER_UBER, search: 'x', page: 1 },
    });
  });

  it('originState', () => {
    expect(originState(FROM_HOME_SEP)).toEqual({ wsOrigin: FROM_HOME_SEP });
    expect(originState(null)).toBeUndefined();
  });

  it('destinationOf', () => {
    expect(destinationOf(FROM_PURCHASES, TODAY)).toEqual({
      path: '/compras',
      queryParams: { ano: '2026', mes: '9', busca: 'uber', pagina: '2' },
    });
    expect(destinationOf(FROM_HOME_SEP, TODAY)).toEqual({
      path: '/inicio',
      queryParams: { ano: '2026', mes: '9' },
    });
    expect(destinationOf(null, TODAY)).toEqual({
      path: '/compras',
      queryParams: { ano: '2026', mes: '11' },
    });
  });

  it('initialDate', () => {
    expect(initialDate(FROM_PURCHASES, TODAY)).toEqual({ year: 2026, month: 9, day: 1 });
    expect(initialDate(FROM_HOME_NOV, TODAY)).toEqual(TODAY);
    expect(initialDate(null, TODAY)).toEqual(TODAY);
  });

  it('savedToast', () => {
    expect(savedToast('2026-09-10', FROM_PURCHASES_NOV, TODAY)).toBe(
      'Compra salva em setembro de 2026',
    );
    expect(savedToast('2026-11-05', FROM_PURCHASES_NOV, TODAY)).toBe('Compra salva com sucesso');
    expect(savedToast('2026-11-05', FROM_HOME_SEP, TODAY)).toBe('Compra salva em novembro de 2026');
    expect(savedToast('2026-11-05', null, TODAY)).toBe('Compra salva com sucesso');
  });
});
