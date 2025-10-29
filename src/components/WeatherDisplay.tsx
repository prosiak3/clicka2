import { Cloud, Thermometer, Wind, Droplets, ArrowUp, TrendingUp, TrendingDown, Minus, CloudRain, CloudSnow, CloudDrizzle } from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherDisplayProps {
  weather: WeatherData;
  waterTemp?: number;
}

export function WeatherDisplay({ weather, waterTemp }: WeatherDisplayProps) {
  const getPressureTrendIcon = () => {
    switch (weather.pressureTrend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPrecipitationIcon = () => {
    switch (weather.precipitationType) {
      case 'rain':
        return <CloudRain className="text-blue-500 w-5 h-5" />;
      case 'snow':
        return <CloudSnow className="text-blue-500 w-5 h-5" />;
      case 'sleet':
        return <CloudDrizzle className="text-blue-500 w-5 h-5" />;
      default:
        return <Cloud className="text-blue-500 w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Temperature */}
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        <Thermometer className="text-red-500 w-5 h-5" />
        <div>
          <p className="text-xs font-medium text-gray-600">Temperature</p>
          <p className="text-lg font-bold text-gray-900">{weather.temperature}°C</p>
        </div>
      </div>

      {/* Wind */}
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        <Wind className="text-blue-500 w-5 h-5" />
        <div>
          <p className="text-xs font-medium text-gray-600">Wind</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-900">{weather.windSpeed} m/s</p>
            <ArrowUp 
              className="w-4 h-4 text-gray-600" 
              style={{ 
                transform: `rotate(${
                  weather.windDirection === 'N' ? 0 :
                  weather.windDirection === 'NE' ? 45 :
                  weather.windDirection === 'E' ? 90 :
                  weather.windDirection === 'SE' ? 135 :
                  weather.windDirection === 'S' ? 180 :
                  weather.windDirection === 'SW' ? 225 :
                  weather.windDirection === 'W' ? 270 :
                  weather.windDirection === 'NW' ? 315 : 0
                }deg)`
              }} 
            />
          </div>
        </div>
      </div>

      {/* Cloud Cover */}
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        <Cloud className="text-gray-500 w-5 h-5" />
        <div>
          <p className="text-xs font-medium text-gray-600">Cloud Cover</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-900">{weather.cloudCover}%</p>
            <span className="text-sm text-gray-500">
              {weather.cloudCover <= 25 ? 'Clear' :
               weather.cloudCover <= 50 ? 'Partly Cloudy' :
               weather.cloudCover <= 75 ? 'Mostly Cloudy' :
               'Overcast'}
            </span>
          </div>
        </div>
      </div>

      {/* Precipitation */}
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        {getPrecipitationIcon()}
        <div>
          <p className="text-xs font-medium text-gray-600">Precipitation</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-900">{weather.precipitation} mm</p>
            {weather.precipitationProbability > 0 && (
              <span className="text-sm text-blue-600">
                ({weather.precipitationProbability}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pressure */}
      <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
        <Droplets className="text-purple-500 w-5 h-5" />
        <div>
          <p className="text-xs font-medium text-gray-600">Pressure</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-900">{weather.pressure}</p>
            <span className="text-sm text-gray-500">hPa</span>
            <div className="ml-1">{getPressureTrendIcon()}</div>
          </div>
        </div>
      </div>

      {/* Water Temperature (if provided) */}
      {waterTemp && (
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
          <Thermometer className="text-blue-500 w-5 h-5" />
          <div>
            <p className="text-xs font-medium text-gray-600">Water Temp</p>
            <p className="text-lg font-bold text-gray-900">{waterTemp}°C</p>
          </div>
        </div>
      )}
    </div>
  );
}