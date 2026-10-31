// Textos da feature 003 (lançamentos). Sem import do Angular: `e2e/support/texts.ts` reexporta este arquivo.
import type { PurchaseStatus } from './purchase.models';

export const LABEL_NEW_PURCHASE = 'Novo lançamento';
export const TITLE_EDIT_PURCHASE = 'Editar lançamento';

export const LABEL_PREVIOUS_MONTH = 'Mês anterior';
export const LABEL_NEXT_MONTH = 'Próximo mês';
export const LABEL_CURRENT_MONTH = 'Mês atual';
export const pickMonthLabel = (monthLabel: string) => `Escolher mês: ${monthLabel}`;

export const LABEL_FILTERS = 'Filtros';
export const LABEL_DATE = 'Data';
export const LABEL_DESCRIPTION = 'Descrição';
export const LABEL_AMOUNT = 'Valor';
export const LABEL_CATEGORY = 'Categoria';
export const LABEL_PAYMENT_METHOD = 'Forma de pagamento';
export const LABEL_STATUS = 'Status';
export const LABEL_ALL_STATUSES = 'Todos';
export const LABEL_ALL_OPTIONS = 'Todas';
export const LABEL_CLEAR_FILTERS = 'Limpar filtros';

export const STATUS_LABELS: Readonly<Record<PurchaseStatus, string>> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

export const LABEL_ACTIONS = 'Ações';
export const LABEL_DELETE = 'Excluir';
export const deleteLabel = (description: string) => `Excluir ${description}`;

export const emptyMonthMessage = (monthLabel: string) => `Nenhum lançamento em ${monthLabel}.`;
export const MSG_EMPTY_FILTERED = 'Nenhum lançamento encontrado com esses filtros.';
export const LABEL_RETRY = 'Tentar novamente';
export const LABEL_LOADING = 'Carregando';

export const rangeLabel = (start: number, end: number, total: number) =>
  `${start}–${end} de ${total}`;
export const LABEL_NEXT_PAGE = 'Próxima página';
export const LABEL_PREVIOUS_PAGE = 'Página anterior';
export const LABEL_PAGINATION = 'Paginação';

export const DATE_HINT = 'dd/mm/aaaa';

export const LABEL_SAVE = 'Salvar';
export const LABEL_SAVE_AND_NEW = 'Salvar e criar outro';
export const LABEL_CANCEL = 'Cancelar';

export const DELETE_DIALOG_TITLE = 'Excluir lançamento?';
export const DELETE_DIALOG_WARNING = 'Esta ação não pode ser desfeita.';
export const DISCARD_DIALOG_TITLE = 'Descartar alterações?';
export const LABEL_KEEP_EDITING = 'Continuar editando';
export const LABEL_DISCARD = 'Descartar';

// RN-01
export const MSG_DATE_REQUIRED = 'Informe a data.';
export const MSG_DATE_INVALID = 'Data inválida.';
export const MSG_DESCRIPTION_REQUIRED = 'Informe a descrição.';
export const MSG_DESCRIPTION_MAX = 'Use no máximo 255 caracteres.';
export const MSG_AMOUNT_REQUIRED = 'Informe o valor.';
export const MSG_AMOUNT_POSITIVE = 'O valor deve ser maior que zero.';
export const MSG_AMOUNT_MAX = 'O valor máximo é R$ 99.999.999,99.';
export const MSG_CATEGORY_REQUIRED = 'Escolha a categoria.';
export const MSG_PAYMENT_METHOD_REQUIRED = 'Escolha a forma de pagamento.';

// RN-17
export const MSG_CATEGORY_GONE = 'A categoria escolhida não existe mais. Escolha outra.';
export const MSG_PAYMENT_METHOD_GONE =
  'A forma de pagamento escolhida não existe mais. Escolha outra.';
export const MSG_PURCHASE_GONE = 'Este lançamento não existe mais.';

// Avisos (toast)
export const MSG_SAVED = 'Lançamento salvo.';
export const savedInMonthMessage = (monthLabel: string) => `Lançamento salvo em ${monthLabel}.`;
export const MSG_DELETED = 'Lançamento excluído.';
export const MSG_NOT_FOUND = 'Lançamento não encontrado.';

/** Textos do calendário (campo de data e seletor de mês). */
export const CALENDAR_LABELS = {
  open: 'Abrir calendário',
  calendar: 'Calendário',
  previous: { days: 'Mês anterior', months: 'Ano anterior', years: '24 anos anteriores' },
  next: { days: 'Próximo mês', months: 'Próximo ano', years: 'Próximos 24 anos' },
} as const;

/** Título da grade de anos do calendário (`2016 a 2039`). */
export const yearRangeLabel = (start: string, end: string) => `${start} a ${end}`;
