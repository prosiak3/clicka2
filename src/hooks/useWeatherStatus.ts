import { useState, useEffect } from 'react';

type WeatherStatus = 'available' | 'unavailable' | 'checking';

export function useWeatherStatus() {
  const [status, setStatus] = useState<WeatherStatus>('checking');
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const checkWeatherAvailability = async () => {
      try {
        const testLat = 52.2297;
        const testLon = 21.0122;
        const testUrl = `https://api.open-meteo.com/v1/forecast?latitude=${testLat}&longitude=${testLon}&current=temperature_2m`;

        console.log('[useWeatherStatus] Checking weather API availability...');

        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(10000),
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        console.log(`[useWeatherStatus] API response: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const data = await response.json();
          console.log('[useWeatherStatus] Weather API is available', data);
          setStatus('available');
          setLastSuccessfulFetch(new Date());
          setLastError(null);
        } else {
          const errorText = await response.text();
          console.error(`[useWeatherStatus] Weather API returned error: ${response.status}`, errorText);
          setStatus('unavailable');
          setLastError(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[useWeatherStatus] Weather API check failed:', errorMessage);
        setStatus('unavailable');
        setLastError(errorMessage);
      }
    };

    checkWeatherAvailability();
    const interval = setInterval(checkWeatherAvailability, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return { status, lastSuccessfulFetch, lastError };
}
