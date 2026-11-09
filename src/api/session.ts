import * as SecureStore from 'expo-secure-store';

export type Session = {
  token: string;
  userId: number;
  role: string;
  expiresAt: string;
};

const KEY = 'poupi.session';

export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    const session: Session = JSON.parse(raw);
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function setSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
