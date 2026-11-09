import type { Category } from '@/data/types';
import { api, ApiError } from './client';
import { CategoriesType } from './enums';
import { centsToReais, reaisToCents } from './money';

type CategoryResultDto = {
  id: number;
  userId: number;
  name: string;
  type: number;
  isDefault: boolean;
  limitValueCents: number | null;
};

function toCategory(dto: CategoryResultDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    kind: CategoriesType.fromWire(dto.type),
    limit: centsToReais(dto.limitValueCents ?? 0),
    isDefault: dto.isDefault,
  };
}

export async function listCategories(userId: number): Promise<Category[]> {
  const dtos = await api.get<CategoryResultDto[]>(`/api/Categories/user/${userId}`);
  return dtos.map(toCategory);
}

export type CategoryInput = {
  name: string;
  kind: 'income' | 'expense';
  limit?: number;
};

export async function createCategory(userId: number, input: CategoryInput): Promise<Category> {
  const dto = await api.post<CategoryResultDto>('/api/Categories', {
    userId,
    name: input.name,
    type: CategoriesType.toWire(input.kind),
    isDefault: false,
    limitValueCents: reaisToCents(input.limit ?? 0),
    createdAt: new Date().toISOString(),
  });
  return toCategory(dto);
}

export async function updateCategory(id: number, input: CategoryInput): Promise<void> {
  await api.put(`/api/Categories/${id}`, {
    id,
    name: input.name,
    limitValueCents: reaisToCents(input.limit ?? 0),
  });
}

export type CategorySuggestion = {
  categoryId?: number;
  requiresConfirmation: boolean;
  candidateCategoryIds: number[];
};

type CategoryClassificationResultDto = {
  categoryId: number | null;
  requiresConfirmation: boolean;
  reason: string;
  matchedTerm: string | null;
  candidateCategoryIds: number[] | null;
};

export async function suggestCategory(description: string): Promise<CategorySuggestion> {
  const dto = await api.get<CategoryClassificationResultDto>(
    `/api/Categories/suggest?description=${encodeURIComponent(description)}`
  );
  return {
    categoryId: !dto.requiresConfirmation && dto.categoryId != null ? dto.categoryId : undefined,
    requiresConfirmation: dto.requiresConfirmation,
    candidateCategoryIds: dto.candidateCategoryIds ?? [],
  };
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await api.delete(`/api/Categories/${id}`);
    return true;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 409)) return false;
    throw error;
  }
}

export async function listInactiveCategories(userId: number): Promise<Category[]> {
  const dtos = await api.get<CategoryResultDto[]>(`/api/Categories/user/${userId}/inactive`);
  return dtos.map(toCategory);
}

export async function reactivateCategory(id: number): Promise<Category> {
  return toCategory(await api.patch<CategoryResultDto>(`/api/Categories/${id}/reactivate`));
}
