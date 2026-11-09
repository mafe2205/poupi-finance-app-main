import type { Card } from '@/data/types';
import { api } from './client';
import { CardsType } from './enums';
import { centsToReais, reaisToCents } from './money';

type CardResultDto = {
  id: number;
  bankAccountId: number;
  name: string;
  type: number;
  limitValueCents: number;
  closingDate: number;
  dueDate: number;
  active: boolean;
};

function toCard(dto: CardResultDto): Card {
  return {
    id: dto.id,
    accountId: dto.bankAccountId,
    nickname: dto.name,
    kind: CardsType.fromWire(dto.type),
    limit: centsToReais(dto.limitValueCents),
    closingDay: dto.closingDate,
    dueDay: dto.dueDate,
    active: dto.active ?? true,
  };
}

export async function listInactiveCards(userId: number): Promise<Card[]> {
  const dtos = await api.get<CardResultDto[]>(`/api/Cards/user/${userId}/inactive`);
  return dtos.map(toCard);
}

export async function reactivateCard(id: number): Promise<Card> {
  return toCard(await api.patch<CardResultDto>(`/api/Cards/${id}/reactivate`));
}

export async function listCardsByAccount(accountId: number): Promise<Card[]> {
  const dtos = await api.get<CardResultDto[]>(`/api/Cards/bank-account/${accountId}`);
  return dtos.map(toCard);
}

export type CreateCardInput = {
  accountId: number;
  nickname: string;
  kind: 'credito' | 'debito';
  limit: number;
  closingDay: number;
  dueDay: number;
};

export async function createCard(input: CreateCardInput): Promise<Card> {
  const dto = await api.post<CardResultDto>('/api/Cards', {
    bankAccountId: input.accountId,
    name: input.nickname,
    type: CardsType.toWire(input.kind),
    limitValueCents: reaisToCents(input.limit),
    closingDate: input.closingDay,
    dueDate: input.dueDay,
    createdAt: new Date().toISOString(),
  });
  return toCard(dto);
}

export async function updateCard(id: number, input: CreateCardInput): Promise<Card> {
  const dto = await api.put<CardResultDto>('/api/Cards', {
    id,
    name: input.nickname,
    type: CardsType.toWire(input.kind),
    limitValueCents: reaisToCents(input.limit),
    closingDate: input.closingDay,
    dueDate: input.dueDay,
    updatedAt: new Date().toISOString(),
  });
  return toCard(dto);
}

export async function deleteCard(id: number): Promise<Card> {
  return toCard(await api.delete<CardResultDto>(`/api/Cards/${id}`));
}
