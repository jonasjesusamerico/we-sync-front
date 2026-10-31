import { HttpErrorResponse } from '@angular/common/http';

export type SaveFailure =
  /** 404 NOT_FOUND no PUT */
  | 'purchase-gone'
  /** 404 CATEGORY_NOT_FOUND (POST ou PUT) */
  | 'category-gone'
  /** 404 PAYMENT_METHOD_NOT_FOUND (POST ou PUT) */
  | 'payment-gone'
  /** qualquer outro 404 (ex.: NOT_FOUND no POST, de uma instância antiga no deploy) */
  | 'unknown-404'
  /** tudo o que não é 404 → genericErrorMessage */
  | 'other';

/** `code` do envelope de erro, só quando o corpo é objeto com `code` string. */
function errorCode(error: HttpErrorResponse): string | null {
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const code = (body as Record<string, unknown>)['code'];
  return typeof code === 'string' ? code : null;
}

/** RN-17: classifica o erro de `POST`/`PUT /purchases`. */
export function classifySaveError(error: unknown, mode: 'create' | 'edit'): SaveFailure {
  if (!(error instanceof HttpErrorResponse) || error.status !== 404) {
    return 'other';
  }
  switch (errorCode(error)) {
    case 'CATEGORY_NOT_FOUND':
      return 'category-gone';
    case 'PAYMENT_METHOD_NOT_FOUND':
      return 'payment-gone';
    case 'NOT_FOUND':
      return mode === 'edit' ? 'purchase-gone' : 'unknown-404';
    default:
      return 'unknown-404';
  }
}

/** RN-16: o erro do GET /purchases/{id} manda voltar com "Lançamento não encontrado."? */
export function isPurchaseNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
}
