import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ThemeService } from '../theme/theme';
import { UserApi } from './user-api';
import { CurrentUserStatus, UserResponse } from './user.models';

/** User of GET /users/me (ADR-10, RN-20 of feature 004). Loaded once per session by the shell resolver. */
@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly api = inject(UserApi);
  private readonly theme = inject(ThemeService);
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
          // The account's theme wins over the browser's (ADR-14); null = never chosen, nothing changes.
          if (user.theme !== null) {
            this.theme.adoptAccountTheme(user.theme);
          }
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

  /** The user returned by PUT /users/me/profile (RN-02). Discards a load in progress; does not adopt the theme. */
  setUser(user: UserResponse): void {
    this.generation++;
    this.pending = null;
    this.userSignal.set(user);
    this.statusSignal.set('ready');
  }

  /** Back to 'idle'; a load still running when clear() is called is discarded. */
  clear(): void {
    this.generation++;
    this.pending = null;
    this.userSignal.set(null);
    this.statusSignal.set('idle');
  }
}
