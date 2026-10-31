import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import {
  displayApiDate,
  formatApiDate,
  formatBrDate,
  formatMonthLabel,
  fromLocalDate,
  parseApiDate,
  parseBrDate,
  toLocalDate,
} from './plain-date';

registerLocaleData(localePt);

describe('plain-date', () => {
  it('parseApiDate válida', () => {
    expect(parseApiDate('2026-10-05')).toEqual({ year: 2026, month: 10, day: 5 });
  });

  it('parseApiDate inválida', () => {
    for (const text of ['2026-02-30', '2026-10-5', '05/10/2026', '']) {
      expect(parseApiDate(text)).toBeNull();
    }
  });

  it('formatApiDate ano curto', () => {
    expect(formatApiDate({ year: 50, month: 1, day: 2 })).toBe('0050-01-02');
  });

  it('parseBrDate', () => {
    for (const text of ['05/10/2026', '5/10/2026', ' 05/10/2026 ']) {
      expect(parseBrDate(text)).toEqual({ year: 2026, month: 10, day: 5 });
    }
  });

  it('parseBrDate inválida', () => {
    for (const text of [
      '31/02/2026',
      '29/02/2026',
      '00/10/2026',
      '05/13/2026',
      '05/10/26',
      '05/10/0000',
      '05-10-2026',
      'abc',
    ]) {
      expect(parseBrDate(text)).toBeNull();
    }
  });

  it('parseBrDate bissexto', () => {
    expect(parseBrDate('29/02/2028')).toEqual({ year: 2028, month: 2, day: 29 });
  });

  it('formatBrDate', () => {
    expect(formatBrDate({ year: 2026, month: 10, day: 5 })).toBe('05/10/2026');
  });

  it('toLocalDate não muda o dia', () => {
    const date = toLocalDate({ year: 2026, month: 10, day: 5 });
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(5);
    expect(date.getHours()).toBe(0);
  });

  it('toLocalDate ano 50', () => {
    expect(toLocalDate({ year: 50, month: 1, day: 1 }).getFullYear()).toBe(50);
  });

  it('ida e volta', () => {
    for (const d of [
      { year: 2026, month: 1, day: 31 },
      { year: 2028, month: 2, day: 29 },
      { year: 1, month: 1, day: 1 },
      { year: 9999, month: 12, day: 31 },
    ]) {
      expect(fromLocalDate(toLocalDate(d))).toEqual(d);
    }
  });

  it('displayApiDate', () => {
    expect(displayApiDate('2026-10-05')).toBe('05/10/2026');
    expect(displayApiDate('x')).toBe('x');
  });

  it('formatMonthLabel', () => {
    expect(formatMonthLabel(2026, 10)).toBe('outubro de 2026');
    expect(formatMonthLabel(2025, 3)).toBe('março de 2025');
  });
});
