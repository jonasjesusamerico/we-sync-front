// Money in integer cents (ADR-11 of feature 005). No parseFloat and no float arithmetic on amounts.

/** Largest amount of a single purchase: R$ 99.999.999,99 (the amount field and centsToApi). */
export const MAX_CENTS = 9_999_999_999;

// Sums (total_amount, spent) have no upper bound in the contract: up to 13 integer digits, still a safe integer
// in cents (D-19).
const API_MONEY = /^(\d{1,13})(?:\.(\d{1,2}))?$/;
const MAX_INPUT_DIGITS = String(MAX_CENTS).length;

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const plain = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** API decimal string ("1234.5", "10", "0") → cents. Anything else throws. */
export function apiToCents(value: string): number {
  const match = API_MONEY.exec(value);
  if (!match) {
    throw new Error('invalid money');
  }
  const fraction = (match[2] ?? '').padEnd(2, '0');
  return Number(match[1]) * 100 + Number(fraction);
}

/** Cents → API decimal string, always with 2 decimal places: 123456 → "1234.56". */
export function centsToApi(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_CENTS) {
    throw new Error('invalid money');
  }
  const integer = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, '0');
  return `${integer}.${fraction}`;
}

/** Cents → "R$ 1.234,56" (the space after "R$" is U+00A0, from Intl). */
export function formatBrl(cents: number): string {
  return brl.format(cents / 100);
}

/** Cents → the amount field text, without the symbol: 123456 → "1.234,56"; 0 → "0,00". */
export function formatMoneyInput(cents: number): string {
  return plain.format(cents / 100);
}

/** Only the digits of `text`, read as cents: "1,23" → 123; "" → 0; above MAX_CENTS → null. */
export function digitsToCents(text: string): number | null {
  const digits = text.replace(/\D/g, '').replace(/^0+/, '');
  if (digits === '') {
    return 0;
  }
  if (digits.length > MAX_INPUT_DIGITS) {
    return null;
  }
  const cents = Number(digits);
  return cents > MAX_CENTS ? null : cents;
}
