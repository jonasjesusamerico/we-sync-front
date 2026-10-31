// Dinheiro em centavos inteiros (ADR-07). Nada de `parseFloat` nem conta com `float` sobre o valor digitado.

/** 99.999.999,99 */
export const AMOUNT_MAX_CENTS = 9_999_999_999;
export const MONEY_INPUT_MAX_LENGTH = 15;
/** Texto que a diretiva aceita durante a digitação: dígitos e pontos, e no máximo uma vírgula com até 2 dígitos depois. */
export const MONEY_TYPING_PATTERN = /^[\d.]*(,\d{0,2})?$/;

const BRL_TEXT = /^(\d*)(?:,(\d{0,2}))?$/;
const API_AMOUNT = /^(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Texto em pt-BR → centavos. Os pontos são só separadores de milhar e são todos ignorados. `null` para vazio ou
 * texto que não é um valor.
 */
export function parseBrl(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const match = BRL_TEXT.exec(trimmed.replace(/\./g, ''));
  if (!match) {
    return null;
  }
  const [, integer, fraction] = match;
  if (integer === '' && (fraction ?? '') === '') {
    return null;
  }
  return Number(integer || '0') * 100 + Number((fraction ?? '').padEnd(2, '0'));
}

function split(cents: number): [string, string] {
  return [String(Math.trunc(cents / 100)), String(cents % 100).padStart(2, '0')];
}

/** 123456 → `1.234,56` */
export function formatBrl(cents: number): string {
  const [integer, fraction] = split(cents);
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction}`;
}

/** 123456 → `1234.56` (sempre 2 casas, como o front envia). */
export function centsToApi(cents: number): string {
  const [integer, fraction] = split(cents);
  return `${integer}.${fraction}`;
}

/** `1234.5` → 123450. A API remove zeros à direita. Fora do contrato → lança `Error`. */
export function apiToCents(text: string): number {
  const match = API_AMOUNT.exec(text);
  if (!match) {
    throw new Error('amount out of contract');
  }
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}
