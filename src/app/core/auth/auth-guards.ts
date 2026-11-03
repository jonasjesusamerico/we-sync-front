import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HOME_URL } from './return-url';
import { SessionStore } from './session-store';

/** With a session → true; without → /login?returnUrl=<requested URL> (RN-10). Only checks that tokens exist. */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(SessionStore).read()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** With a session → /inicio (RN-11); without → true. */
export const guestGuard: CanActivateFn = () =>
  inject(SessionStore).read() ? inject(Router).parseUrl(HOME_URL) : true;
