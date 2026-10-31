import { Routes } from '@angular/router';

import { unsavedChangesGuard } from './form/unsaved-changes.guard';

export type PurchaseFormMode = 'create' | 'edit';

const loadForm = () => import('./form/purchase-form.page').then((m) => m.PurchaseFormPage);

/** Rotas de `/lancamentos`. */
export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    title: 'Lançamentos · we-sync',
    loadComponent: () => import('./list/purchase-list.page').then((m) => m.PurchaseListPage),
  },
  // `novo` antes de `:id`.
  {
    path: 'novo',
    title: 'Novo lançamento · we-sync',
    data: { mode: 'create' satisfies PurchaseFormMode },
    canDeactivate: [unsavedChangesGuard],
    loadComponent: loadForm,
  },
  {
    path: ':id',
    title: 'Editar lançamento · we-sync',
    data: { mode: 'edit' satisfies PurchaseFormMode },
    canDeactivate: [unsavedChangesGuard],
    loadComponent: loadForm,
  },
];
