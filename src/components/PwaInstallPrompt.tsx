import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-4 border border-blue-400/30 backdrop-blur-sm">
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
