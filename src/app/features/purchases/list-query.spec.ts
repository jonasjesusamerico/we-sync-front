import {
  canShiftMonth,
  clearFilters,
  isCanonical,
  isCurrentMonth,
  ListQuery,
  normalizeListQuery,
  readOrigin,
  shiftMonth,
  toApiParams,
  toRouteParams,
  withFilters,
  withMonth,
} from './list-query';

const now = new Date(2026, 9, 22, 12, 0);

const q = (
  year: number,
  month: number,
  status: ListQuery['status'] = null,
  categoryId: number | null = null,
  paymentMethodId: number | null = null,
  page = 1,
): ListQuery => ({ year, month, status, categoryId, paymentMethodId, page });

const CURRENT = q(2026, 10);

describe('list-query', () => {
  it('vazio → mês atual', () => {
    const result = normalizeListQuery({}, now);
    expect(result).toEqual(CURRENT);
    expect(isCanonical({}, result)).toBe(false);
  });

  it('canônico', () => {
    const raw = { ano: '2026', mes: '9', status: 'PENDING', pagina: '2' };
    const result = normalizeListQuery(raw, now);
    expect(result).toEqual(q(2026, 9, 'PENDING', null, null, 2));
    expect(isCanonical(raw, result)).toBe(true);
  });

  it('mês inválido', () => {
    for (const mes of ['13', '0', 'abc']) {
      expect(normalizeListQuery({ ano: '2026', mes }, now)).toEqual(CURRENT);
    }
  });

  it('ano inválido', () => {
    for (const ano of ['0', '10000', '20a6']) {
      expect(normalizeListQuery({ ano, mes: '5' }, now)).toEqual(CURRENT);
    }
  });

  it('só um dos dois', () => {
    expect(normalizeListQuery({ ano: '2025' }, now)).toEqual(CURRENT);
    expect(normalizeListQuery({ mes: '3' }, now)).toEqual(CURRENT);
  });

  it('status desconhecido', () => {
    for (const status of ['X', 'pending']) {
      const raw = { ano: '2026', mes: '10', status };
      const result = normalizeListQuery(raw, now);
      expect(result.status).toBeNull();
      expect(isCanonical(raw, result)).toBe(false);
    }
  });

  it('ids', () => {
    const result = normalizeListQuery({ ano: '2026', mes: '10', categoria: '1', forma: '4' }, now);
    expect(result.categoryId).toBe(1);
    expect(result.paymentMethodId).toBe(4);
  });

  it('ids inválidos', () => {
    for (const id of ['0', '-1', '1.5', 'abc', '99999999999999999']) {
      const result = normalizeListQuery({ ano: '2026', mes: '10', categoria: id, forma: id }, now);
      expect(result.categoryId).toBeNull();
      expect(result.paymentMethodId).toBeNull();
    }
  });

  it('página', () => {
    for (const pagina of ['0', '-1', 'x', '1']) {
      const result = normalizeListQuery({ ano: '2026', mes: '10', pagina }, now);
      expect(result.page).toBe(1);
      expect(toRouteParams(result)).not.toHaveProperty('pagina');
    }
  });

  it('página com zero à esquerda', () => {
    const raw = { ano: '2026', mes: '10', pagina: '02' };
    const result = normalizeListQuery(raw, now);
    expect(result.page).toBe(2);
    expect(isCanonical(raw, result)).toBe(false);
  });

  it('chave repetida', () => {
    const result = normalizeListQuery({ ano: '2026', mes: '10', status: ['PAID', 'PENDING'] }, now);
    expect(result.status).toBeNull();
  });

  it('chave estranha', () => {
    const raw = { ano: '2026', mes: '10', foo: '1' };
    expect(isCanonical(raw, normalizeListQuery(raw, now))).toBe(false);
  });

  it('toRouteParams', () => {
    const params = toRouteParams(q(2026, 9, 'PENDING', 1, 4, 2));
    expect(params).toEqual({
      ano: '2026',
      mes: '9',
      status: 'PENDING',
      categoria: '1',
      forma: '4',
      pagina: '2',
    });
    expect(Object.keys(params)).toEqual(['ano', 'mes', 'status', 'categoria', 'forma', 'pagina']);
  });

  it('toApiParams', () => {
    expect(toApiParams(q(2026, 9, 'PENDING', 1, 4, 2))).toEqual({
      year: '2026',
      month: '9',
      status: 'PENDING',
      category_id: '1',
      payment_method_id: '4',
      page: '2',
      page_size: '20',
    });
  });

  it('toApiParams sem filtros', () => {
    expect(toApiParams(CURRENT)).toEqual({
      year: '2026',
      month: '10',
      page: '1',
      page_size: '20',
    });
  });

  it('withMonth mantém filtros e volta à página 1', () => {
    const result = withMonth(q(2026, 10, 'PENDING', 1, null, 3), 2026, 9);
    expect(result).toEqual(q(2026, 9, 'PENDING', 1, null, 1));
  });

  it('shiftMonth vira o ano', () => {
    expect(shiftMonth(q(2026, 1), -1)).toEqual(q(2025, 12));
    expect(shiftMonth(q(2026, 12), 1)).toEqual(q(2027, 1));
  });

  it('limites', () => {
    expect(canShiftMonth(q(1, 1), -1)).toBe(false);
    expect(canShiftMonth(q(9999, 12), 1)).toBe(false);
    const first = q(1, 1);
    const last = q(9999, 12);
    expect(shiftMonth(first, -1)).toBe(first);
    expect(shiftMonth(last, 1)).toBe(last);
  });

  it('withFilters e clearFilters', () => {
    const base = q(2026, 10, null, null, null, 3);
    expect(withFilters(base, { status: 'PAID' })).toEqual(q(2026, 10, 'PAID', null, null, 1));
    expect(clearFilters(q(2026, 10, 'PAID', 1, 4, 3))).toEqual(q(2026, 10));
  });

  it('isCurrentMonth', () => {
    expect(isCurrentMonth({ year: 2026, month: 10 }, now)).toBe(true);
    expect(isCurrentMonth({ year: 2026, month: 9 }, now)).toBe(false);
  });

  it('readOrigin', () => {
    const origin = q(2026, 9, 'PENDING', null, null, 2);
    expect(readOrigin({ origin }, now)).toEqual(origin);
  });

  it('readOrigin ausente ou inválido', () => {
    for (const state of [
      null,
      undefined,
      'x',
      {},
      { origin: {} },
      { origin: { year: 2026, month: 13 } },
      { origin: { year: '2026', month: '9' } },
    ]) {
      expect(readOrigin(state, now)).toBeNull();
    }
  });

  it('readOrigin com filtro inválido', () => {
    const result = readOrigin({ origin: { ...q(2026, 9), status: 'X' } }, now);
    expect(result).toEqual(q(2026, 9));
  });
});
