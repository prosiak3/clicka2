import React, { useEffect, useState } from 'react';
import { Download, X, RefreshCw, Search } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useSettings } from '../utils/settings';

/**
 * Props for UpdateNotification component
 * @interface UpdateNotificationProps
 * @property {number} [onUpdateCheckInterval=900000] - Interval in milliseconds to check for updates (default: 15 minutes)
 */
interface UpdateNotificationProps {
  onUpdateCheckInterval?: number;
}

/**
 * UpdateNotification Component
 *
 * Displays a notification banner when a new version of the PWA is available.
 * Automatically checks for updates at configured intervals and provides UI
 * for users to update immediately or dismiss the notification.
 *
 * Features:
 * - Automatic update checking at configurable intervals
 * - Visual notification with gradient design
 * - User choice to update now or later
 * - Loading state during update process
 * - Automatic page reload after update
 *
 * @param {UpdateNotificationProps} props - Component props
 * @returns {JSX.Element | null} Notification banner or null if no update available
 *
 * @example
 * <UpdateNotification onUpdateCheckInterval={15 * 60 * 1000} />
 */
export function UpdateNotification({ onUpdateCheckInterval = 5 * 60 * 1000 }: UpdateNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckNotification, setShowCheckNotification] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const settings = useSettings();

  // Register service worker and set up update checking
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Called when service worker is successfully registered
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);

      if (!registration) return;

      // Function to check for new service worker versions
      const checkForUpdates = async () => {
        try {
          console.log('🔍 Checking for updates...');
          const checkTime = new Date();
          setLastCheckTime(checkTime);

          if (settings.pwa.showUpdateCheckNotifications) {
            setShowCheckNotification(true);
            setTimeout(() => {
              setShowCheckNotification(false);
            }, 3000);
          }

          await registration.update();
          console.log('✅ Update check completed at', checkTime.toLocaleTimeString());
        } catch (error) {
          console.error('❌ Error checking for updates:', error);
        }
      };

      // Check immediately on registration
      checkForUpdates();

      // Set up periodic checking at configured interval
      const intervalId = setInterval(() => {
        checkForUpdates();
      }, onUpdateCheckInterval);

      // Cleanup interval on unmount
      return () => {
        clearInterval(intervalId);
      };
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
    immediate: true,
  });

  // Show notification when update is available
  useEffect(() => {
    if (needRefresh) {
      setShowNotification(true);
    }
  }, [needRefresh]);

  /**
   * Handles the update process when user clicks "Update Now"
   * Activates the new service worker and reloads the page
   */
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Activate the new service worker
      await updateServiceWorker(true);
      // Reload page to use new version
      window.location.reload();
    } catch (error) {
      console.error('Error updating service worker:', error);
      setIsUpdating(false);
    }
  };

  /**
   * Handles dismissing the update notification
   * User can continue using current version
   */
  const handleDismiss = () => {
    setShowNotification(false);
    setNeedRefresh(false);
  };

  if (showCheckNotification) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pointer-events-none">
        <div className="max-w-lg mx-auto bg-blue-600 rounded-lg shadow-xl p-3 animate-slide-up border-2 border-blue-400">
          <div className="flex items-center gap-2 justify-center">
            <Search className="w-5 h-5 text-white animate-pulse" />
            <div className="flex flex-col">
              <p className="text-sm text-white font-bold">Checking for updates...</p>
              {lastCheckTime && (
                <p className="text-xs text-blue-100">Last check: {lastCheckTime.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showNotification) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl border-2 border-blue-400 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">New Update Available!</h3>
                <p className="text-sm text-blue-100">A new version of Clicka is ready</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isUpdating}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="flex-1 touch-target-min py-3 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl font-semibold transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
            >
              Later
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 touch-target-min py-3 px-4 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-600 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed touch-feedback flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Update Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
