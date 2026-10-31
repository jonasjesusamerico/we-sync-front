import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SESSION_KEY } from '../../../core/auth/session.store';
import { API_BASE_URL } from '../../../core/http/api-base-url';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from '../../../core/http/error-messages';
import {
  MSG_EMAIL_FORMAT,
  MSG_PASSWORD_MIN_BYTES,
} from '../../../shared/validators/validation-messages';
import { MSG_INVALID_CREDENTIALS, MSG_REGISTERED, MSG_SESSION_EXPIRED } from '../auth.messages';
import { LoginPage } from './login.page';

@Component({ selector: 'app-stub-page', template: 'stub' })
class StubPage {}

const LOGIN = '/api/v1/auth/login';
const TOKENS = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<assinatura>',
  refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
  token_type: 'Bearer',
};

describe('LoginPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let router: Router;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginPage },
          { path: 'cadastro', component: StubPage },
          { path: '**', component: StubPage },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    http.verify();
    localStorage.clear();
  });

  async function open(url = '/login', state?: Record<string, unknown>) {
    await router.navigateByUrl(url, state ? { state } : {});
    await harness.fixture.whenStable();
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return harness.routeDebugElement?.componentInstance as LoginPage;
  }

  const root = () => harness.routeNativeElement as HTMLElement;
  const inputs = () => Array.from(root().querySelectorAll('input')) as HTMLInputElement[];
  const submitButton = () => root().querySelector('button[type=submit]') as HTMLButtonElement;
  const settle = () => harness.fixture.whenStable();
  const alert = () => root().querySelector('app-form-alert');
  const fieldError = (index: number) => {
    const field = root().querySelectorAll('.field').item(index);
    return field.querySelector('.invalid-feedback')?.textContent?.trim() ?? null;
  };

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function fillAndSend(email = 'ana@exemplo.com', password = 'senha123') {
    const [emailInput, passwordInput] = inputs();
    type(emailInput, email);
    type(passwordInput, password);
    submitButton().click();
    await settle();
  }

  it('vindo do cadastro', async () => {
    await open('/login', { email: 'ana@exemplo.com', notice: 'registered' });

    expect(inputs()[0].value).toBe('ana@exemplo.com');
    expect(alert()?.textContent?.trim()).toBe(MSG_REGISTERED);
    expect(alert()?.getAttribute('role')).toBe('status');
    expect(MSG_REGISTERED).toBe('Conta criada. Entre com sua senha.');
  });

  it('vindo de sessão expirada', async () => {
    await open('/login?returnUrl=%2Fcompras', { notice: 'expired' });

    expect(alert()?.textContent?.trim()).toBe(MSG_SESSION_EXPIRED);
    expect(MSG_SESSION_EXPIRED).toBe('Sua sessão expirou. Entre novamente.');
  });

  it('state inválido', async () => {
    await open('/login', { email: 42, notice: 'x' });

    expect(inputs()[0].value).toBe('');
    expect(alert()).toBeNull();
  });

  it('login com sucesso', async () => {
    await open();
    await fillAndSend();

    const req = http.expectOne(LOGIN);
    expect(req.request.body).toEqual({ email: 'ana@exemplo.com', password: 'senha123' });
    req.flush(TOKENS);
    await settle();

    expect(JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')).toEqual({
      access_token: TOKENS.access_token,
      refresh_token: TOKENS.refresh_token,
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('trim do e-mail no envio', async () => {
    await open();
    await fillAndSend('  ana@exemplo.com  ');

    const req = http.expectOne(LOGIN);
    expect(req.request.body.email).toBe('ana@exemplo.com');
    req.flush(TOKENS);
  });

  it('volta para a rota pedida', async () => {
    await open('/login?returnUrl=%2Fcompras%3Fmes%3D10');
    await fillAndSend();

    http.expectOne(LOGIN).flush(TOKENS);
    await settle();

    expect(navigateByUrl).toHaveBeenCalledWith('/compras?mes=10', { replaceUrl: true });
  });

  it('returnUrl externo', async () => {
    await open('/login?returnUrl=https%3A%2F%2Fevil.com');
    await fillAndSend();

    http.expectOne(LOGIN).flush(TOKENS);
    await settle();

    expect(navigateByUrl).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('credenciais inválidas', async () => {
    await open();
    await fillAndSend();

    http
      .expectOne(LOGIN)
      .flush(
        { code: 'UNAUTHORIZED', message: 'invalid credentials' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_INVALID_CREDENTIALS);
    expect(alert()?.getAttribute('role')).toBe('alert');
    expect(MSG_INVALID_CREDENTIALS).toBe('E-mail ou senha inválidos.');
    expect(inputs()[1].value).toBe('');
    expect(fieldError(1)).toBeNull();
    expect(inputs()[0].value).toBe('ana@exemplo.com');
    expect(root().textContent).not.toContain('invalid credentials');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('sem conexão', async () => {
    await open();
    await fillAndSend();

    http.expectOne(LOGIN).error(new ProgressEvent('error'));
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_CONNECTION);
    expect(inputs().map((i) => i.value)).toEqual(['ana@exemplo.com', 'senha123']);
  });

  it('erro 500', async () => {
    await open();
    await fillAndSend();

    http
      .expectOne(LOGIN)
      .flush(
        { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_SERVER);
  });

  it('erro 422', async () => {
    await open();
    await fillAndSend();

    http
      .expectOne(LOGIN)
      .flush(
        { code: 'VALIDATION_ERROR', message: 'email and password are required' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_INVALID_DATA);
    expect(root().textContent).not.toContain('email and password are required');
  });

  it('storage indisponível', async () => {
    await open();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('cheio', 'QuotaExceededError');
    });
    await fillAndSend();

    http.expectOne(LOGIN).flush(TOKENS);
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_SERVER);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('validação antes de enviar', async () => {
    await open();
    await fillAndSend('ana@exemplo', 'senha12');

    http.expectNone(LOGIN);
    expect(fieldError(0)).toBe(MSG_EMAIL_FORMAT);
    expect(fieldError(1)).toBe(MSG_PASSWORD_MIN_BYTES);
  });

  it('envio duplicado', async () => {
    const page = await open();
    const [emailInput, passwordInput] = inputs();
    type(emailInput, 'ana@exemplo.com');
    type(passwordInput, 'senha123');
    submitButton().click();
    page.submit();
    await settle();

    const req = http.expectOne(LOGIN);
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().querySelector('.spinner-border')).not.toBeNull();
    req.flush(TOKENS);
  });

  it('aviso de entrada some no envio', async () => {
    await open('/login', { email: 'ana@exemplo.com', notice: 'registered' });
    type(inputs()[1], 'senha123');
    submitButton().click();
    await settle();

    expect(alert()).toBeNull();
    http.expectOne(LOGIN).flush(TOKENS);
  });
});
