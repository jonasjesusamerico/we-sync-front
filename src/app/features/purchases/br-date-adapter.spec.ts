import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { BR_DATE_FORMATS, BR_DATE_INPUT, BrDateAdapter } from './br-date-adapter';

registerLocaleData(localePt);

describe('BrDateAdapter', () => {
  let adapter: BrDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }],
    });
    adapter = TestBed.inject(BrDateAdapter);
  });

  const ymd = (d: Date | null) => d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];

  it('parse dd/mm/aaaa', () => {
    const date = adapter.parse('05/10/2026');
    expect(ymd(date)).toEqual([2026, 10, 5]);
    expect(date?.getHours()).toBe(0);
  });

  it('parse d/m/aaaa', () => {
    expect(ymd(adapter.parse('5/1/2026'))).toEqual([2026, 1, 5]);
  });

  it('parse inválida', () => {
    for (const text of ['31/02/2026', '05/10/26', 'abc']) {
      const result = adapter.parse(text);
      expect(result).not.toBeNull();
      expect(adapter.isValid(result as Date)).toBe(false);
    }
  });

  it('parse vazio', () => {
    expect(adapter.parse('')).toBeNull();
    expect(adapter.parse('  ')).toBeNull();
  });

  it('format do campo', () => {
    expect(adapter.format(new Date(2026, 9, 5), BR_DATE_INPUT)).toBe('05/10/2026');
  });

  it('format ano 50', () => {
    const date = new Date(2000, 0, 1);
    date.setFullYear(50, 0, 2);
    expect(adapter.format(date, BR_DATE_INPUT)).toBe('02/01/0050');
  });

  it('format do calendário', () => {
    expect(adapter.format(new Date(2026, 9, 5), BR_DATE_FORMATS.display.monthYearA11yLabel)).toBe(
      'outubro de 2026',
    );
  });
});
