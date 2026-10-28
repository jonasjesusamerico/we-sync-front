import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from './auth.api';
import { LOCKS, REFRESH_LOCK_NAME, REFRESH_LOCK_WAIT_MS } from './locks';
import { RefreshError } from './refresh-error';
import { SessionStore } from './session.store';

/**
 * Renovação única (RN-13): chamadas simultâneas da aba reaproveitam a mesma promise, e entre abas o
 * `navigator.locks` garante exclusão mútua. Dentro do lock o storage é relido: se o access token já mudou, outra
 * chamada ou aba já renovou.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefresher {
  private readonly api = inject(AuthApi);
  private readonly store = inject(SessionStore);
  private readonly locks = inject(LOCKS);
  private inFlight: Promise<string> | null = null;

  /** Resolve com o access token a usar na repetição. Rejeita com RefreshError ou com o erro do refresh. */
  refresh(usedAccessToken: string): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }
    const promise = this.locks
      .request(
        REFRESH_LOCK_NAME,
        { mode: 'exclusive', signal: AbortSignal.timeout(REFRESH_LOCK_WAIT_MS) },
        () => this.criticalSection(usedAccessToken),
      )
      .finally(() => {
        this.inFlight = null;
      });
    this.inFlight = promise;
    return promise;
  }

  private async criticalSection(usedAccessToken: string): Promise<string> {
    const session = this.store.read();
    if (session === null) {
      throw new RefreshError('logged-out');
    }
    if (session.access_token !== usedAccessToken) {
      return session.access_token;
    }
    let tokens;
    try {
      tokens = await firstValueFrom(this.api.refresh(session.refresh_token));
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 400)) {
        this.store.clear();
        throw new RefreshError('expired');
      }
      throw error;
    }
    const saved = this.store.save({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (!saved) {
      this.store.clear();
      throw new RefreshError('expired');
    }
    return tokens.access_token;
  }
}
