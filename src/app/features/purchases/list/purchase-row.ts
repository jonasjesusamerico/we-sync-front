import { formatCurrency } from '@angular/common';

import { apiToCents } from '../money';
import { displayApiDate } from '../plain-date';
import { STATUS_LABELS } from '../purchase.messages';
import { Purchase, PurchaseStatus } from '../purchase.models';

/** Linha da lista já formatada para exibição (tabela, itens e diálogo de exclusão usam os mesmos textos). */
export interface PurchaseRow {
  id: number;
  date: string;
  description: string;
  category: string;
  paymentMethod: string;
  amount: string;
  status: PurchaseStatus;
  statusLabel: string;
  canceled: boolean;
  source: Purchase;
}

/** `R$ 1.234,56` (o espaço depois de `R$` é U+00A0). A divisão por 100 é só para formatar (ADR-07). */
export function formatBrlCurrency(cents: number): string {
  return formatCurrency(cents / 100, 'pt-BR', 'R$', 'BRL', '1.2-2');
}

export function toPurchaseRow(p: Purchase): PurchaseRow {
  return {
    id: p.id,
    date: displayApiDate(p.purchase_date),
    description: p.description,
    category: p.category.name,
    paymentMethod: p.payment_method.name,
    amount: formatBrlCurrency(apiToCents(p.amount)),
    status: p.status,
    statusLabel: STATUS_LABELS[p.status],
    canceled: p.status === 'CANCELED',
    source: p,
  };
}

/** Cor do selo de status, como os `badge` da tabela do ArchitectUI. */
export const STATUS_BADGE_CLASS: Readonly<Record<PurchaseStatus, string>> = {
  PAID: 'bg-success',
  PENDING: 'bg-warning',
  CANCELED: 'bg-secondary',
};
