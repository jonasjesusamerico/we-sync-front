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
  /** Delay of every next response of the path. */
  delay(path: string, ms: number): void;
  /** Status with the contract envelope, or route.abort('connectionrefused'); `times` responses (default 1). */
  fail(path: string, response: number | 'abort', times?: number): void;
  calls(path: string): number;
  requests(path: string): MockRequest[];
  /** Serves another context (a new browser session) with the same state. */
  attach(context: BrowserContext): Promise<void>;
}

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
  const failures = new Map<string, { response: number | 'abort'; times: number }>();
  const log = new Map<string, MockRequest[]>();
  let nextId = 100;
  let counter = 0;

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
    const entry = { body, headers: await request.allHeaders() };
    log.set(path, [...(log.get(path) ?? []), entry]);

    const wait = delays.get(path);
    if (wait) {
      await sleep(wait);
    }
    const failure = failures.get(path);
    if (failure && failure.times > 0) {
      failure.times -= 1;
      if (failure.response === 'abort') {
        await route.abort('connectionrefused');
      } else {
        await error(route, failure.response, 'simulated failure');
      }
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
  };
  await api.attach(context);
  return api;
}
