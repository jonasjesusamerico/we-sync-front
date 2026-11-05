import { DestroyRef, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUserStore } from '../user/current-user-store';
import { HOME_URL } from './return-url';
import { SESSION_KEY } from './session.models';
import { SessionStore } from './session-store';

const ACCESS_PAGES = new Set(['login', 'cadastro']);

/** Follows the session of the other tabs through the `storage` event (ADR-14). */
@Injectable({ providedIn: 'root' })
export class SessionSync {
  private readonly store = inject(SessionStore);
  private readonly currentUser = inject(CurrentUserStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }
    this.started = true;
    const listener = (event: StorageEvent) => this.onStorage(event);
    window.addEventListener('storage', listener);
    this.destroyRef.onDestroy(() => window.removeEventListener('storage', listener));
  }

  private onStorage(event: StorageEvent): void {
    // key null = the whole storage was cleared.
    if (event.key !== null && event.key !== SESSION_KEY) {
      return;
    }
    const hasSession = this.store.read() !== null;
    const tree = this.router.parseUrl(this.router.url);
    const first = tree.root.children['primary']?.segments[0]?.path;
    const onAccessPage = first !== undefined && ACCESS_PAGES.has(first);
    if (!hasSession) {
      this.currentUser.clear();
      if (!onAccessPage) {
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    } else if (onAccessPage) {
      void this.router.navigateByUrl(HOME_URL, { replaceUrl: true });
    }
  }
}
