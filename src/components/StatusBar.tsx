import React, { useState, useEffect } from 'react';
import { Signal, Antenna, Database, MapPin, Satellite, User, Shield } from 'lucide-react';
import { supabase } from '../utils/db';
import { GpsPermissionDialog } from './GpsPermissionDialog';
import { useGpsTracking } from '../hooks/useGpsTracking';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';

interface StatusBarProps {
  isSessionActive?: boolean;
  isPaused?: boolean;
}

export function StatusBar({ isSessionActive, isPaused }: StatusBarProps) {
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

  const [userInfo, setUserInfo] = useState<{ email: string; role: string } | null>(null);

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
  const getTooltip = (type: 'gps' | 'internet' | 'database') => {
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
          <div
            className="flex items-center gap-1.5 cursor-help text-gray-700 bg-gray-100 px-2 py-1 rounded"
            title={`Logged in as: ${userInfo.email}\nRole: ${userInfo.role}`}
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
          </div>
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
      </div>

      <GpsPermissionDialog
        isOpen={showPermissionDialog}
        onClose={hidePermissionDialog}
        onRequestPermission={requestPermission}
      />
    </>
  );
}