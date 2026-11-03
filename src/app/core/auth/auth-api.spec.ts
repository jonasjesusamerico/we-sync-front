import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  LOGIN_REQUEST_EXAMPLE,
  REGISTER_REQUEST_EXAMPLE,
  REGISTER_RESPONSE_EXAMPLE,
  TOKEN_RESPONSE_EXAMPLE,
} from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { AuthApi } from './auth-api';

describe('AuthApi', () => {
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('register', async () => {
    const result = firstValueFrom(api.register(REGISTER_REQUEST_EXAMPLE));
    const req = http.expectOne(`${API}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(REGISTER_REQUEST_EXAMPLE);
    req.flush(REGISTER_RESPONSE_EXAMPLE, { status: 201, statusText: 'Created' });
    expect(await result).toEqual(REGISTER_RESPONSE_EXAMPLE);
  });

  it('login', async () => {
    const result = firstValueFrom(api.login(LOGIN_REQUEST_EXAMPLE));
    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(LOGIN_REQUEST_EXAMPLE);
    req.flush(TOKEN_RESPONSE_EXAMPLE);
    expect(await result).toEqual(TOKEN_RESPONSE_EXAMPLE);
  });

  it('refresh', async () => {
    const result = firstValueFrom(api.refresh('R1'));
    const req = http.expectOne(`${API}/auth/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    req.flush(TOKEN_RESPONSE_EXAMPLE);
    expect(await result).toEqual(TOKEN_RESPONSE_EXAMPLE);
  });

  it('logout', async () => {
    const result = firstValueFrom(api.logout('R1'), { defaultValue: undefined });
    const req = http.expectOne(`${API}/auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(await result).toBeNull();
  });
});
