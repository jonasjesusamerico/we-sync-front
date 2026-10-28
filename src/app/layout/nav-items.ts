import { LABEL_HOME } from './layout.messages';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

/** Itens do menu lateral. RN-02: um item só entra junto com a rota da tela dele. */
export const NAV_ITEMS: readonly NavItem[] = [{ path: '/', label: LABEL_HOME, icon: 'home' }];
