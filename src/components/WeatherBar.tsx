import React, { useState, useEffect } from 'react';
import { Thermometer, Wind, Gauge, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';
import { WeatherData } from '../types';
import { getWeatherData } from '../utils/weather';
import { useGpsTracking } from '../hooks/useGpsTracking';

interface LocationName {
  city?: string;
  country?: string;
}

export function WeatherBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<LocationName | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { coords } = useGpsTracking();

  useEffect(() => {
    if (!coords) {
      setWeather(null);
      setLocationName(null);
      return;
    }

    const fetchWeather = async () => {
      try {
        const data = await getWeatherData(coords.latitude, coords.longitude);
        setWeather(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [coords?.latitude, coords?.longitude]);

  useEffect(() => {
    if (!coords) {
      setLocationName(null);
      return;
    }

    const fetchLocationName = async () => {
      setIsLoadingLocation(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=en`,
          {
            headers: {
              'User-Agent': 'Clicka-Fishing-App'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setLocationName({
            city: data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || 'Unknown',
            country: data.address?.country || ''
          });
        }
      } catch (error) {
        console.error('Error fetching location name:', error);
        setLocationName({ city: 'Unknown', country: '' });
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationName();
  }, [coords?.latitude, coords?.longitude]);

  if (!weather || !coords) {
    return null;
  }

  const formatTemperature = (temp: number) => Math.round(temp);

  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getPressureTrend = () => {
    if (!weather.pressure || weather.pressure === 1013) {
      return { icon: Minus, text: 'Stable', color: 'text-gray-500' };
    }
    if (weather.pressure > 1013) {
      return { icon: TrendingUp, text: 'Rising', color: 'text-green-600' };
    }
    return { icon: TrendingDown, text: 'Falling', color: 'text-blue-600' };
  };

  const pressureTrend = getPressureTrend();
  const PressureIcon = pressureTrend.icon;

  const feelsLike = weather.feelsLike || weather.temperature;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              {isLoadingLocation ? (
                <span className="text-sm text-gray-500 italic">Loading location...</span>
              ) : locationName ? (
                <span className="text-sm font-medium text-gray-700 truncate">
                  {locationName.city}
                  {locationName.country && `, ${locationName.country}`}
                </span>
              ) : (
                <span className="text-sm text-gray-500 italic">Unknown location</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-blue-100">
              <Thermometer className="w-4 h-4 text-red-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">
                  {formatTemperature(weather.temperature)}°C
                </span>
                <span className="text-[10px] text-gray-500">
                  feels {formatTemperature(feelsLike)}°C
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-blue-100">
              <Wind className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">
                  {Math.round(weather.windSpeed)} m/s
                </span>
                <span className="text-[10px] text-gray-500">
                  {getWindDirection(weather.windDirection || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-blue-100">
              <Gauge className="w-4 h-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">
                  {Math.round(weather.pressure)} hPa
                </span>
                <div className={`flex items-center gap-0.5 text-[10px] ${pressureTrend.color}`}>
                  <PressureIcon className="w-3 h-3" />
                  <span>{pressureTrend.text}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
