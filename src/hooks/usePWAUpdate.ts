import { useEffect, useState } from 'react';

/**
 * State interface for PWA update management
 * @interface PWAUpdateState
 * @property {boolean} updateAvailable - Indicates if a new version is available
 * @property {Function} updateSW - Function to activate the waiting service worker
 * @property {Function} checkForUpdate - Function to manually check for updates
 */
interface PWAUpdateState {
  updateAvailable: boolean;
  updateSW: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

/**
 * Custom hook for managing PWA updates
 * Detects when a new version of the service worker is available and provides
 * functions to check for updates and activate the new version.
 *
 * @returns {PWAUpdateState} Object containing update state and control functions
 *
 * @example
 * const { updateAvailable, updateSW, checkForUpdate } = usePWAUpdate();
 *
 * if (updateAvailable) {
 *   // Show update notification to user
 *   await updateSW(); // Activate new version
 * }
 */
export function usePWAUpdate(): PWAUpdateState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          setRegistration(reg);

          // Listen for new service worker being installed
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // When new SW is installed and there's an active controller,
                // a new version is available
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

      // Reload the page when the new service worker takes control
      // Prevents duplicate reloads with refreshing flag
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  /**
   * Manually checks for service worker updates
   * Triggers the browser to check if a new version is available
   */
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

  /**
   * Activates the waiting service worker
   * Sends SKIP_WAITING message to immediately activate the new SW
   * This will trigger a page reload via the controllerchange event
   */
  const updateSW = async () => {
    if (!registration || !registration.waiting) {
      console.log('No waiting service worker');
      return;
    }

    // Tell the waiting service worker to skip waiting and activate immediately
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  return {
    updateAvailable,
    updateSW,
    checkForUpdate,
  };
}
