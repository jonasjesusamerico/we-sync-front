import type { Params } from '@angular/router';
import {
  type Normalized,
  monthQueryParams,
  parseMonthParams,
  sameParams,
} from '../../shared/date/month-query';
import { type PlainDate, type YearMonth, monthOf } from '../../shared/date/plain-date';
import type { PurchaseListApiQuery, PurchaseStatus } from './data/purchase.models';

export const PAGE_SIZE = 8;
export const SEARCH_MAX = 255;

export type StatusSlug = 'paga' | 'pendente' | 'cancelada';

export const STATUS_BY_SLUG: Readonly<Record<StatusSlug, PurchaseStatus>> = {
  paga: 'PAID',
  pendente: 'PENDING',
  cancelada: 'CANCELED',
};

/** State of the purchases list, as kept in the address (ADR-04). */
export interface PurchaseListQuery {
  year: number;
  month: number;
  /** Trimmed; '' = no search. */
  search: string;
  categoryId: number | null;
  status: StatusSlug | null;
  page: number;
}

// Limits keep every value valid for the API and a safe integer in JS (D-21).
const CATEGORY = /^[1-9]\d{0,14}$/;
const PAGE = /^[1-9]\d{0,8}$/;

const isSlug = (value: unknown): value is StatusSlug =>
  typeof value === 'string' && Object.hasOwn(STATUS_BY_SLUG, value);

/** Trimmed and cut at 255 code points (ADR-10), trimmed again so the result is stable. */
function cleanSearch(text: string): string {
  const trimmed = text.trim();
  const points = Array.from(trimmed);
  return points.length > SEARCH_MAX ? points.slice(0, SEARCH_MAX).join('').trimEnd() : trimmed;
}

/** Address of the purchases list (RN-22): every invalid value is dropped or replaced. */
export function normalizePurchaseListQuery(
  params: Params,
  today: PlainDate,
): Normalized<PurchaseListQuery> {
  const month = parseMonthParams(params) ?? monthOf(today);
  const busca: unknown = params['busca'];
  const categoria: unknown = params['categoria'];
  const situacao: unknown = params['situacao'];
  const pagina: unknown = params['pagina'];
  const value: PurchaseListQuery = {
    year: month.year,
    month: month.month,
    search: typeof busca === 'string' ? cleanSearch(busca) : '',
    categoryId:
      typeof categoria === 'string' && CATEGORY.test(categoria) ? Number(categoria) : null,
    status: isSlug(situacao) ? situacao : null,
    page: typeof pagina === 'string' && PAGE.test(pagina) ? Number(pagina) : 1,
  };
  return { value, changed: !sameParams(params, toQueryParams(value)) };
}

/** Canonical address: ano, mes; busca, categoria and situacao only when active; pagina only from 2 on. */
export function toQueryParams(q: PurchaseListQuery): Params {
  const params: Params = monthQueryParams(q);
  if (q.search !== '') {
    params['busca'] = q.search;
  }
  if (q.categoryId !== null) {
    params['categoria'] = String(q.categoryId);
  }
  if (q.status !== null) {
    params['situacao'] = q.status;
  }
  if (q.page >= 2) {
    params['pagina'] = String(q.page);
  }
  return params;
}

export function toApiQuery(q: PurchaseListQuery): PurchaseListApiQuery {
  const api: PurchaseListApiQuery = {
    year: q.year,
    month: q.month,
    page: q.page,
    page_size: PAGE_SIZE,
  };
  if (q.search !== '') {
    api.q = q.search;
  }
  if (q.status !== null) {
    api.status = STATUS_BY_SLUG[q.status];
  }
  if (q.categoryId !== null) {
    api.category_id = q.categoryId;
  }
  return api;
}

export function hasFilters(q: PurchaseListQuery): boolean {
  return q.search !== '' || q.categoryId !== null || q.status !== null;
}

/** Another month keeps the search and the filters, on page 1 (RN-06). */
export function withMonth(q: PurchaseListQuery, ym: YearMonth): PurchaseListQuery {
  return { ...q, year: ym.year, month: ym.month, page: 1 };
}

export function withSearch(q: PurchaseListQuery, text: string): PurchaseListQuery {
  return { ...q, search: cleanSearch(text), page: 1 };
}

export function withCategory(q: PurchaseListQuery, id: number | null): PurchaseListQuery {
  return { ...q, categoryId: id, page: 1 };
}

export function withStatus(q: PurchaseListQuery, status: StatusSlug | null): PurchaseListQuery {
  return { ...q, status, page: 1 };
}

export function withPage(q: PurchaseListQuery, page: number): PurchaseListQuery {
  return { ...q, page };
}

/** Same month, no search and no filters, page 1. */
export function clearFilters(q: PurchaseListQuery): PurchaseListQuery {
  return { ...q, search: '', categoryId: null, status: null, page: 1 };
}
