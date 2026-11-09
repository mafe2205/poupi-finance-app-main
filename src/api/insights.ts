import type { Insight, InsightFeedback } from '@/data/types';
import { api } from './client';
import { BehavioralInsightType, Feedback as FeedbackEnum } from './enums';

type InsightResultDto = {
  id: number;
  categoryId: number | null;
  type: number;
  description: string;
  referenceDate: string;
  feedback: number | null;
};

function toInsight(dto: InsightResultDto): Insight {
  return {
    id: dto.id,
    type: BehavioralInsightType.fromWire(dto.type),
    categoryId: dto.categoryId ?? undefined,
    description: dto.description,
    referenceDate: dto.referenceDate,
    feedback: dto.feedback != null ? FeedbackEnum.fromWire(dto.feedback) : undefined,
  };
}

export async function listInsights(userId: number): Promise<Insight[]> {
  const dtos = await api.get<InsightResultDto[]>(`/api/BehavioralInsights/user/${userId}`);
  return dtos.map(toInsight);
}

export async function getInsight(id: number): Promise<Insight> {
  return toInsight(await api.get<InsightResultDto>(`/api/BehavioralInsights/${id}`));
}

export async function submitInsightFeedback(id: number, feedback: InsightFeedback): Promise<void> {
  await api.patch(`/api/BehavioralInsights/${id}/feedback`, { feedback: FeedbackEnum.toWire(feedback) });
}

export async function refreshInsights(): Promise<void> {
  await api.post('/api/BehavioralInsights/refresh');
}

export async function markInsightViewed(id: number): Promise<void> {
  await api.post(`/api/BehavioralInsights/${id}/mark-viewed`);
}
