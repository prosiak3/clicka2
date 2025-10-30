import { WeatherData } from '../types';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Cache weather data with expiration
interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const weatherCache = new Map<string, CachedWeather>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
let lastRequestTime = 0;

// Store the last pressure reading and its timestamp
let lastPressureReading = {
  pressure: 0,
  timestamp: 0
};

const getCacheKey = (lat: number, lon: number): string => {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
};

const getFromCache = (lat: number, lon: number): WeatherData | null => {
  const key = getCacheKey(lat, lon);
  const cached = weatherCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
};

const saveToCache = (lat: number, lon: number, data: WeatherData) => {
  const key = getCacheKey(lat, lon);
  weatherCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const getDefaultWeatherData = (): WeatherData => ({
  temperature: 20,
  pressure: 1013,
  pressureTrend: 'stable',
  windSpeed: 0,
  windDirection: 'N',
  cloudCover: 0,
  precipitation: 0,
  precipitationType: 'none',
  precipitationProbability: 0
});

export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    // Check cache first
    const cachedData = getFromCache(lat, lon);
    if (cachedData) {
      return cachedData;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }

    lastRequestTime = Date.now();
    const response = await fetch(
      `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability&wind_speed_unit=ms`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.current) {
      throw new Error('Invalid weather data received');
    }

    const currentPressure = Math.round(data.current.pressure_msl ?? 1013);
    const currentTime = Date.now();
    
    // Calculate pressure trend
    let pressureTrend: 'rising' | 'falling' | 'stable' = 'stable';
    
    if (lastPressureReading.timestamp > 0 && 
        currentTime - lastPressureReading.timestamp <= 3600000) { // Within last hour
      const pressureDiff = currentPressure - lastPressureReading.pressure;
      if (pressureDiff > 0.5) {
        pressureTrend = 'rising';
      } else if (pressureDiff < -0.5) {
        pressureTrend = 'falling';
      }
    }

    // Update last pressure reading
    lastPressureReading = {
      pressure: currentPressure,
      timestamp: currentTime
    };

    // Determine precipitation type based on temperature
    const temp = data.current.temperature_2m ?? 20;
    let precipType: 'none' | 'rain' | 'snow' | 'sleet' = 'none';
    const precip = data.current.precipitation ?? 0;

    if (precip > 0) {
      if (temp <= 0) {
        precipType = 'snow';
      } else if (temp <= 2) {
        precipType = 'sleet';
      } else {
        precipType = 'rain';
      }
    }

    const weatherData: WeatherData = {
      temperature: Math.round(temp),
      pressure: currentPressure,
      pressureTrend,
      windSpeed: Math.round(data.current.wind_speed_10m ?? 0),
      windDirection: getWindDirection(data.current.wind_direction_10m ?? 0),
      cloudCover: Math.round(data.current.cloud_cover ?? 0),
      precipitation: precip,
      precipitationType: precipType,
      precipitationProbability: Math.round(data.current.precipitation_probability ?? 0)
    };

    // Save to cache
    saveToCache(lat, lon, weatherData);
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    // Return default weather data if fetch fails
    return getDefaultWeatherData();
  }
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export const getBeaufortScale = (windSpeedMs: number): { level: number; description: string } => {
  if (windSpeedMs < 0.5) return { level: 0, description: 'Calm' };
  if (windSpeedMs < 1.6) return { level: 1, description: 'Light air' };
  if (windSpeedMs < 3.4) return { level: 2, description: 'Light breeze' };
  if (windSpeedMs < 5.5) return { level: 3, description: 'Gentle breeze' };
  if (windSpeedMs < 8.0) return { level: 4, description: 'Moderate breeze' };
  if (windSpeedMs < 10.8) return { level: 5, description: 'Fresh breeze' };
  if (windSpeedMs < 13.9) return { level: 6, description: 'Strong breeze' };
  if (windSpeedMs < 17.2) return { level: 7, description: 'Near gale' };
  if (windSpeedMs < 20.8) return { level: 8, description: 'Gale' };
  if (windSpeedMs < 24.5) return { level: 9, description: 'Strong gale' };
  if (windSpeedMs < 28.5) return { level: 10, description: 'Storm' };
  if (windSpeedMs < 32.7) return { level: 11, description: 'Violent storm' };
  return { level: 12, description: 'Hurricane' };
};