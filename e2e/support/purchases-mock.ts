import { BrowserContext, Page, Request, Route } from '@playwright/test';

import type { Option, PurchaseStatus } from '../../src/app/features/purchases/purchase.models';
import { Handler, respond, StaticHandler } from './api-mock';

const option = (id: number, name: string, is_global = true): Option => ({ id, name, is_global });

/** Categorias globais, na ordem da API (globais primeiro, por nome). */
export const GLOBAL_CATEGORIES: Option[] = [
  option(1, 'Alimentação'),
  option(5, 'Educação'),
  option(6, 'Lazer'),
  option(3, 'Moradia'),
  option(4, 'Saúde'),
  option(2, 'Transporte'),
];

export const GLOBAL_PAYMENT_METHODS: Option[] = [
  option(6, 'Boleto'),
  option(2, 'Cartão de crédito'),
  option(3, 'Cartão de débito'),
  option(1, 'Dinheiro'),
  option(4, 'Pix'),
  option(5, 'Transferência bancária'),
];

/** Categorias pessoais do usuário 7. */
export const PERSONAL_CATEGORIES: Option[] = [
  option(31, 'Academia', false),
  option(32, 'Pets', false),
];

export interface PurchaseSeed {
  id: number;
  /** `YYYY-MM-DD` */
  date: string;
  description: string;
  /** Texto decimal com ponto, como no envio (`"1234.56"`). A resposta tira os zeros à direita. */
  amount: string;
  status: PurchaseStatus;
  categoryId: number;
  paymentMethodId: number;
}

/**
 * `count` lançamentos numerados a partir de `base`: ids `base.id`, `base.id + 1`… (padrão 1) e descrições
 * `"<base.description> 1"`, `"… 2"`… (padrão `Lançamento`).
 */
export function seeds(
  count: number,
  base: Partial<PurchaseSeed> & { date: string },
): PurchaseSeed[] {
  const firstId = base.id ?? 1;
  const prefix = base.description ?? 'Lançamento';
  return Array.from({ length: count }, (_, i) => ({
    amount: '10.00',
    status: 'PAID' as PurchaseStatus,
    categoryId: 1,
    paymentMethodId: 4,
    ...base,
    id: firstId + i,
    description: `${prefix} ${i + 1}`,
  }));
}

export interface FakeUser {
  purchases: PurchaseSeed[];
  categories: Option[];
  paymentMethods: Option[];
}

export type FakeRoute =
  'list' | 'get' | 'create' | 'update' | 'delete' | 'categories' | 'paymentMethods';

export interface PurchasesMockOptions {
  /** Access token → dados. Padrão `{ A1: {} }`. Campos que faltam: categorias e formas globais e nenhum lançamento. */
  users?: Record<string, Partial<FakeUser>>;
  /** Tokens que recebem `401 UNAUTHORIZED` (o interceptor renova). */
  expiredTokens?: string[];
  /** Resposta forçada por rota (inclui `'abort'`). Pode ser trocada durante o teste. */
  override?: Partial<Record<FakeRoute, Handler>>;
  delayMs?: Partial<Record<FakeRoute, number>>;
}

export interface PurchasesMock {
  calls: Record<FakeRoute, number>;
  requests: {
    route: FakeRoute;
    method: string;
    url: URL;
    body: unknown;
    authorization: string | null;
  }[];
  /** Dados do usuário (mutável: o teste pode tirar uma categoria ou um lançamento). */
  user(token: string): FakeUser;
  /** Mutável: trocar `override`, `expiredTokens` ou `delayMs` no meio do teste. */
  options: PurchasesMockOptions;
}

const PURCHASE_ID = /^[1-9]\d*$/;
const PAGE_SIZE_DEFAULT = 20;

/** Como o `shopspring/decimal` da API: `"1234.50"` → `"1234.5"`, `"10.00"` → `"10"`. */
function trimZeros(amount: string): string {
  return amount.includes('.') ? amount.replace(/0+$/, '').replace(/\.$/, '') : amount;
}

function error(status: number, code: string, message: string): StaticHandler {
  return { status, body: { code, message } };
}

/**
 * Servidor falso de `/purchases`, `/categories` e `/payment-methods` (contrato da feature 003), com estado por
 * access token. Registre **depois** do `mockApi`: as rotas que não são daqui seguem com `route.fallback()`.
 */
export async function mockPurchasesApi(
  target: Page | BrowserContext,
  options: PurchasesMockOptions = {},
): Promise<PurchasesMock> {
  options.users ??= { A1: {} };
  const users = new Map<string, FakeUser>();

  const mock: PurchasesMock = {
    calls: {
      list: 0,
      get: 0,
      create: 0,
      update: 0,
      delete: 0,
      categories: 0,
      paymentMethods: 0,
    },
    requests: [],
    options,
    user(token: string): FakeUser {
      let user = users.get(token);
      if (!user) {
        const seed = options.users?.[token] ?? {};
        user = {
          purchases: [...(seed.purchases ?? [])],
          categories: [...(seed.categories ?? GLOBAL_CATEGORIES)],
          paymentMethods: [...(seed.paymentMethods ?? GLOBAL_PAYMENT_METHODS)],
        };
        users.set(token, user);
      }
      return user;
    },
  };

  await target.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, '');
    const match = classify(request.method(), path);
    if (!match) {
      await route.fallback();
      return;
    }
    const [name, id] = match;
    mock.calls[name]++;
    const authorization = (await request.headerValue('authorization')) ?? null;
    mock.requests.push({
      route: name,
      method: request.method(),
      url,
      body: request.postDataJSON() as unknown,
      authorization,
    });

    const delay = options.delayMs?.[name];
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const forced = options.override?.[name];
    if (forced !== undefined) {
      await answer(route, typeof forced === 'function' ? await forced(request) : forced);
      return;
    }

    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token || options.expiredTokens?.includes(token) || !(token in (options.users ?? {}))) {
      await answer(route, error(401, 'UNAUTHORIZED', 'invalid authentication token'));
      return;
    }
    await answer(route, handle(name, id, url, request, mock.user(token)));
  });

  return mock;
}

/**
 * Responde, ignorando a falha de uma requisição que o app já cancelou durante o atraso (ex.: troca de mês ou saída
 * da tela com `delayMs`): não há mais para quem responder.
 */
async function answer(route: Route, handler: StaticHandler): Promise<void> {
  try {
    await respond(route, handler);
  } catch (e) {
    if (!String(e).includes('Route is already handled') && !String(e).includes('closed')) {
      throw e;
    }
  }
}

function classify(method: string, path: string): [FakeRoute, string | null] | null {
  if (path === '/categories' && method === 'GET') return ['categories', null];
  if (path === '/payment-methods' && method === 'GET') return ['paymentMethods', null];
  if (path === '/purchases') {
    if (method === 'GET') return ['list', null];
    if (method === 'POST') return ['create', null];
    return null;
  }
  const item = /^\/purchases\/([^/]+)$/.exec(path);
  if (!item) return null;
  const byMethod: Record<string, FakeRoute> = { GET: 'get', PUT: 'update', DELETE: 'delete' };
  const name = byMethod[method];
  return name ? [name, decodeURIComponent(item[1])] : null;
}

function handle(
  name: FakeRoute,
  id: string | null,
  url: URL,
  request: Request,
  user: FakeUser,
): StaticHandler {
  switch (name) {
    case 'categories':
      return { status: 200, body: byApiOrder(user.categories) };
    case 'paymentMethods':
      return { status: 200, body: byApiOrder(user.paymentMethods) };
    case 'list':
      return { status: 200, body: list(url, user) };
  }
  if (name === 'create') {
    const body = request.postDataJSON() as Record<string, unknown>;
    const invalid = checkOptions(body, user);
    if (invalid) return invalid;
    const nextId = Math.max(1000, ...user.purchases.map((p) => p.id + 1));
    const seed = fromBody(nextId, body);
    user.purchases.push(seed);
    return { status: 201, body: toPurchase(seed, user) };
  }
  if (!id || !PURCHASE_ID.test(id)) {
    return error(400, 'BAD_REQUEST', 'id must be a positive integer');
  }
  const index = user.purchases.findIndex((p) => p.id === Number(id));
  if (name === 'update') {
    const body = request.postDataJSON() as Record<string, unknown>;
    const invalid = checkOptions(body, user);
    if (invalid) return invalid;
    if (index < 0) return error(404, 'NOT_FOUND', 'purchase not found');
    user.purchases[index] = fromBody(Number(id), body);
    return { status: 200, body: toPurchase(user.purchases[index], user) };
  }
  if (index < 0) return error(404, 'NOT_FOUND', 'purchase not found');
  if (name === 'delete') {
    user.purchases.splice(index, 1);
    return { status: 204 };
  }
  return { status: 200, body: toPurchase(user.purchases[index], user) };
}

/** Ordem da API: globais primeiro, depois por nome em minúsculas (o front reordena). */
function byApiOrder(list: Option[]): Option[] {
  return [...list].sort(
    (a, b) =>
      Number(b.is_global) - Number(a.is_global) ||
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
}

function list(url: URL, user: FakeUser) {
  const q = url.searchParams;
  const num = (key: string) => (q.has(key) ? Number(q.get(key)) : null);
  const year = num('year');
  const month = num('month');
  const categoryId = num('category_id');
  const paymentMethodId = num('payment_method_id');
  const status = q.get('status');
  const page = num('page') ?? 1;
  const pageSize = num('page_size') ?? PAGE_SIZE_DEFAULT;
  const matching = user.purchases
    .filter((p) => {
      const [y, m] = p.date.split('-').map(Number);
      return (
        (year === null || y === year) &&
        (month === null || m === month) &&
        (status === null || p.status === status) &&
        (categoryId === null || p.categoryId === categoryId) &&
        (paymentMethodId === null || p.paymentMethodId === paymentMethodId)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = matching.length;
  return {
    items: matching.slice((page - 1) * pageSize, page * pageSize).map((p) => toPurchase(p, user)),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
}

function checkOptions(body: Record<string, unknown>, user: FakeUser): StaticHandler | null {
  if (!user.categories.some((o) => o.id === body['category_id'])) {
    return error(404, 'CATEGORY_NOT_FOUND', 'category not found');
  }
  if (!user.paymentMethods.some((o) => o.id === body['payment_method_id'])) {
    return error(404, 'PAYMENT_METHOD_NOT_FOUND', 'payment method not found');
  }
  return null;
}

function fromBody(id: number, body: Record<string, unknown>): PurchaseSeed {
  return {
    id,
    date: String(body['purchase_date']),
    description: String(body['description']).trim(),
    amount: String(body['amount']),
    status: body['status'] as PurchaseStatus,
    categoryId: Number(body['category_id']),
    paymentMethodId: Number(body['payment_method_id']),
  };
}

function findOption(list: Option[], fallback: Option[], id: number): Option {
  const found = list.find((o) => o.id === id) ?? fallback.find((o) => o.id === id);
  return found ?? option(id, `#${id}`, false);
}

function toPurchase(p: PurchaseSeed, user: FakeUser) {
  return {
    id: p.id,
    user_id: 7,
    purchase_date: p.date,
    description: p.description,
    category: findOption(user.categories, GLOBAL_CATEGORIES, p.categoryId),
    payment_method: findOption(user.paymentMethods, GLOBAL_PAYMENT_METHODS, p.paymentMethodId),
    amount: trimZeros(p.amount),
    status: p.status,
    created_at: '2026-10-05T13:20:11.123456Z',
    updated_at: '2026-10-05T13:20:11.123456Z',
  };
}
