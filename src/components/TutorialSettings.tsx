import React, { useState } from 'react';
import { BookOpen, RotateCcw, CheckCircle, Play } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useTranslation } from '../hooks/useTranslation';

interface TutorialSettingsProps {
  userId: string | null;
}

export function TutorialSettings({ userId }: TutorialSettingsProps) {
  const { onboarding, isLoading, restartOnboarding } = useOnboarding(userId);
  const t = useTranslation();
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = async () => {
    const confirmMessage = onboarding?.completed
      ? 'Are you sure you want to restart the tutorial? This will guide you through all features again.'
      : 'Are you sure you want to start the tutorial from the beginning?';

    if (window.confirm(confirmMessage)) {
      setIsRestarting(true);
      await restartOnboarding();

      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-700 h-20 rounded-lg" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">App Tutorial</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Learn how to use Clicka with an interactive step-by-step guide that highlights each feature
          </p>
        </div>
      </div>

      {onboarding && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            {onboarding.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {onboarding.completed ? 'Tutorial Completed' : 'Tutorial In Progress'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {onboarding.completed
                  ? `Completed on ${new Date(onboarding.completedAt!).toLocaleDateString()}`
                  : `Step ${onboarding.currentStep + 1} of ${onboarding.totalSteps}`}
              </p>
            </div>
          </div>

          {!onboarding.completed && onboarding.currentStep > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 You have an active tutorial in progress. Navigate to the Home screen to continue where you left off.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleRestart}
        disabled={isRestarting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
      >
        {isRestarting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            Starting...
          </>
        ) : (
          <>
            {onboarding?.completed ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Restart Tutorial
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {onboarding ? 'Start from Beginning' : 'Start Tutorial'}
              </>
            )}
          </>
        )}
      </button>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Interactive Tutorial:</strong> You'll be guided through the app with highlighted elements. Click on them to perform real actions and learn by doing!
        </p>
      </div>
    </div>
  );
}
