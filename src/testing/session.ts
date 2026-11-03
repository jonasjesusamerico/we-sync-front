// Session helpers for unit tests (localStorage['we-sync.session']).
import { SESSION_KEY } from '../app/core/auth/session.models';

export function seedSession(access: string, refresh: string): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ access_token: access, refresh_token: refresh }),
  );
}

export function storedSession(): { access_token: string; refresh_token: string } | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw === null ? null : JSON.parse(raw);
}

/** Lets pending promises and macrotasks run (HTTP test responses resolve through several promise hops). */
export const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

export function tokens(access: string, refresh: string) {
  return { access_token: access, refresh_token: refresh, token_type: 'Bearer' as const };
}
