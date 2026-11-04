// Examples of 2-contrato.md (feature 004), used by the unit tests.
import type {
  ApiError,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from '../app/core/auth/session.models';
import type { UserResponse } from '../app/core/user/user.models';
import type {
  Category,
  MonthSummary,
  PaginatedPurchases,
  PaymentMethod,
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
  category: { id: 1, name: 'Alimentação', is_global: true },
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
      category: { id: 2, name: 'Transporte', is_global: true },
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
    previous_year: 2026,
    previous_month: 8,
    current_amount: '0',
    previous_amount: '0',
    result: 'NO_BASE',
    percent: null,
  },
};

const globalItem = (id: number, name: string): Category => ({
  id,
  name,
  is_global: true,
  created_at: SEED_TIME,
  updated_at: SEED_TIME,
});

const ownItem = (id: number, name: string): Category => ({
  id,
  user_id: 7,
  name,
  is_global: false,
  created_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
});

/** API order: globals first, then by lower(name). Ids of the global ones as in the prototype's app.js. */
export const CATEGORIES_EXAMPLE: Category[] = [
  globalItem(1, 'Alimentação'),
  globalItem(5, 'Educação'),
  globalItem(6, 'Lazer'),
  globalItem(3, 'Moradia'),
  globalItem(4, 'Saúde'),
  globalItem(2, 'Transporte'),
  ownItem(30, 'Bar'),
  ownItem(31, 'Pets'),
];

/** API order (globals by lower(name)); Pix = 4, as in the prototype's app.js. */
export const PAYMENT_METHODS_EXAMPLE: PaymentMethod[] = [
  globalItem(6, 'Boleto'),
  globalItem(2, 'Cartão de crédito'),
  globalItem(3, 'Cartão de débito'),
  globalItem(1, 'Dinheiro'),
  globalItem(4, 'Pix'),
  globalItem(5, 'Transferência bancária'),
];

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
