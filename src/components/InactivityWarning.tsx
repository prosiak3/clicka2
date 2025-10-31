import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';

interface InactivityWarningProps {
  isOpen: boolean;
  remainingSeconds: number;
  onExtend: () => void;
  onEndSession: () => void;
  onClose: () => void;
}

export function InactivityWarning({
  isOpen,
  remainingSeconds,
  onExtend,
  onEndSession,
  onClose
}: InactivityWarningProps) {
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    if (isOpen && !audioPlayed) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGAg+lt7zvGwhBDCF0fPUgjQGH27A7+OZUQ4PVabn7qxdGA==');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      setAudioPlayed(true);
    }

    if (!isOpen) {
      setAudioPlayed(false);
    }
  }, [isOpen, audioPlayed]);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-full animate-pulse">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Session Ending Soon</h3>
              <p className="text-sm text-gray-600">Due to inactivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-3xl font-bold text-orange-600 tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-3">
            Your fishing session will automatically end if no action is taken
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onExtend}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Clock className="w-5 h-5" />
            Continue Session
          </button>
          <button
            onClick={onEndSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            End Session Now
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Any interaction with the app will automatically extend your session
        </p>
      </div>
    </div>
  );
}
