export interface TutorialStep {
  id: number;
  targetElement: string | null;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'wait' | 'click' | 'input';
  highlightArea?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  nextButtonText?: string;
  skipButtonText?: string;
  showSkipButton?: boolean;
}

export const tutorialSteps: Record<string, Omit<TutorialStep, 'title' | 'description' | 'nextButtonText' | 'skipButtonText'>> = {
  0: {
    id: 0,
    targetElement: null,
    position: 'center',
    showSkipButton: true,
  },
  1: {
    id: 1,
    targetElement: '[data-tutorial="home-screen"]',
    position: 'center',
    showSkipButton: true,
  },
  2: {
    id: 2,
    targetElement: '[data-tutorial="start-fishing-button"]',
    position: 'bottom',
    action: 'click',
    showSkipButton: true,
  },
  3: {
    id: 3,
    targetElement: '[data-tutorial="active-session"]',
    position: 'top',
    showSkipButton: true,
  },
  4: {
    id: 4,
    targetElement: '[data-tutorial="add-catch-button"]',
    position: 'bottom',
    action: 'click',
    showSkipButton: true,
  },
  5: {
    id: 5,
    targetElement: '[data-tutorial="catch-form"]',
    position: 'top',
    showSkipButton: true,
  },
  6: {
    id: 6,
    targetElement: '[data-tutorial="session-controls"]',
    position: 'top',
    showSkipButton: true,
  },
  7: {
    id: 7,
    targetElement: '[data-tutorial="end-session-button"]',
    position: 'left',
    showSkipButton: true,
  },
  8: {
    id: 8,
    targetElement: '[data-tutorial="history-tab"]',
    position: 'top',
    action: 'click',
    showSkipButton: true,
  },
  9: {
    id: 9,
    targetElement: '[data-tutorial="stats-tab"]',
    position: 'top',
    action: 'click',
    showSkipButton: true,
  },
  10: {
    id: 10,
    targetElement: null,
    position: 'center',
    showSkipButton: false,
  },
};

export function getTutorialStep(stepNumber: number): Omit<TutorialStep, 'title' | 'description' | 'nextButtonText' | 'skipButtonText'> | null {
  return tutorialSteps[stepNumber] || null;
}

export const TOTAL_TUTORIAL_STEPS = Object.keys(tutorialSteps).length;
