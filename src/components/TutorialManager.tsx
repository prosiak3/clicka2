import React, { useEffect, useState } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { TutorialWelcomeDialog } from './TutorialWelcomeDialog';
import { TutorialOverlay } from './TutorialOverlay';

interface TutorialManagerProps {
  userId: string | null;
  isAuthenticated: boolean;
}

export function TutorialManager({ userId, isAuthenticated }: TutorialManagerProps) {
  const {
    onboarding,
    isLoading,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    shouldShowOnboarding,
  } = useOnboarding(userId);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Tutorial temporarily disabled
    // if (!isLoading && isAuthenticated && shouldShowOnboarding && !onboarding) {
    //   setShowWelcome(true);
    // }
  }, [isLoading, isAuthenticated, shouldShowOnboarding, onboarding]);

  const handleStartTutorial = async () => {
    setShowWelcome(false);
    await startOnboarding();
    setShowTutorial(true);
  };

  const handleSkipWelcome = async () => {
    setShowWelcome(false);
    await skipOnboarding();
  };

  const handleNext = async () => {
    await nextStep();
  };

  const handlePrevious = async () => {
    await previousStep();
  };

  const handleSkipTutorial = async () => {
    setShowTutorial(false);
    await skipOnboarding();
  };

  const handleFinish = async () => {
    setShowTutorial(false);
    await completeOnboarding();
  };

  useEffect(() => {
    // Tutorial temporarily disabled
    // if (onboarding && !onboarding.completed && !onboarding.skipped) {
    //   setShowTutorial(true);
    // }
  }, [onboarding]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <TutorialWelcomeDialog
        isOpen={showWelcome}
        onStart={handleStartTutorial}
        onSkip={handleSkipWelcome}
      />

      {showTutorial && onboarding && (
        <TutorialOverlay
          currentStep={onboarding.currentStep}
          totalSteps={onboarding.totalSteps}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkipTutorial}
          onFinish={handleFinish}
        />
      )}
    </>
  );
}
