// Payloads of 2-contrato.md (features 005 and 006), in snake_case as they arrive from the API.
import type { CatalogColorOut, CatalogIcon } from '../../../core/catalog/catalog.models';

export type PurchaseStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface CatalogRef {
  id: number;
  name: string;
  is_global: boolean;
}

/** `Purchase.category`: icon and color come from the API (feature 006). */
export interface CategorySummary extends CatalogRef {
  icon: CatalogIcon;
  color: CatalogColorOut;
}

export interface Purchase {
  id: number;
  user_id: number;
  /** "YYYY-MM-DD" */
  purchase_date: string;
  description: string;
  category: CategorySummary;
  payment_method: CatalogRef;
  /** Decimal string without trailing zeros ("1234.5"). */
  amount: string;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  purchase_date: string;
  description: string;
  category_id: number;
  payment_method_id: number;
  /** Always 2 decimal places ("1234.56"). */
  amount: string;
  status: PurchaseStatus;
}

export interface PaginatedPurchases {
  items: Purchase[];
  total: number;
  /** Sum of the filter without CANCELED. */
  total_amount: string;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PurchaseListApiQuery {
  year: number;
  month: number;
  page: number;
  page_size: 8;
  q?: string;
  status?: PurchaseStatus;
  category_id?: number;
}

export type ComparisonPeriod = 'UNTIL_DAY' | 'FULL_MONTH';
export type ComparisonResult = 'MORE' | 'LESS' | 'EQUAL' | 'NO_BASE';

export interface Comparison {
  period: ComparisonPeriod;
  until_day: number | null;
  /** UNTIL_DAY: last day summed in the previous month; null in FULL_MONTH and without a previous month (ADR-05). */
  previous_until_day: number | null;
  previous_year: number;
  previous_month: number;
  current_amount: string;
  previous_amount: string;
  result: ComparisonResult;
  percent: number | null;
}

export interface MonthSummary {
  year: number;
  month: number;
  purchase_count: number;
  spent: string;
  comparison: Comparison;
}

export interface StatusTotal {
  amount: string;
  count: number;
}

export interface DailyAverage {
  amount: string;
  /** 1–31 */
  days: number;
}

export interface DayAmount {
  day: number;
  amount: string;
  forecast: boolean;
}

export interface CategoryShare {
  category: CategorySummary;
  amount: string;
  /** 0–100 */
  percent: number;
}

export interface PaymentMethodShare {
  payment_method: CatalogRef;
  amount: string;
  /** 0–100 */
  percent: number;
}

/** GET /purchases/overview (feature 007). Every number comes ready from the API (RN-15). */
export interface MonthOverview {
  year: number;
  month: number;
  /** 28–31 */
  days_in_month: number;
  is_current_month: boolean;
  paid: StatusTotal;
  pending: StatusTotal;
  /** 0 → only the spending card (RN-11). */
  active_count: number;
  spent: string;
  daily_average: DailyAverage;
  /** null only when spent = "0". */
  peak_day: number | null;
  /** days_in_month items, in order. */
  daily: DayAmount[];
  /** API order; [] when active_count = 0. */
  categories: CategoryShare[];
  payment_methods: PaymentMethodShare[];
  /** 0–6, API order, any status. */
  latest: Purchase[];
}
