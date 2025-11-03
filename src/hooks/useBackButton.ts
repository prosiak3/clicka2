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

  const handleBackNavigation = useCallback((event: PopStateEvent) => {
    const state = event.state;

    if (selectionMode) {
      onCancelSelection();
      window.history.pushState({ level: 2, tab: activeTab }, '');
      return;
    }

    if (showCatchForm) {
      setShowCatchForm(false);
      window.history.pushState({ level: 3, tab: 'sessions' }, '');
      return;
    }

    if (selectedSession && activeTab === 'history') {
      setSelectedSession(null);
      window.history.pushState({ level: 2, tab: 'history' }, '');
      return;
    }

    if (activeTab !== 'home' && activeTab !== 'sessions') {
      if (activeSession) {
        setActiveTab('sessions');
        window.history.pushState({ level: 1, tab: 'sessions' }, '');
      } else {
        setActiveTab('home');
        window.history.pushState({ level: 1, tab: 'home' }, '');
      }
      return;
    }

    if (activeTab === 'sessions' && activeSession) {
      window.history.pushState({ level: 1, tab: 'sessions' }, '');
      return;
    }

    if (activeTab === 'home') {
      return;
    }
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
    window.history.pushState({ level, tab }, '');
  }, []);

  return { pushNavigationState };
}
