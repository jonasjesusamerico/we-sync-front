// Links to the purchases screens and the form origin (ADR-05). The only file of features/purchases that the shell
// and the home page import.
import { type Params, PRIMARY_OUTLET, type UrlTree } from '@angular/router';
import { monthQueryParams, normalizeMonthQuery } from '../../shared/date/month-query';
import {
  type PlainDate,
  type YearMonth,
  firstDay,
  monthLongLabel,
  monthOf,
  sameMonth,
} from '../../shared/date/plain-date';
import {
  type PurchaseListQuery,
  normalizePurchaseListQuery,
  toQueryParams,
} from './purchase-list-query';
import { TOAST_SAVED, toastSavedIn } from './purchases.messages';

export const PURCHASES_PATH = '/compras';
export const NEW_PURCHASE_PATH = '/compras/nova';
export const editPath = (id: number | string): string => `/compras/${id}`;

export type PurchaseOrigin =
  | { screen: 'compras'; query: PurchaseListQuery }
  | { screen: 'inicio'; year: number; month: number };

/** Navigation state of the links to the form (history.state.wsOrigin). */
export interface OriginState {
  wsOrigin: PurchaseOrigin;
}

export interface Destination {
  path: string;
  queryParams: Params;
}

/** Origin of a link opened from `url`: only /inicio and /compras (the list) are origins. */
export function originFromUrl(url: UrlTree, today: PlainDate): PurchaseOrigin | null {
  const segments = url.root.children[PRIMARY_OUTLET]?.segments ?? [];
  if (segments.length !== 1) {
    return null;
  }
  switch (segments[0].path) {
    case 'inicio':
      return { screen: 'inicio', ...normalizeMonthQuery(url.queryParams, today).value };
    case 'compras':
      return {
        screen: 'compras',
        query: normalizePurchaseListQuery(url.queryParams, today).value,
      };
    default:
      return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isIntIn = (value: unknown, min: number, max: number): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;

/** Address params of a query that came from history.state (it may have any shape). */
function paramsOfUnknownQuery(query: Record<string, unknown>): Params {
  const params: Params = {};
  const put = (key: string, value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') {
      params[key] = String(value);
    }
  };
  put('ano', query['year']);
  put('mes', query['month']);
  put('busca', query['search']);
  put('categoria', query['categoryId']);
  put('situacao', query['status']);
  put('pagina', query['page']);
  return params;
}

/** Reads history.state; anything that is not a valid origin object → null. Never a URL. */
export function readPurchaseOrigin(state: unknown, today: PlainDate): PurchaseOrigin | null {
  if (!isRecord(state) || !isRecord(state['wsOrigin'])) {
    return null;
  }
  const origin = state['wsOrigin'];
  if (origin['screen'] === 'inicio') {
    const { year, month } = origin;
    return isIntIn(year, 1, 9999) && isIntIn(month, 1, 12)
      ? { screen: 'inicio', year, month }
      : null;
  }
  if (origin['screen'] === 'compras' && isRecord(origin['query'])) {
    const params = paramsOfUnknownQuery(origin['query']);
    return { screen: 'compras', query: normalizePurchaseListQuery(params, today).value };
  }
  return null;
}

export function originState(origin: PurchaseOrigin | null): OriginState | undefined {
  return origin ? { wsOrigin: origin } : undefined;
}

/** Where the form goes back to (RN-14): the origin, or the purchases list of today's month. */
export function destinationOf(origin: PurchaseOrigin | null, today: PlainDate): Destination {
  if (origin?.screen === 'compras') {
    return { path: PURCHASES_PATH, queryParams: toQueryParams(origin.query) };
  }
  if (origin?.screen === 'inicio') {
    return { path: '/inicio', queryParams: monthQueryParams(origin) };
  }
  return { path: PURCHASES_PATH, queryParams: monthQueryParams(monthOf(today)) };
}

export function destinationMonth(origin: PurchaseOrigin | null, today: PlainDate): YearMonth {
  if (origin?.screen === 'compras') {
    return { year: origin.query.year, month: origin.query.month };
  }
  if (origin?.screen === 'inicio') {
    return { year: origin.year, month: origin.month };
  }
  return monthOf(today);
}

/** RN-12: an origin in another month starts on its day 1; otherwise today. */
export function initialDate(origin: PurchaseOrigin | null, today: PlainDate): PlainDate {
  const month = destinationMonth(origin, today);
  return sameMonth(month, monthOf(today)) ? today : firstDay(month);
}

/** RN-15: the month goes in the toast when the purchase was saved outside the destination month. */
export function savedToast(
  savedIsoDate: string,
  origin: PurchaseOrigin | null,
  today: PlainDate,
): string {
  const saved = monthOf(savedIsoDate);
  return sameMonth(saved, destinationMonth(origin, today))
    ? TOAST_SAVED
    : toastSavedIn(monthLongLabel(saved));
}
