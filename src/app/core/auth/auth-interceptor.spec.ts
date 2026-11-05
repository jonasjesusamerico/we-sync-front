import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ERROR_INVALID_CREDENTIALS } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession } from '../../../testing/session';
import { authInterceptor, isProtectedApiUrl } from './auth-interceptor';
import { LoggedOutError } from './session-errors';
import { SessionEnd } from './session-end';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let client: HttpClient;
  let sessionEnd: { expired: ReturnType<typeof vi.fn>; loggedOut: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionEnd = { expired: vi.fn(), loggedOut: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders([authInterceptor]),
        { provide: SessionEnd, useValue: sessionEnd },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('isProtectedApiUrl', () => {
    expect(isProtectedApiUrl('/api/v1/users/me', API)).toBe(true);
    expect(isProtectedApiUrl('/api/v1/auth/login', API)).toBe(false);
    expect(isProtectedApiUrl('/api/v1x', API)).toBe(false);
  });

  it('Bearer só na API', () => {
    seedSession('A1', 'R1');
    client.get(`${API}/users/me`).subscribe();
    client.post(`${API}/auth/login`, {}).subscribe();
    client.post(`${API}/auth/refresh`, {}).subscribe();
    client.get('/outra/coisa').subscribe();
    client.get('/api/v1x').subscribe();
    expect(http.expectOne(`${API}/users/me`).request.headers.get('Authorization')).toBe(
      'Bearer A1',
    );
    for (const url of [`${API}/auth/login`, `${API}/auth/refresh`, '/outra/coisa', '/api/v1x']) {
      const req = http.expectOne(url);
      expect(req.request.headers.has('Authorization'), url).toBe(false);
      req.flush({});
    }
    http.match(`${API}/users/me`).forEach((req) => req.flush({}));
  });

  it('token lido a cada requisição', () => {
    seedSession('A1', 'R1');
    client.get(`${API}/users/me`).subscribe();
    seedSession('A9', 'R9');
    client.get(`${API}/users/me`).subscribe();
    const [first, second] = http.match(`${API}/users/me`);
    expect(first.request.headers.get('Authorization')).toBe('Bearer A1');
    expect(second.request.headers.get('Authorization')).toBe('Bearer A9');
    first.flush({});
    second.flush({});
  });

  it('sem sessão não envia', async () => {
    await expect(firstValueFrom(client.get(`${API}/users/me`))).rejects.toBeInstanceOf(
      LoggedOutError,
    );
    http.expectNone(`${API}/users/me`);
    expect(sessionEnd.loggedOut).toHaveBeenCalledTimes(1);
  });

  it('401 de /auth/* passa direto', async () => {
    seedSession('A1', 'R1');
    const result = firstValueFrom(client.post(`${API}/auth/login`, {}));
    http
      .expectOne(`${API}/auth/login`)
      .flush(ERROR_INVALID_CREDENTIALS, { status: 401, statusText: 'Unauthorized' });
    await expect(result).rejects.toMatchObject({ status: 401 });
    http.expectNone(`${API}/auth/refresh`);
    expect(sessionEnd.expired).not.toHaveBeenCalled();
  });
});
