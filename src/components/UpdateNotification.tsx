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
  const [showCheckNotification, setShowCheckNotification] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const settings = useSettings();

  // Register service worker and set up update checking
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
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

  // Show notification when update is being downloaded/installed
  useEffect(() => {
    if (needRefresh) {
      setUpdateReady(true);
      setShowNotification(true);

      // Auto-hide after 5 seconds and reload
      setTimeout(() => {
        setShowNotification(false);
        window.location.reload();
      }, 5000);
    }
  }, [needRefresh]);

  /**
   * Handles dismissing the update notification
   */
  const handleDismiss = () => {
    setShowNotification(false);
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

  if (!showNotification || !updateReady) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-2xl border-2 border-green-400 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-white/20 rounded-xl">
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Update Ready!</h3>
                <p className="text-sm text-green-100">Clicka will reload in a moment to apply the update</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
