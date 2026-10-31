import { isCurrentMonth, ListQuery } from '../list-query';
import { apiToCents, centsToApi, formatBrl, parseBrl } from '../money';
import {
  formatApiDate,
  formatMonthLabel,
  fromLocalDate,
  parseApiDate,
  PlainDate,
  todayPlain,
  toLocalDate,
} from '../plain-date';
import { MSG_SAVED, savedInMonthMessage } from '../purchase.messages';
import { Purchase, PurchaseRequest, PurchaseStatus } from '../purchase.models';

/** Valor do formulário de lançamento (o `getRawValue()` do `FormGroup`). */
export interface PurchaseFormValue {
  date: Date | null;
  description: string;
  amount: string;
  categoryId: number | null;
  paymentMethodId: number | null;
  status: PurchaseStatus;
}

/** RN-03: hoje, se a lista de origem é do mês atual (ou não há origem); senão, o dia 1 do mês da lista. */
export function initialDate(origin: ListQuery | null, now: Date): PlainDate {
  if (!origin || isCurrentMonth(origin, now)) {
    return todayPlain(now);
  }
  return { year: origin.year, month: origin.month, day: 1 };
}

/** RF-21: valores iniciais do novo lançamento. */
export function emptyFormValue(origin: ListQuery | null, now: Date): PurchaseFormValue {
  return {
    date: toLocalDate(initialDate(origin, now)),
    description: '',
    amount: '',
    categoryId: null,
    paymentMethodId: null,
    status: 'PAID',
  };
}

/** RF-23: o formulário a partir do lançamento carregado. */
export function fromPurchase(p: Purchase): PurchaseFormValue {
  const date = parseApiDate(p.purchase_date);
  return {
    date: date ? toLocalDate(date) : null,
    description: p.description,
    amount: formatBrl(apiToCents(p.amount)),
    categoryId: p.category.id,
    paymentMethodId: p.payment_method.id,
    status: p.status,
  };
}

/** Corpo do `POST`/`PUT`. Só com o formulário válido (data, valor e opções preenchidos). */
export function toRequest(v: PurchaseFormValue): PurchaseRequest {
  return {
    purchase_date: formatApiDate(fromLocalDate(v.date!)),
    description: v.description.trim(),
    category_id: v.categoryId!,
    payment_method_id: v.paymentMethodId!,
    amount: centsToApi(parseBrl(v.amount)!),
    status: v.status,
  };
}

const isValidDate = (d: Date | null): d is Date => d instanceof Date && !isNaN(d.getTime());

/**
 * ADR-08: "fotografia" do formulário para saber se algo mudou. Espaços nas pontas e o formato do valor não contam
 * (`10` e `10,00` são o mesmo valor).
 */
export function snapshotOf(v: PurchaseFormValue): string {
  return JSON.stringify({
    date: isValidDate(v.date) ? formatApiDate(fromLocalDate(v.date)) : null,
    description: v.description.trim(),
    amount: parseBrl(v.amount) ?? v.amount.trim(),
    categoryId: v.categoryId,
    paymentMethodId: v.paymentMethodId,
    status: v.status,
  });
}

/** RN-06: aviso depois de salvar. O mês vem da data salva (resposta da API). */
export function savedMessage(
  savedApiDate: string,
  listMonth: Pick<ListQuery, 'year' | 'month'>,
): string {
  const saved = parseApiDate(savedApiDate);
  if (!saved || (saved.year === listMonth.year && saved.month === listMonth.month)) {
    return MSG_SAVED;
  }
  return savedInMonthMessage(formatMonthLabel(saved.year, saved.month));
}
