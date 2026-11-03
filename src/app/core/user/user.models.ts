/** GET /users/me */
export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export type CurrentUserStatus = 'idle' | 'loading' | 'ready' | 'unavailable';
