import React, { useState, useEffect } from 'react';
import { Cloud, Eye, Wind, Gauge, Thermometer, Umbrella, Sun, MapPin, ArrowUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WeatherData } from '../types';
import { getWeatherData } from '../utils/weather';
import { useGpsTracking } from '../hooks/useGpsTracking';

interface LocationName {
  city?: string;
  country?: string;
}

export function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<LocationName | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { coords } = useGpsTracking();

  useEffect(() => {
    const fetchWeather = async () => {
      if (!coords) {
        setError('Location not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getWeatherData(coords.latitude, coords.longitude);
        setWeather(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to fetch weather data');
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Cloud className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'No weather data available'}</p>
        </div>
      </div>
    );
  }

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

  const getCloudCoverDescription = (cover: number): string => {
    if (cover <= 10) return 'Clear sky';
    if (cover <= 30) return 'Few clouds';
    if (cover <= 60) return 'Partly cloudy';
    if (cover <= 90) return 'Mostly cloudy';
    return 'Overcast';
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
  const PressureTrendIcon = pressureTrend.icon;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Current Weather</h2>
              {isLoadingLocation ? (
                <p className="text-sm text-gray-500 italic">Loading location...</p>
              ) : locationName ? (
                <p className="text-sm text-gray-600">
                  {locationName.city}
                  {locationName.country && `, ${locationName.country}`}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">Unknown location</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-600">Temperature</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{Math.round(weather.temperature)}°C</p>
              <p className="text-sm text-gray-500 mt-1">
                Feels like {Math.round(weather.feelsLike || weather.temperature)}°C
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Wind</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowUp
                  className="w-8 h-8 text-blue-600"
                  style={{ transform: `rotate(${(weather.windDirection || 0) + 180}deg)` }}
                />
                <div>
                  <p className="text-3xl font-bold text-gray-800">{Math.round(weather.windSpeed)} m/s</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getWindDirection(weather.windDirection || 0)} ({weather.windDirection}°) • Beaufort {getBeaufortScale(weather.windSpeed).scale}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Pressure</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-800">{Math.round(weather.pressure)} hPa</p>
                <PressureTrendIcon className={`w-6 h-6 ${pressureTrend.color}`} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {weather.pressure > 1013 ? 'High pressure' : weather.pressure < 1013 ? 'Low pressure' : 'Normal'} • {pressureTrend.text}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Cloud Cover</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{Math.round(weather.cloudCover)}%</p>
              <p className="text-sm text-gray-500 mt-1">{getCloudCoverDescription(weather.cloudCover)}</p>
            </div>

            {weather.precipitation !== undefined && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Umbrella className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Precipitation</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{weather.precipitation.toFixed(1)} mm</p>
                <p className="text-sm text-gray-500 mt-1">
                  {weather.precipitation === 0 ? 'No rain' : weather.precipitation < 2.5 ? 'Light rain' : 'Moderate to heavy'}
                </p>
              </div>
            )}

            {weather.visibility !== undefined && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">Visibility</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{(weather.visibility / 1000).toFixed(1)} km</p>
                <p className="text-sm text-gray-500 mt-1">
                  {weather.visibility > 10000 ? 'Excellent' : weather.visibility > 5000 ? 'Good' : 'Poor'}
                </p>
              </div>
            )}

            {weather.uvIndex !== undefined && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-gray-600">UV Index</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{weather.uvIndex}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {weather.uvIndex <= 2 ? 'Low' : weather.uvIndex <= 5 ? 'Moderate' : weather.uvIndex <= 7 ? 'High' : 'Very High'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Fishing Conditions</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Pressure:</strong>{' '}
              {weather.pressure > 1020
                ? 'High pressure - fish may be less active'
                : weather.pressure < 1000
                ? 'Low pressure - good for fishing, fish more active'
                : 'Stable pressure - normal fishing conditions'}
            </p>
            <p>
              <strong>Wind:</strong>{' '}
              {weather.windSpeed < 3
                ? 'Calm - great for fishing'
                : weather.windSpeed < 7
                ? 'Light breeze - good conditions'
                : weather.windSpeed < 12
                ? 'Moderate wind - casting may be challenging'
                : 'Strong wind - difficult fishing conditions'}
            </p>
            <p>
              <strong>Cloud cover:</strong>{' '}
              {weather.cloudCover > 70
                ? 'Overcast - excellent for fishing, fish less cautious'
                : weather.cloudCover > 30
                ? 'Partly cloudy - good balance'
                : 'Clear - fish may be more cautious'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
