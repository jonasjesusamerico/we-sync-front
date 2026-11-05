import { IconName } from '../../shared/ui/icon/icons';
import { NAV_GROUPS, NAV_LABELS, NAV_SHORT_LABELS } from './shell.messages';

export type NavGroup = (typeof NAV_GROUPS)[keyof typeof NAV_GROUPS];

export interface NavItem {
  key: string;
  group: NavGroup;
  label: string;
  shortLabel?: string;
  icon: IconName;
  route?: string;
  soon: boolean;
}

/**
 * Menu of RF-03. Início, Compras (feature 005) and Configurações (feature 006) navigate; the others are "em breve"
 * (RN-16).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'inicio',
    group: NAV_GROUPS.menu,
    label: NAV_LABELS.inicio,
    shortLabel: NAV_SHORT_LABELS.inicio,
    icon: 'home',
    route: '/inicio',
    soon: false,
  },
  {
    key: 'compras',
    group: NAV_GROUPS.menu,
    label: NAV_LABELS.compras,
    shortLabel: NAV_SHORT_LABELS.compras,
    icon: 'receipt',
    route: '/compras',
    soon: false,
  },
  {
    key: 'casa',
    group: NAV_GROUPS.menu,
    label: NAV_LABELS.casa,
    shortLabel: NAV_SHORT_LABELS.casa,
    icon: 'users',
    soon: true,
  },
  {
    key: 'metas',
    group: NAV_GROUPS.planning,
    label: NAV_LABELS.metas,
    icon: 'target',
    soon: true,
  },
  {
    key: 'investimentos',
    group: NAV_GROUPS.planning,
    label: NAV_LABELS.investimentos,
    icon: 'trendUp',
    soon: true,
  },
  {
    key: 'configuracoes',
    group: NAV_GROUPS.admin,
    label: NAV_LABELS.configuracoes,
    shortLabel: NAV_SHORT_LABELS.configuracoes,
    icon: 'sliders',
    route: '/configuracoes',
    soon: false,
  },
];

export const NAV_GROUP_ORDER: readonly NavGroup[] = [
  NAV_GROUPS.menu,
  NAV_GROUPS.planning,
  NAV_GROUPS.admin,
];

/** Items of the bottom navigation (RF-04); the "+" button sits between compras and casa. */
export const BOTTOM_NAV_KEYS = ['inicio', 'compras', 'casa', 'configuracoes'] as const;
