import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../utils/settings';
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
    url: 'https://api.ipify.org?format=json',
    extract: async (data: any) => {
      // Get location from IP
      const geoResponse = await fetch(`https://ipwho.is/${data.ip}`);
      const geoData = await geoResponse.json();
      return {
        latitude: parseFloat(geoData.latitude),
        longitude: parseFloat(geoData.longitude)
      };
    }
  },
  {
    url: 'https://ip-api.com/json/?fields=lat,lon',
    extract: (data: any) => ({
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon)
    })
  }
];

export function useGpsTracking() {
  const settings = useSettings();
  const [state, setState] = useState<{
    status: 'connected' | 'connecting' | 'error';
    satelliteCount: number;
    coords: Location | null;
    showPermissionDialog: boolean;
  }>({
    status: 'connecting',
    satelliteCount: 0,
    coords: null,
    showPermissionDialog: false
  });

  // Function to get location via IP with better error handling and multiple services
  const getLocationViaIp = async () => {
    if (!settings.tracking.methods.ip) {
      throw new Error('IP-based location is disabled');
    }

    let lastError: Error | null = null;

    // Try each service in sequence until one works
    for (const service of IP_GEOLOCATION_SERVICES) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(service.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const coords = await service.extract(data);
        
        if (!coords.latitude || !coords.longitude) {
          throw new Error('Invalid location data received');
        }

        // Cache the successful result
        try {
          localStorage.setItem('last_ip_location', JSON.stringify({
            coords,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Failed to cache IP location:', e);
        }

        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString(),
          source: 'ip' as const,
          accuracy: 5000 // IP geolocation is typically accurate to ~5km
        };
      } catch (error) {
        console.warn(`IP geolocation failed for ${service.url}:`, error);
        lastError = error as Error;
        
        // If it's not a timeout, wait before trying the next service
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Try to use cached location if available and not too old
    try {
      const cached = localStorage.getItem('last_ip_location');
      if (cached) {
        const { coords, timestamp } = JSON.parse(cached);
        // Use cache if less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          return {
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString(),
            source: 'ip' as const,
            accuracy: 10000 // Lower accuracy for cached data
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read cached IP location:', e);
    }

    throw lastError || new Error('All IP geolocation services failed');
  };

  const getGpsLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!settings.tracking.methods.gps) {
        reject(new Error('GPS is disabled'));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('GPS timeout'));
      }, LOCATION_TIMEOUT);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        { 
          enableHighAccuracy: true,
          timeout: LOCATION_TIMEOUT,
          maximumAge: 0
        }
      );
    });
  };

  const getNetworkLocation = () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!settings.tracking.methods.network) {
        reject(new Error('Network location is disabled'));
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Network location timeout'));
      }, LOCATION_TIMEOUT);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve(position);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        { 
          enableHighAccuracy: false,
          timeout: LOCATION_TIMEOUT,
          maximumAge: 30000
        }
      );
    });
  };

  const updateLocation = useCallback(async () => {
    let retries = MAX_RETRIES;
    let permissionDenied = false;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        // Try GPS first
        if (settings.tracking.methods.gps) {
          try {
            const position = await getGpsLocation();
            if (position.coords.accuracy <= 100) {
              setState(prev => ({
                ...prev,
                status: 'connected',
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: new Date().toISOString(),
                  source: 'gps',
                  accuracy: position.coords.accuracy
                },
                satelliteCount: Math.floor(Math.random() * 8) + 4, // Simulate satellite count
                showPermissionDialog: false
              }));
              return;
            }
          } catch (error) {
            if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
              permissionDenied = true;
            }
            lastError = error as Error;
            console.warn('GPS location failed:', error);
          }
        }

        // Try network location if GPS failed or is disabled
        if (!permissionDenied && settings.tracking.methods.network) {
          try {
            const position = await getNetworkLocation();
            setState(prev => ({
              ...prev,
              status: 'connected',
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString(),
                source: 'network',
                accuracy: position.coords.accuracy
              },
              satelliteCount: 0,
              showPermissionDialog: false
            }));
            return;
          } catch (error) {
            if (error instanceof GeolocationPositionError && error.code === error.PERMISSION_DENIED) {
              permissionDenied = true;
            }
            lastError = error as Error;
            console.warn('Network location failed:', error);
          }
        }

        // Try IP location as last resort
        if (settings.tracking.methods.ip) {
          try {
            const ipLocation = await getLocationViaIp();
            setState(prev => ({
              ...prev,
              status: 'connected',
              coords: ipLocation,
              satelliteCount: 0,
              showPermissionDialog: false
            }));
            return;
          } catch (error) {
            lastError = error as Error;
            console.warn('IP location failed:', error);
          }
        }

        // If we get here, all methods failed
        throw lastError || new Error(
          permissionDenied 
            ? 'Location permission denied'
            : 'All location methods failed'
        );
      } catch (error) {
        console.error('Location error:', error);
        retries--;
        
        if (permissionDenied) {
          setState(prev => ({
            ...prev,
            status: 'error',
            showPermissionDialog: true
          }));
          return;
        }

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          continue;
        }

        setState(prev => ({
          ...prev,
          status: 'error',
          showPermissionDialog: false
        }));
      }
    }
  }, [settings.tracking.methods]);

  useEffect(() => {
    // Check if any location method is enabled
    if (!settings.tracking.methods.gps && 
        !settings.tracking.methods.network && 
        !settings.tracking.methods.ip) {
      setState(prev => ({
        ...prev,
        status: 'error',
        showPermissionDialog: false
      }));
      return;
    }

    // Initial location update
    updateLocation();

    // Set up interval for periodic updates
    const intervalId = setInterval(updateLocation, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [updateLocation]);

  const requestPermission = async () => {
    try {
      const position = await getGpsLocation();
      setState(prev => ({
        ...prev,
        status: 'connected',
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString(),
          source: 'gps',
          accuracy: position.coords.accuracy
        },
        showPermissionDialog: false
      }));
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setState(prev => ({
        ...prev,
        status: 'error',
        showPermissionDialog: true
      }));
      return false;
    }
  };

  return {
    status: state.status,
    coords: state.coords,
    satelliteCount: state.satelliteCount,
    showPermissionDialog: state.showPermissionDialog,
    requestPermission,
    hidePermissionDialog: () => setState(prev => ({ ...prev, showPermissionDialog: false }))
  };
}