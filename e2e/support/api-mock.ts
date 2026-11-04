// Fake API with state for the e2e tests, following 2-contrato.md of feature 004.
// Registered with route() on the BrowserContext, so the tabs of a context share it.
import type { BrowserContext, Route } from '@playwright/test';

export interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface MockRequest {
  body: unknown;
  headers: Record<string, string>;
  method: string;
  /** Query string of the request (feature 005). */
  query: Record<string, string>;
}

export interface ApiMock {
  /** Ready user (contract example: Ana Souza, id 42). */
  addUser(user: MockUser): void;
  /** Valid pair, without going through the login. */
  issueSession(email: string): { access_token: string; refresh_token: string };
  /** Every current access token starts to get 401 on /users/me. */
  expireAccessTokens(): void;
  /** Every current refresh token starts to get 401. */
  revokeRefreshTokens(): void;
  /** Delay of every next response of the path (paths with an id use the key '/purchases/:id'). */
  delay(path: string, ms: number): void;
  /**
   * Status with the contract envelope (`{ status, code }` for a specific code), or
   * route.abort('connectionrefused'); `times` responses (default 1).
   */
  fail(path: string, response: FailResponse, times?: number): void;
  calls(path: string): number;
  requests(path: string): MockRequest[];
  /** Serves another context (a new browser session) with the same state. */
  attach(context: BrowserContext): Promise<void>;

  // Feature 005: purchases, categories and payment methods, per user (the owner comes from the token).
  /** The user's own category (id from 30 on). */
  addCategory(email: string, name: string): number;
  addPaymentMethod(email: string, name: string): number;
  /** Removes it, as another tab would. */
  removeCategory(id: number): void;
  removePaymentMethod(id: number): void;
  addPurchase(email: string, purchase: NewMockPurchase): number;
  /** Deletes it, as another tab would. */
  removePurchase(id: number): void;
  /** Purchases kept for the user (to check what the front saved). */
  purchasesOf(email: string): MockPurchase[];
}

export type FailResponse = number | 'abort' | { status: number; code: string };

export type MockStatus = 'PAID' | 'PENDING' | 'CANCELED';

export interface NewMockPurchase {
  /** "YYYY-MM-DD" */
  date: string;
  description: string;
  categoryId: number;
  paymentMethodId: number;
  cents: number;
  status: MockStatus;
}

export interface MockPurchase extends NewMockPurchase {
  id: number;
  owner: string;
}

interface CatalogItem {
  id: number;
  name: string;
  /** null = global. */
  owner: string | null;
}

/** Global items of the API seed, with the ids of the prototype's app.js. */
const GLOBAL_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer'];
const GLOBAL_PAYMENT_METHODS = [
  'Dinheiro',
  'Cartão de crédito',
  'Cartão de débito',
  'Pix',
  'Transferência bancária',
  'Boleto',
];

/** Cents → the API decimal string, without trailing zeros ("263.4", "10", "0"). */
export function centsToMoney(cents: number): string {
  const integer = Math.floor(cents / 100);
  const fraction = String(cents % 100)
    .padStart(2, '0')
    .replace(/0+$/, '');
  return fraction === '' ? String(integer) : `${integer}.${fraction}`;
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
const pad = (n: number, size = 2) => String(n).padStart(size, '0');
const isoDay = (year: number, month: number, day: number) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

export const ANA: MockUser = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  password: 'Senha123!',
};

const CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_SERVER_ERROR',
};

const normalize = (email: string) => email.trim().toLowerCase();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockApi(context: BrowserContext): Promise<ApiMock> {
  const users = new Map<string, MockUser>();
  const access = new Map<string, string>();
  const refresh = new Map<string, string>();
  const delays = new Map<string, number>();
  const failures = new Map<string, { response: FailResponse; times: number }>();
  const log = new Map<string, MockRequest[]>();
  let nextId = 100;
  let counter = 0;
  const categories: CatalogItem[] = GLOBAL_CATEGORIES.map((name, i) => ({
    id: i + 1,
    name,
    owner: null,
  }));
  const paymentMethods: CatalogItem[] = GLOBAL_PAYMENT_METHODS.map((name, i) => ({
    id: i + 1,
    name,
    owner: null,
  }));
  let nextCatalogId = 30;
  const purchases: MockPurchase[] = [];
  let nextPurchaseId = 1;

  function issue(email: string) {
    counter += 1;
    const pair = { access_token: `access-${counter}`, refresh_token: `refresh-${counter}` };
    access.set(pair.access_token, email);
    refresh.set(pair.refresh_token, email);
    return pair;
  }

  const json = (route: Route, status: number, body?: unknown) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: body === undefined ? '' : JSON.stringify(body),
    });

  const error = (route: Route, status: number, message: string) =>
    json(route, status, { code: CODES[status] ?? 'INTERNAL_SERVER_ERROR', message });

  async function handle(route: Route): Promise<void> {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204 });
      return;
    }
    let body: unknown = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
    const entry: MockRequest = {
      body,
      headers: await request.allHeaders(),
      method: request.method(),
      query: Object.fromEntries(url.searchParams),
    };
    // Paths with an id share one key, as the tests do not know the ids in advance.
    const key = /^\/purchases\/\d+$/.test(path) ? '/purchases/:id' : path;
    log.set(key, [...(log.get(key) ?? []), entry]);

    const wait = delays.get(key);
    if (wait) {
      await sleep(wait);
    }
    const failure = failures.get(key);
    if (failure && failure.times > 0) {
      failure.times -= 1;
      if (failure.response === 'abort') {
        await route.abort('connectionrefused');
      } else if (typeof failure.response === 'object') {
        await json(route, failure.response.status, {
          code: failure.response.code,
          message: 'simulated failure',
        });
      } else {
        await error(route, failure.response, 'simulated failure');
      }
      return;
    }

    if (key === '/categories' || key === '/payment-methods' || key.startsWith('/purchases')) {
      await handlePurchases(route, key, path, url, entry);
      return;
    }

    const data = (body ?? {}) as Record<string, string>;
    switch (`${request.method()} ${path}`) {
      case 'POST /auth/register': {
        const name = (data['name'] ?? '').trim();
        const email = normalize(data['email'] ?? '');
        if (Array.from(name).length < 2 || Array.from(name).length > 60) {
          return error(route, 422, 'name must be between 2 and 60 characters');
        }
        if (users.has(email)) {
          return error(route, 409, 'email already registered');
        }
        const user = { id: nextId++, name, email, password: data['password'] ?? '' };
        users.set(email, user);
        return json(route, 201, { id: user.id, name: user.name, email: user.email });
      }
      case 'POST /auth/login': {
        const user = users.get(normalize(data['email'] ?? ''));
        if (!user || user.password !== data['password']) {
          return error(route, 401, 'invalid credentials');
        }
        return json(route, 200, { ...issue(user.email), token_type: 'Bearer' });
      }
      case 'POST /auth/refresh': {
        const token = data['refresh_token'] ?? '';
        const email = refresh.get(token);
        if (!email) {
          return error(route, 401, 'invalid credentials');
        }
        refresh.delete(token);
        return json(route, 200, { ...issue(email), token_type: 'Bearer' });
      }
      case 'POST /auth/logout':
        refresh.delete(data['refresh_token'] ?? '');
        return json(route, 204);
      case 'GET /users/me': {
        const header = entry.headers['authorization'] ?? '';
        const email = header.startsWith('Bearer ') ? access.get(header.slice(7)) : undefined;
        const user = email ? users.get(email) : undefined;
        if (!user) {
          return error(route, 401, 'invalid authentication token');
        }
        return json(route, 200, { id: user.id, name: user.name, email: user.email });
      }
      default:
        return error(route, 404, 'not found');
    }
  }

  // ---------------------------------------------------------------------------
  // Feature 005 (2-contrato.md): purchases, summary, categories and payment methods.
  // ---------------------------------------------------------------------------

  function ownerOf(entry: MockRequest): MockUser | undefined {
    const header = entry.headers['authorization'] ?? '';
    const email = header.startsWith('Bearer ') ? access.get(header.slice(7)) : undefined;
    return email ? users.get(email) : undefined;
  }

  const visible = (list: CatalogItem[], owner: string) =>
    list
      .filter((item) => item.owner === null || item.owner === owner)
      .sort(
        (a, b) =>
          Number(a.owner !== null) - Number(b.owner !== null) ||
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      );

  const catalogJson = (item: CatalogItem, user: MockUser) => ({
    id: item.id,
    ...(item.owner === null ? {} : { user_id: user.id }),
    name: item.name,
    is_global: item.owner === null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  const ref = (list: CatalogItem[], id: number) => {
    const item = list.find((i) => i.id === id);
    return { id, name: item?.name ?? '?', is_global: item?.owner === null };
  };

  const purchaseJson = (p: MockPurchase, user: MockUser) => ({
    id: p.id,
    user_id: user.id,
    purchase_date: p.date,
    description: p.description,
    category: ref(categories, p.categoryId),
    payment_method: ref(paymentMethods, p.paymentMethodId),
    amount: centsToMoney(p.cents),
    status: p.status,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });

  const inMonth = (p: MockPurchase, year: number, month: number) =>
    p.date.startsWith(`${pad(year, 4)}-${pad(month)}-`);
  const sumCents = (list: MockPurchase[]) =>
    list.filter((p) => p.status !== 'CANCELED').reduce((total, p) => total + p.cents, 0);

  /** RN-01 to RN-03 and ADR-03, as the contract describes them. */
  function summary(owner: string, year: number, month: number, today: string) {
    const mine = purchases.filter((p) => p.owner === owner);
    const monthItems = mine.filter((p) => inMonth(p, year, month));
    const [ty, tm, td] = today.split('-').map(Number);
    const previousYear = month === 1 ? year - 1 : year;
    const previousMonth = month === 1 ? 12 : month - 1;
    const untilDay = ty === year && tm === month ? td : null;
    const lastPrevious = previousYear >= 1 ? daysInMonth(previousYear, previousMonth) : 0;
    const between = (from: string, to: string) =>
      mine.filter((p) => p.date >= from && p.date <= to);
    const current = sumCents(
      between(isoDay(year, month, 1), isoDay(year, month, untilDay ?? daysInMonth(year, month))),
    );
    const previous =
      previousYear >= 1
        ? sumCents(
            between(
              isoDay(previousYear, previousMonth, 1),
              isoDay(previousYear, previousMonth, Math.min(untilDay ?? lastPrevious, lastPrevious)),
            ),
          )
        : 0;
    let result: 'MORE' | 'LESS' | 'EQUAL' | 'NO_BASE';
    let percent: number | null = null;
    if (previous === 0) {
      result = 'NO_BASE';
    } else {
      // round(|c − p| ÷ p × 100), half up, in integers.
      percent = Math.floor((200 * Math.abs(current - previous) + previous) / (2 * previous));
      result = percent === 0 ? 'EQUAL' : current > previous ? 'MORE' : 'LESS';
    }
    return {
      year,
      month,
      purchase_count: monthItems.length,
      spent: centsToMoney(sumCents(monthItems)),
      comparison: {
        period: untilDay === null ? 'FULL_MONTH' : 'UNTIL_DAY',
        until_day: untilDay,
        previous_year: previousYear,
        previous_month: previousMonth,
        current_amount: centsToMoney(current),
        previous_amount: centsToMoney(previous),
        result,
        percent,
      },
    };
  }

  async function handlePurchases(
    route: Route,
    key: string,
    path: string,
    url: URL,
    entry: MockRequest,
  ): Promise<void> {
    const user = ownerOf(entry);
    if (!user) {
      return error(route, 401, 'invalid authentication token');
    }
    // The front never sends a user parameter (RN-27, CA-46): a request with one fails the test.
    if (['user_id', 'userId', 'owner'].some((name) => url.searchParams.has(name))) {
      throw new Error(`unexpected user parameter in ${url.search}`);
    }
    const owner = user.email;
    const q = url.searchParams;
    const method = entry.method;
    const id = key === '/purchases/:id' ? Number(path.split('/')[2]) : 0;
    const mine = (pid: number) => purchases.find((p) => p.id === pid && p.owner === owner);

    if (method === 'GET' && key === '/categories') {
      return json(
        route,
        200,
        visible(categories, owner).map((c) => catalogJson(c, user)),
      );
    }
    if (method === 'GET' && key === '/payment-methods') {
      return json(
        route,
        200,
        visible(paymentMethods, owner).map((m) => catalogJson(m, user)),
      );
    }
    if (method === 'GET' && key === '/purchases/summary') {
      const year = Number(q.get('year'));
      const month = Number(q.get('month'));
      const today = q.get('today') ?? '';
      if (!(year >= 1 && year <= 9999)) {
        return error(route, 400, 'year must be an integer between 1 and 9999');
      }
      if (!(month >= 1 && month <= 12)) {
        return error(route, 400, 'month must be an integer between 1 and 12');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
        return error(route, 400, 'today must be a date in YYYY-MM-DD format');
      }
      return json(route, 200, summary(owner, year, month, today));
    }
    if (method === 'GET' && key === '/purchases') {
      const search = fold((q.get('q') ?? '').trim());
      if (Array.from((q.get('q') ?? '').trim()).length > 255) {
        return error(route, 422, 'q must be at most 255 characters');
      }
      const year = Number(q.get('year'));
      const month = Number(q.get('month'));
      const status = q.get('status');
      const categoryId = q.has('category_id') ? Number(q.get('category_id')) : null;
      const page = Number(q.get('page') ?? '1');
      const size = Number(q.get('page_size') ?? '20');
      const filtered = purchases
        .filter(
          (p) =>
            p.owner === owner &&
            inMonth(p, year, month) &&
            (search === '' || fold(p.description).includes(search)) &&
            (status === null || p.status === status) &&
            (categoryId === null || p.categoryId === categoryId),
        )
        .sort((a, b) => (a.date === b.date ? b.id - a.id : a.date < b.date ? 1 : -1));
      return json(route, 200, {
        items: filtered.slice((page - 1) * size, page * size).map((p) => purchaseJson(p, user)),
        total: filtered.length,
        total_amount: centsToMoney(sumCents(filtered)),
        page,
        page_size: size,
        total_pages: Math.ceil(filtered.length / size),
      });
    }
    if (method === 'GET' && key === '/purchases/:id') {
      const p = mine(id);
      return p ? json(route, 200, purchaseJson(p, user)) : error(route, 404, 'purchase not found');
    }
    if (method === 'DELETE' && key === '/purchases/:id') {
      const p = mine(id);
      if (!p) {
        return error(route, 404, 'purchase not found');
      }
      purchases.splice(purchases.indexOf(p), 1);
      return json(route, 204);
    }
    if (
      (method === 'POST' && key === '/purchases') ||
      (method === 'PUT' && key === '/purchases/:id')
    ) {
      const data = (entry.body ?? {}) as Record<string, unknown>;
      const categoryId = Number(data['category_id']);
      const paymentMethodId = Number(data['payment_method_id']);
      const accessible = (list: CatalogItem[], cid: number) =>
        list.some((i) => i.id === cid && (i.owner === null || i.owner === owner));
      // Contract order: category, payment method, then the purchase (PUT only).
      if (!accessible(categories, categoryId)) {
        return json(route, 404, { code: 'CATEGORY_NOT_FOUND', message: 'category not found' });
      }
      if (!accessible(paymentMethods, paymentMethodId)) {
        return json(route, 404, {
          code: 'PAYMENT_METHOD_NOT_FOUND',
          message: 'payment method not found',
        });
      }
      const [integer, fraction = '0'] = String(data['amount']).split('.');
      const values: NewMockPurchase = {
        date: String(data['purchase_date']),
        description: String(data['description']).trim(),
        categoryId,
        paymentMethodId,
        cents: Number(integer) * 100 + Number(fraction.padEnd(2, '0')),
        status: data['status'] as MockStatus,
      };
      if (method === 'POST') {
        const created = { ...values, id: nextPurchaseId++, owner };
        purchases.push(created);
        return json(route, 201, purchaseJson(created, user));
      }
      const p = mine(id);
      if (!p) {
        return error(route, 404, 'purchase not found');
      }
      Object.assign(p, values);
      return json(route, 200, purchaseJson(p, user));
    }
    return error(route, 404, 'not found');
  }

  const api: ApiMock = {
    addUser: (user) => users.set(normalize(user.email), { ...user, email: normalize(user.email) }),
    issueSession: (email) => issue(normalize(email)),
    expireAccessTokens: () => access.clear(),
    revokeRefreshTokens: () => refresh.clear(),
    delay: (path, ms) => delays.set(path, ms),
    fail: (path, response, times = 1) => failures.set(path, { response, times }),
    calls: (path) => log.get(path)?.length ?? 0,
    requests: (path) => log.get(path) ?? [],
    attach: (other) => other.route('**/api/v1/**', handle),
    addCategory: (email, name) => {
      const id = nextCatalogId++;
      categories.push({ id, name, owner: normalize(email) });
      return id;
    },
    addPaymentMethod: (email, name) => {
      const id = nextCatalogId++;
      paymentMethods.push({ id, name, owner: normalize(email) });
      return id;
    },
    removeCategory: (id) => {
      const index = categories.findIndex((c) => c.id === id);
      if (index >= 0) categories.splice(index, 1);
    },
    removePaymentMethod: (id) => {
      const index = paymentMethods.findIndex((m) => m.id === id);
      if (index >= 0) paymentMethods.splice(index, 1);
    },
    addPurchase: (email, purchase) => {
      const id = nextPurchaseId++;
      purchases.push({ ...purchase, id, owner: normalize(email) });
      return id;
    },
    removePurchase: (id) => {
      const index = purchases.findIndex((p) => p.id === id);
      if (index >= 0) purchases.splice(index, 1);
    },
    purchasesOf: (email) => purchases.filter((p) => p.owner === normalize(email)),
  };
  await api.attach(context);
  return api;
}
