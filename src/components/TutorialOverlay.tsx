import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { getTutorialStep } from '../utils/tutorialSteps';

interface TutorialOverlayProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export function TutorialOverlay({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onFinish,
}: TutorialOverlayProps) {
  const t = useTranslation();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const stepConfig = getTutorialStep(currentStep);
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const stepData = (t.tutorial.steps as any)[currentStep];
  const title = stepData?.title || '';
  const description = stepData?.description || '';

  useEffect(() => {
    if (!stepConfig?.targetElement) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(stepConfig.targetElement!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      } else {
        setHighlightRect(null);
      }
    };

    updateHighlight();

    const observer = new MutationObserver(updateHighlight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [stepConfig?.targetElement, currentStep]);

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = () => {
    setShowSkipConfirm(false);
    onSkip();
  };

  const cancelSkip = () => {
    setShowSkipConfirm(false);
  };

  const getTooltipPosition = () => {
    if (!highlightRect || !stepConfig) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (stepConfig.position) {
      case 'top':
        return {
          top: `${highlightRect.top - tooltipHeight - padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${highlightRect.bottom + padding}px`,
          left: `${highlightRect.left + highlightRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.left - tooltipWidth - padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${highlightRect.top + highlightRect.height / 2}px`,
          left: `${highlightRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ isolation: 'isolate' }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ mixBlendMode: 'normal' }}
        >
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#tutorial-mask)"
          />
        </svg>

        {highlightRect && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              border: '3px solid #3b82f6',
              borderRadius: '12px',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}

        <div
          className="absolute bg-white rounded-xl shadow-2xl p-6 pointer-events-auto"
          style={{
            ...tooltipStyle,
            maxWidth: '90vw',
            width: '320px',
            zIndex: 60,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-blue-600">
              {t.tutorial.step} {currentStep + 1} {t.tutorial.of} {totalSteps}
            </div>
            {stepConfig?.showSkipButton && (
              <button
                onClick={handleSkipClick}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onPrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isFirstStep
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {t.tutorial.previous}
            </button>

            <button
              onClick={isLastStep ? onFinish : onNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isLastStep ? t.tutorial.finish : t.tutorial.next}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showSkipConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {t.tutorial.skipConfirm.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.tutorial.skipConfirm.description}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelSkip}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.tutorial.skipConfirm.cancelButton}
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.tutorial.skipConfirm.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.7);
          }
        }
      `}</style>
    </>
  );
}
