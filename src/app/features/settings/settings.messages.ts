// Texts of the Settings page (feature 006). No Angular imports: the e2e re-exports this file.
import type { CatalogColor, CatalogIcon, CatalogKind } from '../../core/catalog/catalog.models';

export { MSG_CONNECTION, MSG_INVALID_DATA, MSG_SERVER } from '../../core/http/error-messages';

export const TITLE_SETTINGS = 'Configurações · we-sync';

export const SETTINGS_HEADING = 'Configurações';
export const SETTINGS_SUBTITLE = 'Cadastre suas rendas e ajuste o we-sync do seu jeito.';

export const LABEL_SECTIONS = 'Seções das configurações';
export const SECTION_LABELS = {
  rendas: 'Rendas',
  orcamento: 'Orçamento',
  categorias: 'Categorias',
  pagamentos: 'Formas de pagamento',
  conta: 'Conta',
} as const;

// Account: profile (RF-04). The name errors are the same as the register page's (D-01).
export const PROFILE_TITLE = 'Perfil';
export const LABEL_NAME = 'Nome';
export const LABEL_EMAIL = 'E-mail';
export const EMAIL_HINT = 'A troca de e-mail chega em breve.';
export const SAVE_PROFILE = 'Salvar perfil';
export const TOAST_PROFILE_SAVED = 'Perfil atualizado';
export const ERR_NAME_REQUIRED = 'Informe seu nome.';
export const ERR_NAME_LENGTH = 'O nome deve ter de 2 a 60 caracteres.';
export const MSG_PROFILE_UNAVAILABLE = 'Não foi possível carregar seus dados.';

// Account: password (RF-05).
export const PASSWORD_TITLE = 'Trocar senha';
export const LABEL_CURRENT_PASSWORD = 'Senha atual';
export const LABEL_NEW_PASSWORD = 'Nova senha';
export const PASSWORD_NOTE =
  'Ao trocar, os outros aparelhos saem da sua conta. Este continua conectado.';
export const TOAST_PASSWORD_CHANGED = 'Senha alterada';
export const ERR_CURRENT_REQUIRED = 'Informe a senha atual.';
export const ERR_NEW_SHORT = 'Use pelo menos 8 caracteres.';
export const ERR_NEW_LONG = 'A senha é longa demais. Use menos caracteres.';
export const ERR_NEW_SAME = 'A nova senha deve ser diferente da atual.';
export const ERR_CURRENT_WRONG = 'Senha atual incorreta.';

// Account: preferences (RF-06).
export const PREFERENCES_TITLE = 'Preferências';
export const LABEL_THEME = 'Tema';
export const THEME_HINT = 'Fica salvo na sua conta e vale em todos os aparelhos.';
export const THEME_LIGHT = 'Claro';
export const THEME_DARK = 'Escuro';

// Account: delete (RF-07, RN-09).
export const DELETE_TITLE = 'Excluir conta';
export const DELETE_TEXT = 'Apaga sua conta e todos os seus lançamentos. Não dá para desfazer.';
export const DELETE_OPEN = 'Excluir minha conta';
export const DELETE_DIALOG_TITLE = 'Excluir sua conta?';
export const DELETE_DIALOG_TEXT = 'Todos os seus lançamentos serão apagados. Não dá para desfazer.';
export const LABEL_YOUR_PASSWORD = 'Sua senha';
export const DELETE_CONFIRM = 'Excluir conta';
export const ERR_PASSWORD_REQUIRED = 'Informe sua senha.';
export const ERR_PASSWORD_WRONG = 'Senha incorreta.';

// Categories and payment methods (RF-08 to RF-13, ADR-17).
export const ICON_LABELS: Record<CatalogIcon, string> = {
  TAG: 'etiqueta',
  HEART: 'coração',
  SMILE: 'sorriso',
  BOOK: 'livro',
  CAR: 'carro',
  HOUSE: 'casa',
  FOOD: 'comida',
  CARD: 'cartão',
  GIFT: 'presente',
  SPARKLE: 'brilho',
};
export const iconLabel = (icon: CatalogIcon): string => `Ícone ${ICON_LABELS[icon]}`;

/** Named by the token color (ADR-17). */
export const COLOR_LABELS: Record<CatalogColor, string> = {
  FOOD: 'azul',
  TRANSPORT: 'verde-água',
  HOME: 'roxo',
  HEALTH: 'rosa',
  EDUCATION: 'laranja',
  LEISURE: 'verde',
};
export const colorLabel = (color: CatalogColor): string => `Cor ${COLOR_LABELS[color]}`;

export const LABEL_ICON = 'Ícone';
export const LABEL_COLOR = 'Cor';
export const TAG_OWN = 'sua';
export const TAG_DEFAULT = 'padrão';
export const REACTIVATE = 'Reativar';
export const SAVE = 'Salvar';
export const CANCEL = 'Cancelar';
export const LABEL_CLOSE = 'Fechar';
export const ARCHIVE = 'Arquivar';
export const ERR_CATALOG_NAME_REQUIRED = 'Informe o nome.';
export const ERR_CATALOG_NAME_MAX = 'Use no máximo 40 caracteres.';
export const archivedSummary = (n: number): string => `Arquivadas (${n})`;
export const editLabel = (name: string): string => `Editar ${name}`;
export const archiveLabel = (name: string): string => `Arquivar ${name}`;
export const reactivateLabel = (name: string): string => `Reativar ${name}`;

export interface CatalogTexts {
  newTitle: string;
  newSubtitle: string;
  placeholder: string;
  /** null on payment methods, as in the prototype. */
  hint: string | null;
  submit: string;
  listTitle: string;
  editTitle: string;
  archiveTitle: string;
  archiveText: (name: string) => string;
  toastAdded: string;
  toastReactivated: string;
  toastUpdated: string;
  toastArchived: string;
  toastGone: string;
  errDefaultName: string;
  errOwnName: string;
  errArchivedName: string;
}

export const CATALOG_TEXTS: Record<CatalogKind, CatalogTexts> = {
  category: {
    newTitle: 'Nova categoria',
    newSubtitle: 'As categorias padrão valem para todos. As suas aparecem só para você.',
    placeholder: 'Ex.: Pets',
    hint: 'Se já existir uma arquivada com esse nome, ela volta.',
    submit: 'Adicionar categoria',
    listTitle: 'Suas categorias',
    editTitle: 'Editar categoria',
    archiveTitle: 'Arquivar categoria?',
    archiveText: (name) =>
      `As compras de "${name}" continuam salvas. Você pode reativá-la em Arquivadas.`,
    toastAdded: 'Categoria adicionada',
    toastReactivated: 'Categoria reativada',
    toastUpdated: 'Categoria atualizada',
    toastArchived: 'Categoria arquivada',
    toastGone: 'Esta categoria não existe mais.',
    errDefaultName: 'Já existe uma categoria padrão com esse nome.',
    errOwnName: 'Você já tem uma categoria com esse nome.',
    errArchivedName: 'Você tem uma categoria arquivada com esse nome. Reative-a em Arquivadas.',
  },
  payment: {
    newTitle: 'Nova forma de pagamento',
    newSubtitle: 'Por exemplo, um cartão específico ou vale-refeição.',
    placeholder: 'Ex.: Vale-refeição',
    hint: null,
    submit: 'Adicionar',
    listTitle: 'Suas formas de pagamento',
    editTitle: 'Editar forma de pagamento',
    archiveTitle: 'Arquivar forma de pagamento?',
    archiveText: (name) =>
      `As compras feitas com "${name}" continuam salvas. Você pode reativá-la em Arquivadas.`,
    toastAdded: 'Forma de pagamento adicionada',
    toastReactivated: 'Forma de pagamento reativada',
    toastUpdated: 'Forma de pagamento atualizada',
    toastArchived: 'Forma de pagamento arquivada',
    toastGone: 'Esta forma de pagamento não existe mais.',
    errDefaultName: 'Já existe uma forma de pagamento padrão com esse nome.',
    errOwnName: 'Você já tem uma forma de pagamento com esse nome.',
    errArchivedName:
      'Você tem uma forma de pagamento arquivada com esse nome. Reative-a em Arquivadas.',
  },
};
