import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Routes } from '@angular/router';

import { BR_DATE_FORMATS, BrDateAdapter } from './br-date-adapter';
import { unsavedChangesGuard } from './form/unsaved-changes.guard';
import { PtBrDatepickerIntl } from './pt-br-datepicker-intl';
import { PtBrPaginatorIntl } from './pt-br-paginator-intl';

export type PurchaseFormMode = 'create' | 'edit';

const loadForm = () => import('./form/purchase-form.page').then((m) => m.PurchaseFormPage);

/** Rotas de `/lancamentos`. Os adapters e textos do Material em pt-BR valem só aqui (ADR-06, ADR-09). */
export const PURCHASE_ROUTES: Routes = [
  {
    path: '',
    providers: [
      { provide: DateAdapter, useClass: BrDateAdapter },
      { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
      { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
      { provide: MatPaginatorIntl, useClass: PtBrPaginatorIntl },
      { provide: MatDatepickerIntl, useClass: PtBrDatepickerIntl },
    ],
    children: [
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
    ],
  },
];
