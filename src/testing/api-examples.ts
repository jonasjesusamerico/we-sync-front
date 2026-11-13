// Examples of 2-contrato.md (feature 004), used by the unit tests.
import type {
  ApiError,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from '../app/core/auth/session.models';
import type {
  CatalogColorOut,
  CatalogIcon,
  Category,
  PaymentMethod,
} from '../app/core/catalog/catalog.models';
import type { UserResponse } from '../app/core/user/user.models';
import type {
  MonthOverview,
  MonthSummary,
  PaginatedPurchases,
  Purchase,
  PurchaseRequest,
} from '../app/features/purchases/data/purchase.models';

export const REGISTER_REQUEST_EXAMPLE: RegisterRequest = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  password: 'Senha123!',
};

export const REGISTER_RESPONSE_EXAMPLE: RegisterResponse = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
};

export const LOGIN_REQUEST_EXAMPLE = { email: 'ana@exemplo.com', password: 'Senha123!' };

export const TOKEN_RESPONSE_EXAMPLE: TokenResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<assinatura>',
  refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
  token_type: 'Bearer',
};

export const USER_RESPONSE_EXAMPLE: UserResponse = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  theme: null,
};

export const ERROR_BAD_REQUEST: ApiError = { code: 'BAD_REQUEST', message: 'invalid request body' };
export const ERROR_NAME_INVALID: ApiError = {
  code: 'VALIDATION_ERROR',
  message: 'name must be between 2 and 60 characters',
};
export const ERROR_EMAIL_TAKEN: ApiError = {
  code: 'CONFLICT',
  message: 'email already registered',
};
export const ERROR_INVALID_CREDENTIALS: ApiError = {
  code: 'UNAUTHORIZED',
  message: 'invalid credentials',
};
export const ERROR_LOGIN_REQUIRED: ApiError = {
  code: 'VALIDATION_ERROR',
  message: 'email and password are required',
};
export const ERROR_INVALID_TOKEN: ApiError = {
  code: 'UNAUTHORIZED',
  message: 'invalid authentication token',
};
export const ERROR_USER_NOT_FOUND: ApiError = { code: 'NOT_FOUND', message: 'user not found' };
export const ERROR_INTERNAL: ApiError = {
  code: 'INTERNAL_SERVER_ERROR',
  message: 'internal server error',
};

// Examples of 2-contrato.md (feature 005).

const SEED_TIME = '2026-01-01T00:00:00Z';

export const PURCHASE_EXAMPLE: Purchase = {
  id: 42,
  user_id: 7,
  purchase_date: '2026-11-05',
  description: 'Padária São João',
  category: { id: 1, name: 'Alimentação', is_global: true, icon: 'FOOD', color: 'FOOD' },
  payment_method: { id: 4, name: 'Pix', is_global: true },
  amount: '1234.56',
  status: 'PAID',
  created_at: '2026-11-05T13:20:11.123456Z',
  updated_at: '2026-11-05T13:20:11.123456Z',
};

export const PURCHASE_REQUEST_EXAMPLE: PurchaseRequest = {
  purchase_date: '2026-11-05',
  description: 'Padária São João',
  category_id: 1,
  payment_method_id: 4,
  amount: '1234.56',
  status: 'PAID',
};

export const PURCHASE_LIST_EXAMPLE: PaginatedPurchases = {
  items: [
    {
      id: 42,
      user_id: 7,
      purchase_date: '2026-09-30',
      description: 'Uber',
      category: { id: 2, name: 'Transporte', is_global: true, icon: 'CAR', color: 'TRANSPORT' },
      payment_method: { id: 4, name: 'Pix', is_global: true },
      amount: '23.9',
      status: 'PENDING',
      created_at: '2026-09-30T10:00:00Z',
      updated_at: '2026-09-30T10:00:00Z',
    },
  ],
  total: 11,
  total_amount: '263.4',
  page: 2,
  page_size: 8,
  total_pages: 2,
};

/** CA-03: today 10/11/2026. */
export const SUMMARY_UNTIL_DAY_EXAMPLE: MonthSummary = {
  year: 2026,
  month: 11,
  purchase_count: 3,
  spent: '150',
  comparison: {
    period: 'UNTIL_DAY',
    until_day: 10,
    previous_until_day: 10,
    previous_year: 2026,
    previous_month: 10,
    current_amount: '100',
    previous_amount: '200',
    result: 'LESS',
    percent: 50,
  },
};

/** CA-04: September with today in November. */
export const SUMMARY_FULL_MONTH_EXAMPLE: MonthSummary = {
  year: 2026,
  month: 9,
  purchase_count: 14,
  spent: '1100',
  comparison: {
    period: 'FULL_MONTH',
    until_day: null,
    previous_until_day: null,
    previous_year: 2026,
    previous_month: 8,
    current_amount: '1100',
    previous_amount: '1000',
    result: 'MORE',
    percent: 10,
  },
};

/** CA-05: no base to compare. */
export const SUMMARY_NO_BASE_EXAMPLE: MonthSummary = {
  year: 2026,
  month: 9,
  purchase_count: 0,
  spent: '0',
  comparison: {
    period: 'FULL_MONTH',
    until_day: null,
    previous_until_day: null,
    previous_year: 2026,
    previous_month: 8,
    current_amount: '0',
    previous_amount: '0',
    result: 'NO_BASE',
    percent: null,
  },
};

// Examples of 2-contrato.md (feature 007).

/** CA-13: today 31/10/2026; R$ 950,00 in October until today, R$ 1.000,00 in the whole of September. */
export const SUMMARY_SHORTER_MONTH_EXAMPLE: MonthSummary = {
  year: 2026,
  month: 10,
  purchase_count: 12,
  spent: '950',
  comparison: {
    period: 'UNTIL_DAY',
    until_day: 31,
    previous_until_day: 30,
    previous_year: 2026,
    previous_month: 9,
    current_amount: '950',
    previous_amount: '1000',
    result: 'LESS',
    percent: 5,
  },
};

const MORADIA = { id: 3, name: 'Moradia', is_global: true, icon: 'HOUSE', color: 'HOME' } as const;
const ALIMENTACAO = {
  id: 1,
  name: 'Alimentação',
  is_global: true,
  icon: 'FOOD',
  color: 'FOOD',
} as const;
const TRANSPORTE = {
  id: 2,
  name: 'Transporte',
  is_global: true,
  icon: 'CAR',
  color: 'TRANSPORT',
} as const;
const LAZER = { id: 6, name: 'Lazer', is_global: true, icon: 'SMILE', color: 'LEISURE' } as const;
const BOLETO = { id: 6, name: 'Boleto', is_global: true };
const PIX = { id: 4, name: 'Pix', is_global: true };
const CREDITO = { id: 2, name: 'Cartão de crédito', is_global: true };

const OVERVIEW_AMOUNTS: Readonly<Record<number, string>> = { 2: '100', 5: '100', 25: '1000' };

/** CA-01 to CA-06: today 10/11/2026, purchases 101 to 105 of the contract (`daily` with the 30 days). */
export const OVERVIEW_EXAMPLE: MonthOverview = {
  year: 2026,
  month: 11,
  days_in_month: 30,
  is_current_month: true,
  paid: { amount: '200', count: 3 },
  pending: { amount: '1000', count: 1 },
  active_count: 4,
  spent: '1200',
  daily_average: { amount: '20', days: 10 },
  peak_day: 25,
  daily: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    amount: OVERVIEW_AMOUNTS[i + 1] ?? '0',
    forecast: i + 1 > 10,
  })),
  categories: [
    { category: MORADIA, amount: '1000', percent: 83 },
    { category: ALIMENTACAO, amount: '160', percent: 13 },
    { category: TRANSPORTE, amount: '40', percent: 3 },
  ],
  payment_methods: [
    { payment_method: BOLETO, amount: '1000', percent: 83 },
    { payment_method: PIX, amount: '160', percent: 13 },
    { payment_method: CREDITO, amount: '40', percent: 3 },
  ],
  latest: [
    {
      id: 105,
      user_id: 7,
      purchase_date: '2026-11-25',
      description: 'Aluguel',
      category: MORADIA,
      payment_method: BOLETO,
      amount: '1000',
      status: 'PENDING',
      created_at: '2026-11-10T09:00:00Z',
      updated_at: '2026-11-10T09:00:00Z',
    },
    {
      id: 104,
      user_id: 7,
      purchase_date: '2026-11-08',
      description: 'Cinema',
      category: LAZER,
      payment_method: CREDITO,
      amount: '30',
      status: 'CANCELED',
      created_at: '2026-11-08T20:00:00Z',
      updated_at: '2026-11-09T08:00:00Z',
    },
    {
      id: 103,
      user_id: 7,
      purchase_date: '2026-11-05',
      description: 'Padaria',
      category: ALIMENTACAO,
      payment_method: PIX,
      amount: '60',
      status: 'PAID',
      created_at: '2026-11-05T18:00:00Z',
      updated_at: '2026-11-05T18:00:00Z',
    },
    {
      id: 102,
      user_id: 7,
      purchase_date: '2026-11-05',
      description: 'Uber',
      category: TRANSPORTE,
      payment_method: CREDITO,
      amount: '40',
      status: 'PAID',
      created_at: '2026-11-05T08:00:00Z',
      updated_at: '2026-11-05T08:00:00Z',
    },
    {
      id: 101,
      user_id: 7,
      purchase_date: '2026-11-02',
      description: 'Mercado',
      category: ALIMENTACAO,
      payment_method: PIX,
      amount: '100',
      status: 'PAID',
      created_at: '2026-11-02T12:00:00Z',
      updated_at: '2026-11-02T12:00:00Z',
    },
  ],
};

/** CA-11/CA-12: December 2026 seen on 10/11/2026, with one canceled purchase. */
export const OVERVIEW_EMPTY_EXAMPLE: MonthOverview = {
  year: 2026,
  month: 12,
  days_in_month: 31,
  is_current_month: false,
  paid: { amount: '0', count: 0 },
  pending: { amount: '0', count: 0 },
  active_count: 0,
  spent: '0',
  daily_average: { amount: '0', days: 31 },
  peak_day: null,
  daily: Array.from({ length: 31 }, (_, i) => ({ day: i + 1, amount: '0', forecast: false })),
  categories: [],
  payment_methods: [],
  latest: [
    {
      id: 120,
      user_id: 7,
      purchase_date: '2026-12-03',
      description: 'Presente',
      category: LAZER,
      payment_method: PIX,
      amount: '70',
      status: 'CANCELED',
      created_at: '2026-11-10T09:00:00Z',
      updated_at: '2026-11-10T09:30:00Z',
    },
  ],
};

export const ERROR_PURCHASE_NOT_FOUND: ApiError = {
  code: 'NOT_FOUND',
  message: 'purchase not found',
};
export const ERROR_CATEGORY_NOT_FOUND: ApiError = {
  code: 'CATEGORY_NOT_FOUND',
  message: 'category not found',
};
export const ERROR_PAYMENT_METHOD_NOT_FOUND: ApiError = {
  code: 'PAYMENT_METHOD_NOT_FOUND',
  message: 'payment method not found',
};
/** 422 of GET /purchases. */
export const ERROR_Q_TOO_LONG: ApiError = {
  code: 'VALIDATION_ERROR',
  message: 'q must be at most 255 characters',
};

// Examples of 2-contrato.md (feature 006).

export const USER_RESPONSE_DARK_EXAMPLE: UserResponse = {
  id: 7,
  name: 'Jonas Silva',
  email: 'jonas@exemplo.com',
  theme: 'DARK',
};

/** A pair different from TOKEN_RESPONSE_EXAMPLE (PUT /users/me/password). */
export const TOKEN_RESPONSE_NEW_EXAMPLE: TokenResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload-novo>.<assinatura-nova>',
  refresh_token: 'Tm92YS1jaGF2ZS1hbGVhdG9yaWEtYmFzZTY0dXJsLTMy',
  token_type: 'Bearer',
};

const OWN_TIME = '2026-10-01T12:00:00Z';

const globalCategory = (
  id: number,
  name: string,
  icon: CatalogIcon,
  color: CatalogColorOut,
): Category => ({
  id,
  name,
  is_global: true,
  icon,
  color,
  archived_at: null,
  created_at: SEED_TIME,
  updated_at: SEED_TIME,
});

const ownCategory = (
  id: number,
  name: string,
  icon: CatalogIcon,
  color: CatalogColorOut,
  archived_at: string | null = null,
): Category => ({
  id,
  user_id: 7,
  name,
  is_global: false,
  icon,
  color,
  archived_at,
  created_at: OWN_TIME,
  updated_at: OWN_TIME,
});

/**
 * API order: globals first, then by lower(name); archived included. Ids of the global ones as in the prototype's
 * app.js; icon and color of the global ones as in the migration. `Bar` was created before feature 006 (neutral).
 */
export const CATEGORIES_EXAMPLE: Category[] = [
  globalCategory(1, 'Alimentação', 'FOOD', 'FOOD'),
  globalCategory(5, 'Educação', 'BOOK', 'EDUCATION'),
  globalCategory(6, 'Lazer', 'SMILE', 'LEISURE'),
  globalCategory(3, 'Moradia', 'HOUSE', 'HOME'),
  globalCategory(4, 'Saúde', 'HEART', 'HEALTH'),
  globalCategory(2, 'Transporte', 'CAR', 'TRANSPORT'),
  ownCategory(32, 'Academia', 'HEART', 'HEALTH', '2026-10-20T10:00:00Z'),
  ownCategory(30, 'Bar', 'TAG', 'NEUTRAL'),
  ownCategory(31, 'Pets', 'HEART', 'LEISURE'),
];

const globalPayment = (id: number, name: string): PaymentMethod => ({
  id,
  name,
  is_global: true,
  archived_at: null,
  created_at: SEED_TIME,
  updated_at: SEED_TIME,
});

const ownPayment = (
  id: number,
  name: string,
  archived_at: string | null = null,
): PaymentMethod => ({
  id,
  user_id: 7,
  name,
  is_global: false,
  archived_at,
  created_at: OWN_TIME,
  updated_at: OWN_TIME,
});

/** API order (globals by lower(name)); Pix = 4, as in the prototype's app.js. */
export const PAYMENT_METHODS_EXAMPLE: PaymentMethod[] = [
  globalPayment(6, 'Boleto'),
  globalPayment(2, 'Cartão de crédito'),
  globalPayment(3, 'Cartão de débito'),
  globalPayment(1, 'Dinheiro'),
  globalPayment(4, 'Pix'),
  globalPayment(5, 'Transferência bancária'),
  ownPayment(41, 'Cartão antigo', '2026-10-20T10:00:00Z'),
  ownPayment(40, 'Vale-refeição'),
];

export const ERROR_INVALID_PASSWORD: ApiError = {
  code: 'INVALID_PASSWORD',
  message: 'invalid password',
};
export const ERROR_DEFAULT_NAME_CONFLICT: ApiError = {
  code: 'DEFAULT_NAME_CONFLICT',
  message: 'name already used by a default category',
};
export const ERROR_NAME_CONFLICT: ApiError = {
  code: 'NAME_CONFLICT',
  message: 'name already used by another category',
};
export const ERROR_ARCHIVED_NAME_CONFLICT: ApiError = {
  code: 'ARCHIVED_NAME_CONFLICT',
  message: 'name already used by an archived category',
};
/** 404 of PUT /categories/{id} and of …/archive. */
export const ERROR_CATALOG_NOT_FOUND: ApiError = {
  code: 'NOT_FOUND',
  message: 'category not found',
};
export const ERROR_FORBIDDEN: ApiError = {
  code: 'FORBIDDEN',
  message: 'default categories cannot be changed',
};
