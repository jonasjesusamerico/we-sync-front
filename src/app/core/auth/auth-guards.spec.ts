import { HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ERROR_INTERNAL, USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession, settle } from '../../../testing/session';
import { CurrentUserStore } from '../user/current-user-store';
import { currentUserResolver } from '../user/current-user-resolver';
import { authGuard, guestGuard } from './auth-guards';
import { authInterceptor } from './auth-interceptor';
import { SessionSync } from './session-sync';

@Component({ template: '' })
class Blank {}

describe('authGuard, guestGuard and currentUserResolver', () => {
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

  it('visitante na área interna', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/inicio?x=1');
    expect(router.url).toBe('/login?returnUrl=%2Finicio%3Fx%3D1');
  });

  it.each(['/login', '/cadastro'])('autenticado no acesso: %s', async (url) => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl(url);
    await settle();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await navigation;
    expect(router.url).toBe('/inicio');
  });

  it('visitante no acesso', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    expect(router.url).toBe('/login');
  });

  it('resolver carrega uma vez', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    await openInicio(harness);
    await harness.navigateByUrl('/outra');
    await harness.navigateByUrl('/inicio');
    http.expectNone(`${API}/users/me`);
    expect(router.url).toBe('/inicio');
  });

  it('resolver com /me fora', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl('/inicio');
    await settle();
    http.expectOne(`${API}/users/me`).flush(ERROR_INTERNAL, { status: 500, statusText: 'Error' });
    await navigation;
    expect(router.url).toBe('/inicio');
    expect(TestBed.inject(CurrentUserStore).status()).toBe('unavailable');
  });
});
