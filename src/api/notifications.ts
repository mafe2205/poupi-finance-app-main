import { NotificationType } from './enums';
import { api } from './client';
import type { Notification } from '@/data/types';

type NotificationResultDto = {
  id: number;
  type: number;
  title: string;
  message: string;
  relatedEntityId: number | null;
  readAt: string | null;
  createdAt: string;
};

function toNotification(dto: NotificationResultDto): Notification {
  return {
    id: dto.id,
    type: NotificationType.fromWire(dto.type),
    title: dto.title,
    message: dto.message,
    relatedEntityId: dto.relatedEntityId ?? undefined,
    readAt: dto.readAt ?? undefined,
    createdAt: dto.createdAt,
  };
}

export async function listNotifications(userId: number): Promise<Notification[]> {
  const dtos = await api.get<NotificationResultDto[]>(`/api/Notifications/user/${userId}`);
  return dtos.map(toNotification);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const result = await api.get<{ count: number }>(`/api/Notifications/user/${userId}/unread-count`);
  return result.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/api/Notifications/${id}/read`);
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/api/Notifications/${id}`);
}
