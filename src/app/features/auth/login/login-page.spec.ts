import { HttpTestingController } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ERROR_BAD_REQUEST,
  ERROR_INTERNAL,
  ERROR_INVALID_CREDENTIALS,
  TOKEN_RESPONSE_EXAMPLE,
} from '../../../../testing/api-examples';
import { deferred, text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle, storedSession } from '../../../../testing/session';
import { SessionStore } from '../../../core/auth/session-store';
import * as t from '../auth.messages';
import { LoginPage } from './login-page';

@Component({ template: '<h1>Início</h1>' })
class Blank {}

const LOGIN = `${API}/auth/login`;

describe('LoginPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;
  let gate: ReturnType<typeof deferred<boolean>>;

  beforeEach(async () => {
    gate = deferred<boolean>();
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter(
          [
            { path: 'login', component: LoginPage },
            { path: 'cadastro', component: Blank },
            { path: 'inicio', component: Blank },
            { path: 'pendente', component: Blank, resolve: { x: () => gate.promise } },
          ],
          withComponentInputBinding(),
        ),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  async function open(url = '/login', state?: Record<string, unknown>) {
    await router.navigateByUrl(url, { state });
    await harness.fixture.whenStable();
    const root = harness.routeNativeElement as HTMLElement;
    const page = harness.routeDebugElement!.componentInstance as LoginPage;
    return {
      root,
      page,
      email: root.querySelector<HTMLInputElement>('#email')!,
      password: root.querySelector<HTMLInputElement>('#password')!,
      submitButton: root.querySelector<HTMLButtonElement>('button[type=submit]')!,
      form: root.querySelector('form')!,
      alert: () => root.querySelector('.alert'),
      stable: () => harness.fixture.whenStable(),
    };
  }

  async function fillAndSubmit(
    view: Awaited<ReturnType<typeof open>>,
    email: string,
    pass: string,
  ) {
    typeInto(view.email, email);
    typeInto(view.password, pass);
    view.submitButton.click();
    await view.stable();
  }

  it('textos e estrutura', async () => {
    const { root } = await open();
    expect(text(root.querySelector('h1'))).toBe(t.LOGIN_TITLE);
    expect(text(root.querySelector('h1 + p'))).toBe(t.LOGIN_SUBTITLE);
    expect(text(root.querySelector('label[for=email]'))).toBe(t.LABEL_EMAIL);
    expect(text(root.querySelector('label[for=password]'))).toBe(t.LABEL_PASSWORD);
    expect(text(root.querySelector('button[type=submit]'))).toBe(t.LABEL_LOGIN_SUBMIT);
    expect(text(root.querySelector('.ws-divider'))).toBe(t.LABEL_DIVIDER_OR);
    const link = root.querySelector('a[href^="/cadastro"]')!;
    expect(text(link)).toBe(t.LABEL_CREATE_ACCOUNT);
    expect(link.getAttribute('href')).toBe('/cadastro');
    const art = root.querySelector('.ws-auth-art')!;
    expect(art.getAttribute('aria-hidden')).toBe('true');
    expect(text(art.querySelector('h2'))).toBe(t.LOGIN_PANEL_TITLE);
    expect(root.querySelector('button.ws-auth-theme')).not.toBeNull();
  });

  it('vazio não envia', async () => {
    const view = await open();
    view.submitButton.click();
    await view.stable();
    expect(text(view.root.querySelector('#email-error'))).toBe(t.MSG_EMAIL_REQUIRED);
    expect(text(view.root.querySelector('#password-error'))).toBe(t.MSG_PASSWORD_REQUIRED);
    expect(view.email.getAttribute('aria-invalid')).toBe('true');
    expect(view.email.getAttribute('aria-describedby')).toBe('email-error');
    expect(document.activeElement).toBe(view.email);
    http.expectNone(LOGIN);
  });

  it('erros só depois de enviar', async () => {
    const view = await open();
    typeInto(view.email, 'ana@exemplo');
    await view.stable();
    expect(view.root.querySelector('#email-error')).toBeNull();
    view.submitButton.click();
    await view.stable();
    expect(text(view.root.querySelector('#email-error'))).toBe(t.MSG_EMAIL_INVALID);
  });

  it('senha curta no login', async () => {
    const view = await open();
    await fillAndSubmit(view, 'ana@exemplo.com', 'a');
    http.expectOne(LOGIN).flush(ERROR_INVALID_CREDENTIALS, { status: 401, statusText: 'x' });
    await settle();
  });

  it('e-mail sem pontas', async () => {
    const view = await open();
    await fillAndSubmit(view, '  ana@exemplo.com  ', 'Senha123!');
    const req = http.expectOne(LOGIN);
    expect(req.request.body).toEqual({ email: 'ana@exemplo.com', password: 'Senha123!' });
    req.flush(ERROR_INVALID_CREDENTIALS, { status: 401, statusText: 'x' });
    await settle();
  });

  it('sucesso navega', async () => {
    const view = await open();
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    http.expectOne(LOGIN).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(storedSession()?.access_token).toBe(TOKEN_RESPONSE_EXAMPLE.access_token);
    expect(router.url).toBe('/inicio');
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
  });

  it.each([
    ['%2Finicio%3Fx%3D1', '/inicio?x=1'],
    ['https%3A%2F%2Fevil.example', '/inicio'],
  ])('rota de retorno: %s', async (param, expected) => {
    const view = await open(`/login?returnUrl=${param}`);
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    http.expectOne(LOGIN).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(router.url).toBe(expected);
  });

  it('envio único', async () => {
    const view = await open();
    typeInto(view.email, 'ana@exemplo.com');
    typeInto(view.password, 'Senha123!');
    view.submitButton.click();
    view.submitButton.click();
    view.form.dispatchEvent(new Event('submit', { cancelable: true }));
    await view.stable();
    const req = http.expectOne(LOGIN);
    expect(view.submitButton.disabled).toBe(true);
    expect(view.submitButton.getAttribute('aria-busy')).toBe('true');
    expect(view.submitButton.querySelector('.spinner-border')).not.toBeNull();
    req.flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(router.url).toBe('/inicio');
  });

  it('botão fica carregando durante o resolver', async () => {
    const view = await open('/login?returnUrl=%2Fpendente');
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    http.expectOne(LOGIN).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await settle();
    expect(view.page.submitting()).toBe(true);
    expect(router.url).toBe('/login?returnUrl=%2Fpendente');
    gate.resolve(true);
    await settle();
    await view.stable();
    expect(router.url).toBe('/pendente');
  });

  it('navegação falhou', async () => {
    const view = await open();
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    http.expectOne(LOGIN).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(view.page.submitting()).toBe(false);
    expect(view.submitButton.disabled).toBe(false);
  });

  it('credenciais erradas', async () => {
    const view = await open();
    await fillAndSubmit(view, 'ana@exemplo.com', 'errada123');
    http.expectOne(LOGIN).flush(ERROR_INVALID_CREDENTIALS, { status: 401, statusText: 'x' });
    await settle();
    await view.stable();
    expect(text(view.alert())).toBe(t.MSG_INVALID_CREDENTIALS);
    expect(view.alert()!.getAttribute('role')).toBe('alert');
    expect(view.password.value).toBe('');
    expect(document.activeElement).toBe(view.password);
    expect(view.email.value).toBe('ana@exemplo.com');
    expect(view.root.querySelector('.invalid-feedback')).toBeNull();
  });

  it.each([
    [0, t.MSG_CONNECTION],
    [500, t.MSG_SERVER],
    [400, t.MSG_INVALID_DATA],
    [422, t.MSG_INVALID_DATA],
    [409, t.MSG_SERVER],
  ])('erros genéricos e 409 no login: %i', async (status, message) => {
    const view = await open();
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    const req = http.expectOne(LOGIN);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush(status === 400 ? ERROR_BAD_REQUEST : ERROR_INTERNAL, { status, statusText: 'x' });
    }
    await settle();
    await view.stable();
    expect(text(view.alert())).toBe(message);
    expect(view.email.value).toBe('ana@exemplo.com');
    expect(view.password.value).toBe('Senha123!');
    expect(view.submitButton.disabled).toBe(false);
  });

  it('storage recusado', async () => {
    const view = await open();
    vi.spyOn(TestBed.inject(SessionStore), 'save').mockReturnValue(false);
    await fillAndSubmit(view, 'ana@exemplo.com', 'Senha123!');
    http.expectOne(LOGIN).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(text(view.alert())).toBe(t.MSG_SERVER);
    expect(view.submitButton.disabled).toBe(false);
    expect(router.url).toBe('/login');
  });

  it('aviso de sessão expirada', async () => {
    const view = await open('/login', { notice: 'session-expired' });
    expect(text(view.alert())).toBe(t.MSG_SESSION_EXPIRED);
    expect(view.alert()!.getAttribute('role')).toBe('status');
  });

  it('conta criada', async () => {
    const view = await open('/login', { notice: 'account-created', email: 'ana@exemplo.com' });
    expect(text(view.alert())).toBe(t.MSG_ACCOUNT_CREATED);
    expect(view.alert()!.classList).toContain('alert-success');
    expect(view.email.value).toBe('ana@exemplo.com');
    expect(document.activeElement).toBe(view.password);
  });

  it('login mostra o aviso de conta excluída', async () => {
    const view = await open('/login', { notice: 'account-deleted' });
    expect(text(view.alert())).toBe(t.MSG_ACCOUNT_DELETED);
    expect(view.alert()!.getAttribute('role')).toBe('status');
    expect(view.alert()!.classList).toContain('alert-primary');
    expect(TestBed.inject(Location).getState()).not.toHaveProperty('notice');
  });

  it('aviso some no envio', async () => {
    const view = await open('/login', { notice: 'session-expired' });
    view.submitButton.click();
    await view.stable();
    expect(view.alert()).toBeNull();
  });

  it('state inválido', async () => {
    const view = await open('/login', { notice: 'x' });
    expect(view.alert()).toBeNull();
  });

  it('link para o cadastro leva o retorno', async () => {
    const view = await open('/login?returnUrl=%2Finicio');
    expect(view.root.querySelector('a[href^="/cadastro"]')!.getAttribute('href')).toBe(
      '/cadastro?returnUrl=%2Finicio',
    );
  });

  it('esqueci a senha', async () => {
    const view = await open();
    const forgot = Array.from(view.root.querySelectorAll('button')).find(
      (b) => text(b) === t.LABEL_FORGOT_PASSWORD,
    )!;
    forgot.click();
    await view.stable();
    expect(router.url).toBe('/login');
    expect(forgot.getAttribute('aria-label')).toBe('Esqueci a senha, em breve');
    http.expectNone(LOGIN);
  });
});
