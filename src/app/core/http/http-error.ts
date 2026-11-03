import { HttpErrorResponse } from '@angular/common/http';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from './error-messages';

export type HttpErrorKind = 'connection' | 'unauthorized' | 'conflict' | 'invalid' | 'server';

/** status 0 → connection; 401 → unauthorized; 409 → conflict; 400 or 422 → invalid; anything else → server. */
export function classifyHttpError(error: unknown): HttpErrorKind {
  if (!(error instanceof HttpErrorResponse)) {
    return 'server';
  }
  switch (error.status) {
    case 0:
      return 'connection';
    case 401:
      return 'unauthorized';
    case 409:
      return 'conflict';
    case 400:
    case 422:
      return 'invalid';
    default:
      return 'server';
  }
}

/** connection → MSG_CONNECTION; invalid → MSG_INVALID_DATA; the others → MSG_SERVER (DAS 5.2). */
export function genericErrorMessage(kind: HttpErrorKind): string {
  switch (kind) {
    case 'connection':
      return MSG_CONNECTION;
    case 'invalid':
      return MSG_INVALID_DATA;
    default:
      return MSG_SERVER;
  }
}
