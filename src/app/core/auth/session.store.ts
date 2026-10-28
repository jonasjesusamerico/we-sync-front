import { Injectable, Signal, signal } from '@angular/core';

import { Session } from './auth.models';

export const SESSION_KEY = 'we-sync.session';

/**
 * Sessão em `localStorage` (ADR-05). O storage é a fonte da verdade: `read()` relê a cada chamada, sem cache,
 * para refletir o que outra aba gravou.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly authenticated = signal(this.hasSession());
  readonly isAuthenticated: Signal<boolean> = this.authenticated.asReadonly();

  read(): Session | null {
    let raw: string | null;
    try {
      raw = localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
    if (raw === null) {
      return null;
    }
    const session = parseSession(raw);
    if (session === null) {
      this.remove();
    }
    return session;
  }

  /** Grava só o par de tokens. Devolve `false` se o storage recusar (modo privado, cota). */
  save(session: Session): boolean {
    const value: Session = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value));
    } catch {
      return false;
    }
    this.authenticated.set(true);
    return true;
  }

  clear(): void {
    this.remove();
    this.authenticated.set(false);
  }

  hasSession(): boolean {
    return this.read() !== null;
  }

  syncFromStorage(): void {
    this.authenticated.set(this.hasSession());
  }

  private remove(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // storage indisponível: não há o que apagar
    }
  }
}

function parseSession(raw: string): Session | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const { access_token, refresh_token } = parsed as Record<string, unknown>;
  if (!isNonEmptyString(access_token) || !isNonEmptyString(refresh_token)) {
    return null;
  }
  return { access_token, refresh_token };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}
