import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ERROR_INTERNAL, ERROR_INVALID_TOKEN } from '../../../testing/api-examples';
import { FakeLockManager } from '../../../testing/fake-lock-manager';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession, settle, storedSession, tokens } from '../../../testing/session';
import { authInterceptor } from './auth-interceptor';
import { LOCK_MANAGER, REFRESH_LOCK_NAME } from './lock-manager';
import { RefreshError } from './session-errors';
import { SessionEnd } from './session-end';
import { SessionStore } from './session-store';
import { TokenRefresher } from './token-refresher';

const ME = `${API}/users/me`;
const REFRESH = `${API}/auth/refresh`;

describe('TokenRefresher', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let locks: FakeLockManager | null;
  let sessionEnd: { expired: ReturnType<typeof vi.fn>; loggedOut: ReturnType<typeof vi.fn> };

  function setup(withLocks = true) {
    locks = withLocks ? new FakeLockManager() : null;
    sessionEnd = { expired: vi.fn(), loggedOut: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders([authInterceptor]),
        { provide: LOCK_MANAGER, useValue: locks },
        { provide: SessionEnd, useValue: sessionEnd },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  }

  const unauthorized = { status: 401, statusText: 'Unauthorized' };

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renova e repete', async () => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await settle();
    const refresh = http.expectOne(REFRESH);
    expect(refresh.request.body).toEqual({ refresh_token: 'R1' });
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    refresh.flush(tokens('A2', 'R2'));
    await settle();
    expect(storedSession()).toEqual({ access_token: 'A2', refresh_token: 'R2' });
    const retry = http.expectOne(ME);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer A2');
    retry.flush({ id: 42 });
    expect(await result).toEqual({ id: 42 });
  });

  it('várias chamadas, uma renovação', async () => {
    setup();
    seedSession('A1', 'R1');
    const results = [1, 2, 3].map(() => firstValueFrom(client.get(ME)));
    const first = http.match(ME);
    expect(first).toHaveLength(3);
    first.forEach((req) => req.flush(ERROR_INVALID_TOKEN, unauthorized));
    await settle();
    http.expectOne(REFRESH).flush(tokens('A2', 'R2'));
    await settle();
    const retries = http.match(ME);
    expect(retries).toHaveLength(3);
    retries.forEach((req) => {
      expect(req.request.headers.get('Authorization')).toBe('Bearer A2');
      req.flush({ id: 42 });
    });
    expect(await Promise.all(results)).toHaveLength(3);
  });

  it('outra aba já renovou (lock)', async () => {
    setup();
    seedSession('A1', 'R1');
    let release!: () => void;
    const otherTab = locks!.request(
      REFRESH_LOCK_NAME,
      { signal: new AbortController().signal },
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const result = TestBed.inject(TokenRefresher).refresh('A1');
    await settle();
    expect(locks!.waiting(REFRESH_LOCK_NAME)).toBe(1);
    seedSession('A2', 'R2');
    release();
    await otherTab;
    expect(await result).toBe('A2');
    http.expectNone(REFRESH);
  });

  it('sem lock, outra aba renovou', async () => {
    setup(false);
    seedSession('A1', 'R1');
    const result = TestBed.inject(TokenRefresher).refresh('A1');
    await settle();
    const refresh = http.expectOne(REFRESH);
    seedSession('A2', 'R2');
    refresh.flush(ERROR_INVALID_TOKEN, unauthorized);
    expect(await result).toBe('A2');
    expect(storedSession()).toEqual({ access_token: 'A2', refresh_token: 'R2' });
    expect(sessionEnd.expired).not.toHaveBeenCalled();
  });

  it.each([401, 400])('refresh recusado (%i)', async (status) => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await settle();
    http.expectOne(REFRESH).flush(ERROR_INVALID_TOKEN, { status, statusText: 'Error' });
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(storedSession()).toBeNull();
    expect(sessionEnd.expired).toHaveBeenCalledTimes(1);
  });

  it.each([0, 500])('refresh indisponível (%i)', async (status) => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await settle();
    const refresh = http.expectOne(REFRESH);
    if (status === 0) {
      refresh.error(new ProgressEvent('error'), { status: 0 });
    } else {
      refresh.flush(ERROR_INTERNAL, { status, statusText: 'Error' });
    }
    await expect(result).rejects.toMatchObject({ status: 401, url: ME });
    expect(storedSession()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
    expect(sessionEnd.expired).not.toHaveBeenCalled();
  });

  it('espera do lock estourada', async () => {
    vi.useFakeTimers();
    setup();
    seedSession('A1', 'R1');
    void locks!.request(
      REFRESH_LOCK_NAME,
      { signal: new AbortController().signal },
      () => new Promise<void>(() => undefined),
    );
    const result = TestBed.inject(TokenRefresher).refresh('A1');
    const assertion = expect(result).rejects.toEqual(new RefreshError('unavailable'));
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(storedSession()).toEqual({ access_token: 'A1', refresh_token: 'R1' });
  });

  it('outra aba saiu', async () => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    localStorage.clear();
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(sessionEnd.loggedOut).toHaveBeenCalledTimes(1);
    http.expectNone(REFRESH);
  });

  it('storage recusa o par novo', async () => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await settle();
    vi.spyOn(TestBed.inject(SessionStore), 'save').mockReturnValue(false);
    http.expectOne(REFRESH).flush(tokens('A2', 'R2'));
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(storedSession()).toBeNull();
    expect(sessionEnd.expired).toHaveBeenCalledTimes(1);
  });

  it('repetição com 401', async () => {
    setup();
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.get(ME));
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await settle();
    http.expectOne(REFRESH).flush(tokens('A2', 'R2'));
    await settle();
    http.expectOne(ME).flush(ERROR_INVALID_TOKEN, unauthorized);
    await expect(result).rejects.toMatchObject({ status: 401 });
    expect(sessionEnd.expired).toHaveBeenCalledTimes(1);
    http.expectNone(ME);
  });
});
