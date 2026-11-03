import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';
import { LOCK_MANAGER, REFRESH_LOCK_NAME, REFRESH_LOCK_TIMEOUT_MS } from './lock-manager';
import { RefreshError } from './session-errors';
import { SessionStore } from './session-store';

/**
 * Single token renewal (ADR-13): one promise per tab, the Web Locks lock between tabs, and a new read of the
 * storage before and after calling the API.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefresher {
  private readonly store = inject(SessionStore);
  private readonly api = inject(AuthApi);
  private readonly locks = inject(LOCK_MANAGER);
  private inFlight: Promise<string> | null = null;

  /** Returns a valid access token to repeat the call that failed with `failedAccessToken`. Rejects with RefreshError. */
  refresh(failedAccessToken: string): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const promise = this.underLock(failedAccessToken).finally(() => {
      if (this.inFlight === promise) {
        this.inFlight = null;
      }
    });
    this.inFlight = promise;
    return promise;
  }

  private async underLock(failedAccessToken: string): Promise<string> {
    if (!this.locks) {
      return this.critical(failedAccessToken);
    }
    // Same as AbortSignal.timeout(), but with setTimeout, which the unit tests can fake.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REFRESH_LOCK_TIMEOUT_MS);
    try {
      return await this.locks.request(REFRESH_LOCK_NAME, { signal: controller.signal }, () => {
        clearTimeout(timer);
        return this.critical(failedAccessToken);
      });
    } catch (error) {
      if (error instanceof RefreshError) {
        throw error;
      }
      throw new RefreshError('unavailable');
    } finally {
      clearTimeout(timer);
    }
  }

  private async critical(failedAccessToken: string): Promise<string> {
    const session = this.store.read();
    if (!session) {
      throw new RefreshError('logged-out');
    }
    if (session.access_token !== failedAccessToken) {
      return session.access_token;
    }
    try {
      const tokens = await firstValueFrom(this.api.refresh(session.refresh_token));
      if (!this.store.save(tokens)) {
        this.store.clear();
        throw new RefreshError('expired');
      }
      return tokens.access_token;
    } catch (error) {
      if (error instanceof RefreshError) {
        throw error;
      }
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 400)) {
        const current = this.store.read();
        if (!current) {
          throw new RefreshError('logged-out');
        }
        if (current.refresh_token !== session.refresh_token) {
          return current.access_token;
        }
        this.store.clear();
        throw new RefreshError('expired');
      }
      throw new RefreshError('unavailable');
    }
  }
}
