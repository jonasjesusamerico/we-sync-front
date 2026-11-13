import {
  isFutureMonth,
  MONTH_NAMES,
  addMonths,
  firstDay,
  formatDate,
  formatDayMonth,
  localToday,
  monthLabel,
  monthLongLabel,
  monthName,
  monthOf,
  parseIsoDate,
  sameMonth,
  toIsoDate,
} from './plain-date';

describe('plain-date', () => {
  it('nomes dos meses do protótipo', () => {
    expect(MONTH_NAMES).toHaveLength(12);
    expect(monthName(1)).toBe('janeiro');
    expect(monthName(3)).toBe('março');
    expect(monthName(10)).toBe('outubro');
  });

  it.each([
    ['2026-02-30', null],
    ['2026-2-3', null],
    ['2027-02-28', { year: 2027, month: 2, day: 28 }],
    ['2028-02-29', { year: 2028, month: 2, day: 29 }],
    ['2100-02-29', null],
    ['2026-13-01', null],
    ['2026-04-31', null],
    ['0000-01-01', null],
    ['20266-11-05', null],
    ['0001-01-01', { year: 1, month: 1, day: 1 }],
    ['9999-12-31', { year: 9999, month: 12, day: 31 }],
    ['', null],
  ])('parseIsoDate(%j)', (iso, expected) => {
    expect(parseIsoDate(iso)).toEqual(expected);
  });

  it('toIsoDate com zeros à esquerda', () => {
    expect(toIsoDate({ year: 2026, month: 9, day: 1 })).toBe('2026-09-01');
    expect(toIsoDate({ year: 1, month: 1, day: 1 })).toBe('0001-01-01');
  });

  it('formatDate', () => {
    expect(formatDate('2026-11-05')).toBe('05/11/2026');
  });

  it('formatDayMonth', () => {
    expect(formatDayMonth('2026-10-23')).toBe('23 out');
    expect(formatDayMonth('2026-03-01')).toBe('01 mar');
  });

  it('rótulos de mês', () => {
    expect(monthLabel({ year: 2026, month: 10 })).toBe('outubro 2026');
    expect(monthLongLabel({ year: 2026, month: 10 })).toBe('outubro de 2026');
    expect(monthLabel({ year: 1, month: 1 })).toBe('janeiro 0001');
  });

  it.each([
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
    [{ year: 2026, month: 12 }, 1, { year: 2027, month: 1 }],
    [{ year: 1, month: 1 }, -1, { year: 0, month: 12 }],
    [{ year: 2026, month: 11 }, -14, { year: 2025, month: 9 }],
  ])('addMonths(%o, %i)', (ym, n, expected) => {
    expect(addMonths(ym, n)).toEqual(expected);
  });

  it.each([
    [{ year: 2026, month: 12 }, { year: 2026, month: 11 }, true],
    [{ year: 2027, month: 1 }, { year: 2026, month: 12 }, true],
    [{ year: 2026, month: 11 }, { year: 2026, month: 11 }, false],
    [{ year: 2026, month: 10 }, { year: 2026, month: 11 }, false],
    [{ year: 9999, month: 12 }, { year: 1, month: 1 }, true],
  ])('isFutureMonth(%o, %o) → %s', (month, current, expected) => {
    expect(isFutureMonth(month, current)).toBe(expected);
  });

  it('sameMonth, monthOf e firstDay', () => {
    expect(sameMonth({ year: 2026, month: 9 }, { year: 2026, month: 9 })).toBe(true);
    expect(sameMonth({ year: 2026, month: 9 }, { year: 2025, month: 9 })).toBe(false);
    expect(monthOf('2026-09-10')).toEqual({ year: 2026, month: 9 });
    expect(monthOf({ year: 2026, month: 11, day: 10 })).toEqual({ year: 2026, month: 11 });
    expect(() => monthOf('x')).toThrowError('invalid date');
    expect(firstDay({ year: 2026, month: 9 })).toEqual({ year: 2026, month: 9, day: 1 });
  });

  describe('localToday', () => {
    afterEach(() => vi.useRealTimers());

    it('usa a data local, sem fuso', () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 10, 23, 59));
      expect(localToday()).toEqual({ year: 2026, month: 11, day: 10 });
    });
  });
});
