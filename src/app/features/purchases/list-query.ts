import { PURCHASE_STATUSES, PurchaseStatus } from './purchase.models';

/** Estado da lista no endereço (ADR-04). Funções puras: `now` sempre vem de quem chama. */
export interface ListQuery {
  /** 1–9999 */
  year: number;
  /** 1–12 */
  month: number;
  status: PurchaseStatus | null;
  categoryId: number | null;
  paymentMethodId: number | null;
  /** ≥ 1 */
  page: number;
}

/** Valores crus do endereço (Params do Angular: string ou string[]) ou de um objeto qualquer. */
export type RawQuery = Readonly<Record<string, unknown>>;

type FilterPatch = Partial<Pick<ListQuery, 'status' | 'categoryId' | 'paymentMethodId'>>;

const MIN_YEAR = 1;
const MAX_YEAR = 9999;

export function currentMonthQuery(now: Date): ListQuery {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    status: null,
    categoryId: null,
    paymentMethodId: null,
    page: 1,
  };
}

/** `string` → usa; `number` inteiro → `String(n)`; qualquer outra coisa (inclusive `string[]`) → ausente. */
function text(raw: RawQuery, key: string): string | null {
  const value = raw[key];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value);
  }
  return null;
}

function readYearMonth(raw: RawQuery): { year: number; month: number } | null {
  const year = text(raw, 'ano');
  const month = text(raw, 'mes');
  if (year === null || month === null || !/^\d{1,4}$/.test(year) || !/^\d{1,2}$/.test(month)) {
    return null;
  }
  const y = Number(year);
  const m = Number(month);
  if (y < MIN_YEAR || y > MAX_YEAR || m < 1 || m > 12) {
    return null;
  }
  return { year: y, month: m };
}

function readId(raw: RawQuery, key: string): number | null {
  const value = text(raw, key);
  if (value === null || !/^[1-9]\d{0,15}$/.test(value)) {
    return null;
  }
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function readStatus(raw: RawQuery): PurchaseStatus | null {
  const value = text(raw, 'status');
  return PURCHASE_STATUSES.find((s) => s === value) ?? null;
}

function readPage(raw: RawQuery): number {
  const value = text(raw, 'pagina');
  if (value === null || !/^\d+$/.test(value)) {
    return 1;
  }
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}

/** RN-15: qualquer valor inválido do endereço é trocado pelo padrão. */
export function normalizeListQuery(raw: RawQuery, now: Date): ListQuery {
  const current = currentMonthQuery(now);
  const { year, month } = readYearMonth(raw) ?? current;
  return {
    year,
    month,
    status: readStatus(raw),
    categoryId: readId(raw, 'categoria'),
    paymentMethodId: readId(raw, 'forma'),
    page: readPage(raw),
  };
}

/** Endereço canônico: `ano`, `mes`, `status`, `categoria`, `forma`, `pagina`, nessa ordem; só os ativos. */
export function toRouteParams(q: ListQuery): Record<string, string> {
  const params: Record<string, string> = { ano: String(q.year), mes: String(q.month) };
  if (q.status !== null) {
    params['status'] = q.status;
  }
  if (q.categoryId !== null) {
    params['categoria'] = String(q.categoryId);
  }
  if (q.paymentMethodId !== null) {
    params['forma'] = String(q.paymentMethodId);
  }
  if (q.page > 1) {
    params['pagina'] = String(q.page);
  }
  return params;
}

/** Mesmas chaves e mesmos textos que `toRouteParams(q)`. */
export function isCanonical(raw: RawQuery, q: ListQuery): boolean {
  const expected = toRouteParams(q);
  const keys = Object.keys(raw);
  if (keys.length !== Object.keys(expected).length) {
    return false;
  }
  return keys.every((key) => raw[key] === expected[key]);
}

export function toApiParams(q: ListQuery): Record<string, string> {
  const params: Record<string, string> = { year: String(q.year), month: String(q.month) };
  if (q.status !== null) {
    params['status'] = q.status;
  }
  if (q.categoryId !== null) {
    params['category_id'] = String(q.categoryId);
  }
  if (q.paymentMethodId !== null) {
    params['payment_method_id'] = String(q.paymentMethodId);
  }
  params['page'] = String(q.page);
  params['page_size'] = '20';
  return params;
}

export function isCurrentMonth(q: Pick<ListQuery, 'year' | 'month'>, now: Date): boolean {
  return q.year === now.getFullYear() && q.month === now.getMonth() + 1;
}

export function hasFilters(q: ListQuery): boolean {
  return q.status !== null || q.categoryId !== null || q.paymentMethodId !== null;
}

/** RN-08: filtros mantidos, página 1. */
export function withMonth(q: ListQuery, year: number, month: number): ListQuery {
  return { ...q, year, month, page: 1 };
}

export function canShiftMonth(q: Pick<ListQuery, 'year' | 'month'>, delta: -1 | 1): boolean {
  if (delta === -1) {
    return !(q.year === MIN_YEAR && q.month === 1);
  }
  return !(q.year === MAX_YEAR && q.month === 12);
}

export function shiftMonth(q: ListQuery, delta: -1 | 1): ListQuery {
  if (!canShiftMonth(q, delta)) {
    return q;
  }
  const index = q.year * 12 + (q.month - 1) + delta;
  return withMonth(q, Math.floor(index / 12), (index % 12) + 1);
}

/** RN-08: página 1. */
export function withFilters(q: ListQuery, patch: FilterPatch): ListQuery {
  return { ...q, ...patch, page: 1 };
}

export function clearFilters(q: ListQuery): ListQuery {
  return { ...q, status: null, categoryId: null, paymentMethodId: null, page: 1 };
}

export function withPage(q: ListQuery, page: number): ListQuery {
  return { ...q, page };
}

/** ADR-05: lê `history.state.origin`. Ausente, não objeto, ou ano/mês inválidos → `null` ("sem origem"). */
export function readOrigin(state: unknown, now: Date): ListQuery | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }
  const origin = (state as Record<string, unknown>)['origin'];
  if (typeof origin !== 'object' || origin === null) {
    return null;
  }
  const o = origin as Record<string, unknown>;
  if (typeof o['year'] !== 'number' || typeof o['month'] !== 'number') {
    return null;
  }
  const raw: RawQuery = {
    ano: o['year'],
    mes: o['month'],
    status: o['status'],
    categoria: o['categoryId'],
    forma: o['paymentMethodId'],
    pagina: o['page'],
  };
  return readYearMonth(raw) ? normalizeListQuery(raw, now) : null;
}
