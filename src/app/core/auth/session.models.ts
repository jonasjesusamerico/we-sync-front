// Payloads of the auth endpoints (2-contrato.md of feature 004), in snake_case like the API.
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
}

/** Body of /auth/refresh and /auth/logout. */
export interface RefreshTokenRequest {
  refresh_token: string;
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

/** Error envelope of the API. The front never shows `message`. */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

/** What is kept in localStorage (ADR-12). */
export interface Session {
  access_token: string;
  refresh_token: string;
}

export const SESSION_KEY = 'we-sync.session';
