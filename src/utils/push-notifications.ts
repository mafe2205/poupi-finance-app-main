import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { deleteDeviceToken, registerDeviceToken } from '@/api/deviceTokens';

const KEY = 'poupi.deviceTokenId';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificações',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      ({ status: finalStatus } = await Notifications.requestPermissionsAsync());
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push desativado: projectId do EAS ausente (rode `eas init`).');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await saveToken(token);
  } catch (error) {
    console.warn('Falha ao registrar o push token:', error);
  }
}

async function saveToken(token: string) {
  const id = await registerDeviceToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
  await SecureStore.setItemAsync(KEY, String(id));
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    const id = await SecureStore.getItemAsync(KEY);
    if (!id) return;
    await SecureStore.deleteItemAsync(KEY);
    await deleteDeviceToken(Number(id));
  } catch (error) {
    console.warn('Falha ao remover o push token:', error);
  }
}

export function notificationTarget(data: Record<string, unknown> | undefined) {
  const insightId = Number(data?.relatedEntityId);
  if (data?.type === 'insight_generated' && insightId) return `/insights/${insightId}` as const;
  return '/notificacao' as const;
}

export function addPushTokenRefreshListener(): () => void {
  if (Platform.OS === 'web') return () => { };
  const subscription = Notifications.addPushTokenListener(() => {
    registerForPushNotifications();
  });
  return () => subscription.remove();
}
