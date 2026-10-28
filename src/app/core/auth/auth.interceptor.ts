import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { API_BASE_URL } from '../http/api-base-url';
import { RefreshError } from './refresh-error';
import { SessionStore } from './session.store';
import { TokenRefresher } from './token-refresher';

/** Marca a repetição depois da renovação: um segundo `401` não renova de novo. */
export const RETRIED = new HttpContextToken<boolean>(() => false);

/**
 * RF-06/RF-07: põe o Bearer nas rotas protegidas da API e, num `401`, renova uma vez (RN-13) e repete.
 * Nunca manda o token para outro host nem para `/auth/*`.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = inject(API_BASE_URL);
  if (!isProtectedApiRequest(req, apiBaseUrl)) {
    return next(req);
  }

  const store = inject(SessionStore);
  const refresher = inject(TokenRefresher);
  const router = inject(Router);

  const used = store.read()?.access_token ?? '';
  const authorized = used ? withBearer(req, used) : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error) || req.context.get(RETRIED)) {
        return throwError(() => error);
      }
      return from(refresher.refresh(used)).pipe(
        switchMap((token) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
              context: req.context.set(RETRIED, true),
            }),
          ).pipe(
            catchError((retryError: unknown) => {
              if (isUnauthorized(retryError)) {
                store.clear();
                return throwError(() => new RefreshError('expired'));
              }
              return throwError(() => retryError);
            }),
          ),
        ),
        catchError((failure: unknown) => {
          if (failure instanceof RefreshError) {
            if (failure.reason === 'expired') {
              void router.navigate(['/login'], {
                queryParams: { returnUrl: router.url },
                state: { notice: 'expired' },
                replaceUrl: true,
              });
            } else {
              void router.navigate(['/login'], { replaceUrl: true });
            }
          }
          return throwError(() => failure);
        }),
      );
    }),
  );
};

function isProtectedApiRequest(req: HttpRequest<unknown>, apiBaseUrl: string): boolean {
  if (!req.url.startsWith(apiBaseUrl)) {
    return false;
  }
  const rest = req.url.slice(apiBaseUrl.length);
  if (rest !== '' && !rest.startsWith('/') && !rest.startsWith('?')) {
    return false; // ex.: base `/api/v1` e URL `/api/v10/...`
  }
  return !rest.startsWith('/auth/');
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
