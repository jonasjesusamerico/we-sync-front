import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/navigation/unsaved-changes.guard';
import { TITLE_EDIT_PURCHASE, TITLE_NEW_PURCHASE, TITLE_PURCHASES } from './purchases.messages';

/** Children of /compras (ADR-04). The form warns before leaving with unsaved changes (ADR-12). */
export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    title: TITLE_PURCHASES,
    loadComponent: () => import('./list/purchases-page').then((m) => m.PurchasesPage),
  },
  {
    path: 'nova',
    title: TITLE_NEW_PURCHASE,
    data: { mode: 'create' },
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./form/purchase-form-page').then((m) => m.PurchaseFormPage),
  },
  {
    path: ':id',
    title: TITLE_EDIT_PURCHASE,
    data: { mode: 'edit' },
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./form/purchase-form-page').then((m) => m.PurchaseFormPage),
  },
];
