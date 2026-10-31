import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, withRouterConfig } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { SessionSync } from './core/auth/session-sync';
import { API_BASE_URL } from './core/http/api-base-url';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ADR-08 (003): um voltar cancelado pelo guard de alterações não salvas não estraga o histórico.
    provideRouter(routes, withRouterConfig({ canceledNavigationResolution: 'computed' })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    provideAppInitializer(() => inject(SessionSync).start()),
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
