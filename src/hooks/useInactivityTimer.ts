import { useEffect, useState, useCallback, useRef } from 'react';

interface UseInactivityTimerOptions {
  timeoutMinutes: number;
  warningMinutes?: number;
  enabled: boolean;
  onTimeout: () => void;
  onWarning?: () => void;
}

export function useInactivityTimer({
  timeoutMinutes,
  warningMinutes = 5,
  enabled,
  onTimeout,
  onWarning
}: UseInactivityTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearAllTimers();
    setIsWarningActive(false);
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    if (warningMs > 0 && onWarning) {
      warningTimeoutRef.current = setTimeout(() => {
        setIsWarningActive(true);
        setRemainingSeconds(warningMinutes * 60);
        onWarning();

        countdownIntervalRef.current = setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, warningMs);
    }

    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      onTimeout();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, warningMinutes, onTimeout, onWarning, clearAllTimers]);

  const handleActivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    if (timeSinceLastActivity > 1000) {
      resetTimer();
    }
  }, [enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setIsWarningActive(false);
      return;
    }

    resetTimer();

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer, handleActivity, clearAllTimers]);

  return {
    remainingSeconds,
    isWarningActive,
    resetTimer
  };
}
