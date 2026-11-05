import { Injectable } from '@angular/core';
import { Session, SESSION_KEY } from './session.models';

const isToken = (value: unknown): value is string => typeof value === 'string' && value !== '';

/** Tokens in localStorage['we-sync.session'] (ADR-12). No copy in memory: every read goes to the storage. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  read(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw === null) {
        return null;
      }
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null;
      }
      const { access_token, refresh_token } = value as Record<string, unknown>;
      return isToken(access_token) && isToken(refresh_token)
        ? { access_token, refresh_token }
        : null;
    } catch {
      return null;
    }
  }

  /** Saves only the two tokens. False when the storage refuses (quota, policy). */
  save(tokens: Session): boolean {
    try {
      const session: Session = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage unavailable: nothing to remove.
    }
  }
}
