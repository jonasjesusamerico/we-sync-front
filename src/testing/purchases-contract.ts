// Exemplos do `2-contrato.md` da feature 003, para os testes unitários.
import type {
  Option,
  Purchase,
  PurchasePage,
  PurchaseRequest,
} from '../app/features/purchases/purchase.models';

export const CONTRACT_PURCHASE: Purchase = {
  id: 42,
  user_id: 7,
  purchase_date: '2026-10-05',
  description: 'Mercado',
  category: { id: 1, name: 'Alimentação', is_global: true },
  payment_method: { id: 4, name: 'Pix', is_global: true },
  amount: '1234.56',
  status: 'PAID',
  created_at: '2026-10-05T13:20:11.123456Z',
  updated_at: '2026-10-05T13:20:11.123456Z',
};

export const CONTRACT_REQUEST: PurchaseRequest = {
  purchase_date: '2026-10-05',
  description: 'Mercado',
  category_id: 1,
  payment_method_id: 4,
  amount: '1234.56',
  status: 'PAID',
};

export const CONTRACT_PAGE: PurchasePage = {
  items: [
    {
      ...CONTRACT_PURCHASE,
      purchase_date: '2026-09-30',
      amount: '89.9',
      status: 'PENDING',
      created_at: '2026-09-30T10:00:00Z',
      updated_at: '2026-09-30T10:00:00Z',
    },
  ],
  total: 47,
  page: 2,
  page_size: 20,
  total_pages: 3,
};

const option = (id: number, name: string, is_global = true): Option => ({ id, name, is_global });

/** As seis categorias globais, na ordem da API (globais primeiro, por nome). */
export const GLOBAL_CATEGORIES: Option[] = [
  option(1, 'Alimentação'),
  option(5, 'Educação'),
  option(6, 'Lazer'),
  option(3, 'Moradia'),
  option(4, 'Saúde'),
  option(2, 'Transporte'),
];

export const GLOBAL_PAYMENT_METHODS: Option[] = [
  option(2, 'Cartão de crédito'),
  option(3, 'Cartão de débito'),
  option(1, 'Dinheiro'),
  option(4, 'Pix'),
  option(5, 'Transferência bancária'),
  option(6, 'Boleto'),
];

export const PERSONAL_CATEGORIES: Option[] = [
  option(31, 'Academia', false),
  option(32, 'Pets', false),
];

/** Item da lista a partir do exemplo do contrato. */
export function purchase(patch: Partial<Purchase> = {}): Purchase {
  return { ...CONTRACT_PURCHASE, ...patch };
}

export function page(items: Purchase[], patch: Partial<PurchasePage> = {}): PurchasePage {
  const total = patch.total ?? items.length;
  return {
    items,
    total,
    page: 1,
    page_size: 20,
    total_pages: Math.ceil(total / 20),
    ...patch,
  };
}

export const http404 = (code: string) => ({
  body: { code, message: 'not found' },
  opts: { status: 404, statusText: 'Not Found' },
});
