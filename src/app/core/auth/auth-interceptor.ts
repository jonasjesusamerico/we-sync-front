import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../http/api-base-url';
import { LoggedOutError, RefreshError } from './session-errors';
import { SessionEnd } from './session-end';
import { SessionStore } from './session-store';
import { TokenRefresher } from './token-refresher';

/** Bearer only for URLs of the API, never for /auth/* (DAS 6). */
export function isProtectedApiUrl(url: string, base: string): boolean {
  return url.startsWith(base + '/') && !url.startsWith(base + '/auth/');
}

const withToken = <T>(req: HttpRequest<T>, token: string): HttpRequest<T> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

const isUnauthorized = (error: unknown): boolean =>
  error instanceof HttpErrorResponse && error.status === 401;

/** RF-12 (DAS 3.3): token read from the storage on every request; on 401, one renewal and one retry. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE_URL);
  if (!isProtectedApiUrl(req.url, base)) {
    return next(req);
  }
  const store = inject(SessionStore);
  const refresher = inject(TokenRefresher);
  const sessionEnd = inject(SessionEnd);

  const session = store.read();
  if (!session) {
    sessionEnd.loggedOut();
    return throwError(() => new LoggedOutError());
  }
  const usedToken = session.access_token;

  return next(withToken(req, usedToken)).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }
      return from(refresher.refresh(usedToken)).pipe(
        catchError((refreshError: unknown) => {
          if (refreshError instanceof RefreshError) {
            if (refreshError.kind === 'expired') {
              sessionEnd.expired();
            } else if (refreshError.kind === 'logged-out') {
              sessionEnd.loggedOut();
            }
          }
          return throwError(() => error);
        }),
        switchMap((token) =>
          next(withToken(req, token)).pipe(
            catchError((retryError: unknown) => {
              if (isUnauthorized(retryError)) {
                sessionEnd.expired();
              }
              return throwError(() => retryError);
            }),
          ),
        ),
      );
    }),
  );
};
