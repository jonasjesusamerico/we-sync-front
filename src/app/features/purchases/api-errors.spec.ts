import { HttpErrorResponse } from '@angular/common/http';

import { RefreshError } from '../../core/auth/refresh-error';
import { classifySaveError, isPurchaseNotFound } from './api-errors';

const http = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });
const withCode = (status: number, code: string) => http(status, { code, message: 'x' });

describe('api-errors', () => {
  it('classifySaveError', () => {
    expect(classifySaveError(withCode(404, 'CATEGORY_NOT_FOUND'), 'create')).toBe('category-gone');
    expect(classifySaveError(withCode(404, 'CATEGORY_NOT_FOUND'), 'edit')).toBe('category-gone');
    expect(classifySaveError(withCode(404, 'PAYMENT_METHOD_NOT_FOUND'), 'create')).toBe(
      'payment-gone',
    );
    expect(classifySaveError(withCode(404, 'PAYMENT_METHOD_NOT_FOUND'), 'edit')).toBe(
      'payment-gone',
    );
    expect(classifySaveError(withCode(404, 'NOT_FOUND'), 'edit')).toBe('purchase-gone');
    expect(classifySaveError(withCode(404, 'NOT_FOUND'), 'create')).toBe('unknown-404');
    expect(classifySaveError(http(404), 'edit')).toBe('unknown-404');
    expect(classifySaveError(http(404, 'texto'), 'edit')).toBe('unknown-404');
    expect(classifySaveError(http(404, { message: 'x' }), 'edit')).toBe('unknown-404');
    expect(classifySaveError(withCode(422, 'VALIDATION_ERROR'), 'create')).toBe('other');
    expect(classifySaveError(withCode(500, 'INTERNAL_SERVER_ERROR'), 'create')).toBe('other');
    expect(classifySaveError(http(0), 'create')).toBe('other');
    expect(classifySaveError(new RefreshError('expired'), 'create')).toBe('other');
    expect(classifySaveError(new Error(), 'create')).toBe('other');
  });

  it('isPurchaseNotFound', () => {
    expect(isPurchaseNotFound(http(404))).toBe(true);
    expect(isPurchaseNotFound(http(400))).toBe(true);
    expect(isPurchaseNotFound(http(500))).toBe(false);
    expect(isPurchaseNotFound(http(0))).toBe(false);
  });
});
