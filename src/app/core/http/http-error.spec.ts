import { HttpErrorResponse } from '@angular/common/http';
import { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from './error-messages';
import { classifyHttpError, genericErrorMessage, HttpErrorKind } from './http-error';

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
