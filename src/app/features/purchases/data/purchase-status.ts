// Status labels and pill kinds, shared by Compras and the home (D-03 of the 007 SDD). No Angular code at run time:
// the e2e re-exports the labels through purchases.messages.ts.
import type { StatusPillKind } from '../../../shared/ui/status-pill/status-pill';
import type { PurchaseStatus } from './purchase.models';

export const STATUS_LABELS: Readonly<Record<PurchaseStatus, string>> = {
  PAID: 'Paga',
  PENDING: 'Pendente',
  CANCELED: 'Cancelada',
};

const KIND: Readonly<Record<PurchaseStatus, StatusPillKind>> = {
  PAID: 'paid',
  PENDING: 'pending',
  CANCELED: 'canceled',
};

export function statusPillKind(status: PurchaseStatus): StatusPillKind {
  return KIND[status];
}
