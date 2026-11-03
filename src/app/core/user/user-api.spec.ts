import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { USER_RESPONSE_EXAMPLE } from '../../../testing/api-examples';
import { API, httpTestingProviders } from '../../../testing/http';
import { UserApi } from './user-api';

describe('UserApi', () => {
  it('me', async () => {
    TestBed.configureTestingModule({ providers: httpTestingProviders() });
    const http = TestBed.inject(HttpTestingController);
    const result = firstValueFrom(TestBed.inject(UserApi).me());
    const req = http.expectOne(`${API}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(USER_RESPONSE_EXAMPLE);
    expect(await result).toEqual(USER_RESPONSE_EXAMPLE);
    http.verify();
  });
});
