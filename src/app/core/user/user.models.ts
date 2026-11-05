// Payloads of the /users/me endpoints (2-contrato.md of features 004 and 006), in snake_case like the API.

export type ApiTheme = 'LIGHT' | 'DARK';

/** GET /users/me, PUT /users/me/profile, PUT /users/me/preferences */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  /** null = never chosen in the account. */
  theme: ApiTheme | null;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface UpdatePreferencesRequest {
  theme: ApiTheme;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export type CurrentUserStatus = 'idle' | 'loading' | 'ready' | 'unavailable';
