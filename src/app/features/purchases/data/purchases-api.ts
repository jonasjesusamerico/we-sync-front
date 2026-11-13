import {
  HttpClient,
  HttpErrorResponse,
  HttpParameterCodec,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import {
  MonthOverview,
  MonthSummary,
  PaginatedPurchases,
  Purchase,
  PurchaseListApiQuery,
  PurchaseRequest,
} from './purchase.models';

/**
 * Encodes every reserved character. Angular's default codec leaves ";" as is, and Go (1.17+) drops query pairs
 * with ";": a search for "a;b" would reach the API as no search at all.
 */
export const STRICT_PARAM_CODEC: HttpParameterCodec = {
  encodeKey: (key) => encodeURIComponent(key),
  encodeValue: (value) => encodeURIComponent(value),
  decodeKey: (key) => decodeURIComponent(key),
  decodeValue: (value) => decodeURIComponent(value),
};

const LIST_KEYS = ['year', 'month', 'page', 'page_size', 'q', 'status', 'category_id'] as const;

function listParams(query: PurchaseListApiQuery): HttpParams {
  let params = new HttpParams({ encoder: STRICT_PARAM_CODEC });
  for (const key of LIST_KEYS) {
    const value = query[key];
    if (value !== undefined) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

/** An old API instance (mid-deploy) answers without the fields of feature 005 (DAS 7). */
function isPaginatedPurchases(body: unknown): body is PaginatedPurchases {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const page = body as Partial<Record<keyof PaginatedPurchases, unknown>>;
  return (
    Array.isArray(page.items) &&
    typeof page.total === 'number' &&
    typeof page.total_amount === 'string'
  );
}

/** RN-12 ("unexpected response", D-08 of the 007 SDD): only the shape the page reads. */
function isMonthOverview(body: unknown): body is MonthOverview {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const o = body as Partial<Record<keyof MonthOverview, unknown>>;
  const isObject = (v: unknown): boolean => typeof v === 'object' && v !== null;
  return (
    typeof o.active_count === 'number' &&
    typeof o.days_in_month === 'number' &&
    typeof o.spent === 'string' &&
    isObject(o.paid) &&
    isObject(o.pending) &&
    isObject(o.daily_average) &&
    Array.isArray(o.daily) &&
    Array.isArray(o.categories) &&
    Array.isArray(o.payment_methods) &&
    Array.isArray(o.latest)
  );
}

function monthParams(year: number, month: number, today: string): HttpParams {
  return new HttpParams({ encoder: STRICT_PARAM_CODEC })
    .set('year', String(year))
    .set('month', String(month))
    .set('today', today);
}

/** Purchases endpoints (contract of feature 005). Stateless: each page loads what it shows. */
@Injectable({ providedIn: 'root' })
export class PurchasesApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(query: PurchaseListApiQuery): Observable<PaginatedPurchases> {
    const url = `${this.base}/purchases`;
    return this.http.get<unknown>(url, { params: listParams(query) }).pipe(
      map((body) => {
        if (!isPaginatedPurchases(body)) {
          throw new HttpErrorResponse({ status: 500, url });
        }
        return body;
      }),
    );
  }

  summary(year: number, month: number, today: string): Observable<MonthSummary> {
    const params = monthParams(year, month, today);
    return this.http.get<MonthSummary>(`${this.base}/purchases/summary`, { params });
  }

  /** Blocks of the home month (feature 007). A body of another shape fails as a 500 (RN-12). */
  overview(year: number, month: number, today: string): Observable<MonthOverview> {
    const url = `${this.base}/purchases/overview`;
    return this.http.get<unknown>(url, { params: monthParams(year, month, today) }).pipe(
      map((body) => {
        if (!isMonthOverview(body)) {
          throw new HttpErrorResponse({ status: 500, url });
        }
        return body;
      }),
    );
  }

  /** `id` already checked by the page (^[1-9][0-9]{0,18}$). */
  get(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.base}/purchases/${id}`);
  }

  /** Not idempotent: never repeated by the front, besides the single retry after a 401. */
  create(body: PurchaseRequest): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.base}/purchases`, body);
  }

  update(id: string, body: PurchaseRequest): Observable<Purchase> {
    return this.http.put<Purchase>(`${this.base}/purchases/${id}`, body);
  }

  /** 204 → completes. */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/purchases/${id}`);
  }
}
