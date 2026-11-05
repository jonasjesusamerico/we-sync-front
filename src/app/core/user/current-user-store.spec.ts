import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ERROR_INTERNAL,
  USER_RESPONSE_DARK_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
} from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { THEME_KEY, ThemeService } from '../theme/theme';
import { CurrentUserStore } from './current-user-store';

describe('CurrentUserStore', () => {
  let store: CurrentUserStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    store = TestBed.inject(CurrentUserStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('usuário pronto', async () => {
    expect(store.status()).toBe('idle');
    const done = store.load();
    expect(store.status()).toBe('loading');
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await done;
    expect(store.status()).toBe('ready');
    expect(store.user()).toEqual(USER_RESPONSE_EXAMPLE);
  });

  it.each([0, 404, 500])('usuário indisponível: status %i', async (status) => {
    const done = store.load();
    const req = http.expectOne(`${API}/users/me`);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush(ERROR_INTERNAL, { status, statusText: 'Error' });
    }
    await expect(done).resolves.toBeUndefined();
    expect(store.status()).toBe('unavailable');
    expect(store.user()).toBeNull();
  });

  it('uma carga por vez', async () => {
    const first = store.load();
    const second = store.load();
    expect(second).toBe(first);
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await first;
    expect(store.status()).toBe('ready');
  });

  it('clear durante a carga', async () => {
    const done = store.load();
    store.clear();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await done;
    expect(store.status()).toBe('idle');
    expect(store.user()).toBeNull();
  });

  it('load adota o tema da conta', async () => {
    const adopt = vi.spyOn(TestBed.inject(ThemeService), 'adoptAccountTheme');
    const done = store.load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_DARK_EXAMPLE);
    await done;
    expect(adopt).toHaveBeenCalledWith('DARK');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('load sem tema', async () => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    const theme = TestBed.inject(ThemeService);
    const adopt = vi.spyOn(theme, 'adoptAccountTheme');
    const done = store.load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await done;
    expect(adopt).not.toHaveBeenCalled();
    expect(theme.theme()).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
    http.expectNone(`${API}/users/me/preferences`);
  });

  it('setUser', async () => {
    const adopt = vi.spyOn(TestBed.inject(ThemeService), 'adoptAccountTheme');
    const done = store.load();
    const req = http.expectOne(`${API}/users/me`);
    const renamed = { ...USER_RESPONSE_DARK_EXAMPLE, name: 'Jonas Silva' };
    store.setUser(renamed);
    expect(store.user()).toEqual(renamed);
    expect(store.status()).toBe('ready');
    req.flush({ ...USER_RESPONSE_EXAMPLE, name: 'Velho' });
    await done;
    expect(store.user()).toEqual(renamed);
    expect(store.status()).toBe('ready');
    expect(adopt).not.toHaveBeenCalled();
  });
});
