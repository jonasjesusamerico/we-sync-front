import { InjectionToken } from '@angular/core';

/** URL base da API (`environment.apiBaseUrl`), sem barra no fim. Ex.: `/api/v1`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
