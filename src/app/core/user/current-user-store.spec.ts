import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ERROR_INTERNAL, USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { CurrentUserStore } from './current-user-store';

describe('CurrentUserStore', () => {
  let store: CurrentUserStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    store = TestBed.inject(CurrentUserStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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
});
