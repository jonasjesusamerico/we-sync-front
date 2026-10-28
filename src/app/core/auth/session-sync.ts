import { DestroyRef, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { SESSION_KEY, SessionStore } from './session.store';

const GUEST_URL = /^\/(?:login|cadastro)(?:[/?#;]|$)/;

/** RN-12: reage ao evento `storage` (sair ou entrar em outra aba). */
@Injectable({ providedIn: 'root' })
export class SessionSync {
  private readonly store = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const handler = (event: StorageEvent) => this.onStorage(event);
    window.addEventListener('storage', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('storage', handler));
  }

  private onStorage(event: StorageEvent): void {
    if (event.key !== SESSION_KEY && event.key !== null) {
      return;
    }
    this.store.syncFromStorage();
    const hasSession = this.store.hasSession();
    const guest = GUEST_URL.test(this.router.url);
    if (!hasSession && !guest) {
      void this.router.navigate(['/login'], { replaceUrl: true });
    } else if (hasSession && guest) {
      void this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}
