import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { FakeLockManager } from '../../../testing/fake-lock-manager';
import { API_BASE_URL } from '../http/api-base-url';
import { authInterceptor } from './auth.interceptor';
import { LOCKS } from './locks';
import { RefreshError } from './refresh-error';
import { SESSION_KEY } from './session.store';

const PURCHASES = '/api/v1/purchases';
const REFRESH = '/api/v1/auth/refresh';
const UNAUTHORIZED_BODY = { code: 'UNAUTHORIZED', message: 'invalid authentication token' };
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const seed = (access: string, refresh: string) =>
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ access_token: access, refresh_token: refresh }),
  );
const stored = () => JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
const status = (code: number) => ({ status: code, statusText: String(code) });

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api/v1' },
        { provide: LOCKS, useValue: new FakeLockManager() },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function get(url = PURCHASES) {
    const next = vi.fn();
    const error = vi.fn();
    client.get(url).subscribe({ next, error });
    return { next, error };
  }

  it('envia Bearer em rota protegida', () => {
    seed('A1', 'R1');
    get();

    const req = http.expectOne(PURCHASES);
    expect(req.request.headers.get('Authorization')).toBe('Bearer A1');
    req.flush([]);
  });

  it('não envia Bearer em /auth/*', () => {
    seed('A1', 'R1');
    client.post('/api/v1/auth/login', {}).subscribe();

    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('não envia Bearer para outro host', () => {
    seed('A1', 'R1');
    get('https://outro.com/api/v1/x');

    const req = http.expectOne('https://outro.com/api/v1/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('não envia Bearer para um caminho que só começa igual à base', () => {
    seed('A1', 'R1');
    get('/api/v10/x');

    const req = http.expectOne('/api/v10/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sem sessão não envia Authorization', () => {
    get();

    const req = http.expectOne(PURCHASES);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('401 → renova → repete', async () => {
    seed('A1', 'R1');
    const { next, error } = get();

    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));
    await settle();
    const refresh = http.expectOne(REFRESH);
    expect(refresh.request.body).toEqual({ refresh_token: 'R1' });
    refresh.flush({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });
    await settle();
    const retry = http.expectOne(PURCHASES);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer A2');
    retry.flush([]);

    expect(next).toHaveBeenCalledWith([]);
    expect(error).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('duas chamadas com 401 = um refresh', async () => {
    seed('A1', 'R1');
    const first = get();
    const second = get();

    for (const req of http.match(PURCHASES)) {
      req.flush(UNAUTHORIZED_BODY, status(401));
    }
    await settle();
    http
      .expectOne(REFRESH)
      .flush({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });
    await settle();
    const retries = http.match(PURCHASES);
    expect(retries).toHaveLength(2);
    for (const req of retries) {
      expect(req.request.headers.get('Authorization')).toBe('Bearer A2');
      req.flush([]);
    }

    expect(first.next).toHaveBeenCalledWith([]);
    expect(second.next).toHaveBeenCalledWith([]);
  });

  it('401 na repetição', async () => {
    seed('A1', 'R1');
    const { error } = get();

    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));
    await settle();
    http
      .expectOne(REFRESH)
      .flush({ access_token: 'A2', refresh_token: 'R2', token_type: 'Bearer' });
    await settle();
    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/' },
      state: { notice: 'expired' },
      replaceUrl: true,
    });
    const err = error.mock.calls[0][0];
    expect(err).toBeInstanceOf(RefreshError);
    expect(err.reason).toBe('expired');
    http.expectNone(REFRESH);
  });

  it('refresh 401', async () => {
    seed('A1', 'R1');
    const { error } = get();

    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));
    await settle();
    http
      .expectOne(REFRESH)
      .flush({ code: 'UNAUTHORIZED', message: 'invalid credentials' }, status(401));
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: TestBed.inject(Router).url },
      state: { notice: 'expired' },
      replaceUrl: true,
    });
    expect(error.mock.calls[0][0]).toBeInstanceOf(RefreshError);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('sessão sumiu', async () => {
    seed('A1', 'R1');
    const { error } = get();

    localStorage.removeItem(SESSION_KEY);
    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));
    await settle();

    http.expectNone(REFRESH);
    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    const err = error.mock.calls[0][0];
    expect(err).toBeInstanceOf(RefreshError);
    expect(err.reason).toBe('logged-out');
  });

  it('refresh sem rede', async () => {
    seed('A1', 'R1');
    const { error } = get();

    http.expectOne(PURCHASES).flush(UNAUTHORIZED_BODY, status(401));
    await settle();
    http.expectOne(REFRESH).error(new ProgressEvent('error'));
    await settle();

    const err = error.mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(err.status).toBe(0);
    expect(stored()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('401 de /auth/login não renova', async () => {
    const error = vi.fn();
    client.post('/api/v1/auth/login', {}).subscribe({ error });

    http
      .expectOne('/api/v1/auth/login')
      .flush({ code: 'UNAUTHORIZED', message: 'invalid credentials' }, status(401));
    await settle();

    http.expectNone(REFRESH);
    expect(error.mock.calls[0][0].status).toBe(401);
  });

  it('404 passa direto', async () => {
    seed('A1', 'R1');
    const { error } = get();

    http.expectOne(PURCHASES).flush({}, status(404));
    await settle();

    http.expectNone(REFRESH);
    expect(error.mock.calls[0][0].status).toBe(404);
    expect(navigate).not.toHaveBeenCalled();
  });
});
