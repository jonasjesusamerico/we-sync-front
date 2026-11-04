// Payloads of 2-contrato.md (feature 005), in snake_case as they arrive from the API.

export type PurchaseStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface CatalogRef {
  id: number;
  name: string;
  is_global: boolean;
}

export interface Purchase {
  id: number;
  user_id: number;
  /** "YYYY-MM-DD" */
  purchase_date: string;
  description: string;
  category: CatalogRef;
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

export interface Category {
  id: number;
  /** Only on the user's own items. */
  user_id?: number;
  name: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = Category;
