// Texts of the shared UI components (feature 004). No Angular imports: the e2e re-exports this file.
export const BRAND_NAME = 'we-sync';

export const LABEL_SHOW_PASSWORD = 'Mostrar senha';
export const LABEL_HIDE_PASSWORD = 'Ocultar senha';

export const STRENGTH_HINT_EMPTY = 'Use pelo menos 8 caracteres.';
export const STRENGTH_HINT_WEAK = 'Misture letras maiúsculas, números e símbolos.';
export const STRENGTH_HINT_STRONG = 'Senha forte.';

export const SOON_TITLE = 'Em breve';
export const SOON_TAG = 'em breve';
export const soonLabel = (label: string): string => `${label}, em breve`;

export const LABEL_USE_DARK_THEME = 'Usar tema escuro';
export const LABEL_USE_LIGHT_THEME = 'Usar tema claro';

// Paginator (feature 005, RF-15).
export const pagerInfo = (page: number, total: number): string => `Página ${page} de ${total}`;
export const LABEL_PREVIOUS_PAGE = 'Anterior';
export const LABEL_NEXT_PAGE = 'Próxima';

// Month switcher (RF-03).
export const LABEL_MONTH = 'Mês';
export const LABEL_PREVIOUS_MONTH = 'Mês anterior';
export const LABEL_NEXT_MONTH = 'Próximo mês';
export const LABEL_CURRENT_MONTH = 'Mês atual';

// Area states (RF-25, RN-26) and toast.
export const LABEL_LOADING = 'Carregando…';
export const LABEL_RETRY = 'Tentar novamente';
export const LABEL_CLOSE_TOAST = 'Fechar aviso';
