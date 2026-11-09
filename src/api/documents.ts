import type { OcrDraft, OcrItem, OcrReviewReason } from '@/data/types';
import { api } from './client';
import { StatusOCR } from './enums';
import { centsToReais, reaisToCents } from './money';

type ItemDto = {
  code: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  unitPriceCents: number;
  totalCents: number;
};

type DocumentItemDto = ItemDto & { id: number; lineNumber: number };

type DocumentResultDto = {
  id: number;
  transactionId?: number | null;
  status: number;
  needsManualReview: boolean;
  reviewReasons: OcrReviewReason[] | null;
  items: DocumentItemDto[] | null;
  suggestion: {
    description: string | null;
    categoryId: number | null;
    categoryRequiresConfirmation: boolean | null;
    paymentValueCents: number | null;
    transactionDate: string | null;
    items: (ItemDto & { lineNumber: number })[] | null;
    itemsTotalCents: number | null;
    itemsTotalDivergence: boolean | null;
  } | null;
};

export type DocumentStatus = 'pendente' | 'processado' | 'erro';

export type DocumentState = {
  id: number;
  status: DocumentStatus;
  draft?: OcrDraft;
};

function toItem(dto: ItemDto, suggestedItemId?: number): OcrItem {
  return {
    suggestedItemId,
    code: dto.code ?? undefined,
    description: dto.description,
    quantity: dto.quantity,
    unit: dto.unit ?? undefined,
    unitPrice: centsToReais(dto.unitPriceCents),
    total: centsToReais(dto.totalCents),
  };
}

function toDocumentState(dto: DocumentResultDto): DocumentState {
  const suggestion = dto.suggestion;
  const items = dto.items?.length
    ? [...dto.items].sort((a, b) => a.lineNumber - b.lineNumber).map((item) => toItem(item, item.id))
    : (suggestion?.items ?? []).map((item) => toItem(item));

  return {
    id: dto.id,
    status: StatusOCR.fromWire(dto.status),
    draft: suggestion
      ? {
        description: suggestion.description ?? '',
        categoryId: suggestion.categoryRequiresConfirmation ? undefined : (suggestion.categoryId ?? undefined),
        categoryRequiresConfirmation: suggestion.categoryRequiresConfirmation ?? suggestion.categoryId == null,
        amount: suggestion.paymentValueCents != null ? centsToReais(suggestion.paymentValueCents) : 0,
        date: suggestion.transactionDate ?? new Date().toISOString().slice(0, 10),
        confidence: dto.needsManualReview ? 0.5 : 0.9,
        reviewReasons: dto.reviewReasons ?? [],
        items,
        itemsTotal: suggestion.itemsTotalCents != null ? centsToReais(suggestion.itemsTotalCents) : undefined,
      }
      : undefined,
  };
}

export function toConfirmedItemsPayload(items: OcrItem[]) {
  return items.map((item) => ({
    suggestedItemId: item.suggestedItemId ?? null,
    code: item.code ?? null,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit ?? null,
    unitPriceCents: reaisToCents(item.unitPrice),
    totalCents: reaisToCents(item.total),
  }));
}

export type UploadableFile = Blob;

export async function uploadDocument(file: UploadableFile): Promise<number> {
  const formData = new FormData();
  formData.append('file', file, 'name' in file && file.name ? undefined : 'comprovante.jpg');
  const result = await api.postForm<{ id: number }>('/api/Documents/upload', formData);
  return result.id;
}

export async function getDocument(id: number): Promise<DocumentState> {
  return toDocumentState(await api.get<DocumentResultDto>(`/api/Documents/${id}`));
}

export async function confirmDocument(id: number, confirmedManually: boolean): Promise<void> {
  await api.patch(`/api/Documents/${id}/confirm`, confirmedManually);
}

export async function getTransactionOcrItems(userId: number, transactionId: number): Promise<OcrItem[]> {
  const documents = await api.get<DocumentResultDto[]>(`/api/Documents/user/${userId}`);
  const document = documents.find((d) => d.transactionId === transactionId);
  if (!document?.items?.length) return [];
  return [...document.items].sort((a, b) => a.lineNumber - b.lineNumber).map((item) => toItem(item, item.id));
}
