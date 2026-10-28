import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { sanitizeReturnUrl } from './return-url';

describe('sanitizeReturnUrl', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
  });

  it('returnUrl interno', () => {
    expect(sanitizeReturnUrl('/compras?mes=10', router)).toBe('/compras?mes=10');
  });

  it('returnUrl raiz', () => {
    expect(sanitizeReturnUrl('/', router)).toBe('/');
  });

  it('returnUrl vazio ou ausente', () => {
    expect(sanitizeReturnUrl(null, router)).toBe('/');
    expect(sanitizeReturnUrl(undefined, router)).toBe('/');
    expect(sanitizeReturnUrl('', router)).toBe('/');
  });

  it('returnUrl absoluto', () => {
    expect(sanitizeReturnUrl('https://evil.com', router)).toBe('/');
  });

  it('returnUrl protocolo relativo', () => {
    expect(sanitizeReturnUrl('//evil.com', router)).toBe('/');
  });

  it('returnUrl com barra invertida', () => {
    expect(sanitizeReturnUrl('/\\evil.com', router)).toBe('/');
    expect(sanitizeReturnUrl('/a\\b', router)).toBe('/');
  });

  it('returnUrl javascript:', () => {
    expect(sanitizeReturnUrl('javascript:alert(1)', router)).toBe('/');
  });

  it('returnUrl sem barra inicial', () => {
    expect(sanitizeReturnUrl('compras', router)).toBe('/');
  });

  it('returnUrl para login/cadastro', () => {
    expect(sanitizeReturnUrl('/login', router)).toBe('/');
    expect(sanitizeReturnUrl('/cadastro?x=1', router)).toBe('/');
  });
});
