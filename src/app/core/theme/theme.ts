import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'we-sync.theme';

/** Light/dark theme (ADR-16). public/theme-init.js applies the saved choice before the first paint. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly current = signal<Theme>(
    this.root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light',
  );
  readonly theme = this.current.asReadonly();

  toggle(): void {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.root.setAttribute('data-bs-theme', next);
    this.current.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage unavailable: the theme lasts until the page is reloaded (RN-15).
    }
  }
}
