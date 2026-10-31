import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { API_BASE_URL } from '../../../core/http/api-base-url';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from '../../../core/http/error-messages';
import {
  MSG_CONFIRM_REQUIRED,
  MSG_EMAIL_FORMAT,
  MSG_EMAIL_MAX_BYTES,
  MSG_EMAIL_REQUIRED,
  MSG_PASSWORD_MAX_BYTES,
  MSG_PASSWORD_MIN_BYTES,
  MSG_PASSWORD_MISMATCH,
  MSG_PASSWORD_REQUIRED,
} from '../../../shared/validators/validation-messages';
import { MSG_EMAIL_TAKEN } from '../auth.messages';
import { RegisterPage } from './register.page';

@Component({ selector: 'app-stub-login', template: 'login' })
class StubLogin {}

const REGISTER = '/api/v1/auth/register';

describe('RegisterPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let page: RegisterPage;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cadastro', component: RegisterPage },
          { path: 'login', component: StubLogin },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    harness = await RouterTestingHarness.create();
    page = await harness.navigateByUrl('/cadastro', RegisterPage);
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  const root = () => harness.routeNativeElement as HTMLElement;
  const inputs = () => Array.from(root().querySelectorAll('input')) as HTMLInputElement[];
  const submitButton = () => root().querySelector('button[type=submit]') as HTMLButtonElement;
  const settle = () => harness.fixture.whenStable();
  const errors = () =>
    Array.from(root().querySelectorAll('.invalid-feedback')).map(
      (e) => e.textContent?.trim() ?? '',
    );
  const fieldError = (index: number) => {
    const field = root().querySelectorAll('.field').item(index);
    return field.querySelector('.invalid-feedback')?.textContent?.trim() ?? null;
  };
  const alert = () => root().querySelector('app-form-alert');

  function type(input: HTMLInputElement, value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  async function fill(email: string, password: string, confirm: string) {
    const [emailInput, passwordInput, confirmInput] = inputs();
    type(emailInput, email);
    type(passwordInput, password);
    type(confirmInput, confirm);
    await settle();
  }

  async function send() {
    submitButton().click();
    await settle();
  }

  async function submitValid() {
    await fill('ana@exemplo.com', 'senha123', 'senha123');
    await send();
    return http.expectOne(REGISTER);
  }

  it('cadastro com sucesso', async () => {
    const req = await submitValid();
    expect(req.request.body).toEqual({ email: 'ana@exemplo.com', password: 'senha123' });

    req.flush({ id: 42, email: 'ana@exemplo.com' }, { status: 201, statusText: 'Created' });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      state: { email: 'ana@exemplo.com', notice: 'registered' },
    });
  });

  it('trim do e-mail', async () => {
    await fill('  Ana@Exemplo.com  ', 'senha123', 'senha123');
    await send();

    const req = http.expectOne(REGISTER);
    expect(req.request.body.email).toBe('Ana@Exemplo.com');
    req.flush({ id: 42, email: 'ana@exemplo.com' }, { status: 201, statusText: 'Created' });
  });

  it('confirmação diferente', async () => {
    await fill('ana@exemplo.com', 'senha123', 'senha124');
    await send();

    http.expectNone(REGISTER);
    expect(fieldError(2)).toBe(MSG_PASSWORD_MISMATCH);
  });

  it('confirmação reage à senha', async () => {
    await fill('ana@exemplo.com', 'senha123', 'senha123');
    inputs()[2].dispatchEvent(new Event('blur'));
    await settle();
    expect(fieldError(2)).toBeNull();

    type(inputs()[1], 'senha124');
    await settle();

    expect(fieldError(2)).toBe(MSG_PASSWORD_MISMATCH);
    expect(inputs()[2].getAttribute('aria-invalid')).toBe('true');
  });

  it('senha com 7 bytes', async () => {
    await fill('ana@exemplo.com', 'senha12', 'senha12');
    await send();

    http.expectNone(REGISTER);
    expect(fieldError(1)).toBe(MSG_PASSWORD_MIN_BYTES);
  });

  it('senha com 80 bytes', async () => {
    const long = 'á'.repeat(40);
    await fill('ana@exemplo.com', long, long);
    await send();

    http.expectNone(REGISTER);
    expect(fieldError(1)).toBe(MSG_PASSWORD_MAX_BYTES);
    expect(MSG_PASSWORD_MAX_BYTES).toBe('A senha é muito longa.');
  });

  it('e-mail sem domínio completo', async () => {
    await fill('ana@exemplo', 'senha123', 'senha123');
    await send();

    http.expectNone(REGISTER);
    expect(fieldError(0)).toBe(MSG_EMAIL_FORMAT);
  });

  it('e-mail com 255 caracteres', async () => {
    await fill('a'.repeat(243) + '@exemplo.com', 'senha123', 'senha123');
    await send();

    http.expectNone(REGISTER);
    expect(fieldError(0)).toBe(MSG_EMAIL_MAX_BYTES);
  });

  it('todos vazios', async () => {
    await send();

    http.expectNone(REGISTER);
    expect(errors()).toEqual([MSG_EMAIL_REQUIRED, MSG_PASSWORD_REQUIRED, MSG_CONFIRM_REQUIRED]);
  });

  it('e-mail já cadastrado', async () => {
    const req = await submitValid();
    req.flush(
      { code: 'CONFLICT', message: 'email already registered' },
      { status: 409, statusText: 'Conflict' },
    );
    await settle();

    expect(alert()?.textContent).toContain(MSG_EMAIL_TAKEN);
    expect(MSG_EMAIL_TAKEN).toBe('Este e-mail já está cadastrado.');
    const link = alert()?.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Entrar');
    expect(link.getAttribute('href')).toBe('/login');
    expect(inputs().map((i) => i.value)).toEqual(['ana@exemplo.com', 'senha123', 'senha123']);
    expect(root().textContent).not.toContain('email already registered');
  });

  it('link Entrar do aviso leva o e-mail no state', async () => {
    const req = await submitValid();
    req.flush({ code: 'CONFLICT', message: 'x' }, { status: 409, statusText: 'Conflict' });
    await settle();
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    (alert()?.querySelector('a') as HTMLAnchorElement).click();

    expect(navigateByUrl.mock.calls[0][1]).toEqual(
      expect.objectContaining({ state: { email: 'ana@exemplo.com' } }),
    );
  });

  it('sem conexão', async () => {
    const req = await submitValid();
    req.error(new ProgressEvent('error'));
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_CONNECTION);
    expect(alert()?.getAttribute('role')).toBe('alert');
    expect(inputs().map((i) => i.value)).toEqual(['ana@exemplo.com', 'senha123', 'senha123']);
  });

  it('erro 500', async () => {
    const req = await submitValid();
    req.flush(
      { code: 'INTERNAL_SERVER_ERROR', message: 'internal server error' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_SERVER);
  });

  it('erro 422 inesperado', async () => {
    const req = await submitValid();
    req.flush(
      { code: 'VALIDATION_ERROR', message: 'email is invalid' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_INVALID_DATA);
    expect(root().textContent).not.toContain('email is invalid');
  });

  it('erro 400', async () => {
    const req = await submitValid();
    req.flush(
      { code: 'BAD_REQUEST', message: 'invalid request body' },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle();

    expect(alert()?.textContent?.trim()).toBe(MSG_INVALID_DATA);
  });

  it('envio duplicado', async () => {
    await fill('ana@exemplo.com', 'senha123', 'senha123');
    submitButton().click();
    page.submit();
    await settle();

    const req = http.expectOne(REGISTER);
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().querySelector('.spinner-border')).not.toBeNull();

    req.flush({ id: 42, email: 'ana@exemplo.com' }, { status: 201, statusText: 'Created' });
    await settle();
    expect(submitButton().disabled).toBe(false);
  });

  it('aviso some no novo envio', async () => {
    const first = await submitValid();
    first.flush({ code: 'CONFLICT', message: 'x' }, { status: 409, statusText: 'Conflict' });
    await settle();
    expect(alert()).not.toBeNull();

    await send();

    expect(alert()).toBeNull();
    http
      .expectOne(REGISTER)
      .flush({ id: 42, email: 'ana@exemplo.com' }, { status: 201, statusText: 'Created' });
  });
});
