// Examples of 2-contrato.md (feature 004), used by the unit tests.
import type {
  ApiError,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
} from '../app/core/auth/session.models';
import type { UserResponse } from '../app/core/user/user.models';

export const REGISTER_REQUEST_EXAMPLE: RegisterRequest = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  password: 'Senha123!',
};

export const REGISTER_RESPONSE_EXAMPLE: RegisterResponse = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
};

export const LOGIN_REQUEST_EXAMPLE = { email: 'ana@exemplo.com', password: 'Senha123!' };

export const TOKEN_RESPONSE_EXAMPLE: TokenResponse = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<assinatura>',
  refresh_token: 'Q2hhdmUtYWxlYXRvcmlhLWJhc2U2NHVybC0zMi1ieXRlcw',
  token_type: 'Bearer',
};

export const USER_RESPONSE_EXAMPLE: UserResponse = {
  id: 42,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
};

export const ERROR_BAD_REQUEST: ApiError = { code: 'BAD_REQUEST', message: 'invalid request body' };
export const ERROR_NAME_INVALID: ApiError = {
  code: 'VALIDATION_ERROR',
  message: 'name must be between 2 and 60 characters',
};
export const ERROR_EMAIL_TAKEN: ApiError = {
  code: 'CONFLICT',
  message: 'email already registered',
};
export const ERROR_INVALID_CREDENTIALS: ApiError = {
  code: 'UNAUTHORIZED',
  message: 'invalid credentials',
};
export const ERROR_LOGIN_REQUIRED: ApiError = {
  code: 'VALIDATION_ERROR',
  message: 'email and password are required',
};
export const ERROR_INVALID_TOKEN: ApiError = {
  code: 'UNAUTHORIZED',
  message: 'invalid authentication token',
};
export const ERROR_USER_NOT_FOUND: ApiError = { code: 'NOT_FOUND', message: 'user not found' };
export const ERROR_INTERNAL: ApiError = {
  code: 'INTERNAL_SERVER_ERROR',
  message: 'internal server error',
};
