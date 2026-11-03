import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession, settle } from '../../../testing/session';
import { CurrentUserStore } from '../user/current-user-store';
import { currentUserResolver } from '../user/current-user-resolver';
import { authGuard, guestGuard } from './auth-guards';
import { authInterceptor } from './auth-interceptor';
import { SESSION_KEY } from './session.models';
import { SessionSync } from './session-sync';

@Component({ template: '' })
class Blank {}

describe('SessionSync', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders([authInterceptor]),
        provideRouter([
          { path: 'login', component: Blank, canActivate: [guestGuard] },
          { path: 'cadastro', component: Blank, canActivate: [guestGuard] },
          {
            path: '',
            component: Blank,
            canActivate: [authGuard],
            resolve: { user: currentUserResolver },
            children: [
              { path: 'inicio', component: Blank },
              { path: 'outra', component: Blank },
            ],
          },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(SessionSync).start();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  async function openInicio(harness: RouterTestingHarness) {
    const navigation = harness.navigateByUrl('/inicio');
    await settle();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await navigation;
  }

  const storageEvent = (key: string | null) =>
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: null }));

  it('outra aba saiu', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    await openInicio(harness);
    localStorage.removeItem(SESSION_KEY);
    storageEvent(SESSION_KEY);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login');
    expect(TestBed.inject(CurrentUserStore).user()).toBeNull();
  });

  it('storage limpo', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    await openInicio(harness);
    localStorage.clear();
    storageEvent(null);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login');
  });

  it('outra aba entrou', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    seedSession('A1', 'R1');
    storageEvent(SESSION_KEY);
    await settle();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/inicio');
  });

  it('outra aba renovou', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    await openInicio(harness);
    seedSession('A2', 'R2');
    storageEvent(SESSION_KEY);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/inicio');
    expect(TestBed.inject(CurrentUserStore).status()).toBe('ready');
  });

  it('outra chave', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    await openInicio(harness);
    localStorage.removeItem(SESSION_KEY);
    storageEvent('we-sync.theme');
    await harness.fixture.whenStable();
    expect(router.url).toBe('/inicio');
  });
});
