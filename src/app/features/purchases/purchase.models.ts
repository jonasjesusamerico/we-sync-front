// Tipos da API de lançamentos (2-contrato.md da feature 003). Sem import do Angular; campos em snake_case, como na
// API.

export type PurchaseStatus = 'PENDING' | 'PAID' | 'CANCELED';

export const PURCHASE_STATUSES: readonly PurchaseStatus[] = ['PENDING', 'PAID', 'CANCELED'];

/** Categoria ou forma de pagamento (resposta de GET /categories e /payment-methods, e campo do Purchase). */
export interface Option {
  id: number;
  name: string;
  is_global: boolean;
}

export interface Purchase {
  id: number;
  user_id: number;
  purchase_date: string;
  description: string;
  category: Option;
  payment_method: Option;
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
  amount: string;
  status: PurchaseStatus;
}

export interface PurchasePage {
  items: Purchase[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type PurchaseErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'PAYMENT_METHOD_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

/** RN-16: o front só chama GET/PUT/DELETE /purchases/{id} com um :id assim. */
export const PURCHASE_ID_PATTERN = /^[1-9][0-9]{0,18}$/;

export const PAGE_SIZE = 20;
