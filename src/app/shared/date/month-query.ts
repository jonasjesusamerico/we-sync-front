import type { Params } from '@angular/router';
import { type PlainDate, type YearMonth, monthOf } from './plain-date';

/** A value read from the address and whether the address must be rewritten to the canonical form. */
export interface Normalized<T> {
  value: T;
  changed: boolean;
}

const YEAR = /^\d{1,4}$/;
const MONTH = /^\d{1,2}$/;

/** `ano` (1–9999) and `mes` (1–12), both single strings; anything else → null. */
export function parseMonthParams(params: Params): YearMonth | null {
  const ano: unknown = params['ano'];
  const mes: unknown = params['mes'];
  if (typeof ano !== 'string' || typeof mes !== 'string' || !YEAR.test(ano) || !MONTH.test(mes)) {
    return null;
  }
  const year = Number(ano);
  const month = Number(mes);
  if (year < 1 || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

/** Canonical address of a month: { ano: '2026', mes: '9' }. */
export function monthQueryParams(ym: YearMonth): { ano: string; mes: string } {
  return { ano: String(ym.year), mes: String(ym.month) };
}

/** Address of the home page (ADR-04, RN-22): a valid month or today's month; `changed` when not canonical. */
export function normalizeMonthQuery(params: Params, today: PlainDate): Normalized<YearMonth> {
  const value = parseMonthParams(params) ?? monthOf(today);
  return { value, changed: !sameParams(params, monthQueryParams(value)) };
}

/** True when `params` has exactly the keys and string values of `expected`. */
export function sameParams(params: Params, expected: Params): boolean {
  const keys = Object.keys(params);
  const expectedKeys = Object.keys(expected);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => params[key] === expected[key])
  );
}
