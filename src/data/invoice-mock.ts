import type { Card, Invoice, Transaction } from './types';

/**
 * Fatura de exemplo para visualizar a tela de detalhe sem depender da API.
 * Abra em /fatura/mock (atalho só em __DEV__ na aba Faturas da Home).
 */
export const MOCK_INVOICE_ID = 'mock';

export const mockCard: Card = {
  id: -1,
  accountId: -1,
  nickname: 'Nubank Roxinho',
  kind: 'credito',
  limit: 5000,
  closingDay: 3,
  dueDay: 10,
  active: true,
};

export const mockInvoice: Invoice = {
  id: -1,
  cardId: mockCard.id,
  monthReference: '2026-11-01',
  status: 'aberta',
  closingDate: '2026-12-03',
  dueDate: '2026-12-10',
  total: 1569.77,
  paid: 0,
  remaining: 1569.77,
};

export const mockCategoryNames: Record<number, string> = {
  [-1]: 'Alimentação',
  [-2]: 'Transporte',
  [-3]: 'Assinaturas',
  [-4]: 'Compras',
  [-5]: 'Saúde',
  [-6]: 'Lazer',
};

const base = {
  cardId: mockCard.id,
  kind: 'expense',
  paymentMethod: 'cartao_credito',
  recorrent: false,
  invoiceId: mockInvoice.id,
  source: 'manual',
} as const;

export const mockInvoiceTransactions: Transaction[] = [
  { ...base, id: -101, description: 'iFood', categoryId: -1, amount: 68.9, date: '2026-11-04', parcels: 1 },
  { ...base, id: -102, description: 'Uber', categoryId: -2, amount: 23.45, date: '2026-11-05', parcels: 1 },
  { ...base, id: -103, description: 'Netflix', categoryId: -3, amount: 44.9, date: '2026-11-06', parcels: 1, recorrent: true },
  { ...base, id: -104, description: 'Mercado Pão de Açúcar', categoryId: -1, amount: 412.37, date: '2026-11-07', parcels: 1 },
  { ...base, id: -105, description: 'Notebook Dell (3/10)', categoryId: -4, amount: 389.9, date: '2026-11-08', parcels: 10 },
  { ...base, id: -106, description: 'Drogasil', categoryId: -5, amount: 87.6, date: '2026-11-08', parcels: 1 },
  { ...base, id: -107, description: 'Spotify', categoryId: -3, amount: 21.9, date: '2026-11-09', parcels: 1, recorrent: true },
  { ...base, id: -108, description: 'Cinema Cinemark', categoryId: -6, amount: 96.0, date: '2026-11-09', parcels: 1 },
  { ...base, id: -109, description: 'Tênis Nike (2/4)', categoryId: -4, amount: 174.75, date: '2026-11-09', parcels: 4 },
  { ...base, id: -110, description: 'Posto Shell', categoryId: -2, amount: 250.0, date: '2026-11-09', parcels: 1 },
];
