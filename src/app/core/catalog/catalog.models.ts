// Categories and payment methods of 2-contrato.md (feature 006), in snake_case as they arrive from the API.

export type CatalogKind = 'category' | 'payment';

export type CatalogIcon =
  'TAG' | 'HEART' | 'SMILE' | 'BOOK' | 'CAR' | 'HOUSE' | 'FOOD' | 'CARD' | 'GIFT' | 'SPARKLE';

export type CatalogColor = 'FOOD' | 'TRANSPORT' | 'HOME' | 'HEALTH' | 'EDUCATION' | 'LEISURE';

/** What the API may return: the 6 colors + NEUTRAL (own categories created before feature 006). */
export type CatalogColorOut = CatalogColor | 'NEUTRAL';

export interface Category {
  id: number;
  /** Only on the user's own items. */
  user_id?: number;
  /** May be longer than 40 code points (old names). */
  name: string;
  is_global: boolean;
  /** Unknown values are tolerated by catalogStyle (contract, "Enums"). */
  icon: CatalogIcon;
  color: CatalogColorOut;
  /** RFC 3339; always null on the global items. */
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: number;
  /** Only on the user's own items. */
  user_id?: number;
  name: string;
  is_global: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRequest {
  name: string;
  icon: CatalogIcon;
  color: CatalogColor;
}

export interface PaymentMethodRequest {
  name: string;
}

/** POST result: 201 → reactivated false; 200 → reactivated true (ADR-09). */
export interface Created<T> {
  item: T;
  reactivated: boolean;
}
