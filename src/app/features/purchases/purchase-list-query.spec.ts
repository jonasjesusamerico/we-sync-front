import type { Params } from '@angular/router';
import {
  type PurchaseListQuery,
  clearFilters,
  hasFilters,
  normalizePurchaseListQuery,
  toApiQuery,
  toQueryParams,
  withCategory,
  withMonth,
  withPage,
  withSearch,
  withStatus,
} from './purchase-list-query';

const TODAY = { year: 2026, month: 11, day: 10 };
const normalize = (params: Params) => normalizePurchaseListQuery(params, TODAY);

const BASE: PurchaseListQuery = {
  year: 2026,
  month: 9,
  search: '',
  categoryId: null,
  status: null,
  page: 1,
};

describe('purchase-list-query', () => {
  it('lista: canônico', () => {
    const params = { ano: '2026', mes: '9', busca: 'uber', situacao: 'pendente', pagina: '2' };
    const result = normalize(params);
    expect(result.changed).toBe(false);
    expect(toQueryParams(result.value)).toEqual(params);
    expect(toApiQuery(result.value)).toEqual({
      year: 2026,
      month: 9,
      page: 2,
      page_size: 8,
      q: 'uber',
      status: 'PENDING',
    });
  });

  it('lista: inválidos', () => {
    expect(normalize({ ano: '2026', mes: '13', situacao: 'X' })).toEqual({
      value: { ...BASE, month: 11 },
      changed: true,
    });
  });

  it.each(['0', '-1', 'abc', '05', '1234567890'])('lista: página %j vira 1', (pagina) => {
    const result = normalize({ ano: '2026', mes: '9', pagina });
    expect(result.value.page).toBe(1);
    expect(result.changed).toBe(true);
    expect(toQueryParams(result.value)).not.toHaveProperty('pagina');
  });

  it('lista: página 1 sai do endereço; 123456789 fica', () => {
    expect(normalize({ ano: '2026', mes: '9', pagina: '1' }).changed).toBe(true);
    expect(normalize({ ano: '2026', mes: '9', pagina: '123456789' })).toEqual({
      value: { ...BASE, page: 123456789 },
      changed: false,
    });
  });

  it('lista: busca', () => {
    expect(normalize({ ano: '2026', mes: '9', busca: '  mercado  ' }).value.search).toBe('mercado');
    expect(normalize({ ano: '2026', mes: '9', busca: '   ' }).value.search).toBe('');
    const long = normalize({ ano: '2026', mes: '9', busca: 'á'.repeat(300) });
    expect(Array.from(long.value.search)).toHaveLength(255);
    expect(long.changed).toBe(true);
    const emoji = normalize({ ano: '2026', mes: '9', busca: '😀'.repeat(256) });
    expect(Array.from(emoji.value.search)).toHaveLength(255);
  });

  it('lista: busca cortada é estável (o corte não deixa espaço no fim)', () => {
    const first = normalize({ ano: '2026', mes: '9', busca: 'a'.repeat(254) + ' b' });
    expect(first.value.search).toBe('a'.repeat(254));
    expect(normalize(toQueryParams(first.value)).changed).toBe(false);
  });

  it.each([
    ['abc', null],
    ['0', null],
    ['31', 31],
    ['123456789012345', 123456789012345],
    ['1234567890123456', null],
  ])('lista: categoria %j', (categoria, expected) => {
    expect(normalize({ ano: '2026', mes: '9', categoria }).value.categoryId).toBe(expected);
  });

  it('lista: chave estranha e valor repetido', () => {
    expect(normalize({ ano: '2026', mes: '9', x: '1' })).toEqual({ value: BASE, changed: true });
    expect(normalize({ ano: '2026', mes: '9', busca: ['a', 'b'] })).toEqual({
      value: BASE,
      changed: true,
    });
  });

  it('trocar mês mantém filtros', () => {
    const q = { ...BASE, search: 'uber', categoryId: 31, status: 'paga' as const, page: 3 };
    expect(withMonth(q, { year: 2026, month: 10 })).toEqual({ ...q, month: 10, page: 1 });
  });

  it('filtros vão para a página 1', () => {
    const q = { ...BASE, search: 'uber', categoryId: 31, status: 'paga' as const, page: 3 };
    expect(withSearch(q, '  pão ').page).toBe(1);
    expect(withSearch(q, '  pão ').search).toBe('pão');
    expect(withCategory(q, 2)).toEqual({ ...q, categoryId: 2, page: 1 });
    expect(withStatus(q, null)).toEqual({ ...q, status: null, page: 1 });
    expect(clearFilters(q)).toEqual(BASE);
    expect(withPage(q, 2).page).toBe(2);
  });

  it('hasFilters', () => {
    expect(hasFilters(BASE)).toBe(false);
    expect(hasFilters({ ...BASE, page: 3 })).toBe(false);
    expect(hasFilters({ ...BASE, search: 'x' })).toBe(true);
    expect(hasFilters({ ...BASE, categoryId: 1 })).toBe(true);
    expect(hasFilters({ ...BASE, status: 'cancelada' })).toBe(true);
  });

  it('toApiQuery com categoria e Cancelada', () => {
    expect(toApiQuery({ ...BASE, categoryId: 31, status: 'cancelada' })).toEqual({
      year: 2026,
      month: 9,
      page: 1,
      page_size: 8,
      status: 'CANCELED',
      category_id: 31,
    });
  });
});
