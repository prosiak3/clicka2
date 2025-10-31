import { useState, useEffect } from 'react';

type WeatherStatus = 'available' | 'unavailable' | 'checking';

export function useWeatherStatus() {
  const [status, setStatus] = useState<WeatherStatus>('checking');
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);

  useEffect(() => {
    const checkWeatherAvailability = async () => {
      try {
        const testLat = 52.2297;
        const testLon = 21.0122;
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${testLat}&longitude=${testLon}&current=temperature_2m`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
          setStatus('available');
          setLastSuccessfulFetch(new Date());
        } else {
          setStatus('unavailable');
        }
      } catch (error) {
        setStatus('unavailable');
      }
    };

    checkWeatherAvailability();
    const interval = setInterval(checkWeatherAvailability, 60000);

    return () => clearInterval(interval);
  }, []);

  return { status, lastSuccessfulFetch };
}
