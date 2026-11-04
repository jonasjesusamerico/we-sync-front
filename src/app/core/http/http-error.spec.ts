import { HttpErrorResponse } from '@angular/common/http';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from './error-messages';
import { ERROR_CATEGORY_NOT_FOUND } from '../../../testing/api-examples';
import { apiErrorCode, classifyHttpError, genericErrorMessage, HttpErrorKind } from './http-error';

describe('classifyHttpError', () => {
  it.each([
    [0, 'connection'],
    [401, 'unauthorized'],
    [409, 'conflict'],
    [400, 'invalid'],
    [422, 'invalid'],
    [404, 'server'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('status %i → %s', (status, kind) => {
    expect(classifyHttpError(new HttpErrorResponse({ status }))).toBe(kind);
  });

  it('treats an error that is not an HttpErrorResponse as server', () => {
    expect(classifyHttpError(new Error())).toBe('server');
  });
});

describe('genericErrorMessage', () => {
  it.each([
    ['connection', MSG_CONNECTION],
    ['unauthorized', MSG_SERVER],
    ['conflict', MSG_SERVER],
    ['invalid', MSG_INVALID_DATA],
    ['server', MSG_SERVER],
  ] as [HttpErrorKind, string][])('%s', (kind, message) => {
    expect(genericErrorMessage(kind)).toBe(message);
  });
});

describe('apiErrorCode', () => {
  it('lê o code do envelope', () => {
    const error = new HttpErrorResponse({ status: 404, error: ERROR_CATEGORY_NOT_FOUND });
    expect(apiErrorCode(error)).toBe('CATEGORY_NOT_FOUND');
  });

  it.each([
    ['corpo texto', new HttpErrorResponse({ status: 404, error: 'not found' })],
    ['corpo sem code', new HttpErrorResponse({ status: 500, error: { message: 'x' } })],
    ['code não string', new HttpErrorResponse({ status: 500, error: { code: 1 } })],
    ['sem corpo', new HttpErrorResponse({ status: 0 })],
    ['Error comum', new Error('x')],
  ])('%s → null', (_name, error) => {
    expect(apiErrorCode(error)).toBeNull();
  });
});
