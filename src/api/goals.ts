import type { Goal, RawTransaction } from '@/data/types';
import { api } from './client';
import { centsToReais, reaisToCents } from './money';
import { listTransactions } from './transactions';

type GoalResultDto = {
  id: number;
  inicialDate: string;
  finalDate: string;
  inicialValueCents: number;
  finalValueCents: number;
  description: string;
};

function toGoalBase(dto: GoalResultDto): Omit<Goal, 'currentAmount'> {
  return {
    id: dto.id,
    description: dto.description,
    initialAmount: centsToReais(dto.inicialValueCents),
    targetAmount: centsToReais(dto.finalValueCents),
    startDate: dto.inicialDate,
    endDate: dto.finalDate,
  };
}

export async function listGoals(userId: number): Promise<Omit<Goal, 'currentAmount'>[]> {
  const dtos = await api.get<GoalResultDto[]>(`/api/Goals/user/${userId}`);
  return dtos.map(toGoalBase);
}

export async function getGoalHistory(goalId: number): Promise<RawTransaction[]> {
  return listTransactions({ metaId: goalId, pageSize: 200 });
}

export type CreateGoalInput = {
  userId: number;
  description: string;
  initialAmount: number;
  targetAmount: number;
  startDate: string;
  endDate: string;
};

export async function createGoal(input: CreateGoalInput): Promise<Omit<Goal, 'currentAmount'>> {
  const dto = await api.post<GoalResultDto>('/api/Goals', {
    userId: input.userId,
    inicialDate: input.startDate,
    finalDate: input.endDate,
    inicialValueCents: reaisToCents(input.initialAmount),
    finalValueCents: reaisToCents(input.targetAmount),
    description: input.description,
    createdAt: new Date().toISOString(),
  });
  return toGoalBase(dto);
}

export async function updateGoal(
  id: number,
  input: { description: string; targetAmount: number; endDate: string }
): Promise<Omit<Goal, 'currentAmount'>> {
  const dto = await api.put<GoalResultDto>('/api/Goals', {
    id,
    finalDate: input.endDate,
    finalValueCents: reaisToCents(input.targetAmount),
    description: input.description,
    updatedAt: new Date().toISOString(),
  });
  return toGoalBase(dto);
}

export async function deleteGoal(id: number): Promise<void> {
  await api.delete(`/api/Goals/${id}`);
}
