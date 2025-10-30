import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Fish, History, Settings, BarChart as ChartBar, Home, Trophy, User, Plus, ArrowLeft } from 'lucide-react';
import { CatchForm } from './components/CatchForm';
import { SessionList } from './components/SessionList';
import { SessionCard } from './components/SessionCard';
import { SettingsScreen } from './components/SettingsScreen';
import { AnalysisSection } from './components/AnalysisSection';
import { StatusBar } from './components/StatusBar';
import { InactivityWarning } from './components/InactivityWarning';
import { LoginScreen } from './components/LoginScreen';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { IosInstallPrompt } from './components/IosInstallPrompt';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminUsersScreen } from './screens/AdminUsersScreen';
import { AdminRoadmapScreen } from './screens/AdminRoadmapScreen';
import { AdminWeatherApiScreen } from './screens/AdminWeatherApiScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { FishCatch, FishingSession, User as UserType, Location } from './types';
import { saveSession, loadSessions, syncPendingSessions } from './utils/db';
import { getCurrentUser, signIn, signUp } from './utils/auth';
import { useSettings } from './utils/settings';
import { getWeatherData } from './utils/weather';
import { getCurrentLocation, useLocationPermission } from './utils/location';
import { useTranslation } from './hooks/useTranslation';
import { useGpsTracking } from './hooks/useGpsTracking';
import { useActiveSession } from './hooks/useActiveSession';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { playClickSound } from './utils/sound';

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
  const settings = useSettings();
  const t = useTranslation();
  const locationPermission = useLocationPermission();
  const { coords: currentLocation, status: locationStatus } = useGpsTracking();
  const { session: activeSession, setSession: setActiveSession } = useActiveSession();

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

  const startQuickCatch = async () => {
    if (!user) return;
    if (isStartingSession) return;

    try {
      await playClickSound();
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
        tracking_interval: settings.tracking.interval
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
        tracking_interval: settings.tracking.interval
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
    <Router>
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
                handleAddWaypoint={handleAddWaypoint}
                startNewSession={startNewSession}
                startQuickCatch={startQuickCatch}
                isStartingSession={isStartingSession}
                loadingStep={loadingStep}
                settings={settings}
                isWarningActive={isWarningActive}
                remainingSeconds={remainingSeconds}
                resetTimer={resetTimer}
                setUser={setUser}
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
  handleAddWaypoint: (location: Location) => void;
  startNewSession: () => void;
  startQuickCatch: () => void;
  isStartingSession: boolean;
  loadingStep: string | null;
  settings: any;
  isWarningActive: boolean;
  remainingSeconds: number;
  resetTimer: () => void;
  setUser: (user: UserType | null) => void;
}

interface AdminAppProps {
  user: UserType;
  setUser: (user: UserType | null) => void;
}

function AdminApp({ user, setUser }: AdminAppProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'roadmap' | 'weather-api'>('dashboard');

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
  handleAddWaypoint,
  startNewSession,
  startQuickCatch,
  isStartingSession,
  loadingStep,
  settings,
  isWarningActive,
  remainingSeconds,
  resetTimer,
  setUser,
}: MainAppProps) {
  return (
      <div className={`min-h-screen bg-gradient-to-b from-blue-50 to-white ${settings.theme === 'dark' ? 'dark' : ''}`}>
        <div className="max-w-lg mx-auto pb-11">
          {/* Header */}
          <div className="sticky top-0 bg-white backdrop-blur-sm border-b z-10 shadow-sm">
            <div className="px-3 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeTab === 'history' && selectedSession && (
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-base font-bold text-blue-900">Clicka</h1>
                    <p className="text-[9px] text-blue-600 leading-none">Better Fishing</p>
                  </div>
                </div>
                <StatusBar />
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
              <div className="space-y-6">
                {/* Quick Catch Button */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <button
                    onClick={startQuickCatch}
                    disabled={isStartingSession}
                    className={`relative w-44 h-44 rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-2xl transform transition-all ${
                      isStartingSession ? 'opacity-75 cursor-not-allowed scale-95' : 'hover:scale-110 hover:shadow-green-500/50 active:scale-95'
                    } ${!isStartingSession ? 'animate-pulse' : ''}`}
                  >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative flex flex-col items-center justify-center h-full text-white">
                      {isStartingSession && loadingStep ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
                          <span className="text-sm font-medium">
                            {loadingStep === 'checkingGPS' && 'GPS...'}
                            {loadingStep === 'gettingLocation' && 'Location...'}
                            {loadingStep === 'gettingWeather' && 'Weather...'}
                            {loadingStep === 'startingSession' && 'Starting...'}
                            {loadingStep === 'ready' && 'Ready!'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Fish className="w-14 h-14" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                              <Plus className="w-6 h-6" />
                            </div>
                          </div>
                          <span className="text-base font-bold mt-3">Quick</span>
                          <span className="text-sm font-medium">Catch</span>
                        </>
                      )}
                    </div>
                  </button>
                  <p className="text-xs text-gray-400 text-center max-w-xs">
                    Tap to quickly add a catch with automatic session start
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300" />
                  <p className="text-sm text-gray-500 font-medium">or</p>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300" />
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
                    <p className="text-blue-100 mb-6">Track your catches, monitor conditions, and improve your success rate.</p>
                    <button
                      onClick={startNewSession}
                      disabled={isStartingSession}
                      className={`w-full bg-white text-blue-600 rounded-xl py-4 px-6 font-bold shadow-lg hover:bg-blue-50 transform transition-all hover:scale-105 focus:ring-4 focus:ring-white/50 ${
                        isStartingSession ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3">
                        {isStartingSession ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                        ) : (
                          <Fish className="w-6 h-6" />
                        )}
                        <span>{isStartingSession ? 'Starting...' : 'Start Fishing'}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && activeSession && (
              <div className="space-y-6">
                {/* Add Catch Button */}
                <button
                  onClick={() => setShowCatchForm(!showCatchForm)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Catch</span>
                </button>

                {/* Add Catch Form */}
                {showCatchForm && (
                  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
                    <h2 className="text-lg font-semibold text-blue-900 mb-4">Add Catch</h2>
                    <CatchForm
                      onSave={handleCatchSave}
                      onCancel={() => setShowCatchForm(false)}
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
                  onAddWaypoint={handleAddWaypoint}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {selectedSession ? (
                  <SessionCard
                    session={selectedSession}
                    isActive={false}
                  />
                ) : (
                  <>
                    {sessions.length > 0 && sessions[0].endTime && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Last Session</h2>
                        <SessionCard
                          session={sessions[0]}
                          isActive={false}
                        />
                      </div>
                    )}
                    <div>
                      {sessions.length > 0 && sessions[0].endTime && (
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Sessions</h2>
                      )}
                      <SessionList
                        sessions={sessions.filter(s => s.endTime)}
                        onSessionSelect={setSelectedSession}
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
                onLogout={() => {
                  setUser(null);
                  window.location.href = '/login';
                }}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-lg mx-auto grid grid-cols-4 divide-x">
            {activeSession ? (
              <button
                onClick={() => {
                  setActiveTab('sessions');
                  setSelectedSession(null);
                }}
                className={`py-1.5 px-2 flex flex-col items-center relative ${
                  activeTab === 'sessions' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <div className="relative">
                  <Fish className="w-5 h-5" />
                  <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    activeSession.pauses?.some(p => !p.endTime)
                      ? 'bg-orange-500 animate-pulse'
                      : 'bg-green-500 animate-pulse'
                  }`} />
                </div>
                <span className="text-[9px] mt-0.5">Session</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className={`py-1.5 px-2 flex flex-col items-center ${
                  activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] mt-0.5">Home</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('stats')}
              className={`py-1.5 px-2 flex flex-col items-center ${
                activeTab === 'stats' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <ChartBar className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-2 flex flex-col items-center ${
                activeTab === 'history' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-1.5 px-2 flex flex-col items-center ${
                activeTab === 'settings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">Settings</span>
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
      </div>
  );
}

export default App;