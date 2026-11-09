import { api } from './client';
import { DevicePlatform, type DevicePlatformValue } from './enums';

export async function registerDeviceToken(token: string, platform: DevicePlatformValue): Promise<number> {
  const result = await api.post<{ id: number }>('/api/DeviceTokens', {
    userId: 0,
    token,
    platform: DevicePlatform.toWire(platform),
  });
  return result.id;
}

export async function deleteDeviceToken(id: number): Promise<void> {
  await api.delete(`/api/DeviceTokens/${id}`);
}
