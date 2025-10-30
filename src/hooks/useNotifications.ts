import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  type NotificationPermission
} from '../utils/notifications';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentPermission = checkNotificationPermission();
    setPermission(currentPermission);

    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      const newPermission = checkNotificationPermission();
      setPermission(newPermission);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeToPushNotifications();
      if (subscription) {
        setIsSubscribed(true);
        return subscription;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe
  };
}
