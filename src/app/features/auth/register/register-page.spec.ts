import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ERROR_BAD_REQUEST,
  ERROR_EMAIL_TAKEN,
  ERROR_INTERNAL,
  ERROR_INVALID_CREDENTIALS,
  REGISTER_RESPONSE_EXAMPLE,
  TOKEN_RESPONSE_EXAMPLE,
} from '../../../../testing/api-examples';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { settle, storedSession } from '../../../../testing/session';
import { SessionStore } from '../../../core/auth/session-store';
import { LABEL_HIDE_PASSWORD } from '../../../shared/ui/ui.messages';
import * as t from '../auth.messages';
import { RegisterPage } from './register-page';

@Component({ template: '' })
class Blank {}

const REGISTER = `${API}/auth/register`;
const LOGIN = `${API}/auth/login`;
const created = { status: 201, statusText: 'Created' };

describe('RegisterPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter(
          [
            { path: 'cadastro', component: RegisterPage },
            { path: 'login', component: Blank },
            { path: 'inicio', component: Blank },
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

  async function open(url = '/cadastro') {
    await router.navigateByUrl(url);
    await harness.fixture.whenStable();
    const root = harness.routeNativeElement as HTMLElement;
    return {
      root,
      page: harness.routeDebugElement!.componentInstance as RegisterPage,
      name: root.querySelector<HTMLInputElement>('#name')!,
      email: root.querySelector<HTMLInputElement>('#email')!,
      password: root.querySelector<HTMLInputElement>('#password')!,
      submitButton: root.querySelector<HTMLButtonElement>('button[type=submit]')!,
      form: root.querySelector('form')!,
      alert: () => root.querySelector('.alert'),
      error: (id: string) => text(root.querySelector(`#${id}-error`)),
      stable: () => harness.fixture.whenStable(),
    };
  }
  type View = Awaited<ReturnType<typeof open>>;

  async function fill(view: View, name: string, email: string, password: string) {
    typeInto(view.name, name);
    typeInto(view.email, email);
    typeInto(view.password, password);
    await view.stable();
  }

  async function fillAndSubmit(
    view: View,
    name = 'Ana Souza',
    email = 'ana@exemplo.com',
    password = 'Senha123!',
  ) {
    await fill(view, name, email, password);
    view.submitButton.click();
    await view.stable();
  }

  it('textos e estrutura', async () => {
    const { root } = await open();
    expect(text(root.querySelector('h1'))).toBe(t.REGISTER_TITLE);
    expect(text(root.querySelector('h1 + p'))).toBe(t.REGISTER_SUBTITLE);
    const benefits = Array.from(root.querySelectorAll('.ws-auth-art li')).map(text);
    expect(benefits).toEqual(t.REGISTER_PANEL_BENEFITS.map((b) => b.text));
    expect(
      ['name', 'email', 'password'].map((id) => text(root.querySelector(`label[for=${id}]`))),
    ).toEqual([t.LABEL_NAME, t.LABEL_EMAIL, t.LABEL_PASSWORD]);
    expect(root.querySelectorAll('input')).toHaveLength(3);
    const link = root.querySelector('main a[href^="/login"]')!;
    expect(text(link)).toBe(t.LABEL_GO_TO_LOGIN);
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('vazio não envia', async () => {
    const view = await open();
    view.submitButton.click();
    await view.stable();
    expect(view.error('name')).toBe(t.MSG_NAME_REQUIRED);
    expect(view.error('email')).toBe(t.MSG_EMAIL_REQUIRED);
    expect(view.error('password')).toBe(t.MSG_PASSWORD_REQUIRED);
    expect(document.activeElement).toBe(view.name);
    http.expectNone(REGISTER);
  });

  it.each([
    ['', t.MSG_NAME_REQUIRED],
    ['   ', t.MSG_NAME_REQUIRED],
    ['A', t.MSG_NAME_LENGTH],
    ['a'.repeat(61), t.MSG_NAME_LENGTH],
  ])('nome inválido não envia: %j', async (name, message) => {
    const view = await open();
    await fillAndSubmit(view, name);
    expect(view.error('name')).toBe(message);
    http.expectNone(REGISTER);
  });

  it.each(['Jô', 'ã'.repeat(60)])('nome válido envia: %s', async (name) => {
    const view = await open();
    await fillAndSubmit(view, name);
    http.expectOne(REGISTER).flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await settle();
  });

  it('nome sem pontas', async () => {
    const view = await open();
    await fillAndSubmit(view, '  Ana  ');
    const req = http.expectOne(REGISTER);
    expect(req.request.body.name).toBe('Ana');
    req.flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await settle();
  });

  it.each([
    ['Abc1234', t.MSG_PASSWORD_SHORT],
    ['á'.repeat(40), t.MSG_PASSWORD_LONG],
  ])('senha fora do tamanho: %j', async (password, message) => {
    const view = await open();
    await fillAndSubmit(view, 'Ana', 'ana@exemplo.com', password);
    expect(view.error('password')).toBe(message);
    expect(view.password.getAttribute('aria-describedby')).toBe('password-hint password-error');
    http.expectNone(REGISTER);
  });

  it.each(['ana@exemplo', `${'a'.repeat(243)}@exemplo.com`])(
    'e-mail inválido: %s',
    async (email) => {
      const view = await open();
      await fillAndSubmit(view, 'Ana', email);
      expect(view.error('email')).toBe(t.MSG_EMAIL_INVALID);
      http.expectNone(REGISTER);
    },
  );

  it('senha fraca pode enviar', async () => {
    const view = await open();
    await fill(view, 'Ana', 'ana@exemplo.com', 'abcdefgh');
    expect(view.root.querySelector<HTMLElement>('.progress-bar')!.style.width).toBe('25%');
    view.submitButton.click();
    await view.stable();
    http.expectOne(REGISTER).flush(ERROR_INTERNAL, { status: 500, statusText: 'x' });
    await settle();
  });

  async function registerAndLogin(view: View, email = ' ana@exemplo.com ') {
    await fillAndSubmit(view, 'Ana Souza', email, 'Senha123!');
    const register = http.expectOne(REGISTER);
    expect(register.request.body).toEqual({
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      password: 'Senha123!',
    });
    register.flush(REGISTER_RESPONSE_EXAMPLE, created);
    await settle();
    const login = http.expectOne(LOGIN);
    expect(login.request.body).toEqual({ email: 'ana@exemplo.com', password: 'Senha123!' });
    return login;
  }

  it('cadastro + login', async () => {
    const view = await open();
    (await registerAndLogin(view)).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(storedSession()?.refresh_token).toBe(TOKEN_RESPONSE_EXAMPLE.refresh_token);
    expect(router.url).toBe('/inicio');
  });

  it('cadastro com retorno', async () => {
    const view = await open('/cadastro?returnUrl=%2Finicio%3Fx%3D1');
    (await registerAndLogin(view)).flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(router.url).toBe('/inicio?x=1');
  });

  it.each(['0', '500', '401', 'save'])('login automático falhou: %s', async (failure) => {
    const view = await open('/cadastro?returnUrl=%2Finicio');
    const login = await registerAndLogin(view);
    if (failure === '0') {
      login.error(new ProgressEvent('error'), { status: 0 });
    } else if (failure === 'save') {
      vi.spyOn(TestBed.inject(SessionStore), 'save').mockReturnValue(false);
      login.flush(TOKEN_RESPONSE_EXAMPLE);
    } else {
      login.flush(failure === '401' ? ERROR_INVALID_CREDENTIALS : ERROR_INTERNAL, {
        status: Number(failure),
        statusText: 'x',
      });
    }
    await settle();
    await view.stable();
    expect(router.url).toBe('/login?returnUrl=%2Finicio');
    const navigation = router.lastSuccessfulNavigation();
    expect(navigation?.extras.state).toEqual({
      notice: 'account-created',
      email: 'ana@exemplo.com',
    });
    expect(navigation?.extras.replaceUrl).toBe(true);
  });

  it('e-mail já cadastrado', async () => {
    const view = await open('/cadastro?returnUrl=%2Finicio');
    await fillAndSubmit(view);
    http.expectOne(REGISTER).flush(ERROR_EMAIL_TAKEN, { status: 409, statusText: 'Conflict' });
    await settle();
    await view.stable();
    expect(text(view.alert())).toBe(`${t.MSG_EMAIL_TAKEN} ${t.LABEL_GO_TO_LOGIN}`);
    expect(view.alert()!.querySelector('a')!.getAttribute('href')).toBe(
      '/login?returnUrl=%2Finicio',
    );
    expect(view.name.value).toBe('Ana Souza');
    expect(view.password.value).toBe('Senha123!');
  });

  it.each([
    [0, t.MSG_CONNECTION],
    [500, t.MSG_SERVER],
    [400, t.MSG_INVALID_DATA],
    [422, t.MSG_INVALID_DATA],
    [401, t.MSG_SERVER],
  ])('erros genéricos: %i', async (status, message) => {
    const view = await open();
    await fillAndSubmit(view);
    const req = http.expectOne(REGISTER);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush(status === 400 ? ERROR_BAD_REQUEST : ERROR_INTERNAL, { status, statusText: 'x' });
    }
    await settle();
    await view.stable();
    expect(text(view.alert())).toBe(message);
    expect(view.alert()!.getAttribute('role')).toBe('alert');
    expect([view.name.value, view.email.value, view.password.value]).toEqual([
      'Ana Souza',
      'ana@exemplo.com',
      'Senha123!',
    ]);
    expect(view.submitButton.disabled).toBe(false);
  });

  it('envio único', async () => {
    const view = await open();
    await fill(view, 'Ana Souza', 'ana@exemplo.com', 'Senha123!');
    view.submitButton.click();
    view.submitButton.click();
    view.form.dispatchEvent(new Event('submit', { cancelable: true }));
    await view.stable();
    const register = http.expectOne(REGISTER);
    expect(view.submitButton.disabled).toBe(true);
    register.flush(REGISTER_RESPONSE_EXAMPLE, created);
    await settle();
    await view.stable();
    expect(view.submitButton.disabled).toBe(true);
    view.form.dispatchEvent(new Event('submit', { cancelable: true }));
    const login = http.expectOne(LOGIN);
    login.flush(TOKEN_RESPONSE_EXAMPLE);
    await settle();
    await view.stable();
    expect(router.url).toBe('/inicio');
    http.expectNone(REGISTER);
  });

  it('mostrar senha', async () => {
    const view = await open();
    typeInto(view.password, 'Senha123!');
    const toggle = view.root.querySelector<HTMLButtonElement>('button[aria-controls=password]')!;
    toggle.click();
    await view.stable();
    expect(toggle.getAttribute('aria-label')).toBe(LABEL_HIDE_PASSWORD);
    expect(view.password.type).toBe('text');
  });
});
