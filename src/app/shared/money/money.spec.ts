import {
  MAX_CENTS,
  apiToCents,
  centsToApi,
  digitsToCents,
  formatBrl,
  formatMoneyInput,
} from './money';

const NBSP = ' ';

describe('money', () => {
  it.each([
    ['1234.5', 123450],
    ['10', 1000],
    ['0', 0],
    ['0.05', 5],
    ['99999999.99', MAX_CENTS],
  ])('apiToCents(%s)', (value, cents) => {
    expect(apiToCents(value)).toBe(cents);
  });

  it.each([
    ['1999999999.8', 199999999980],
    ['9999999999999.99', 999999999999999],
  ])('apiToCents aceita somas acima do limite de uma compra: %s (D-19)', (value, cents) => {
    expect(apiToCents(value)).toBe(cents);
    expect(Number.isSafeInteger(cents)).toBe(true);
  });

  it.each(['1,5', 'abc', '', '1.234', '10000000000000', '-1', '1.'])(
    'apiToCents inválido: %j',
    (value) => {
      expect(() => apiToCents(value)).toThrowError('invalid money');
    },
  );

  it.each([
    [123456, '1234.56'],
    [5, '0.05'],
    [0, '0.00'],
    [MAX_CENTS, '99999999.99'],
  ])('centsToApi(%i)', (cents, value) => {
    expect(centsToApi(cents)).toBe(value);
    expect(value).toMatch(/^\d{1,8}\.\d{2}$/);
  });

  it.each([-1, 1.5, MAX_CENTS + 1])('centsToApi inválido: %d', (cents) => {
    expect(() => centsToApi(cents)).toThrowError('invalid money');
  });

  it.each(['1234.56', '1234.5', '10', '0', '0.05', '23.9', '263.4'])('ida e volta: %s', (value) => {
    const [integer, fraction = ''] = value.split('.');
    expect(centsToApi(apiToCents(value))).toBe(`${integer}.${fraction.padEnd(2, '0')}`);
  });

  it('formatBrl', () => {
    expect(formatBrl(123456)).toBe(`R$${NBSP}1.234,56`);
    expect(formatBrl(0)).toBe(`R$${NBSP}0,00`);
  });

  it('formatMoneyInput', () => {
    expect(formatMoneyInput(123)).toBe('1,23');
    expect(formatMoneyInput(MAX_CENTS)).toBe('99.999.999,99');
    expect(formatMoneyInput(0)).toBe('0,00');
  });

  it.each([
    ['1,23', 123],
    ['abc', 0],
    ['', 0],
    ['R$ 12,34abc', 1234],
    ['00012', 12],
    ['99.999.999,99', MAX_CENTS],
    ['999999999999', null],
    ['99.999.999,995', null],
  ])('digitsToCents(%j)', (text, cents) => {
    expect(digitsToCents(text)).toBe(cents);
  });
});
