// Espelham o `2-contrato.md` da feature 001 (campos em snake_case, como na API).

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export type ApiErrorCode =
  'BAD_REQUEST' | 'UNAUTHORIZED' | 'CONFLICT' | 'VALIDATION_ERROR' | 'INTERNAL_SERVER_ERROR';

/** Envelope de erro da API. `message` nunca vai para a tela. */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
}
