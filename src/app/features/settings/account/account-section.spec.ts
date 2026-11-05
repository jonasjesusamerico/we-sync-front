import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  ERROR_INTERNAL,
  ERROR_INVALID_PASSWORD,
  ERROR_NAME_INVALID,
  TOKEN_RESPONSE_NEW_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
} from '../../../../testing/api-examples';
import { installDialogStub } from '../../../../testing/dialog';
import { text, typeInto } from '../../../../testing/dom';
import { API, httpTestingProviders } from '../../../../testing/http';
import { seedSession, settle, storedSession } from '../../../../testing/session';
import { SessionEnd } from '../../../core/auth/session-end';
import { ThemeService } from '../../../core/theme/theme';
import { CurrentUserStore } from '../../../core/user/current-user-store';
import type { UserResponse } from '../../../core/user/user.models';
import { ToastService } from '../../../shared/ui/toast/toast';
import * as t from '../settings.messages';
import { AccountSection } from './account-section';

const ME = `${API}/users/me`;
const PROFILE = `${API}/users/me/profile`;
const PASSWORD = `${API}/users/me/password`;
const PREFERENCES = `${API}/users/me/preferences`;
const failure = (status: number) => ({ status, statusText: 'Error' });

describe('AccountSection', () => {
  let http: HttpTestingController;
  let stub: ReturnType<typeof installDialogStub>;

  beforeEach(() => {
    stub = installDialogStub();
    seedSession('A1', 'R1');
    document.documentElement.setAttribute('data-bs-theme', 'light');
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter([]),
        { provide: SessionEnd, useValue: { accountDeleted: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    stub.restore();
    http.verify();
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
    vi.restoreAllMocks();
  });

  async function render(user: UserResponse | 'unavailable' = USER_RESPONSE_EXAMPLE) {
    const store = TestBed.inject(CurrentUserStore);
    const loading = store.load();
    const req = http.expectOne(ME);
    if (user === 'unavailable') {
      req.flush(ERROR_INTERNAL, failure(500));
    } else {
      req.flush(user);
    }
    await loading;
    const fixture = TestBed.createComponent(AccountSection);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const stable = async () => {
      await settle();
      await fixture.whenStable();
    };
    const cards = () => Array.from(root.querySelectorAll<HTMLElement>('#tab-conta > .ws-card'));
    return {
      fixture,
      root,
      store,
      stable,
      cards,
      name: () => root.querySelector<HTMLInputElement>('#acc-name')!,
      email: () => root.querySelector<HTMLInputElement>('#acc-email')!,
      current: () => root.querySelector<HTMLInputElement>('#acc-pass')!,
      next: () => root.querySelector<HTMLInputElement>('#acc-new')!,
      saveProfile: () => cards()[0].querySelector<HTMLButtonElement>('button[type=submit]')!,
      savePassword: () => cards()[1].querySelector<HTMLButtonElement>('button[type=submit]')!,
      error: (id: string) => text(root.querySelector(`#${id}-error`)),
      alert: (card: number) => cards()[card].querySelector('.alert'),
    };
  }

  const toast = () => TestBed.inject(ToastService).current();

  it('estrutura', async () => {
    const view = await render();
    expect(view.cards().map((c) => text(c.querySelector('h2')))).toEqual([
      t.PROFILE_TITLE,
      t.PASSWORD_TITLE,
      t.PREFERENCES_TITLE,
      t.DELETE_TITLE,
    ]);
    expect(view.cards().map((c) => c.tagName)).toEqual(['FORM', 'FORM', 'DIV', 'DIV']);
    expect(view.name().value).toBe('Ana Souza');
    expect(view.email().value).toBe('ana@exemplo.com');
    expect(view.email().readOnly).toBe(true);
    expect(view.email().getAttribute('aria-describedby')).toBe('acc-email-hint');
    expect(text(view.root.querySelector('#acc-email-hint'))).toBe(t.EMAIL_HINT);
    expect(text(view.root.querySelector('#theme-hint'))).toBe(t.THEME_HINT);
    expect(view.root.querySelectorAll('select').length).toBe(0);
    expect(view.root.querySelector('#acc-start, #tours-reset')).toBeNull();
    const danger = view.cards()[3];
    expect(danger.classList).toContain('ws-danger-zone');
    expect(danger.querySelector('h2')!.classList).toContain('text-danger-ws');
    expect(text(danger.querySelector('button'))).toBe(t.DELETE_OPEN);
    expect(text(view.cards()[1].querySelector('p.form-text'))).toBe(t.PASSWORD_NOTE);
  });

  it('perfil salva', async () => {
    const view = await render();
    typeInto(view.name(), 'Jonas Silva');
    view.saveProfile().click();
    const req = http.expectOne(PROFILE);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Jonas Silva' });
    req.flush({ ...USER_RESPONSE_EXAMPLE, name: 'Jonas Silva' });
    await view.stable();
    expect(toast()).toMatchObject({ text: t.TOAST_PROFILE_SAVED, kind: 'success' });
    expect(view.store.user()!.name).toBe('Jonas Silva');
    expect(view.name().value).toBe('Jonas Silva');
  });

  it.each([
    ['A', t.ERR_NAME_LENGTH],
    ['   ', t.ERR_NAME_REQUIRED],
    ['a'.repeat(61), t.ERR_NAME_LENGTH],
  ])('perfil inválido: %j', async (value, message) => {
    const view = await render();
    typeInto(view.name(), value);
    view.saveProfile().click();
    await view.stable();
    expect(view.error('acc-name')).toBe(message);
    expect(view.name().getAttribute('aria-invalid')).toBe('true');
    expect(view.name().getAttribute('aria-describedby')).toBe('acc-name-error');
    expect(document.activeElement).toBe(view.name());
    http.expectNone(PROFILE);
  });

  it('perfil trim', async () => {
    const view = await render();
    typeInto(view.name(), '  Ana  ');
    view.saveProfile().click();
    const req = http.expectOne(PROFILE);
    expect(req.request.body).toEqual({ name: 'Ana' });
    req.flush({ ...USER_RESPONSE_EXAMPLE, name: 'Ana' });
    await view.stable();
  });

  it.each([
    [500, t.MSG_SERVER],
    [0, t.MSG_CONNECTION],
    [422, t.MSG_INVALID_DATA],
  ])('perfil erro: %i', async (status, message) => {
    const view = await render();
    typeInto(view.name(), 'Jonas Silva');
    view.saveProfile().click();
    const req = http.expectOne(PROFILE);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush(status === 422 ? ERROR_NAME_INVALID : ERROR_INTERNAL, failure(status));
    }
    await view.stable();
    expect(text(view.alert(0))).toBe(message);
    expect(view.name().value).toBe('Jonas Silva');
    expect(view.store.user()!.name).toBe('Ana Souza');
    expect(toast()).toBeNull();
  });

  it('perfil indisponível', async () => {
    const view = await render('unavailable');
    const profile = view.cards()[0];
    expect(text(profile.querySelector('ws-area-status'))).toContain(t.MSG_PROFILE_UNAVAILABLE);
    expect(view.root.querySelector('#acc-name')).toBeNull();
    expect(view.cards()[1].querySelector('#acc-pass')).not.toBeNull();
    const load = vi.spyOn(view.store, 'load');
    profile.querySelector<HTMLButtonElement>('ws-area-status button')!.click();
    expect(load).toHaveBeenCalled();
    await view.stable();
    expect(profile.querySelector('ws-area-status [role=status]')).not.toBeNull();
    http.expectOne(ME).flush(USER_RESPONSE_EXAMPLE);
    await view.stable();
    expect(view.name().value).toBe('Ana Souza');
  });

  it('senha troca', async () => {
    const view = await render();
    typeInto(view.current(), 'senha-antiga-1');
    typeInto(view.next(), 'Nova-senha-2026');
    view.savePassword().click();
    const req = http.expectOne(PASSWORD);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      current_password: 'senha-antiga-1',
      new_password: 'Nova-senha-2026',
    });
    req.flush(TOKEN_RESPONSE_NEW_EXAMPLE);
    await view.stable();
    expect(storedSession()).toEqual({
      access_token: TOKEN_RESPONSE_NEW_EXAMPLE.access_token,
      refresh_token: TOKEN_RESPONSE_NEW_EXAMPLE.refresh_token,
    });
    expect(view.current().value).toBe('');
    expect(view.next().value).toBe('');
    expect(view.root.querySelector('#acc-pass-error, #acc-new-error')).toBeNull();
    expect(toast()).toMatchObject({ text: t.TOAST_PASSWORD_CHANGED });
  });

  it('senha atual errada', async () => {
    const view = await render();
    typeInto(view.current(), 'errada-123');
    typeInto(view.next(), 'Nova-senha-2026');
    view.savePassword().click();
    http.expectOne(PASSWORD).flush(ERROR_INVALID_PASSWORD, failure(403));
    await view.stable();
    expect(view.error('acc-pass')).toBe(t.ERR_CURRENT_WRONG);
    expect(view.current().value).toBe('');
    expect(view.next().value).toBe('Nova-senha-2026');
    expect(document.activeElement).toBe(view.current());
    expect(view.alert(1)).toBeNull();
    expect(storedSession()).toEqual({ access_token: 'A1', refresh_token: 'R1' });

    typeInto(view.current(), 'o');
    await view.stable();
    expect(view.root.querySelector('#acc-pass-error')).toBeNull();
  });

  it('senha igual', async () => {
    const view = await render();
    typeInto(view.current(), 'Senha123!');
    typeInto(view.next(), 'Senha123!');
    view.savePassword().click();
    await view.stable();
    expect(view.error('acc-new')).toBe(t.ERR_NEW_SAME);
    expect(document.activeElement).toBe(view.next());
    http.expectNone(PASSWORD);
  });

  it('senha curta e vazia', async () => {
    const view = await render();
    typeInto(view.next(), '1234567');
    view.savePassword().click();
    await view.stable();
    expect(view.error('acc-pass')).toBe(t.ERR_CURRENT_REQUIRED);
    expect(view.error('acc-new')).toBe(t.ERR_NEW_SHORT);
    expect(document.activeElement).toBe(view.current());
    expect(view.next().getAttribute('aria-describedby')).toBe('acc-new-hint acc-new-error');

    typeInto(view.next(), '');
    typeInto(view.current(), 'x');
    view.savePassword().click();
    await view.stable();
    expect(view.error('acc-new')).toBe(t.ERR_NEW_SHORT);
    expect(document.activeElement).toBe(view.next());

    typeInto(view.next(), 'a'.repeat(73));
    await view.stable();
    expect(view.error('acc-new')).toBe(t.ERR_NEW_LONG);
    http.expectNone(PASSWORD);
  });

  it.each([
    [422, t.MSG_INVALID_DATA],
    [500, t.MSG_SERVER],
    [403, t.MSG_SERVER],
  ])('senha erro genérico: %i', async (status, message) => {
    const view = await render();
    typeInto(view.current(), 'senha-antiga-1');
    typeInto(view.next(), 'Nova-senha-2026');
    view.savePassword().click();
    http
      .expectOne(PASSWORD)
      .flush(
        status === 403 ? { code: 'FORBIDDEN', message: 'x' } : ERROR_INTERNAL,
        failure(status),
      );
    await view.stable();
    expect(text(view.alert(1))).toBe(message);
    expect(view.current().value).toBe('senha-antiga-1');
    expect(view.next().value).toBe('Nova-senha-2026');
  });

  it('tema', async () => {
    const view = await render();
    const theme = TestBed.inject(ThemeService);
    const set = vi.spyOn(theme, 'set');
    const light = view.root.querySelector<HTMLInputElement>('#th-light')!;
    const dark = view.root.querySelector<HTMLInputElement>('#th-dark')!;
    expect(light.checked).toBe(true);
    dark.click();
    await view.stable();
    expect(set).toHaveBeenCalledWith('dark');
    expect(dark.checked).toBe(true);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    http.expectOne(PREFERENCES).flush({ ...USER_RESPONSE_EXAMPLE, theme: 'DARK' });
  });

  it('envio único', async () => {
    const view = await render();
    typeInto(view.name(), 'Jonas Silva');
    view.saveProfile().click();
    await view.stable();
    view.saveProfile().click();
    const profile = view.saveProfile();
    expect(profile.disabled).toBe(true);
    expect(profile.getAttribute('aria-busy')).toBe('true');
    expect(profile.querySelector('.spinner-border')).not.toBeNull();
    const form = view.cards()[0] as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    typeInto(view.current(), 'senha-antiga-1');
    typeInto(view.next(), 'Nova-senha-2026');
    view.savePassword().click();
    await view.stable();
    (view.cards()[1] as HTMLFormElement).dispatchEvent(new Event('submit'));
    expect(view.savePassword().disabled).toBe(true);
    expect(view.savePassword().getAttribute('aria-busy')).toBe('true');

    http.expectOne(PROFILE).flush({ ...USER_RESPONSE_EXAMPLE, name: 'Jonas Silva' });
    http.expectOne(PASSWORD).flush(TOKEN_RESPONSE_NEW_EXAMPLE);
    await view.stable();
    expect(view.saveProfile().disabled).toBe(false);
    expect(view.savePassword().disabled).toBe(false);
  });

  it('excluir abre', async () => {
    const view = await render();
    const open = view.cards()[3].querySelector<HTMLButtonElement>('button')!;
    open.focus();
    open.click();
    await view.stable();
    const dialog = view.root.querySelector('ws-delete-account-dialog dialog');
    expect(dialog).not.toBeNull();
    expect(stub.showModal).toHaveBeenCalledTimes(1);
    expect(dialog!.getAttribute('aria-labelledby')).toBe('delete-title');

    view.root.querySelector<HTMLButtonElement>('ws-delete-account-dialog .btn-ghost')!.click();
    await view.stable();
    expect(view.root.querySelector('ws-delete-account-dialog')).toBeNull();
    expect(document.activeElement).toBe(open);
  });
});
