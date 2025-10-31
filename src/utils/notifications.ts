export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export function checkNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return { granted: false, denied: true, default: false };
  }

  return {
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
    default: Notification.permission === 'default'
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: NotificationAction[];
}

export async function showNotification(options: NotificationOptions): Promise<void> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.svg',
      badge: options.badge || '/icon-192x192.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
      actions: options.actions,
      vibrate: [200, 100, 200]
    });
  } else {
    new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data,
      vibrate: [200, 100, 200]
    });
  }
}

export async function scheduleNotification(options: NotificationOptions, delayMs: number): Promise<number> {
  return window.setTimeout(async () => {
    await showNotification(options);
  }, delayMs);
}

export function cancelScheduledNotification(notificationId: number): void {
  window.clearTimeout(notificationId);
}

export async function showCatchReminderNotification(): Promise<void> {
  await showNotification({
    title: 'Clicka - Przypomnienie',
    body: 'Nie zapomnij zapisać swojego ostatniego połowu!',
    tag: 'catch-reminder',
    requireInteraction: false
  });
}

export async function showWeatherAlertNotification(weatherInfo: string): Promise<void> {
  await showNotification({
    title: 'Clicka - Alert Pogodowy',
    body: weatherInfo,
    tag: 'weather-alert',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Zobacz szczegóły' },
      { action: 'dismiss', title: 'Zamknij' }
    ]
  });
}

export async function showIdealConditionsNotification(message: string): Promise<void> {
  await showNotification({
    title: 'Clicka - Idealne Warunki!',
    body: message,
    tag: 'ideal-conditions',
    requireInteraction: true,
    actions: [
      { action: 'start-session', title: 'Rozpocznij sesję' },
      { action: 'dismiss', title: 'Później' }
    ]
  });
}

export async function showSessionEndWarningNotification(minutesLeft: number): Promise<void> {
  await showNotification({
    title: 'Clicka - Ostrzeżenie',
    body: `Sesja połowowa zostanie zakończona za ${minutesLeft} minut z powodu braku aktywności`,
    tag: 'session-warning',
    requireInteraction: true,
    actions: [
      { action: 'continue', title: 'Kontynuuj' },
      { action: 'end', title: 'Zakończ teraz' }
    ]
  });
}

export async function showOfflineNotification(): Promise<void> {
  await showNotification({
    title: 'Clicka - Tryb Offline',
    body: 'Działasz w trybie offline. Dane zostaną zsynchronizowane po przywróceniu połączenia.',
    tag: 'offline-mode',
    silent: true
  });
}

export async function showOnlineNotification(): Promise<void> {
  await showNotification({
    title: 'Clicka - Połączono',
    body: 'Połączenie przywrócone. Synchronizuję dane...',
    tag: 'online-mode',
    silent: true
  });
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      )
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      return success;
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
