import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { sanitizeReturnUrl } from './return-url';

describe('sanitizeReturnUrl', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    router = TestBed.inject(Router);
  });

  it.each([
    ['/inicio', '/inicio'],
    ['/inicio?x=1#a', '/inicio?x=1#a'],
    ['/', '/'],
  ])('returnUrl interno: %s', (raw, expected) => {
    expect(sanitizeReturnUrl(raw, router)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    ['/inicio'],
    'inicio',
    '//evil.example',
    '/\\evil.example',
    '/a\\b',
    'https://evil.example',
    'javascript:alert(1)',
    '/\t/evil.example',
  ])('returnUrl externo ou inválido: %j', (raw) => {
    expect(sanitizeReturnUrl(raw, router)).toBe('/inicio');
  });

  it.each(['/login', '/cadastro?returnUrl=%2Finicio'])('returnUrl para acesso: %s', (raw) => {
    expect(sanitizeReturnUrl(raw, router)).toBe('/inicio');
  });
});
