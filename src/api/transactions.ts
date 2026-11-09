import type { OcrItem, RawTransaction } from '@/data/types';
import { api } from './client';
import { toConfirmedItemsPayload } from './documents';
import { GoalContributionDirection, PaymentMethod as PaymentMethodEnum } from './enums';
import { centsToReais, reaisToCents } from './money';

export type TransactionDto = {
  id: number;
  categoryId: number;
  metaId: number | null;
  metaDirection: number | null;
  cardId: number | null;
  bankAccountId: number | null;
  bankStatementId: number | null;
  description: string;
  paymentMethod: number;
  paymentParcels: number;
  paymentValueCents: number;
  descriptionOCR: string | null;
  recorrent: boolean;
  recorrentValue: number | null;
  recorrentSerialId: number | null;
  transactionDate: string;
  paymentDate: string | null;
};

export function toTransaction(dto: TransactionDto): RawTransaction {
  return {
    id: dto.id,
    accountId: dto.bankAccountId ?? undefined,
    cardId: dto.cardId ?? undefined,
    goalId: dto.metaId ?? undefined,
    metaDirection: dto.metaDirection != null ? GoalContributionDirection.fromWire(dto.metaDirection) : undefined,
    invoiceId: dto.bankStatementId ?? undefined,
    description: dto.description,
    categoryId: dto.categoryId,
    paymentMethod: PaymentMethodEnum.fromWire(dto.paymentMethod),
    amount: centsToReais(dto.paymentValueCents),
    date: dto.transactionDate,
    parcels: dto.paymentParcels,
    recorrent: dto.recorrent,
    recorrentMonths: dto.recorrentValue ?? undefined,
    recorrentSerialId: dto.recorrentSerialId ?? undefined,
    source: dto.descriptionOCR ? 'ocr' : 'manual',
  };
}

export type TransactionFilter = {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  cardId?: number;
  bankAccountId?: number;
  metaId?: number;
  page?: number;
  pageSize?: number;
};

function toQueryString(filter: TransactionFilter): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listTransactions(filter: TransactionFilter = {}): Promise<RawTransaction[]> {
  const dtos = await api.get<TransactionDto[]>(`/api/transactions${toQueryString(filter)}`);
  return dtos.map(toTransaction);
}

export async function getTransaction(id: number): Promise<RawTransaction> {
  return toTransaction(await api.get<TransactionDto>(`/api/transactions/${id}`));
}

export type CreateTransactionInput = {
  categoryId: number;
  goalId?: number;
  metaDirection?: 'deposito' | 'retirada';
  cardId?: number;
  accountId?: number;
  description: string;
  paymentMethod: RawTransaction['paymentMethod'];
  parcels?: number;
  amount: number;
  recorrent?: boolean;
  recorrentMonths?: number;
  date: string;
  paymentDate?: string;
  expiringDate?: string;
};

function createPayload(input: CreateTransactionInput) {
  return {
    categoryId: input.categoryId,
    metaId: input.goalId ?? null,
    metaDirection: input.metaDirection ? GoalContributionDirection.toWire(input.metaDirection) : null,
    cardId: input.cardId ?? null,
    bankAccountId: input.accountId ?? null,
    description: input.description,
    paymentMethod: PaymentMethodEnum.toWire(input.paymentMethod),
    paymentParcels: input.parcels ?? 1,
    paymentValueCents: reaisToCents(input.amount),
    recorrent: input.recorrent ?? false,
    recorrentValue: input.recorrent ? (input.recorrentMonths ?? 1) : null,
    transactionDate: input.date,
    paymentDate: input.paymentDate ?? null,
    expiringDate: input.expiringDate ?? null,
  };
}

export async function createTransaction(input: CreateTransactionInput): Promise<RawTransaction> {
  return toTransaction(await api.post<TransactionDto>('/api/transactions', createPayload(input)));
}

export async function updateTransaction(
  id: number,
  input: {
    description: string;
    categoryId: number;
    goalId?: number;
    metaDirection?: 'deposito' | 'retirada';
    amount: number;
    date: string;
    paymentDate?: string;
  }
): Promise<RawTransaction> {
  const dto = await api.put<TransactionDto>(`/api/transactions/${id}`, {
    description: input.description,
    categoryId: input.categoryId,
    metaId: input.goalId ?? null,
    metaDirection: input.metaDirection ? GoalContributionDirection.toWire(input.metaDirection) : null,
    paymentValueCents: reaisToCents(input.amount),
    transactionDate: input.date,
    paymentDate: input.paymentDate ?? null,
    updatedAt: new Date().toISOString(),
  });
  return toTransaction(dto);
}

export async function deleteTransaction(id: number): Promise<void> {
  await api.delete(`/api/transactions/${id}`);
}

export async function cancelRecurrentSeries(id: number): Promise<void> {
  await api.patch(`/api/transactions/${id}/cancel-series`);
}

export async function createTransactionFromDocument(
  documentId: number,
  input: CreateTransactionInput,
  items?: OcrItem[]
): Promise<RawTransaction> {
  const dto = await api.post<TransactionDto>(`/api/transactions/from-document/${documentId}`, {
    ...createPayload(input),
    items: items ? toConfirmedItemsPayload(items) : null,
  });
  return toTransaction(dto);
}
