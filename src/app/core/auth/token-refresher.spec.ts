import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FakeLockManager } from '../../../testing/fake-lock-manager';
import { API_BASE_URL } from '../http/api-base-url';
import { LOCKS } from './locks';
import { RefreshError } from './refresh-error';
import { SESSION_KEY } from './session.store';
import { TokenRefresher } from './token-refresher';

const REFRESH_URL = '/api/v1/auth/refresh';
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const seed = (access: string, refresh: string) =>
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ access_token: access, refresh_token: refresh }),
  );
const stored = () => JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');

describe('TokenRefresher', () => {
  let refresher: TokenRefresher;
  let http: HttpTestingController;
  let locks: FakeLockManager;

  beforeEach(() => {
    localStorage.clear();
    locks = new FakeLockManager();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: LOCKS, useValue: locks },
      ],
    });
    refresher = TestBed.inject(TokenRefresher);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    http.verify();
    localStorage.clear();
  });

  async function flushRefresh(body: object, status = 200) {
    await settle();
    const req = http.expectOne(REFRESH_URL);
    req.flush(body, { status, statusText: String(status) });
    return req;
  }

  it('renova e grava o par novo', async () => {
    seed('A1', 'R1');
    const result = refresher.refresh('A1');

    const req = await flushRefresh({
      access_token: 'A2',
      refresh_token: 'R2',
      token_type: 'Bearer',
    });

    await expect(result).resolves.toBe('A2');
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    expect(stored()).toEqual({ access_token: 'A2', refresh_token: 'R2' });
  });

  it('três chamadas na mesma aba = um refresh', async () => {
    seed('A1', 'R1');
    const results = [refresher.refresh('A1'), refresher.refresh('A1'), refresher.refresh('A1')];

    await flushRefresh({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });

    await expect(Promise.all(results)).resolves.toEqual(['A2', 'A2', 'A2']);
  });

  it('token já trocado', async () => {
    seed('A2', 'R2');

    await expect(refresher.refresh('A1')).resolves.toBe('A2');
    http.expectNone(REFRESH_URL);
  });

  it('duas abas com o token vencido', async () => {
    seed('A1', 'R1');
    const otherTab = createEnvironmentInjector(
      [TokenRefresher],
      TestBed.inject(EnvironmentInjector),
    ).get(TokenRefresher);
    expect(otherTab).not.toBe(refresher);

    const first = refresher.refresh('A1');
    const second = otherTab.refresh('A1');
    await flushRefresh({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });

    await expect(Promise.all([first, second])).resolves.toEqual(['A2', 'A2']);
    http.expectNone(REFRESH_URL);
    expect(stored()).toEqual({ access_token: 'A2', refresh_token: 'R2' });
  });

  it('sessão sumiu (logout em outra aba)', async () => {
    const error = await refresher.refresh('A1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RefreshError);
    expect((error as RefreshError).reason).toBe('logged-out');
    http.expectNone(REFRESH_URL);
  });

  it('refresh 401', async () => {
    seed('A1', 'R1');
    const result = refresher.refresh('A1').catch((e: unknown) => e);

    await flushRefresh({ code: 'UNAUTHORIZED', message: 'invalid credentials' }, 401);

    const error = await result;
    expect(error).toBeInstanceOf(RefreshError);
    expect((error as RefreshError).reason).toBe('expired');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('refresh 400', async () => {
    seed('A1', 'R1');
    const result = refresher.refresh('A1').catch((e: unknown) => e);

    await flushRefresh({ code: 'BAD_REQUEST', message: 'refresh_token is required' }, 400);

    const error = await result;
    expect(error).toBeInstanceOf(RefreshError);
    expect((error as RefreshError).reason).toBe('expired');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('refresh 500 mantém a sessão', async () => {
    seed('A1', 'R1');
    const result = refresher.refresh('A1').catch((e: unknown) => e);

    await flushRefresh({ code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' }, 500);

    const error = await result;
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(500);
    expect(stored()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
  });

  it('refresh sem rede mantém a sessão', async () => {
    seed('A1', 'R1');
    const result = refresher.refresh('A1').catch((e: unknown) => e);

    await settle();
    http.expectOne(REFRESH_URL).error(new ProgressEvent('error'));

    const error = await result;
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(0);
    expect(stored()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
  });

  it('inFlight é liberado', async () => {
    seed('A1', 'R1');
    const first = refresher.refresh('A1');
    await flushRefresh({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });
    await expect(first).resolves.toBe('A2');

    const second = refresher.refresh('A2');
    const req = await flushRefresh({
      access_token: 'A3',
      refresh_token: 'R3',
      token_type: 'Bearer',
    });

    await expect(second).resolves.toBe('A3');
    expect(req.request.body).toEqual({ refresh_token: 'R2' });
  });

  it('save falha', async () => {
    seed('A1', 'R1');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError');
    });
    const result = refresher.refresh('A1').catch((e: unknown) => e);

    await flushRefresh({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });

    const error = await result;
    expect(error).toBeInstanceOf(RefreshError);
    expect((error as RefreshError).reason).toBe('expired');
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('espera do lock estourada propaga e mantém a sessão', async () => {
    seed('A1', 'R1');
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
      AbortSignal.abort(new DOMException('t', 'TimeoutError')),
    );

    const error = await refresher.refresh('A1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('TimeoutError');
    http.expectNone(REFRESH_URL);
    expect(stored()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
  });
});
