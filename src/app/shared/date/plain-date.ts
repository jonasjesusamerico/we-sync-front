// Dates without time ("YYYY-MM-DD" from the API), handled only through their parts (ADR-11 of feature 005).
// Never new Date(string), toISOString() or DatePipe over them.

export interface PlainDate {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

export interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

export const MONTH_NAMES: readonly string[] = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, size: number): string => String(n).padStart(size, '0');

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Only "YYYY-MM-DD" with a real calendar date and a year from 1 to 9999; anything else → null. */
export function parseIsoDate(iso: string): PlainDate | null {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

/** { 2026, 9, 1 } → "2026-09-01". */
export function toIsoDate(d: PlainDate): string {
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
}

/** "2026-11-05" → "05/11/2026" (by the parts of the string). */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** "2026-10-23" → "23 out". */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day} ${monthName(Number(month)).slice(0, 3)}`;
}

/** 10 → "outubro". */
export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

/** "outubro 2026" (month switcher). */
export function monthLabel(ym: YearMonth): string {
  return `${monthName(ym.month)} ${pad(ym.year, 4)}`;
}

/** "outubro de 2026" (empty state and toast). */
export function monthLongLabel(ym: YearMonth): string {
  return `${monthName(ym.month)} de ${pad(ym.year, 4)}`;
}

/** Month arithmetic; the caller limits the range. { 2026, 1 } − 1 → { 2025, 12 }. */
export function addMonths(ym: YearMonth, n: number): YearMonth {
  const index = ym.year * 12 + (ym.month - 1) + n;
  const year = Math.floor(index / 12);
  return { year, month: index - year * 12 + 1 };
}

export function sameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Month of a PlainDate or of a "YYYY-MM-DD" string (an invalid string throws). */
export function monthOf(d: PlainDate | string): YearMonth {
  const date = typeof d === 'string' ? parseIsoDate(d) : d;
  if (!date) {
    throw new Error('invalid date');
  }
  return { year: date.year, month: date.month };
}

/** RN-01: true when `month` comes after `current` (ADR-04 of feature 007). */
export function isFutureMonth(month: YearMonth, current: YearMonth): boolean {
  return month.year * 12 + month.month > current.year * 12 + current.month;
}

export function firstDay(ym: YearMonth): PlainDate {
  return { year: ym.year, month: ym.month, day: 1 };
}

/** The browser's local date (no time zone conversion). */
export function localToday(): PlainDate {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
