import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, EMPTY, Subject } from 'rxjs';
import { SessionStore } from '../auth/session-store';
import { classifyHttpError } from '../http/http-error';
import { UserApi } from '../user/user-api';
import type { ApiTheme } from '../user/user.models';
import { ToastService } from '../../shared/ui/toast/toast';
import { TOAST_THEME_NOT_SAVED } from './theme.messages';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'we-sync.theme';

export const toApiTheme = (theme: Theme): ApiTheme => (theme === 'dark' ? 'DARK' : 'LIGHT');
export const fromApiTheme = (theme: ApiTheme): Theme => (theme === 'DARK' ? 'dark' : 'light');

/**
 * Light/dark theme (ADR-16 of feature 004, ADR-14 of feature 006). public/theme-init.js applies the browser's choice
 * before the first paint; with a session, a change is also saved in the account, one PUT at a time.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly session = inject(SessionStore);
  private readonly userApi = inject(UserApi);
  private readonly toast = inject(ToastService);
  private readonly current = signal<Theme>(
    this.root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light',
  );
  private readonly toSave$ = new Subject<Theme>();

  readonly theme = this.current.asReadonly();

  constructor() {
    // In the order of the clicks; a failure keeps the theme and does not stop the next ones (RN-07).
    this.toSave$
      .pipe(
        concatMap((theme) =>
          this.userApi.updatePreferences({ theme: toApiTheme(theme) }).pipe(
            catchError((error: unknown) => {
              // 401: the interceptor has already ended the session.
              if (classifyHttpError(error) !== 'unauthorized') {
                this.toast.show(TOAST_THEME_NOT_SAVED, 'warning');
              }
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /** Applies, saves in the browser and, with a session, saves in the account (RN-07). */
  set(theme: Theme): void {
    this.apply(theme);
    if (this.session.read() !== null) {
      this.toSave$.next(theme);
    }
  }

  /** Theme of the account (GET /users/me): applies and saves in the browser, never calls the API (ADR-14). */
  adoptAccountTheme(theme: ApiTheme): void {
    const next = fromApiTheme(theme);
    if (next !== this.current()) {
      this.apply(next);
    }
  }

  private apply(theme: Theme): void {
    this.root.setAttribute('data-bs-theme', theme);
    this.current.set(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Storage unavailable: the theme lasts until the page is reloaded (RN-15 of feature 004).
    }
  }
}
