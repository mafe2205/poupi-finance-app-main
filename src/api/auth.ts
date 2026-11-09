import { api } from './client';
import { setSession } from './session';

type LoginResultDto = {
  token: string;
  userId: number;
  role: string;
  expiresAt: string;
};

export async function login(identifier: string, password: string) {
  const result = await api.postAnonymous<LoginResultDto>('/api/Authentication/login', {
    identifier,
    password,
  });
  await setSession(result);
  return result;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/Authentication/change-password', { currentPassword, newPassword });
}
