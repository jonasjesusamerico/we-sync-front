import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserApi } from './user-api';
import { CurrentUserStatus, UserResponse } from './user.models';

/** User of GET /users/me (ADR-10, RN-20). Loaded once per session by the shell resolver. */
@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly api = inject(UserApi);
  private readonly statusSignal = signal<CurrentUserStatus>('idle');
  private readonly userSignal = signal<UserResponse | null>(null);
  private pending: Promise<void> | null = null;
  private generation = 0;

  readonly status = this.statusSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();

  /** One load at a time; never rejects (any error → 'unavailable'). */
  load(): Promise<void> {
    if (this.pending) {
      return this.pending;
    }
    const generation = ++this.generation;
    this.statusSignal.set('loading');
    const run = async () => {
      try {
        const user = await firstValueFrom(this.api.me());
        if (generation === this.generation) {
          this.userSignal.set(user);
          this.statusSignal.set('ready');
        }
      } catch {
        if (generation === this.generation) {
          this.userSignal.set(null);
          this.statusSignal.set('unavailable');
        }
      } finally {
        if (generation === this.generation) {
          this.pending = null;
        }
      }
    };
    this.pending = run();
    return this.pending;
  }

  /** Back to 'idle'; a load still running when clear() is called is discarded. */
  clear(): void {
    this.generation++;
    this.pending = null;
    this.userSignal.set(null);
    this.statusSignal.set('idle');
  }
}
