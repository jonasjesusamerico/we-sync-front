import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ERROR_INTERNAL, USER_RESPONSE_DARK_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession } from '../../../testing/session';
import { ToastService } from '../../shared/ui/toast/toast';
import { THEME_KEY, ThemeService, fromApiTheme, toApiTheme } from './theme';
import { TOAST_THEME_NOT_SAVED } from './theme.messages';

const PREFERENCES = `${API}/users/me/preferences`;

describe('ThemeService', () => {
  const root = document.documentElement;
  let http: HttpTestingController;

  function create(attribute: string | null): ThemeService {
    if (attribute === null) {
      root.removeAttribute('data-bs-theme');
    } else {
      root.setAttribute('data-bs-theme', attribute);
    }
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(ThemeService);
  }

  const toast = () => TestBed.inject(ToastService).current();

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    localStorage.clear();
    root.removeAttribute('data-bs-theme');
  });

  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [null, 'light'],
  ])('estado inicial: %s → %s', (attribute, expected) => {
    expect(create(attribute).theme()).toBe(expected);
  });

  it('conversão com a API', () => {
    expect(toApiTheme('dark')).toBe('DARK');
    expect(toApiTheme('light')).toBe('LIGHT');
    expect(fromApiTheme('DARK')).toBe('dark');
    expect(fromApiTheme('LIGHT')).toBe('light');
  });

  it('set sem sessão', () => {
    const service = create('light');
    service.set('dark');
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    http.expectNone(PREFERENCES);
  });

  it('set com sessão', () => {
    seedSession('a', 'r');
    const service = create('light');
    service.set('dark');
    const req = http.expectOne(PREFERENCES);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ theme: 'DARK' });
    req.flush(USER_RESPONSE_DARK_EXAMPLE);
    expect(toast()).toBeNull();
  });

  it('ordem dos PUT', () => {
    seedSession('a', 'r');
    const service = create('light');
    service.set('dark');
    service.set('light');
    const first = http.expectOne(PREFERENCES);
    expect(first.request.body).toEqual({ theme: 'DARK' });
    first.flush(USER_RESPONSE_DARK_EXAMPLE);
    const second = http.expectOne(PREFERENCES);
    expect(second.request.body).toEqual({ theme: 'LIGHT' });
    second.flush({ ...USER_RESPONSE_DARK_EXAMPLE, theme: 'LIGHT' });
    expect(service.theme()).toBe('light');
  });

  it.each([500, 0])('falha não desfaz: status %i', (status) => {
    seedSession('a', 'r');
    const service = create('light');
    service.set('dark');
    const req = http.expectOne(PREFERENCES);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush(ERROR_INTERNAL, { status, statusText: 'Error' });
    }
    expect(service.theme()).toBe('dark');
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(toast()).toMatchObject({ text: TOAST_THEME_NOT_SAVED, kind: 'warning' });

    service.set('light');
    http.expectOne(PREFERENCES).flush(USER_RESPONSE_DARK_EXAMPLE);
  });

  it('401 sem toast', () => {
    seedSession('a', 'r');
    const service = create('light');
    service.set('dark');
    http
      .expectOne(PREFERENCES)
      .flush({ code: 'UNAUTHORIZED', message: 'x' }, { status: 401, statusText: 'Unauthorized' });
    expect(toast()).toBeNull();
    expect(service.theme()).toBe('dark');
  });

  it('storage recusado', () => {
    const service = create('light');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => service.set('dark')).not.toThrow();
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(service.theme()).toBe('dark');
  });

  it('adopt', () => {
    seedSession('a', 'r');
    const service = create('light');
    service.adoptAccountTheme('DARK');
    expect(root.getAttribute('data-bs-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(service.theme()).toBe('dark');
    http.expectNone(PREFERENCES);
  });

  it('adopt igual não grava', () => {
    const service = create('dark');
    service.adoptAccountTheme('DARK');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });
});
