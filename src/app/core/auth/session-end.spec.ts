import { HttpTestingController } from '@angular/common/http/testing';
import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { seedSession, settle, storedSession } from '../../../testing/session';
import { CurrentUserStore } from '../user/current-user-store';
import { SessionEnd } from './session-end';

@Component({ template: '' })
class Blank {}

describe('SessionEnd', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...httpTestingProviders(),
        provideRouter([
          { path: 'login', component: Blank },
          {
            path: 'inicio',
            component: Blank,
            resolve: {
              x: () => {
                inject(SessionEnd).expired();
                return true;
              },
            },
          },
          { path: 'outra', component: Blank },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('expired com navegação em andamento', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create('/outra');
    await harness.navigateByUrl('/inicio').catch(() => undefined);
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login?returnUrl=%2Finicio');
    const navigation = router.lastSuccessfulNavigation();
    expect(navigation?.extras.state).toEqual({ notice: 'session-expired' });
    expect(navigation?.extras.replaceUrl).toBe(true);
    expect(storedSession()).toBeNull();
  });

  it('logout', async () => {
    seedSession('A1', 'R1');
    const user = TestBed.inject(CurrentUserStore);
    const loading = user.load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await loading;
    const harness = await RouterTestingHarness.create('/outra');

    TestBed.inject(SessionEnd).logout();
    expect(storedSession()).toBeNull();
    expect(user.user()).toBeNull();
    const req = http.expectOne(`${API}/auth/logout`);
    expect(req.request.body).toEqual({ refresh_token: 'R1' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null, { status: 204, statusText: 'No Content' });
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login');
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
  });

  it.each([0, 500])('logout com API fora (%i)', async (status) => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create('/outra');
    expect(() => TestBed.inject(SessionEnd).logout()).not.toThrow();
    const req = http.expectOne(`${API}/auth/logout`);
    if (status === 0) {
      req.error(new ProgressEvent('error'), { status: 0 });
    } else {
      req.flush({}, { status, statusText: 'Error' });
    }
    await settle();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login');
  });

  it('accountDeleted', async () => {
    seedSession('A1', 'R1');
    const user = TestBed.inject(CurrentUserStore);
    const loading = user.load();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    await loading;
    const harness = await RouterTestingHarness.create('/outra');

    TestBed.inject(SessionEnd).accountDeleted();
    await harness.fixture.whenStable();
    expect(storedSession()).toBeNull();
    expect(user.status()).toBe('idle');
    expect(router.url).toBe('/login');
    const navigation = router.lastSuccessfulNavigation();
    expect(navigation?.extras.state).toEqual({ notice: 'account-deleted' });
    expect(navigation?.extras.replaceUrl).toBe(true);
    http.expectNone(`${API}/auth/logout`);
  });

  it('logout without a refresh token does not call the API', async () => {
    const harness = await RouterTestingHarness.create('/outra');
    TestBed.inject(SessionEnd).logout();
    await harness.fixture.whenStable();
    http.expectNone(`${API}/auth/logout`);
    expect(router.url).toBe('/login');
  });

  it('loggedOut goes to the login, except on an access page', async () => {
    seedSession('A1', 'R1');
    const harness = await RouterTestingHarness.create('/outra');
    TestBed.inject(SessionEnd).loggedOut();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/login');
    expect(storedSession()).toBeNull();
    const navigate = vi.spyOn(router, 'navigateByUrl');
    TestBed.inject(SessionEnd).loggedOut();
    expect(navigate).not.toHaveBeenCalled();
  });
});
