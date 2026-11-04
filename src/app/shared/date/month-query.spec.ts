import type { Params } from '@angular/router';
import { monthQueryParams, normalizeMonthQuery, parseMonthParams } from './month-query';

const TODAY = { year: 2026, month: 11, day: 10 };
const NOVEMBER = { year: 2026, month: 11 };

describe('month-query', () => {
  it('normalizeMonthQuery válido', () => {
    expect(normalizeMonthQuery({ ano: '2026', mes: '9' }, TODAY)).toEqual({
      value: { year: 2026, month: 9 },
      changed: false,
    });
  });

  it.each<[Params, { year: number; month: number }]>([
    [{}, NOVEMBER],
    [{ ano: '2026' }, NOVEMBER],
    [{ ano: '2026', mes: '13' }, NOVEMBER],
    [{ ano: '0', mes: '1' }, NOVEMBER],
    [{ ano: '10000', mes: '1' }, NOVEMBER],
    [
      { ano: '2026', mes: '09' },
      { year: 2026, month: 9 },
    ],
    [{ ano: '2026', mes: ['1', '2'] }, NOVEMBER],
    [
      { ano: '2026', mes: '9', x: '1' },
      { year: 2026, month: 9 },
    ],
  ])('normalizeMonthQuery inválido: %o', (params, value) => {
    expect(normalizeMonthQuery(params, TODAY)).toEqual({ value, changed: true });
  });

  it('parseMonthParams nos limites', () => {
    expect(parseMonthParams({ ano: '1', mes: '1' })).toEqual({ year: 1, month: 1 });
    expect(parseMonthParams({ ano: '9999', mes: '12' })).toEqual({ year: 9999, month: 12 });
    expect(parseMonthParams({ ano: '2026', mes: '0' })).toBeNull();
    expect(parseMonthParams({ ano: '2026', mes: '1.5' })).toBeNull();
  });

  it('monthQueryParams', () => {
    expect(monthQueryParams({ year: 2026, month: 9 })).toEqual({ ano: '2026', mes: '9' });
  });
});
