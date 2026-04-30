import messaging from '@react-native-firebase/messaging';
import { supabase } from './supabase';
import { getDeviceId } from './deviceId';

export async function requestPushPermission(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function registerPushToken(): Promise<void> {
  try {
    const granted = await requestPushPermission();
    if (!granted) return;
    const token = await messaging().getToken();
    if (!token) return;
    const deviceId = await getDeviceId();
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('device_id', deviceId);
  } catch (e) {
    console.warn('Push token registration failed:', e);
  }
}

export function onForegroundMessage(
  handler: (title: string, body: string) => void
): () => void {
  try {
    return messaging().onMessage(async msg => {
      const title = msg.notification?.title ?? '';
      const body = msg.notification?.body ?? '';
      handler(title, body);
    });
  } catch (e) {
    console.warn('Push foreground listener failed:', e);
    return () => {};
  }
}
