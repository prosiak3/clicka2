import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../utils/db';
import { useWeatherContext } from '../contexts/WeatherContext';

interface WeatherSnapshot {
  sessionId: string;
  weatherData: any;
  location: { lat: number; lon: number };
  providerName: string;
}

interface UseWeatherTrackingOptions {
  enabled: boolean;
  sessionId: string | null;
  isPaused: boolean;
  location: { lat: number; lon: number } | null;
  intervalMinutes?: number;
}

export function useWeatherTracking({
  enabled,
  sessionId,
  isPaused,
  location,
  intervalMinutes = 5
}: UseWeatherTrackingOptions) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [providerUsed, setProviderUsed] = useState<string>('unknown');
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { weather, refreshWeather } = useWeatherContext();

  const saveWeatherSnapshot = async (snapshot: WeatherSnapshot) => {
    try {
      console.log('[WeatherTracking] Saving weather snapshot:', snapshot);

      const { error } = await supabase
        .from('weather_snapshots')
        .insert({
          session_id: snapshot.sessionId,
          weather_data: snapshot.weatherData,
          location: snapshot.location,
          provider_name: snapshot.providerName,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('[WeatherTracking] Failed to save weather snapshot:', error);
      } else {
        console.log('[WeatherTracking] Weather snapshot saved successfully');
      }
    } catch (error) {
      console.error('[WeatherTracking] Error saving weather snapshot:', error);
    }
  };

  const fetchAndSaveWeather = useCallback(async () => {
    if (!sessionId || !location || isPaused) {
      console.log('[WeatherTracking] Skipping weather fetch:', {
        hasSessionId: !!sessionId,
        hasLocation: !!location,
        isPaused
      });
      return;
    }

    try {
      console.log(`[WeatherTracking] Fetching weather for session ${sessionId}`);
      setIsTracking(true);

      await refreshWeather(location.lat, location.lon);

      if (!weather) {
        console.warn('[WeatherTracking] No weather data available after refresh');
        return;
      }

      const providers = await supabase
        .from('weather_api_providers')
        .select('name, enabled, priority')
        .eq('enabled', true)
        .order('priority', { ascending: true });

      const providerName = providers.data?.[0]?.name || 'unknown';
      setProviderUsed(providerName);

      await saveWeatherSnapshot({
        sessionId,
        weatherData: weather,
        location,
        providerName
      });

      setLastUpdate(new Date());
      console.log(`[WeatherTracking] Weather snapshot saved for session ${sessionId}`);
    } catch (error) {
      console.error('[WeatherTracking] Failed to fetch and save weather:', error);
    } finally {
      setIsTracking(false);
    }
  }, [sessionId, location, isPaused, weather, refreshWeather]);

  useEffect(() => {
    if (!enabled || !sessionId || !location || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
      return;
    }

    console.log(`[WeatherTracking] Starting weather tracking every ${intervalMinutes} minutes`);

    fetchAndSaveWeather();

    intervalRef.current = setInterval(() => {
      fetchAndSaveWeather();
    }, intervalMinutes * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        console.log('[WeatherTracking] Stopping weather tracking');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sessionId, location?.lat, location?.lon, isPaused, intervalMinutes, fetchAndSaveWeather]);

  return {
    lastUpdate,
    providerUsed,
    isTracking,
    manualUpdate: fetchAndSaveWeather
  };
}
