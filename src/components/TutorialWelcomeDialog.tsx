import React from 'react';
import { Fish, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface TutorialWelcomeDialogProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export function TutorialWelcomeDialog({
  isOpen,
  onStart,
  onSkip,
}: TutorialWelcomeDialogProps) {
  const t = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Fish className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t.tutorial.welcome.title}
          </h2>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {t.tutorial.welcome.description}
          </p>

          <div className="space-y-3">
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg font-medium text-lg"
            >
              <Fish className="w-5 h-5" />
              {t.tutorial.welcome.startButton}
            </button>

            <button
              onClick={onSkip}
              className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
            >
              {t.tutorial.welcome.skipButton}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            {t.tutorial.welcome.skipWarning}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
