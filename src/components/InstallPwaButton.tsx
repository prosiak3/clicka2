import { useState, useEffect } from 'react';
import { Download, Share, CheckCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showWindowsInstructions, setShowWindowsInstructions] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        document.referrer.includes('windows-app://')
      );
    };

    const checkIfIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    const checkIfWindows = () => {
      const platform = window.navigator.platform?.toLowerCase() || '';
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /win/.test(platform) || /windows/.test(userAgent);
    };

    setIsInstalled(isInStandaloneMode());
    setIsIOS(checkIfIOS());
    setIsWindows(checkIfWindows());

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler as any);

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      } else if (isWindows) {
        setShowWindowsInstructions(true);
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-5 h-5" />
        <span>Aplikacja zainstalowana</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        <span>Zainstaluj aplikację</span>
      </button>

      {showIOSInstructions && isIOS && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">Jak zainstalować na iOS:</h4>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Dotknij przycisku <Share className="inline w-4 h-4" /> (Udostępnij) na dolnym pasku Safari</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Przewiń w dół i wybierz "Dodaj do ekranu początkowego"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Dotknij "Dodaj" w prawym górnym rogu</span>
            </li>
          </ol>
        </div>
      )}

      {showWindowsInstructions && isWindows && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">Jak zainstalować na Windows:</h4>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>W Chrome lub Edge: Kliknij ikonę <Download className="inline w-4 h-4" /> w pasku adresu (po prawej stronie)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>LUB kliknij menu (3 kropki) → "Zainstaluj Clicka" lub "Instaluj aplikację"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Potwierdź instalację - aplikacja pojawi się w menu Start i na pulpicie</span>
            </li>
          </ol>
        </div>
      )}

      {!deferredPrompt && !isIOS && !isWindows && (
        <p className="text-sm text-gray-500 text-center">
          Aplikacja może być już zainstalowana lub Twoja przeglądarka nie obsługuje instalacji PWA.
        </p>
      )}

      {!deferredPrompt && (isIOS || isWindows) && (
        <p className="text-sm text-gray-500 text-center">
          Kliknij przycisk powyżej, aby zobaczyć instrukcje instalacji.
        </p>
      )}
    </div>
  );
}
