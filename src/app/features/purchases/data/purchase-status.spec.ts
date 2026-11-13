import { STATUS_LABELS, statusPillKind } from './purchase-status';

describe('purchase-status', () => {
  it.each([
    ['PAID', 'Paga', 'paid'],
    ['PENDING', 'Pendente', 'pending'],
    ['CANCELED', 'Cancelada', 'canceled'],
  ] as const)('rótulos e tipos da pílula: %s', (status, label, kind) => {
    expect(STATUS_LABELS[status]).toBe(label);
    expect(statusPillKind(status)).toBe(kind);
  });
});
