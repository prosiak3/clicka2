import { useEffect, useState } from 'react';
import { Share, X, Download } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const checkIfIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    const checkIfStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };

    const isIOSDevice = checkIfIOS();
    const isInStandaloneMode = checkIfStandalone();

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandaloneMode);

    if (isIOSDevice && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('ios-pwa-install-dismissed');
      const dismissedTime = localStorage.getItem('ios-pwa-install-dismissed-time');

      if (dismissed && dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 14) {
          console.log('iOS install prompt dismissed recently');
          return;
        }
      }

      setTimeout(() => {
        setShowPrompt(true);
        console.log('Showing iOS install prompt');
      }, 3000);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-pwa-install-dismissed', 'true');
    localStorage.setItem('ios-pwa-install-dismissed-time', Date.now().toString());
    setShowPrompt(false);
  };

  if (!isIOS || isStandalone || !showPrompt) {
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
              Dodaj Clicka do ekranu głównego, aby korzystać z niej jak z natywnej aplikacji!
            </p>

            <div className="bg-white/10 rounded-lg p-3 mb-3 space-y-2">
              <div className="flex items-start gap-2 text-white text-sm">
                <span className="font-bold text-blue-200 min-w-[20px]">1.</span>
                <span>
                  Dotknij przycisku <Share className="inline w-4 h-4 mx-1 align-text-bottom" /> "Udostępnij" na dolnym pasku Safari
                </span>
              </div>
              <div className="flex items-start gap-2 text-white text-sm">
                <span className="font-bold text-blue-200 min-w-[20px]">2.</span>
                <span>Przewiń w dół i wybierz "Dodaj do ekranu początkowego"</span>
              </div>
              <div className="flex items-start gap-2 text-white text-sm">
                <span className="font-bold text-blue-200 min-w-[20px]">3.</span>
                <span>Dotknij "Dodaj"</span>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full bg-white/20 text-white rounded-lg py-2 px-4 font-semibold text-sm hover:bg-white/30 transition-colors"
            >
              {t.pwa?.laterButton || 'Później'}
            </button>
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
