import React from 'react';
import { BookOpen, RotateCcw, CheckCircle } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useTranslation } from '../hooks/useTranslation';

interface TutorialSettingsProps {
  userId: string | null;
}

export function TutorialSettings({ userId }: TutorialSettingsProps) {
  const { onboarding, isLoading, restartOnboarding } = useOnboarding(userId);
  const t = useTranslation();

  const handleRestart = async () => {
    if (window.confirm('Are you sure you want to restart the tutorial? This will guide you through all features again.')) {
      await restartOnboarding();
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 h-20 rounded-lg" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">App Tutorial</h3>
          </div>
          <p className="text-sm text-gray-500">
            Learn how to use Clicka with an interactive step-by-step guide
          </p>
        </div>
      </div>

      {onboarding && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            {onboarding.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {onboarding.completed ? 'Tutorial Completed' : 'Tutorial In Progress'}
              </p>
              <p className="text-xs text-gray-500">
                {onboarding.completed
                  ? `Completed on ${new Date(onboarding.completedAt!).toLocaleDateString()}`
                  : `Step ${onboarding.currentStep + 1} of ${onboarding.totalSteps}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleRestart}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <RotateCcw className="w-4 h-4" />
        {onboarding ? 'Restart Tutorial' : 'Start Tutorial'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        The tutorial will guide you through all main features of the app
      </p>
    </div>
  );
}
