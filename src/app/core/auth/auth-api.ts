import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import {
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from './session.models';

/** Auth endpoints, without state. Callers decide by the status (DAS 5.2). */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  register(body: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, body);
  }

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, body);
  }

  refresh(refreshToken: string): Observable<TokenResponse> {
    const body: RefreshTokenRequest = { refresh_token: refreshToken };
    return this.http.post<TokenResponse>(`${this.base}/auth/refresh`, body);
  }

  logout(refreshToken: string): Observable<void> {
    const body: RefreshTokenRequest = { refresh_token: refreshToken };
    return this.http.post<void>(`${this.base}/auth/logout`, body);
  }
}
