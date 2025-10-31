import React, { useState, useEffect } from 'react';
import { Signal, Antenna, Database, MapPin, Satellite, User, Shield, Cloud, CloudOff } from 'lucide-react';
import { supabase } from '../utils/db';
import { GpsPermissionDialog } from './GpsPermissionDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { signOut } from '../utils/auth';
import { useGpsTracking } from '../hooks/useGpsTracking';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';
import { useWeatherStatus } from '../hooks/useWeatherStatus';

interface StatusBarProps {
  isSessionActive?: boolean;
  isPaused?: boolean;
  onLogout?: () => void;
}

export function StatusBar({ isSessionActive, isPaused, onLogout }: StatusBarProps) {
  const {
    status: gpsStatus,
    satelliteCount,
    coords,
    showPermissionDialog,
    requestPermission,
    hidePermissionDialog
  } = useGpsTracking();

  const internetStatus = useOnlineStatus();
  const dbStatus = useDatabaseStatus();
  const { status: weatherStatus, lastSuccessfulFetch, lastError } = useWeatherStatus();

  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        console.log('User profile query:', { profile, error, userId: user.id });

        setUserInfo({
          email: user.email || 'Unknown',
          role: profile?.role || 'user'
        });
      }
    };

    fetchUserInfo();
  }, []);

  // Helper function to get tooltip text based on status
  const getTooltip = (type: 'gps' | 'internet' | 'database' | 'weather') => {
    switch (type) {
      case 'gps':
        if (gpsStatus === 'connected' && coords) {
          const sourceText = coords.source === 'gps'
            ? `GPS (${satelliteCount} satellites)`
            : coords.source === 'network'
              ? 'Network Location'
              : 'IP Location';
          return `Location via ${sourceText} - Accuracy: ${Math.round(coords.accuracy)}m`;
        }
        if (gpsStatus === 'connecting') {
          return 'Getting Location...';
        }
        return 'Location Error - Click to enable access';
      case 'internet':
        return `Internet ${internetStatus === 'online' ? 'Connected' : 'Offline'}`;
      case 'database':
        if (dbStatus === 'connected') {
          return 'Database Connected';
        }
        if (dbStatus === 'connecting') {
          return 'Connecting to Database...';
        }
        return 'Database Connection Error';
      case 'weather':
        if (weatherStatus === 'available') {
          const lastFetchTime = lastSuccessfulFetch ? ` (Last: ${lastSuccessfulFetch.toLocaleTimeString()})` : '';
          return `Weather API Available - Live data${lastFetchTime}`;
        }
        if (weatherStatus === 'checking') {
          return 'Checking Weather API...';
        }
        const errorInfo = lastError ? ` - ${lastError}` : '';
        return `Weather API Unavailable${errorInfo} - Using estimated data`;
    }
  };

  const getLocationIcon = () => {
    if (!coords) return Signal;
    switch (coords.source) {
      case 'gps':
        return Satellite;
      case 'network':
        return Antenna;
      case 'ip':
        return MapPin;
    }
  };

  const LocationIcon = getLocationIcon();

  return (
    <>
      <div className="flex items-center gap-3">
        {/* User Info */}
        {userInfo && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            title="Click to logout"
          >
            {userInfo.role === 'admin' ? (
              <Shield className="w-4 h-4 text-red-600" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">{userInfo.email}</span>
            {userInfo.role === 'admin' && (
              <span className="text-[10px] font-bold text-red-600 uppercase">Admin</span>
            )}
          </button>
        )}

        {/* Location Status with Source Indicator */}
        <button
          onClick={() => {
            if (gpsStatus === 'error') {
              requestPermission();
            }
          }}
          className={`relative flex items-center gap-1 cursor-help ${
            gpsStatus === 'connected' ? 'text-green-600' :
            gpsStatus === 'connecting' ? 'text-yellow-600' :
            'text-red-600'
          }`}
          title={getTooltip('gps')}
        >
          <LocationIcon className={`w-5 h-5 ${
            gpsStatus === 'connecting' ? 'animate-pulse' : ''
          }`} />
          {coords?.source === 'gps' && satelliteCount > 0 && (
            <div className="absolute -top-2 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full animate-pulse">
              {satelliteCount}
            </div>
          )}
          {gpsStatus === 'error' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </button>

        {/* Internet Status */}
        <div 
          className={`flex items-center gap-1 cursor-help ${
            internetStatus === 'online' ? 'text-green-600' : 'text-red-600'
          }`}
          title={getTooltip('internet')}
        >
          <Signal className={`w-5 h-5 ${
            internetStatus === 'offline' ? 'animate-pulse' : ''
          }`} />
          {internetStatus === 'offline' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Database Status */}
        <div
          className={`flex items-center gap-1 cursor-help ${
            dbStatus === 'connected' ? 'text-green-600' :
            dbStatus === 'connecting' ? 'text-yellow-600' :
            'text-red-600'
          }`}
          title={getTooltip('database')}
        >
          <Database className={`w-5 h-5 ${
            dbStatus === 'connecting' ? 'animate-pulse' : ''
          }`} />
          {dbStatus === 'error' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Weather Status */}
        <div
          className={`flex items-center gap-1 cursor-help ${
            weatherStatus === 'available' ? 'text-green-600' :
            weatherStatus === 'checking' ? 'text-yellow-600' :
            'text-orange-600'
          }`}
          title={getTooltip('weather')}
        >
          {weatherStatus === 'available' ? (
            <Cloud className={`w-5 h-5 ${
              weatherStatus === 'checking' ? 'animate-pulse' : ''
            }`} />
          ) : (
            <CloudOff className={`w-5 h-5 ${
              weatherStatus === 'checking' ? 'animate-pulse' : ''
            }`} />
          )}
          {weatherStatus === 'unavailable' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
          )}
        </div>
      </div>

      <GpsPermissionDialog
        isOpen={showPermissionDialog}
        onClose={hidePermissionDialog}
        onRequestPermission={requestPermission}
      />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          if (isLoggingOut) return;
          setIsLoggingOut(true);
          try {
            await signOut();
            if (onLogout) {
              onLogout();
            } else {
              window.location.href = '/login';
            }
          } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
          }
        }}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText={isLoggingOut ? 'Logging out...' : 'Logout'}
        confirmColor="blue"
      />
    </>
  );
}