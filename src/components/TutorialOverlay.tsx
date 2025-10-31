import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { getTutorialStep } from '../utils/tutorialSteps';

interface TutorialOverlayProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export function TutorialOverlay({
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  onFinish,
}: TutorialOverlayProps) {
  const t = useTranslation();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const stepConfig = getTutorialStep(currentStep);
  const isLastStep = currentStep === totalSteps - 1;

  const stepData = (t.tutorial.steps as any)[currentStep];
  const title = stepData?.title || '';
  const description = stepData?.description || '';

  useEffect(() => {
    if (!stepConfig?.targetElement) {
      setHighlightRect(null);
      setTargetElement(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(stepConfig.targetElement!) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        setTargetElement(element);

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightRect(null);
        setTargetElement(null);
      }
    };

    const timeout = setTimeout(updateHighlight, 100);

    const observer = new MutationObserver(updateHighlight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [stepConfig?.targetElement, currentStep]);

  useEffect(() => {
    if (!targetElement || !stepConfig?.action) return;

    const handleAction = (e: Event) => {
      if (stepConfig.action === 'click') {
        setTimeout(() => onNext(), 300);
      }
    };

    if (stepConfig.action === 'click') {
      targetElement.addEventListener('click', handleAction);
      return () => targetElement.removeEventListener('click', handleAction);
    }
  }, [targetElement, stepConfig?.action, onNext]);

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
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        width: '400px'
      };
    }

    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(360, viewportWidth - 40);

    let top = 0;
    let left = 0;
    let transform = '';

    switch (stepConfig.position) {
      case 'top':
        if (highlightRect.top > 200) {
          top = highlightRect.top - padding;
          left = highlightRect.left + highlightRect.width / 2;
          transform = 'translate(-50%, -100%)';
        } else {
          top = highlightRect.bottom + padding;
          left = highlightRect.left + highlightRect.width / 2;
          transform = 'translateX(-50%)';
        }
        break;
      case 'bottom':
        if (viewportHeight - highlightRect.bottom > 200) {
          top = highlightRect.bottom + padding;
          left = highlightRect.left + highlightRect.width / 2;
          transform = 'translateX(-50%)';
        } else {
          top = highlightRect.top - padding;
          left = highlightRect.left + highlightRect.width / 2;
          transform = 'translate(-50%, -100%)';
        }
        break;
      case 'left':
        if (highlightRect.left > tooltipWidth + padding) {
          top = highlightRect.top + highlightRect.height / 2;
          left = highlightRect.left - padding;
          transform = 'translate(-100%, -50%)';
        } else {
          top = highlightRect.top + highlightRect.height / 2;
          left = highlightRect.right + padding;
          transform = 'translateY(-50%)';
        }
        break;
      case 'right':
        if (viewportWidth - highlightRect.right > tooltipWidth + padding) {
          top = highlightRect.top + highlightRect.height / 2;
          left = highlightRect.right + padding;
          transform = 'translateY(-50%)';
        } else {
          top = highlightRect.top + highlightRect.height / 2;
          left = highlightRect.left - padding;
          transform = 'translate(-100%, -50%)';
        }
        break;
      default:
        top = viewportHeight / 2;
        left = viewportWidth / 2;
        transform = 'translate(-50%, -50%)';
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform,
      maxWidth: '90vw',
      width: `${tooltipWidth}px`,
    };
  };

  const tooltipStyle = getTooltipPosition();

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (highlightRect && targetElement) {
      const rect = highlightRect;
      const clickX = e.clientX;
      const clickY = e.clientY;

      if (
        clickX >= rect.left - 8 &&
        clickX <= rect.right + 8 &&
        clickY >= rect.top - 8 &&
        clickY <= rect.bottom + 8
      ) {
        return;
      }
    }
  };

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9999]"
        style={{ isolation: 'isolate', pointerEvents: 'none' }}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'auto', zIndex: 9999 }}
          onClick={handleOverlayClick}
        >
          <svg className="absolute inset-0 w-full h-full">
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
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#tutorial-mask)"
            />
          </svg>
        </div>

        {highlightRect && (
          <div
            className="absolute"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              border: '3px solid #3b82f6',
              borderRadius: '12px',
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
              animation: 'pulse 2s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          />
        )}

        {highlightRect && targetElement && (
          <div
            className="absolute"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              pointerEvents: 'auto',
              zIndex: 10001,
              cursor: stepConfig?.action === 'click' ? 'pointer' : 'default',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (targetElement) {
                targetElement.click();
              }
            }}
          />
        )}

        <div
          className="absolute bg-white rounded-xl shadow-2xl p-5 animate-fade-in"
          style={{
            ...tooltipStyle,
            zIndex: 10003,
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {currentStep + 1} / {totalSteps}
            </div>
            <button
              onClick={handleSkipClick}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              title="Skip tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>

          {stepConfig?.action === 'click' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 font-medium">
                👆 Click the highlighted element to continue
              </p>
            </div>
          )}

          {!stepConfig?.action && (
            <button
              onClick={isLastStep ? onFinish : onNext}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {isLastStep ? t.tutorial.finish : t.tutorial.next}
            </button>
          )}
        </div>
      </div>

      {showSkipConfirm && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                {t.tutorial.skipConfirm.cancelButton}
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
