import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { API_BASE_URL } from '../http/api-base-url';
import { SessionSync } from './session-sync';
import { SESSION_KEY, SessionStore } from './session.store';

const seed = (access = 'A1', refresh = 'R1') =>
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ access_token: access, refresh_token: refresh }),
  );
const fire = (key: string | null) =>
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));

describe('SessionSync', () => {
  let router: Router;
  let harness: RouterTestingHarness;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function startAt(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    router = TestBed.inject(Router);
    TestBed.inject(SessionSync).start();
    navigate = vi.spyOn(router, 'navigate');
  }

  const settle = () => harness.fixture.whenStable();

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('storage: saiu em outra aba', async () => {
    seed();
    await startAt('/');

    localStorage.removeItem(SESSION_KEY);
    fire(SESSION_KEY);
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(router.url).toBe('/login');
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
  });

  it('storage: entrou em outra aba', async () => {
    await startAt('/login');

    seed();
    fire(SESSION_KEY);
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/'], { replaceUrl: true });
    expect(router.url).toBe('/');
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(true);
  });

  it('storage: renovou em outra aba', async () => {
    seed();
    await startAt('/');

    seed('A2', 'R2');
    fire(SESSION_KEY);
    await settle();

    expect(navigate).not.toHaveBeenCalled();
    expect(router.url).toBe('/');
  });

  it('storage: outra chave', async () => {
    seed();
    await startAt('/');

    localStorage.removeItem(SESSION_KEY);
    fire('outra');
    await settle();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('storage: clear()', async () => {
    seed();
    await startAt('/');

    localStorage.clear();
    fire(null);
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    expect(router.url).toBe('/login');
  });

  it('start() registra o listener uma vez só', async () => {
    seed();
    await startAt('/');
    TestBed.inject(SessionSync).start();

    localStorage.removeItem(SESSION_KEY);
    fire(SESSION_KEY);
    await settle();

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
