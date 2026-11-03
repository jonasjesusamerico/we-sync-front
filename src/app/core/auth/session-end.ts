import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUserStore } from '../user/current-user-store';
import { AuthApi } from './auth-api';
import { LoginNoticeState } from './login-notice';
import { sanitizeReturnUrl } from './return-url';
import { SessionStore } from './session-store';

const ACCESS_PAGES = new Set(['login', 'cadastro']);

/** End of the session: expired (RN-09), logged out in another tab, and logout (RN-12). */
@Injectable({ providedIn: 'root' })
export class SessionEnd {
  private readonly store = inject(SessionStore);
  private readonly currentUser = inject(CurrentUserStore);
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApi);

  /** RN-09: clears the session and goes to the login with the return route and the "session expired" notice. */
  expired(): void {
    this.store.clear();
    this.currentUser.clear();
    const navigation = this.router.currentNavigation();
    const target = navigation?.finalUrl ?? navigation?.extractedUrl;
    const current = target ? this.router.serializeUrl(target) : this.router.url;
    const returnUrl = sanitizeReturnUrl(current, this.router);
    const state: LoginNoticeState = { notice: 'session-expired' };
    void this.router.navigate(['/login'], { queryParams: { returnUrl }, state, replaceUrl: true });
  }

  /** Another tab logged out: clears what is left and goes to the login (no notice). */
  loggedOut(): void {
    this.store.clear();
    this.currentUser.clear();
    if (!this.isOnAccessPage()) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  /** RN-12 (DAS 3.4): clears first, navigates, then revokes the refresh token without waiting. */
  logout(): void {
    const refreshToken = this.store.read()?.refresh_token;
    this.store.clear();
    this.currentUser.clear();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
    if (refreshToken) {
      this.authApi.logout(refreshToken).subscribe({ error: () => undefined });
    }
  }

  private isOnAccessPage(): boolean {
    const tree = this.router.parseUrl(this.router.url);
    const first = tree.root.children['primary']?.segments[0]?.path;
    return first !== undefined && ACCESS_PAGES.has(first);
  }
}
