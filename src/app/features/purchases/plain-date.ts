import { formatDate } from '@angular/common';

/**
 * Data sem hora (ADR-06). As datas da API (`YYYY-MM-DD`) só passam por aqui: nunca `new Date(string)`,
 * `toISOString()` nem `DatePipe` sobre elas.
 */
export interface PlainDate {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

const API_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const BR_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

/** Inteiros; ano 1–9999; mês 1–12; o dia existe no mês (com ano bissexto). */
export function isValidPlainDate(d: PlainDate): boolean {
  const { year, month, day } = d;
  if (![year, month, day].every(Number.isInteger)) {
    return false;
  }
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  return day <= daysInMonth(year, month);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function checked(d: PlainDate): PlainDate | null {
  return isValidPlainDate(d) ? d : null;
}

export function parseApiDate(text: string): PlainDate | null {
  const match = API_DATE.exec(text);
  if (!match) {
    return null;
  }
  return checked({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
}

const pad = (n: number, size: number) => String(n).padStart(size, '0');

/** `YYYY-MM-DD`, com o ano em 4 dígitos (ano 50 → `0050`). */
export function formatApiDate(d: PlainDate): string {
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
}

/** `dd/mm/aaaa` ou `d/m/aaaa`, com espaços nas pontas ignorados. */
export function parseBrDate(text: string): PlainDate | null {
  const match = BR_DATE.exec(text.trim());
  if (!match) {
    return null;
  }
  return checked({ year: Number(match[3]), month: Number(match[2]), day: Number(match[1]) });
}

export function formatBrDate(d: PlainDate): string {
  return `${pad(d.day, 2)}/${pad(d.month, 2)}/${pad(d.year, 4)}`;
}

/** Meia-noite local do dia. `setFullYear` evita que o ano 50 vire 1950. */
export function toLocalDate(d: PlainDate): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(d.year, d.month - 1, d.day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function fromLocalDate(date: Date): PlainDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

export function todayPlain(now: Date): PlainDate {
  return fromLocalDate(now);
}

/** `2026-10-05` → `05/10/2026`. Texto fora do formato volta como veio. */
export function displayApiDate(text: string): string {
  const d = parseApiDate(text);
  return d ? formatBrDate(d) : text;
}

/** `outubro de 2026`. Precisa do `registerLocaleData(localePt)` (feito no `app.config.ts`). */
export function formatMonthLabel(year: number, month: number): string {
  return formatDate(toLocalDate({ year, month, day: 1 }), "MMMM 'de' y", 'pt-BR');
}
