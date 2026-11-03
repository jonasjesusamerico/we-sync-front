import { InjectionToken } from '@angular/core';

/** Base URL of the API (`environment.apiBaseUrl`), without the trailing slash. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
