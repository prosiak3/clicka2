import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Fish, History, Settings, BarChart as ChartBar, Home, Trophy, User, ArrowLeft } from 'lucide-react';
import { CatchForm } from './components/CatchForm';
import { SessionList } from './components/SessionList';
import { SessionCard } from './components/SessionCard';
import { SettingsScreen } from './components/SettingsScreen';
import { AnalysisSection } from './components/AnalysisSection';
import { StatusBar } from './components/StatusBar';
import { InactivityWarning } from './components/InactivityWarning';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { IosInstallPrompt } from './components/IosInstallPrompt';
import { TutorialManager } from './components/TutorialManager';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsersScreen } from './screens/AdminUsersScreen';
import { AdminRoadmapScreen } from './screens/AdminRoadmapScreen';
import { AdminWeatherApiScreen } from './screens/AdminWeatherApiScreen';
import { AdminFishSpeciesScreen } from './screens/AdminFishSpeciesScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { FishCatch, FishingSession, User as UserType, Location } from './types';
import { saveSession, loadSessions, syncPendingSessions, deleteSessions, updateCatch } from './utils/db';
import { getCurrentUser, signIn, signUp } from './utils/auth';
import { useSettings } from './utils/settings';
import { getWeatherData } from './utils/weather';
import { getCurrentLocation, useLocationPermission } from './utils/location';
import { useTranslation } from './hooks/useTranslation';
import { useGpsTracking } from './hooks/useGpsTracking';
import { useActiveSession } from './hooks/useActiveSession';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { useBackButton } from './hooks/useBackButton';
import { playClickSound, playReelSound } from './utils/sound';

type TabType = 'home' | 'sessions' | 'history' | 'analysis' | 'settings' | 'stats' | 'profile';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [sessions, setSessions] = useState<FishingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<FishingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [showCatchForm, setShowCatchForm] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const settings = useSettings();
  const t = useTranslation();
  const locationPermission = useLocationPermission();
  const { coords: currentLocation, status: locationStatus } = useGpsTracking();
  const { session: activeSession, setSession: setActiveSession } = useActiveSession();

  const handleEditCatch = useCallback(async (catchId: string, photos: string[], description: string) => {
    try {
      setError(null);
      await updateCatch(catchId, photos, description);

      setSessions(prev => prev.map(session => ({
        ...session,
        catches: session.catches.map(catch_ =>
          catch_.id === catchId
            ? { ...catch_, photoUrls: photos, description }
            : catch_
        )
      })));

      if (activeSession) {
        setActiveSession({
          ...activeSession,
          catches: activeSession.catches.map(catch_ =>
            catch_.id === catchId
              ? { ...catch_, photoUrls: photos, description }
              : catch_
          )
        });
      }
    } catch (err) {
      console.error('Failed to update catch:', err);
      setError('Failed to update catch. Please try again.');
    }
  }, [activeSession, setActiveSession]);

  const handleDeleteSessions = useCallback(async () => {
    if (selectedSessions.length === 0) return;

    try {
      setError(null);
      await deleteSessions(selectedSessions);
      setSessions(prev => prev.filter(s => !selectedSessions.includes(s.id)));
      setSelectedSessions([]);
      setSelectionMode(false);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete sessions:', err);
      setError('Failed to delete sessions. Please try again.');
    }
  }, [selectedSessions]);

  const handleToggleSelection = useCallback((sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  }, []);

  const handleEnterSelectionMode = useCallback((sessionId: string) => {
    setSelectionMode(true);
    setSelectedSessions([sessionId]);
  }, []);

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedSessions([]);
  }, []);

  const handleEndSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      setError(null);
      const endedSession = {
        ...activeSession,
        endTime: new Date().toISOString()
      };

      setActiveSession(null);
      setSessions(prev =>
        prev.map(s => s.id === endedSession.id ? endedSession : s)
      );

      try {
        await saveSession(endedSession);
      } catch (saveError) {
        console.error('Failed to save ended session:', saveError);
      }

      setActiveTab('home');
    } catch (error) {
      console.error('Failed to end session:', error);
      setError('Failed to end session. Please try again.');
    }
  }, [activeSession, setActiveSession]);

  const { remainingSeconds, isWarningActive, resetTimer } = useInactivityTimer({
    timeoutMinutes: settings.session.autoEndTimeout,
    warningMinutes: 5,
    enabled: !!activeSession && settings.session.autoEndEnabled,
    onTimeout: handleEndSession,
    onWarning: () => {}
  });

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (settings.display.hideScrollbar) {
      document.body.classList.add('hide-scrollbar');
    } else {
      document.body.classList.remove('hide-scrollbar');
    }
  }, [settings.display.hideScrollbar]);

  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (!user) return;

      try {
        setError(null);
        const loadedSessions = await loadSessions();

        if (!isMounted) return;

        setSessions(loadedSessions);

        if (activeSession && !activeSession.endTime) {
          const sessionExists = loadedSessions.find(s => s.id === activeSession.id);
          if (!sessionExists) {
            console.log('Active session not found in database, clearing...');
            setActiveSession(null);
          } else {
            console.log('Restored active session from localStorage');
            setActiveTab('sessions');
          }
        }

        try {
          await syncPendingSessions();
        } catch (syncError) {
          console.error('Failed to sync pending sessions:', syncError);
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
        if (isMounted) {
          setError('Failed to load sessions. Working in offline mode.');
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (activeSession && !activeSession.endTime) {
        e.preventDefault();
        e.returnValue = '';

        try {
          const updatedSession = {
            ...activeSession,
            last_activity_at: new Date().toISOString()
          };
          await saveSession(updatedSession);
        } catch (error) {
          console.error('Failed to save session before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeSession]);

  // Auto-save active session every 2 minutes to prevent data loss
  useEffect(() => {
    if (!activeSession || activeSession.endTime) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const updatedSession = {
          ...activeSession,
          last_activity_at: new Date().toISOString()
        };
        await saveSession(updatedSession);
        console.log('Auto-saved active session');
      } catch (error) {
        console.error('Failed to auto-save session:', error);
      }
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [activeSession]);

  // Real-time GPS tracking: automatically add location points to active session
  // This creates a live trail on the map as the user moves during fishing
  useEffect(() => {
    // Only track for active, non-ended sessions with valid GPS connection
    if (!activeSession || activeSession.endTime || !currentLocation || locationStatus !== 'connected') {
      return;
    }

    // Don't track when session is paused
    const isPaused = activeSession.pauses?.some(p => !p.endTime);
    if (isPaused) {
      return;
    }

    // Respect user's tracking preference
    if (!activeSession.tracking_enabled) {
      return;
    }

    const lastLocation = activeSession.locations[activeSession.locations.length - 1];
    if (!lastLocation) {
      return;
    }

    // Calculate distance between current and last location using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    };

    const distance = calculateDistance(
      lastLocation.latitude,
      lastLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );

    // Quality filters to prevent adding unnecessary or inaccurate points
    const MIN_DISTANCE = 5; // Only add point if user moved at least 5 meters
    const MAX_ACCURACY = 100; // Ignore points with accuracy worse than 100 meters

    // User hasn't moved enough - skip this update
    if (distance < MIN_DISTANCE) {
      return;
    }

    // GPS accuracy is too poor - skip to avoid cluttering trail with bad data
    if (currentLocation.accuracy > MAX_ACCURACY) {
      console.log(`Skipping location update due to low accuracy: ${currentLocation.accuracy}m`);
      return;
    }

    // Respect the configured tracking interval (default: 15 minutes)
    const timeSinceLastUpdate = new Date().getTime() - new Date(lastLocation.timestamp).getTime();
    const minUpdateInterval = (activeSession.tracking_interval || settings.tracking.interval) * 60 * 1000;

    if (timeSinceLastUpdate < minUpdateInterval) {
      return;
    }

    // All checks passed - add new location point to the trail
    const newLocation: Location = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date().toISOString(),
      source: currentLocation.source,
      accuracy: currentLocation.accuracy
    };

    const updatedSession = {
      ...activeSession,
      locations: [...activeSession.locations, newLocation],
      last_activity_at: new Date().toISOString()
    };

    // Update local state to immediately show the new point on the map
    setActiveSession(updatedSession);
    setSessions(prev =>
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );

    // Persist to database asynchronously
    saveSession(updatedSession).catch(error => {
      console.error('Failed to save location update:', error);
    });

    console.log(`Added GPS point: distance=${distance.toFixed(1)}m, accuracy=${currentLocation.accuracy}m, source=${currentLocation.source}`);
  }, [currentLocation, locationStatus, activeSession, setActiveSession, settings.tracking.interval]);

  const startQuickCatch = async () => {
    if (!user) return;
    if (isStartingSession) return;

    try {
      await playReelSound();
      setIsStartingSession(true);
      setError(null);
      setLoadingStep('checkingGPS');

      if (locationPermission === 'denied') {
        throw new Error('Location access is required. Please enable it in your browser settings and refresh the page.');
      }

      setLoadingStep('gettingLocation');
      if (!currentLocation || locationStatus === 'error') {
        throw new Error('Could not get your location. Please check your GPS settings and try again.');
      }

      setLoadingStep('gettingWeather');
      let initialWeather;
      try {
        initialWeather = await getWeatherData(
          currentLocation.latitude,
          currentLocation.longitude
        );
      } catch (weatherError) {
        console.error('Weather fetch failed:', weatherError);
        initialWeather = {
          temperature: 20,
          pressure: 1013,
          pressureTrend: 'stable',
          windSpeed: 0,
          windDirection: 'N',
          cloudCover: 0,
          precipitation: 0,
          precipitationType: 'none',
          precipitationProbability: 0
        };
      }

      setLoadingStep('startingSession');
      const newSession: FishingSession = {
        id: crypto.randomUUID(),
        userId: user.id,
        startTime: new Date().toISOString(),
        initialWeather,
        weather: initialWeather,
        locations: [{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date().toISOString(),
          source: currentLocation.source,
          accuracy: currentLocation.accuracy
        }],
        catches: [],
        synced: false,
        tracking_enabled: true,
        tracking_interval: settings.tracking.interval,
        last_activity_at: new Date().toISOString(),
        resumed_count: 0
      };

      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      setActiveTab('sessions');
      setShowCatchForm(true);

      try {
        await saveSession(newSession);
      } catch (saveError) {
        console.error('Failed to save new session:', saveError);
      }

      setLoadingStep('ready');
      setTimeout(() => setLoadingStep(null), 500);
    } catch (error) {
      console.error('Failed to start quick catch:', error);
      setError(error instanceof Error ? error.message : 'Failed to start quick catch. Please check your connection.');
      setLoadingStep(null);
    } finally {
      setIsStartingSession(false);
    }
  };

  const startNewSession = async () => {
    if (!user) return;
    if (isStartingSession) return;

    try {
      setIsStartingSession(true);
      setError(null);

      if (locationPermission === 'denied') {
        throw new Error('Location access is required. Please enable it in your browser settings and refresh the page.');
      }

      if (!currentLocation || locationStatus === 'error') {
        throw new Error('Could not get your location. Please check your GPS settings and try again.');
      }

      let initialWeather;
      try {
        initialWeather = await getWeatherData(
          currentLocation.latitude,
          currentLocation.longitude
        );
      } catch (weatherError) {
        console.error('Weather fetch failed:', weatherError);
        initialWeather = {
          temperature: 20,
          pressure: 1013,
          pressureTrend: 'stable',
          windSpeed: 0,
          windDirection: 'N',
          cloudCover: 0,
          precipitation: 0,
          precipitationType: 'none',
          precipitationProbability: 0
        };
      }

      const newSession: FishingSession = {
        id: crypto.randomUUID(),
        userId: user.id,
        startTime: new Date().toISOString(),
        initialWeather,
        weather: initialWeather,
        locations: [{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date().toISOString(),
          source: currentLocation.source,
          accuracy: currentLocation.accuracy
        }],
        catches: [],
        synced: false,
        tracking_enabled: true,
        tracking_interval: settings.tracking.interval,
        last_activity_at: new Date().toISOString(),
        resumed_count: 0
      };
      
      setSessions(prev => [newSession, ...prev]);
      setActiveSession(newSession);
      setActiveTab('sessions');

      try {
        await saveSession(newSession);
      } catch (saveError) {
        console.error('Failed to save new session:', saveError);
      }
    } catch (error) {
      console.error('Failed to start new session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start new session. Please check your connection.');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleCatchSave = async (catchData: Omit<FishCatch, 'id' | 'sessionId'>) => {
    if (!activeSession) return;

    try {
      setError(null);
      const newCatch: FishCatch = {
        ...catchData,
        id: crypto.randomUUID(),
        sessionId: activeSession.id
      };

      const updatedSession = {
        ...activeSession,
        catches: [...activeSession.catches, newCatch]
      };

      setActiveSession(updatedSession);
      setSessions(prev => 
        prev.map(s => s.id === updatedSession.id ? updatedSession : s)
      );

      try {
        await saveSession(updatedSession);
      } catch (saveError) {
        console.error('Failed to save catch:', saveError);
      }

      setShowCatchForm(false);
    } catch (error) {
      console.error('Failed to save catch:', error);
      setError('Failed to save catch. Please try again.');
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;

    try {
      setError(null);
      const now = new Date().toISOString();
      
      const updatedSession = {
        ...activeSession,
        pauses: [
          ...(activeSession.pauses || []),
          { startTime: now }
        ]
      };

      setActiveSession(updatedSession);
      setSessions(prev =>
        prev.map(s => s.id === updatedSession.id ? updatedSession : s)
      );

      try {
        await saveSession(updatedSession);
      } catch (saveError) {
        console.error('Failed to save paused session:', saveError);
      }
    } catch (error) {
      console.error('Failed to pause session:', error);
      setError('Failed to pause session. Please try again.');
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;

    try {
      setError(null);
      const now = new Date().toISOString();
      
      const pauses = [...(activeSession.pauses || [])];
      const lastPause = pauses[pauses.length - 1];
      
      if (lastPause && !lastPause.endTime) {
        lastPause.endTime = now;
        const pauseDuration = Math.round(
          (new Date(now).getTime() - new Date(lastPause.startTime).getTime()) / (1000 * 60)
        );
        
        const updatedSession = {
          ...activeSession,
          pauses,
          totalPauseTime: (activeSession.totalPauseTime || 0) + pauseDuration
        };

        setActiveSession(updatedSession);
        setSessions(prev =>
          prev.map(s => s.id === updatedSession.id ? updatedSession : s)
        );

        try {
          await saveSession(updatedSession);
        } catch (saveError) {
          console.error('Failed to save resumed session:', saveError);
        }
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
      setError('Failed to resume session. Please try again.');
    }
  };

  const handleDiscardSession = () => {
    if (!activeSession) return;

    setActiveSession(null);
    setSessions(prev => prev.filter(s => s.id !== activeSession.id));
    setActiveTab('home');
  };

  const handleResumeClosedSession = useCallback(async (sessionId: string) => {
    if (!user) return;

    try {
      setError(null);
      const sessionToResume = sessions.find(s => s.id === sessionId);

      if (!sessionToResume) {
        throw new Error('Session not found');
      }

      if (!sessionToResume.endTime) {
        throw new Error('Session is not closed');
      }

      const resumedSession: FishingSession = {
        ...sessionToResume,
        endTime: undefined,
        resumed_count: (sessionToResume.resumed_count || 0) + 1,
        last_activity_at: new Date().toISOString()
      };

      setActiveSession(resumedSession);
      setSessions(prev =>
        prev.map(s => s.id === sessionId ? resumedSession : s)
      );

      try {
        await saveSession(resumedSession);
      } catch (saveError) {
        console.error('Failed to save resumed session:', saveError);
      }

      setActiveTab('sessions');
    } catch (error) {
      console.error('Failed to resume closed session:', error);
      setError(error instanceof Error ? error.message : 'Failed to resume session. Please try again.');
    }
  }, [user, sessions, setActiveSession]);

  const handleAddWaypoint = async (location: Location) => {
    if (!activeSession) return;

    try {
      setError(null);
      const updatedSession = {
        ...activeSession,
        locations: [...activeSession.locations, location]
      };

      setActiveSession(updatedSession);
      setSessions(prev =>
        prev.map(s => s.id === updatedSession.id ? updatedSession : s)
      );

      try {
        await saveSession(updatedSession);
      } catch (saveError) {
        console.error('Failed to save waypoint:', saveError);
      }
    } catch (error) {
      console.error('Failed to add waypoint:', error);
      setError('Failed to add waypoint. Please try again.');
    }
  };

  const handleLoginSuccess = async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />
        } />
        <Route path="/roadmap" element={<RoadmapScreen />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={!!user} isLoading={isLoading}>
            {user?.role === 'admin' ? (
              <AdminApp user={user} setUser={setUser} />
            ) : (
              <MainApp
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sessions={sessions}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                error={error}
                user={user!}
                activeSession={activeSession}
                showCatchForm={showCatchForm}
                setShowCatchForm={setShowCatchForm}
                handleCatchSave={handleCatchSave}
                handleEndSession={handleEndSession}
                handleDiscardSession={handleDiscardSession}
                handlePauseSession={handlePauseSession}
                handleResumeSession={handleResumeSession}
                handleResumeClosedSession={handleResumeClosedSession}
                handleAddWaypoint={handleAddWaypoint}
                handleEditCatch={handleEditCatch}
                startNewSession={startNewSession}
                startQuickCatch={startQuickCatch}
                isStartingSession={isStartingSession}
                loadingStep={loadingStep}
                settings={settings}
                isWarningActive={isWarningActive}
                remainingSeconds={remainingSeconds}
                resetTimer={resetTimer}
                setUser={setUser}
                selectionMode={selectionMode}
                selectedSessions={selectedSessions}
                onToggleSelection={handleToggleSelection}
                onEnterSelectionMode={handleEnterSelectionMode}
                onCancelSelection={handleCancelSelection}
                onDeleteSessions={() => setShowDeleteConfirm(true)}
                showDeleteConfirm={showDeleteConfirm}
                onConfirmDelete={handleDeleteSessions}
                onCancelDelete={() => setShowDeleteConfirm(false)}
              />
            )}
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

interface MainAppProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sessions: FishingSession[];
  selectedSession: FishingSession | null;
  setSelectedSession: (session: FishingSession | null) => void;
  error: string | null;
  user: UserType;
  activeSession: FishingSession | null;
  showCatchForm: boolean;
  setShowCatchForm: (show: boolean) => void;
  handleCatchSave: (catchData: Omit<FishCatch, 'id' | 'sessionId'>) => void;
  handleEndSession: () => void;
  handleDiscardSession: () => void;
  handlePauseSession: () => void;
  handleResumeSession: () => void;
  handleResumeClosedSession: (sessionId: string) => void;
  handleAddWaypoint: (location: Location) => void;
  handleEditCatch: (catchId: string, photos: string[], description: string) => Promise<void>;
  startNewSession: () => void;
  startQuickCatch: () => void;
  isStartingSession: boolean;
  loadingStep: string | null;
  settings: any;
  isWarningActive: boolean;
  remainingSeconds: number;
  resetTimer: () => void;
  setUser: (user: UserType | null) => void;
  selectionMode: boolean;
  selectedSessions: string[];
  onToggleSelection: (sessionId: string) => void;
  onEnterSelectionMode: (sessionId: string) => void;
  onCancelSelection: () => void;
  onDeleteSessions: () => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

interface AdminAppProps {
  user: UserType;
  setUser: (user: UserType | null) => void;
}

function AdminApp({ user, setUser }: AdminAppProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'roadmap' | 'weather-api' | 'fish-species'>('dashboard');

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AdminLayout
      user={user}
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === 'dashboard' && <AdminDashboard />}
      {currentView === 'users' && <AdminUsersScreen user={user} />}
      {currentView === 'fish-species' && <AdminFishSpeciesScreen />}
      {currentView === 'roadmap' && <AdminRoadmapScreen user={user} />}
      {currentView === 'weather-api' && <AdminWeatherApiScreen />}
    </AdminLayout>
  );
}

function MainApp({
  activeTab,
  setActiveTab,
  sessions,
  selectedSession,
  setSelectedSession,
  error,
  user,
  activeSession,
  showCatchForm,
  setShowCatchForm,
  handleCatchSave,
  handleEndSession,
  handleDiscardSession,
  handlePauseSession,
  handleResumeSession,
  handleResumeClosedSession,
  handleAddWaypoint,
  handleEditCatch,
  startNewSession,
  startQuickCatch,
  isStartingSession,
  loadingStep,
  settings,
  isWarningActive,
  remainingSeconds,
  resetTimer,
  setUser,
  selectionMode,
  selectedSessions,
  onToggleSelection,
  onEnterSelectionMode,
  onCancelSelection,
  onDeleteSessions,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: MainAppProps) {
  const t = useTranslation();

  const { pushNavigationState } = useBackButton({
    activeTab,
    setActiveTab,
    showCatchForm,
    setShowCatchForm,
    selectedSession,
    setSelectedSession,
    activeSession,
    selectionMode,
    onCancelSelection,
  });

  return (
      <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white ${settings.theme === 'dark' ? 'dark' : ''}`}>
        <div className="max-w-lg mx-auto pb-11">
          {/* Header */}
          <div className="sticky top-0 bg-white backdrop-blur-sm border-b z-10 shadow-sm">
            <div className="px-3 py-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeTab === 'history' && selectedSession && (
                    <button
                      onClick={() => {
                        setSelectedSession(null);
                        pushNavigationState(2, 'history');
                      }}
                      className="p-0.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3 text-gray-600" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-sm font-bold text-blue-900">Clicka</h1>
                    <p className="text-[8px] text-blue-600 leading-none">Better Fishing</p>
                  </div>
                </div>
                <StatusBar onLogout={() => {
                  setUser(null);
                  window.location.href = '/login';
                }} />
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="p-4">
            {activeTab === 'home' && !activeSession && (
              <div className="space-y-6" data-tutorial="home-screen">
                {/* Quick Catch Button */}
                <div className="flex justify-center items-center pt-2">
                  <button
                    onClick={startQuickCatch}
                    disabled={isStartingSession}
                    className={`touch-target-min relative rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-2xl transition-all touch-feedback ${
                      isStartingSession ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'
                    }`}
                    style={{ width: '200px', height: '200px' }}
                  >
                    <div className="relative flex flex-col items-center justify-center h-full text-white">
                      {isStartingSession && loadingStep ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full border-b-2 border-white" style={{ width: '60px', height: '60px' }} />
                          <span className="text-base font-semibold">
                            {loadingStep === 'checkingGPS' && 'GPS...'}
                            {loadingStep === 'gettingLocation' && 'Location...'}
                            {loadingStep === 'gettingWeather' && 'Weather...'}
                            {loadingStep === 'startingSession' && 'Starting...'}
                            {loadingStep === 'ready' && 'Ready!'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Fish style={{ width: '80px', height: '80px' }} />
                          <span className="text-xl font-bold mt-2">Quick</span>
                          <span className="text-lg font-medium">Catch</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {/* Hero Section with Start Fishing Button */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg">
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#wave)" />
                      <defs>
                        <pattern id="wave" patternUnits="userSpaceOnUse" width="100" height="100">
                          <path d="M0,50 Q25,45 50,50 T100,50 T150,50" fill="none" stroke="white" strokeWidth="2" />
                        </pattern>
                      </defs>
                    </svg>
                  </div>
                  <div className="relative">
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Fish?</h2>
                    <p className="text-blue-100 mb-5 text-base">Add catches, improve your success rate in fishing.</p>
                    <button
                      data-tutorial="start-fishing-button"
                      onClick={startNewSession}
                      disabled={isStartingSession}
                      className={`touch-target-min w-full bg-white text-blue-600 rounded-xl py-5 px-6 font-bold text-xl shadow-lg hover:bg-blue-50 transform transition-all active:scale-95 focus:ring-4 focus:ring-white/50 touch-feedback ${
                        isStartingSession ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {isStartingSession ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                        ) : (
                          <Fish className="w-7 h-7" />
                        )}
                        <span>{isStartingSession ? 'Starting...' : 'Start Fishing'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && activeSession && (
              <div className="space-y-5" data-tutorial="active-session">
                {/* Add Catch Button and Catch Counter */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-md border-2 border-blue-200">
                    <div className="flex flex-col items-center">
                      <div className="text-5xl font-bold text-blue-900">
                        {activeSession.catches?.length || 0}
                      </div>
                      <div className="text-xs font-semibold text-blue-700 mt-1">
                        {t.session.catchesInSession}
                      </div>
                    </div>
                  </div>

                  <button
                    data-tutorial="add-catch-button"
                    onClick={async () => {
                      await playReelSound();
                      if (!showCatchForm) {
                        pushNavigationState(3, 'sessions');
                      }
                      setShowCatchForm(!showCatchForm);
                    }}
                    disabled={showCatchForm}
                    className={`touch-target-min relative w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-xl transform transition-all duration-300 touch-feedback ${
                      showCatchForm ? 'opacity-75 cursor-not-allowed scale-90' : 'active:scale-90 hover:shadow-2xl animate-pulse-slow'
                    }`}
                    style={{
                      animation: showCatchForm ? 'none' : 'pulse-glow 2s ease-in-out infinite'
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" style={{ animationDuration: '3s' }} />
                    <div className="relative flex flex-col items-center justify-center h-full text-white">
                      <Fish className="w-12 h-12" />
                      <span className="text-sm font-bold mt-2">{t.session.addCatch.split(' ')[0]}</span>
                      <span className="text-xs font-medium">{t.session.addCatch.split(' ')[1] || 'Catch'}</span>
                    </div>
                  </button>
                </div>

                {/* Add Catch Form */}
                {showCatchForm && (
                  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100" data-tutorial="catch-form">
                    <CatchForm
                      onSave={handleCatchSave}
                      onCancel={() => {
                        setShowCatchForm(false);
                        pushNavigationState(1, 'sessions');
                      }}
                      selectedSpecies={settings.fishSpecies.filter(s => s.enabled)}
                    />
                  </div>
                )}

                <SessionCard
                  session={activeSession}
                  isActive={true}
                  onEndSession={handleEndSession}
                  onDiscardSession={handleDiscardSession}
                  onPauseSession={handlePauseSession}
                  onResumeSession={handleResumeSession}
                  onResumeClosedSession={handleResumeClosedSession}
                  onAddWaypoint={handleAddWaypoint}
                  onEditCatch={handleEditCatch}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {selectedSession ? (
                  <SessionCard
                    session={selectedSession}
                    isActive={false}
                    onEditCatch={handleEditCatch}
                    onResumeClosedSession={handleResumeClosedSession}
                  />
                ) : (
                  <>
                    {sessions.length > 0 && sessions[0].endTime && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Last Session</h2>
                        <SessionCard
                          session={sessions[0]}
                          isActive={false}
                          onEditCatch={handleEditCatch}
                          onResumeClosedSession={handleResumeClosedSession}
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        {sessions.length > 0 && sessions[0].endTime && (
                          <h2 className="text-xl font-semibold text-gray-900">All Sessions</h2>
                        )}
                        {selectionMode && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={onCancelSelection}
                              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={onDeleteSessions}
                              disabled={selectedSessions.length === 0}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Delete ({selectedSessions.length})
                            </button>
                          </div>
                        )}
                      </div>
                      <SessionList
                        sessions={sessions.filter(s => s.endTime)}
                        onSessionSelect={(session) => {
                          setSelectedSession(session);
                          pushNavigationState(3, 'history');
                        }}
                        selectionMode={selectionMode}
                        selectedSessions={selectedSessions}
                        onToggleSelection={onToggleSelection}
                        onEnterSelectionMode={onEnterSelectionMode}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <AnalysisSection sessions={sessions} />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                user={user}
                setUser={setUser}
                onLogout={() => {
                  setUser(null);
                  window.location.href = '/login';
                }}
                onNavigateHome={() => setActiveTab('home')}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-bottom">
          <div className="max-w-lg mx-auto grid grid-cols-4">
            {activeSession ? (
              <button
                onClick={() => {
                  setActiveTab('sessions');
                  setSelectedSession(null);
                  pushNavigationState(1, 'sessions');
                }}
                className={`py-3 px-3 flex flex-col items-center gap-1 relative touch-feedback transition-colors ${
                  activeTab === 'sessions' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <Fish className="w-6 h-6" />
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                    activeSession.pauses?.some(p => !p.endTime)
                      ? 'bg-orange-500 animate-pulse'
                      : 'bg-green-500 animate-pulse'
                  }`} />
                </div>
                <span className="text-[10px] font-medium">Session</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveTab('home');
                  pushNavigationState(1, 'home');
                }}
                className={`py-3 px-3 flex flex-col items-center gap-1 touch-feedback transition-colors ${
                  activeTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">Home</span>
              </button>
            )}

            <button
              data-tutorial="stats-tab"
              onClick={() => {
                setActiveTab('stats');
                pushNavigationState(2, 'stats');
              }}
              className={`py-3 px-3 flex flex-col items-center gap-1 touch-feedback transition-colors ${
                activeTab === 'stats' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ChartBar className="w-6 h-6" />
              <span className="text-[10px] font-medium">Stats</span>
            </button>

            <button
              data-tutorial="history-tab"
              onClick={() => {
                setActiveTab('history');
                pushNavigationState(2, 'history');
              }}
              className={`py-3 px-3 flex flex-col items-center gap-1 touch-feedback transition-colors ${
                activeTab === 'history' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History className="w-6 h-6" />
              <span className="text-[10px] font-medium">History</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                pushNavigationState(2, 'settings');
              }}
              className={`py-3 px-3 flex flex-col items-center gap-1 touch-feedback transition-colors ${
                activeTab === 'settings' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-medium">Settings</span>
            </button>
          </div>
        </nav>

        <InactivityWarning
          isOpen={isWarningActive}
          remainingSeconds={remainingSeconds}
          onExtend={resetTimer}
          onEndSession={handleEndSession}
          onClose={resetTimer}
        />

        <PwaInstallPrompt />
        <IosInstallPrompt />
        <TutorialManager userId={user?.id || null} isAuthenticated={!!user} />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={onCancelDelete}
          onConfirm={onConfirmDelete}
          title="Delete Sessions"
          message={`Are you sure you want to delete ${selectedSessions.length} session${selectedSessions.length > 1 ? 's' : ''}? This action cannot be undone and will delete all associated catches.`}
          confirmText="Delete"
          confirmColor="red"
        />
      </div>
  );
}

export default App;