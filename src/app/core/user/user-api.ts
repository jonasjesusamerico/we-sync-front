import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { UserResponse } from './user.models';

/** GET /users/me (the Bearer token comes from the auth interceptor). */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/users/me`);
  }
}
