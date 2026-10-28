import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TimeoutError } from 'rxjs';

import { API_BASE_URL } from '../http/api-base-url';
import { AuthApi } from './auth.api';
import { TokenResponse } from './auth.models';

const TOKENS: TokenResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<assinatura>',
  refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
  token_type: 'Bearer',
};

describe('AuthApi', () => {
  let api: AuthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  it('register envia o corpo do contrato', () => {
    const next = vi.fn();
    api.register({ email: 'ana@exemplo.com', password: 'senha123' }).subscribe(next);

    const req = http.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@exemplo.com', password: 'senha123' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ id: 42, email: 'ana@exemplo.com' }, { status: 201, statusText: 'Created' });

    expect(next).toHaveBeenCalledWith({ id: 42, email: 'ana@exemplo.com' });
  });

  it('register propaga 409', () => {
    const error = vi.fn();
    api.register({ email: 'ana@exemplo.com', password: 'senha123' }).subscribe({ error });

    http
      .expectOne('/api/v1/auth/register')
      .flush(
        { code: 'CONFLICT', message: 'email already registered' },
        { status: 409, statusText: 'Conflict' },
      );

    const err = error.mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpErrorResponse);
    expect(err.status).toBe(409);
  });

  it('login devolve o TokenResponse', () => {
    const next = vi.fn();
    api.login({ email: 'ana@exemplo.com', password: 'senha123' }).subscribe(next);

    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@exemplo.com', password: 'senha123' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(TOKENS);

    expect(next).toHaveBeenCalledWith(TOKENS);
  });

  it('refresh envia refresh_token', () => {
    const next = vi.fn();
    api.refresh('Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw').subscribe(next);

    const req = http.expectOne('/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
    });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(TOKENS);

    expect(next).toHaveBeenCalledWith(TOKENS);
  });

  it('refresh expira em 30 s', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    api.refresh('R1').subscribe({ error });
    const req = http.expectOne('/api/v1/auth/refresh');

    vi.advanceTimersByTime(29_999);
    expect(error).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(error.mock.calls[0][0]).toBeInstanceOf(TimeoutError);
    expect(req.cancelled).toBe(true);
  });

  it('logout envia refresh_token', () => {
    const complete = vi.fn();
    api.logout('R1').subscribe({ complete });

    const req = http.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(complete).toHaveBeenCalled();
  });

  it('logout expira em 5 s', () => {
    vi.useFakeTimers();
    const error = vi.fn();
    api.logout('R1').subscribe({ error });
    const req = http.expectOne('/api/v1/auth/logout');

    vi.advanceTimersByTime(4_999);
    expect(error).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(error.mock.calls[0][0]).toBeInstanceOf(TimeoutError);
    expect(req.cancelled).toBe(true);
  });
});
