import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WeatherData } from '../types';
import { getWeatherData } from '../utils/weather';

interface WeatherContextType {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshWeather: (lat: number, lon: number) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);

  const refreshWeather = useCallback(async (lat: number, lon: number) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[WeatherContext] Fetching weather for:', { lat, lon });
      const data = await getWeatherData(lat, lon);

      setWeather(data);
      setLastUpdate(new Date());
      setCurrentCoords({ lat, lon });

      console.log('[WeatherContext] Weather updated:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      console.error('[WeatherContext] Error fetching weather:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <WeatherContext.Provider
      value={{
        weather,
        isLoading,
        error,
        lastUpdate,
        refreshWeather,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeatherContext() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeatherContext must be used within a WeatherProvider');
  }
  return context;
}
