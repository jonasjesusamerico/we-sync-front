import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { RefreshError } from '../auth/refresh-error';

export const MSG_CONNECTION =
  'Não foi possível conectar. Verifique sua internet e tente novamente.';
export const MSG_SERVER = 'Algo deu errado. Tente novamente em instantes.';
export const MSG_INVALID_DATA = 'Verifique os dados informados.';

/** RN-15: mensagem genérica para um erro de chamada. Nunca usa o `message` da API. */
export function genericErrorMessage(error: unknown): string | null {
  if (error instanceof RefreshError) {
    return null;
  }
  if (error instanceof TimeoutError) {
    return MSG_CONNECTION;
  }
  if (
    error instanceof DOMException &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  ) {
    return MSG_CONNECTION;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return MSG_CONNECTION;
    }
    if (error.status === 400 || error.status === 422) {
      return MSG_INVALID_DATA;
    }
  }
  return MSG_SERVER;
}
