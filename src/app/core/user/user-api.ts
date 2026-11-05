import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { TokenResponse } from '../auth/session.models';
import { API_BASE_URL } from '../http/api-base-url';
import type {
  ChangePasswordRequest,
  DeleteAccountRequest,
  UpdatePreferencesRequest,
  UpdateProfileRequest,
  UserResponse,
} from './user.models';

/** The account of the signed-in user (the Bearer token comes from the auth interceptor). Stateless. */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/users/me`);
  }

  updateProfile(body: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/users/me/profile`, body);
  }

  updatePreferences(body: UpdatePreferencesRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/users/me/preferences`, body);
  }

  /** 200 → a new token pair; the other sessions end (ADR-02). */
  changePassword(body: ChangePasswordRequest): Observable<TokenResponse> {
    return this.http.put<TokenResponse>(`${this.base}/users/me/password`, body);
  }

  /** 204 → the account and all its data are gone (ADR-04). */
  deleteAccount(body: DeleteAccountRequest): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/me`, { body });
  }
}
