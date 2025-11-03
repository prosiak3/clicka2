import { useEffect, useState } from 'react';

interface PWAUpdateState {
  updateAvailable: boolean;
  updateSW: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          setRegistration(reg);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  console.log('New update available!');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error getting SW registration:', error);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const checkForUpdate = async () => {
    if (registration) {
      try {
        await registration.update();
        console.log('Checked for updates');
      } catch (error) {
        console.error('Error checking for update:', error);
      }
    }
  };

  const updateSW = async () => {
    if (!registration || !registration.waiting) {
      console.log('No waiting service worker');
      return;
    }

    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return {
    updateAvailable,
    updateSW,
    checkForUpdate,
  };
}
