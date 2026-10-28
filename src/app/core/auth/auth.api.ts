import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, timeout } from 'rxjs';

import { API_BASE_URL } from '../http/api-base-url';
import {
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from './auth.models';

export const REFRESH_TIMEOUT_MS = 30_000;
export const LOGOUT_TIMEOUT_MS = 5_000;

/** Endpoints de `/auth/*` (contrato da feature 001). Não trata erro: propaga para quem chamou. */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register`, body);
  }

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, body);
  }

  refresh(refreshToken: string): Observable<TokenResponse> {
    const body: RefreshRequest = { refresh_token: refreshToken };
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/auth/refresh`, body)
      .pipe(timeout(REFRESH_TIMEOUT_MS));
  }

  logout(refreshToken: string): Observable<void> {
    const body: LogoutRequest = { refresh_token: refreshToken };
    return this.http.post(`${this.baseUrl}/auth/logout`, body).pipe(
      timeout(LOGOUT_TIMEOUT_MS),
      map(() => undefined),
    );
  }
}
