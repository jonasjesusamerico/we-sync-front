import { Routes } from '@angular/router';
import { TITLE_SETTINGS } from './settings.messages';

/**
 * Children of /configuracoes (ADR-12): one address per section; any other section (rendas, orcamento, …) goes to
 * Conta. No canDeactivate (RN-23).
 */
export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-page').then((m) => m.SettingsPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'conta' },
      {
        path: 'conta',
        title: TITLE_SETTINGS,
        loadComponent: () => import('./account/account-section').then((m) => m.AccountSection),
      },
      {
        path: 'categorias',
        title: TITLE_SETTINGS,
        data: { kind: 'category' },
        loadComponent: () => import('./catalog/catalog-section').then((m) => m.CatalogSection),
      },
      {
        path: 'formas-de-pagamento',
        title: TITLE_SETTINGS,
        data: { kind: 'payment' },
        loadComponent: () => import('./catalog/catalog-section').then((m) => m.CatalogSection),
      },
      { path: '**', redirectTo: 'conta' },
    ],
  },
];
