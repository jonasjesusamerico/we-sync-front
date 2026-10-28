import { Page } from '@playwright/test';

export type Endpoint = 'register' | 'login' | 'refresh' | 'logout';
export type Handler = { status: number; body?: unknown; delayMs?: number } | 'abort';

/** Respostas de exemplo do `2-contrato.md` da feature 001. */
export const CONTRACT = {
  registered: { status: 201, body: { id: 42, email: 'ana@exemplo.com' } },
  conflict: { status: 409, body: { code: 'CONFLICT', message: 'email already registered' } },
  tokens: {
    status: 200,
    body: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<assinatura>',
      refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
      token_type: 'Bearer',
    },
  },
  invalidCredentials: {
    status: 401,
    body: { code: 'UNAUTHORIZED', message: 'invalid credentials' },
  },
  loggedOut: { status: 204 },
} satisfies Record<string, Handler>;

export interface ApiMock {
  calls: Record<Endpoint | 'other', number>;
  bodies: Record<Endpoint, unknown[]>;
}

/**
 * Responde tudo em `**\/api/v1/**`. Endpoint sem handler responde 500 e conta a chamada (falha visível).
 * `'abort'` derruba a conexão (`status 0` no app).
 */
export async function mockApi(
  page: Page,
  handlers: Partial<Record<Endpoint, Handler>>,
): Promise<ApiMock> {
  const mock: ApiMock = {
    calls: { register: 0, login: 0, refresh: 0, logout: 0, other: 0 },
    bodies: { register: [], login: [], refresh: [], logout: [] },
  };
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const match = /\/api\/v1\/auth\/(register|login|refresh|logout)$/.exec(path);
    if (!match) {
      mock.calls.other++;
      await route.fulfill({ status: 500, json: internalError() });
      return;
    }
    const endpoint = match[1] as Endpoint;
    mock.calls[endpoint]++;
    mock.bodies[endpoint].push(route.request().postDataJSON());
    const handler = handlers[endpoint];
    if (handler === undefined) {
      await route.fulfill({ status: 500, json: internalError() });
      return;
    }
    if (handler === 'abort') {
      await route.abort('internetdisconnected');
      return;
    }
    if (handler.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, handler.delayMs));
    }
    if (handler.body === undefined) {
      await route.fulfill({ status: handler.status });
    } else {
      await route.fulfill({ status: handler.status, json: handler.body });
    }
  });
  return mock;
}

function internalError() {
  return { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' };
}
