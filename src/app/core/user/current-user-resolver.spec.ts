import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { CurrentUserStore } from './current-user-store';
import { currentUserResolver } from './current-user-resolver';

describe('currentUserResolver', () => {
  const resolve = () =>
    TestBed.runInInjectionContext(() =>
      currentUserResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Promise<true>;

  beforeEach(() => TestBed.configureTestingModule({ providers: httpTestingProviders() }));

  it('loads the user, then resolves at once when ready', async () => {
    const http = TestBed.inject(HttpTestingController);
    const first = resolve();
    http.expectOne(`${API}/users/me`).flush(USER_RESPONSE_EXAMPLE);
    expect(await first).toBe(true);
    expect(TestBed.inject(CurrentUserStore).status()).toBe('ready');
    expect(await resolve()).toBe(true);
    http.verify();
  });

  it('never rejects', async () => {
    const http = TestBed.inject(HttpTestingController);
    const result = resolve();
    http.expectOne(`${API}/users/me`).error(new ProgressEvent('error'), { status: 0 });
    expect(await result).toBe(true);
  });
});
