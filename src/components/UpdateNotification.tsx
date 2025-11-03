import React, { useEffect, useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UpdateNotificationProps {
  onUpdateCheckInterval?: number;
}

export function UpdateNotification({ onUpdateCheckInterval = 15 * 60 * 1000 }: UpdateNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);

      if (!registration) return;

      const checkForUpdates = async () => {
        try {
          console.log('Checking for updates...');
          await registration.update();
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      };

      checkForUpdates();

      const intervalId = setInterval(() => {
        checkForUpdates();
      }, onUpdateCheckInterval);

      return () => {
        clearInterval(intervalId);
      };
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
    immediate: true,
  });

  useEffect(() => {
    if (needRefresh) {
      setShowNotification(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      window.location.reload();
    } catch (error) {
      console.error('Error updating service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setNeedRefresh(false);
  };

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
