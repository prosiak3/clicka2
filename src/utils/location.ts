import { useState, useEffect } from 'react';
import { useSettings } from './settings';
import { Location } from '../types';

const LOCATION_TIMEOUT = 15000; // 15 seconds
const HIGH_ACCURACY_TIMEOUT = 10000; // 10 seconds
const LOW_ACCURACY_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// IP geolocation services
const IP_GEOLOCATION_SERVICES = [
  {
    url: 'https://ipapi.co/json/',
    extract: (data: any) => ({
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    })
  }
];

export const getCurrentLocation = async (retryCount = 0): Promise<Location> => {
  const settings = useSettings.getState();

  const getLocationWithOptions = (options: LocationOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out'));
      }, options.timeout || LOCATION_TIMEOUT);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        options
      );
    });
  };

  // Function to get location via IP
  const getLocationViaIp = async (): Promise<Location> => {
    if (!settings.tracking.methods.ip) {
      throw new Error('IP-based location is disabled');
    }

    for (const service of IP_GEOLOCATION_SERVICES) {
      try {
        const response = await fetch(service.url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const coords = service.extract(data);
        
        if (coords.latitude && coords.longitude) {
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString(),
            source: 'ip',
            accuracy: 5000 // IP geolocation is typically accurate to ~5km
          };
        }
      } catch (error) {
        console.warn(`IP geolocation failed for ${service.url}:`, error);
      }
    }
    
    throw new Error('IP geolocation failed');
  };

  try {
    // Try GPS first if enabled
    if (settings.tracking.methods.gps) {
      try {
        const position = await getLocationWithOptions({
          enableHighAccuracy: true,
          timeout: HIGH_ACCURACY_TIMEOUT,
          maximumAge: 0
        });

        if (position.coords.accuracy <= 100) {
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            source: 'gps',
            accuracy: position.coords.accuracy
          };
        }
      } catch (error) {
        console.warn('GPS location failed:', error);
      }
    }

    // Try network location if enabled
    if (settings.tracking.methods.network) {
      try {
        const position = await getLocationWithOptions({
          enableHighAccuracy: false,
          timeout: LOW_ACCURACY_TIMEOUT,
          maximumAge: 30000
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          source: 'network',
          accuracy: position.coords.accuracy
        };
      } catch (error) {
        console.warn('Network location failed:', error);
      }
    }

    // Try IP location as last resort
    if (settings.tracking.methods.ip) {
      return await getLocationViaIp();
    }

    throw new Error('All location methods failed');
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getCurrentLocation(retryCount + 1);
    }

    let message = 'Failed to get location';
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Please enable location access in your browser settings and refresh the page';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is currently unavailable. Please check your GPS settings';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out. Please try again';
          break;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }
    throw new Error(message);
  }
};

export const useLocationPermission = (): PermissionState => {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const settings = useSettings();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!navigator.permissions) {
          // If permissions API is not available, check if geolocation is available
          if (navigator.geolocation) {
            // Try to get location once to trigger permission prompt
            navigator.geolocation.getCurrentPosition(
              () => setPermission('granted'),
              (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                  setPermission('denied');
                } else {
                  setPermission('prompt');
                }
              }
            );
          }
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state);

        result.addEventListener('change', () => {
          setPermission(result.state);
        });
      } catch (error) {
        console.error('Failed to check location permission:', error);
        setPermission('prompt');
      }
    };

    // Only check permission if GPS tracking is enabled
    if (settings.tracking.methods.gps) {
      checkPermission();
    }
  }, [settings.tracking.methods.gps]);

  return permission;
};