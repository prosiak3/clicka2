import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    setIsStandalone(isInStandaloneMode());

    const handler = (e: BeforeInstallPromptEvent) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');

      if (dismissed && dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 3) {
          console.log('User dismissed recently, not showing prompt');
          return;
        }
      }

      setTimeout(() => {
        setShowPrompt(true);
        console.log('Showing PWA install prompt');
      }, 1000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const appInstalledHandler = () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-time');
    };

    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
    setShowPrompt(false);
  };

  if (isStandalone) {
    return null;
  }

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] pb-20 px-4">
      <div className="max-w-lg mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl shadow-2xl p-5 border-t-4 border-blue-400 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg mb-1">
              {t.pwa?.installTitle || 'Zainstaluj aplikację'}
            </h3>
            <p className="text-blue-100 text-sm mb-3">
              {t.pwa?.installDescription || 'Zainstaluj Clicka na swoim urządzeniu i korzystaj z niej jak z natywnej aplikacji!'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-blue-600 rounded-lg py-2 px-4 font-semibold text-sm hover:bg-blue-50 transition-colors shadow-md"
              >
                {t.pwa?.installButton || 'Zainstaluj'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {t.pwa?.laterButton || 'Później'}
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
