import React from 'react';
import { Activity, Signal, Antenna, Database, MapPin, Satellite } from 'lucide-react';
import { supabase } from '../utils/db';
import { GpsPermissionDialog } from './GpsPermissionDialog';
import { useGpsTracking } from '../hooks/useGpsTracking';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useDatabaseStatus } from '../hooks/useDatabaseStatus';

interface StatusBarProps {
  isSessionActive: boolean;
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

  // Helper function to get tooltip text based on status
  const getTooltip = (type: 'session' | 'gps' | 'internet' | 'database') => {
    switch (type) {
      case 'session':
        return isPaused ? 'Session Paused' : 'Active Fishing Session';
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
        {/* Active Session Status */}
        {isSessionActive && (
          <div 
            className={`relative flex items-center gap-1 cursor-help ${
              isPaused ? 'text-orange-600' : 'text-red-600'
            }`}
            title={getTooltip('session')}
          >
            <Activity className={`w-5 h-5 ${
              isPaused ? 'animate-pulse' : 'animate-gradient-x bg-gradient-to-r from-red-500 via-red-300 to-red-500'
            }`} />
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              isPaused 
                ? 'bg-orange-500 animate-pulse' 
                : 'bg-gradient-to-r from-red-500 via-red-300 to-red-500 animate-gradient-x'
            }`} />
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