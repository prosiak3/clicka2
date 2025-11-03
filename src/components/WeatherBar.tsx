import React, { useState, useEffect } from 'react';
import { Thermometer, Wind, Gauge, TrendingUp, TrendingDown, Minus, MapPin, ArrowUp } from 'lucide-react';
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

  const getBeaufortScale = (windSpeed: number): { scale: number; description: string } => {
    if (windSpeed < 0.5) return { scale: 0, description: 'Calm' };
    if (windSpeed < 1.6) return { scale: 1, description: 'Light air' };
    if (windSpeed < 3.4) return { scale: 2, description: 'Light breeze' };
    if (windSpeed < 5.5) return { scale: 3, description: 'Gentle breeze' };
    if (windSpeed < 8.0) return { scale: 4, description: 'Moderate breeze' };
    if (windSpeed < 10.8) return { scale: 5, description: 'Fresh breeze' };
    if (windSpeed < 13.9) return { scale: 6, description: 'Strong breeze' };
    if (windSpeed < 17.2) return { scale: 7, description: 'Near gale' };
    if (windSpeed < 20.8) return { scale: 8, description: 'Gale' };
    if (windSpeed < 24.5) return { scale: 9, description: 'Strong gale' };
    if (windSpeed < 28.5) return { scale: 10, description: 'Storm' };
    if (windSpeed < 32.7) return { scale: 11, description: 'Violent storm' };
    return { scale: 12, description: 'Hurricane' };
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
  const beaufort = getBeaufortScale(weather.windSpeed);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200 shadow-sm">
      <div className="px-4 py-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              {isLoadingLocation ? (
                <span className="text-xs text-gray-500 italic">Loading location...</span>
              ) : locationName ? (
                <span className="text-xs font-medium text-gray-700 truncate">
                  {locationName.city}
                  {locationName.country && `, ${locationName.country}`}
                </span>
              ) : (
                <span className="text-xs text-gray-500 italic">Unknown location</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-100">
              <Thermometer className="w-3 h-3 text-red-500" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">
                  {formatTemperature(weather.temperature)}°C
                </span>
                <span className="text-[9px] text-gray-500">
                  feels {formatTemperature(feelsLike)}°C
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-100">
              <div className="relative">
                <Wind className="w-3 h-3 text-blue-500" />
                <ArrowUp
                  className="w-2.5 h-2.5 text-blue-600 absolute -top-0.5 -right-0.5"
                  style={{ transform: `rotate(${(weather.windDirection || 0) + 180}deg)` }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">
                  {Math.round(weather.windSpeed)} m/s
                </span>
                <span className="text-[9px] text-gray-500">
                  {getWindDirection(weather.windDirection || 0)} • B{beaufort.scale}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-100">
              <Gauge className="w-3 h-3 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">
                  {Math.round(weather.pressure)} hPa
                </span>
                <div className={`flex items-center gap-0.5 text-[9px] ${pressureTrend.color}`}>
                  <PressureIcon className="w-2.5 h-2.5" />
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
