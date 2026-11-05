import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  TOKEN_RESPONSE_NEW_EXAMPLE,
  USER_RESPONSE_DARK_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
} from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { UserApi } from './user-api';

describe('UserApi', () => {
  let http: HttpTestingController;
  let api: UserApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(UserApi);
  });

  afterEach(() => http.verify());

  it('me', async () => {
    const result = firstValueFrom(api.me());
    const req = http.expectOne(`${API}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(USER_RESPONSE_EXAMPLE);
    expect(await result).toEqual(USER_RESPONSE_EXAMPLE);
  });

  it('perfil', async () => {
    const result = firstValueFrom(api.updateProfile({ name: 'Jonas Silva' }));
    const req = http.expectOne(`${API}/users/me/profile`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Jonas Silva' });
    req.flush(USER_RESPONSE_DARK_EXAMPLE);
    expect(await result).toEqual(USER_RESPONSE_DARK_EXAMPLE);
  });

  it('preferências', async () => {
    const result = firstValueFrom(api.updatePreferences({ theme: 'DARK' }));
    const req = http.expectOne(`${API}/users/me/preferences`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ theme: 'DARK' });
    req.flush(USER_RESPONSE_DARK_EXAMPLE);
    expect((await result).theme).toBe('DARK');
  });

  it('senha', async () => {
    const body = { current_password: 'senha-antiga-1', new_password: 'Nova-senha-2026' };
    const result = firstValueFrom(api.changePassword(body));
    const req = http.expectOne(`${API}/users/me/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(TOKEN_RESPONSE_NEW_EXAMPLE);
    expect(await result).toEqual(TOKEN_RESPONSE_NEW_EXAMPLE);
  });

  it('excluir com corpo', async () => {
    const result = firstValueFrom(api.deleteAccount({ password: 'x' }), {
      defaultValue: undefined,
    });
    const req = http.expectOne(`${API}/users/me`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ password: 'x' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await result;
  });
});
