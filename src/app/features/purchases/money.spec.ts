import { apiToCents, centsToApi, formatBrl, MONEY_TYPING_PATTERN, parseBrl } from './money';

describe('money', () => {
  it('parseBrl', () => {
    const cases: [string, number][] = [
      ['1.234,56', 123456],
      ['1234,56', 123456],
      ['10', 1000],
      ['10,', 1000],
      ['10,5', 1050],
      [',5', 50],
      ['0,01', 1],
      ['100.000.000,00', 10000000000],
    ];
    for (const [text, cents] of cases) {
      expect(parseBrl(text)).toBe(cents);
    }
  });

  it('parseBrl inválido', () => {
    for (const text of ['', '   ', ',', '.', '1,2,3', '1,234', 'abc', '-1']) {
      expect(parseBrl(text)).toBeNull();
    }
  });

  it('parseBrl pontos soltos', () => {
    // Decisões do SDD: `1.2.3` vira 123 reais (`123,00` no blur).
    expect(parseBrl('1.2.3')).toBe(12300);
  });

  it('formatBrl', () => {
    expect(formatBrl(123456)).toBe('1.234,56');
    expect(formatBrl(5)).toBe('0,05');
    expect(formatBrl(0)).toBe('0,00');
    expect(formatBrl(9999999999)).toBe('99.999.999,99');
  });

  it('centsToApi', () => {
    const cases: [number, string][] = [
      [123456, '1234.56'],
      [1000, '10.00'],
      [5, '0.05'],
      [9999999999, '99999999.99'],
    ];
    for (const [cents, text] of cases) {
      expect(centsToApi(cents)).toBe(text);
      expect(text).toMatch(/^\d{1,8}\.\d{2}$/);
    }
  });

  it('apiToCents', () => {
    expect(apiToCents('1234.56')).toBe(123456);
    expect(apiToCents('1234.5')).toBe(123450);
    expect(apiToCents('10')).toBe(1000);
    expect(apiToCents('0.05')).toBe(5);
    expect(apiToCents('99999999.99')).toBe(9999999999);
  });

  it('apiToCents fora do contrato', () => {
    for (const text of ['1,5', '1.234', '']) {
      expect(() => apiToCents(text)).toThrow(Error);
    }
  });

  it('MONEY_TYPING_PATTERN', () => {
    for (const text of ['', '1.234', '10,', '10,55']) {
      expect(MONEY_TYPING_PATTERN.test(text)).toBe(true);
    }
    for (const text of ['10,555', '1,2,3', '1a', '-1', '10,5.']) {
      expect(MONEY_TYPING_PATTERN.test(text)).toBe(false);
    }
  });
});
