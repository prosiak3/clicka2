import { useEffect, useCallback, useRef } from 'react';

interface UseBackButtonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showCatchForm: boolean;
  setShowCatchForm: (show: boolean) => void;
  selectedSession: any | null;
  setSelectedSession: (session: any | null) => void;
  activeSession: any | null;
  selectionMode: boolean;
  onCancelSelection: () => void;
}

export function useBackButton({
  activeTab,
  setActiveTab,
  showCatchForm,
  setShowCatchForm,
  selectedSession,
  setSelectedSession,
  activeSession,
  selectionMode,
  onCancelSelection,
}: UseBackButtonProps) {
  const hasHandledInitialState = useRef(false);
  const isNavigating = useRef(false);

  const handleBackNavigation = useCallback((event: PopStateEvent) => {
    event.preventDefault();

    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    const state = event.state;

    if (selectionMode) {
      onCancelSelection();
      setTimeout(() => {
        window.history.pushState({ level: 2, tab: activeTab }, '');
        isNavigating.current = false;
      }, 0);
      return;
    }

    if (showCatchForm) {
      setShowCatchForm(false);
      setTimeout(() => {
        window.history.pushState({ level: 3, tab: 'sessions' }, '');
        isNavigating.current = false;
      }, 0);
      return;
    }

    if (selectedSession && activeTab === 'history') {
      setSelectedSession(null);
      setTimeout(() => {
        window.history.pushState({ level: 2, tab: 'history' }, '');
        isNavigating.current = false;
      }, 0);
      return;
    }

    if (activeTab !== 'home' && activeTab !== 'sessions') {
      if (activeSession) {
        setActiveTab('sessions');
        setTimeout(() => {
          window.history.pushState({ level: 1, tab: 'sessions' }, '');
          isNavigating.current = false;
        }, 0);
      } else {
        setActiveTab('home');
        setTimeout(() => {
          window.history.pushState({ level: 1, tab: 'home' }, '');
          isNavigating.current = false;
        }, 0);
      }
      return;
    }

    if (activeTab === 'sessions' && activeSession) {
      setTimeout(() => {
        window.history.pushState({ level: 1, tab: 'sessions' }, '');
        isNavigating.current = false;
      }, 0);
      return;
    }

    if (activeTab === 'home') {
      setTimeout(() => {
        window.history.pushState({ level: 0, tab: 'home' }, '');
        isNavigating.current = false;
      }, 0);
      return;
    }

    isNavigating.current = false;
  }, [
    activeTab,
    setActiveTab,
    showCatchForm,
    setShowCatchForm,
    selectedSession,
    setSelectedSession,
    activeSession,
    selectionMode,
    onCancelSelection,
  ]);

  useEffect(() => {
    if (!hasHandledInitialState.current) {
      const initialTab = activeSession ? 'sessions' : 'home';
      window.history.replaceState({ level: 0, tab: initialTab }, '');
      window.history.pushState({ level: 1, tab: initialTab }, '');
      hasHandledInitialState.current = true;
    }
  }, [activeSession]);

  useEffect(() => {
    window.addEventListener('popstate', handleBackNavigation);

    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
    };
  }, [handleBackNavigation]);

  const pushNavigationState = useCallback((level: number, tab: string) => {
    if (!isNavigating.current) {
      window.history.pushState({ level, tab }, '');
    }
  }, []);

  return { pushNavigationState };
}
