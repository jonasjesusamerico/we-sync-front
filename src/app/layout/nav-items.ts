import type { IsActiveMatchOptions } from '@angular/router';

import { LABEL_HOME, LABEL_PURCHASES } from './layout.messages';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Quando o item fica ativo (`routerLinkActiveOptions`). */
  match: IsActiveMatchOptions;
}

const EXACT: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'ignored',
  matrixParams: 'ignored',
  fragment: 'ignored',
};

/** Itens do menu lateral. RN-02: um item só entra junto com a rota da tela dele. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: LABEL_HOME, icon: 'home', match: EXACT },
  // `subset`: ativo também em /lancamentos/novo e /lancamentos/:id (CA-01 da 003).
  {
    path: '/lancamentos',
    label: LABEL_PURCHASES,
    icon: 'receipt_long',
    match: { ...EXACT, paths: 'subset' },
  },
];
