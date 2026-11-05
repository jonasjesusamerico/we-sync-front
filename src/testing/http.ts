// Common providers of the unit tests that talk HTTP.
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider, provideZonelessChangeDetection } from '@angular/core';
import { API_BASE_URL } from '../app/core/http/api-base-url';

export const API = '/api/v1';

export function httpTestingProviders(
  interceptors: HttpInterceptorFn[] = [],
): (Provider | EnvironmentProviders)[] {
  return [
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors(interceptors)),
    provideHttpClientTesting(),
    { provide: API_BASE_URL, useValue: API },
  ];
}
