// Texts of the purchases screens (feature 005). No Angular imports: the e2e re-exports this file.
import type { PurchaseStatus } from './data/purchase.models';

export const TITLE_PURCHASES = 'Compras · we-sync';
export const TITLE_NEW_PURCHASE = 'Nova compra · we-sync';
export const TITLE_EDIT_PURCHASE = 'Editar compra · we-sync';

// List
export const PURCHASES_HEADING = 'Compras';
/** RN-04: "11 compras · R$ 263,40 no total". */
export const purchasesSummary = (count: number, totalText: string): string =>
  `${count} ${count === 1 ? 'compra' : 'compras'} · ${totalText} no total`;

export const LABEL_FILTERS = 'Filtros';
export const LABEL_SEARCH = 'Buscar';
export const SEARCH_PLACEHOLDER = 'Descrição da compra';
export const LABEL_CATEGORY = 'Categoria';
export const LABEL_ALL = 'Todas';
export const LABEL_STATUS = 'Situação';
export const LABEL_CLEAR_FILTERS = 'Limpar filtros';

export const STATUS_LABELS: Readonly<Record<PurchaseStatus, string>> = {
  PAID: 'Paga',
  PENDING: 'Pendente',
  CANCELED: 'Cancelada',
};

export const LABEL_LIST = 'Lista de compras';
export const COLUMN_DESCRIPTION = 'Descrição';
export const COLUMN_DATE = 'Data';
export const COLUMN_PAYMENT = 'Pagamento';
export const COLUMN_STATUS = 'Situação';
export const COLUMN_AMOUNT = 'Valor';
export const COLUMN_ACTIONS = 'Ações';

export const editLabel = (description: string): string => `Editar ${description}`;
export const deleteLabel = (description: string): string => `Excluir ${description}`;

/** RF-17: "Nenhuma compra em setembro de 2026." */
export const emptyMonth = (monthLong: string): string => `Nenhuma compra em ${monthLong}.`;
export const EMPTY_FILTERED_TITLE = 'Nenhuma compra encontrada';
export const EMPTY_FILTERED_TEXT = 'Tente mudar os filtros ou o mês.';

// Form
export const BACK_TO_PURCHASES = 'Compras';
export const NEW_PURCHASE_HEADING = 'Nova compra';
export const NEW_PURCHASE_SUBTITLE = 'Registre o que você gastou. Leva menos de um minuto.';
export const EDIT_PURCHASE_HEADING = 'Editar compra';

export const LABEL_AMOUNT = 'Quanto foi?';
export const CURRENCY_SYMBOL = 'R$';
export const LABEL_DESCRIPTION = 'Descrição';
export const DESCRIPTION_PLACEHOLDER = 'Ex.: Supermercado';
export const LABEL_DATE = 'Data';
export const LABEL_PAYMENT = 'Forma de pagamento';

export const SUMMARY_HEADING = 'Resumo';
export const NO_DESCRIPTION = 'Sem descrição';
export const LABEL_VALUE = 'Valor';

export const SAVE_PURCHASE = 'Salvar compra';
export const SAVE_AND_NEW = 'Salvar e criar outra';
export const CANCEL = 'Cancelar';
export const SAVE_CHANGES = 'Salvar alterações';
export const DELETE = 'Excluir';

export const ERR_AMOUNT = 'Informe um valor maior que zero.';
export const ERR_DESCRIPTION_REQUIRED = 'Informe a descrição.';
export const ERR_DESCRIPTION_MAX = 'Use no máximo 120 caracteres.';
export const ERR_DATE = 'Informe a data.';
export const ERR_CATEGORY = 'Escolha uma categoria.';
export const ERR_PAYMENT = 'Escolha a forma de pagamento.';
export const ERR_CATEGORY_GONE = 'A categoria escolhida não existe mais. Escolha outra.';
export const ERR_PAYMENT_GONE = 'A forma de pagamento escolhida não existe mais. Escolha outra.';

// Toasts
export const TOAST_SAVED = 'Compra salva com sucesso';
/** RN-15: "Compra salva em setembro de 2026". */
export const toastSavedIn = (monthLong: string): string => `Compra salva em ${monthLong}`;
export const TOAST_DELETED = 'Compra excluída';
export const TOAST_NOT_FOUND = 'Compra não encontrada';
export const TOAST_GONE = 'Esta compra não existe mais';

// Delete confirmation
export const DELETE_TITLE = 'Excluir compra?';
export const DELETE_WARNING = 'Esta ação não pode ser desfeita.';
