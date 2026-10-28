import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { SessionStore } from './session.store';

/** RN-09: rota interna exige sessão no storage (o access token vencido não importa aqui). */
export const authGuard: CanActivateFn & CanActivateChildFn = (_route, state) =>
  inject(SessionStore).hasSession() ||
  inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

/** RN-10: com sessão, login e cadastro levam ao Início. */
export const guestGuard: CanActivateFn = () =>
  !inject(SessionStore).hasSession() || inject(Router).createUrlTree(['/']);
