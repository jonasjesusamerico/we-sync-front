import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import { RefreshError } from '../auth/refresh-error';
import {
  genericErrorMessage,
  MSG_CONNECTION,
  MSG_INVALID_DATA,
  MSG_SERVER,
} from './error-messages';

const http = (status: number) =>
  new HttpErrorResponse({ status, error: { code: 'X', message: 'mensagem da API' } });

describe('genericErrorMessage', () => {
  it('as constantes são os textos da interface', () => {
    expect(MSG_CONNECTION).toBe(
      'Não foi possível conectar. Verifique sua internet e tente novamente.',
    );
    expect(MSG_SERVER).toBe('Algo deu errado. Tente novamente em instantes.');
    expect(MSG_INVALID_DATA).toBe('Verifique os dados informados.');
  });

  it('RefreshError → null', () => {
    expect(genericErrorMessage(new RefreshError('expired'))).toBeNull();
    expect(genericErrorMessage(new RefreshError('logged-out'))).toBeNull();
  });

  it('TimeoutError do rxjs → conexão', () => {
    expect(genericErrorMessage(new TimeoutError())).toBe(MSG_CONNECTION);
  });

  it('DOMException TimeoutError ou AbortError → conexão', () => {
    expect(genericErrorMessage(new DOMException('t', 'TimeoutError'))).toBe(MSG_CONNECTION);
    expect(genericErrorMessage(new DOMException('a', 'AbortError'))).toBe(MSG_CONNECTION);
  });

  it('status 0 → conexão', () => {
    expect(genericErrorMessage(http(0))).toBe(MSG_CONNECTION);
  });

  it('400 ou 422 → dados inválidos', () => {
    expect(genericErrorMessage(http(400))).toBe(MSG_INVALID_DATA);
    expect(genericErrorMessage(http(422))).toBe(MSG_INVALID_DATA);
  });

  it('≥ 500 → servidor', () => {
    expect(genericErrorMessage(http(500))).toBe(MSG_SERVER);
    expect(genericErrorMessage(http(503))).toBe(MSG_SERVER);
  });

  it('qualquer outro → servidor', () => {
    expect(genericErrorMessage(http(401))).toBe(MSG_SERVER);
    expect(genericErrorMessage(http(409))).toBe(MSG_SERVER);
    expect(genericErrorMessage(http(404))).toBe(MSG_SERVER);
    expect(genericErrorMessage(new TypeError('x'))).toBe(MSG_SERVER);
    expect(genericErrorMessage(new DOMException('n', 'NotFoundError'))).toBe(MSG_SERVER);
  });
});
