import { WeatherData, CloudType, CloudLayers } from '../types';

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
  cloudLayers: { low: 0, mid: 0, high: 0 },
  cloudBase: undefined,
  dominantCloudType: 'clear',
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
      `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability&wind_speed_unit=ms`
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

    const cloudLayers: CloudLayers = {
      low: Math.round(data.current.cloud_cover_low ?? 0),
      mid: Math.round(data.current.cloud_cover_mid ?? 0),
      high: Math.round(data.current.cloud_cover_high ?? 0)
    };

    const cloudBase = calculateCloudBase(temp, data.current.relative_humidity_2m ?? 50);
    const dominantCloudType = determineCloudType(cloudLayers, cloudBase, precipType);

    const weatherData: WeatherData = {
      temperature: Math.round(temp),
      pressure: currentPressure,
      pressureTrend,
      windSpeed: Math.round(data.current.wind_speed_10m ?? 0),
      windDirection: getWindDirection(data.current.wind_direction_10m ?? 0),
      cloudCover: Math.round(data.current.cloud_cover ?? 0),
      cloudLayers,
      cloudBase,
      dominantCloudType,
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

const calculateCloudBase = (temperature: number, humidity: number): number | undefined => {
  if (humidity < 50) return undefined;

  const dewPointSpread = temperature - (temperature - ((100 - humidity) / 5));
  const cloudBaseMeters = Math.round(dewPointSpread * 125);

  return cloudBaseMeters > 0 ? cloudBaseMeters : undefined;
};

const determineCloudType = (
  layers: CloudLayers,
  cloudBase: number | undefined,
  precipType: 'none' | 'rain' | 'snow' | 'sleet'
): CloudType => {
  const { low, mid, high } = layers;

  if (low === 0 && mid === 0 && high === 0) {
    return 'clear';
  }

  if (precipType === 'rain' || precipType === 'sleet') {
    if (low > 70) return 'nimbostratus';
    if (low > 50) return 'cumulonimbus';
  }

  if (low > mid && low > high) {
    if (!cloudBase) return 'cumulus';
    if (cloudBase < 500) return 'stratus';
    if (cloudBase < 1500) return 'stratocumulus';
    return 'cumulus';
  }

  if (mid > low && mid > high) {
    if (mid > 60) return 'altostratus';
    return 'altocumulus';
  }

  if (high > low && high > mid) {
    if (high > 60) return 'cirrostratus';
    if (high > 30) return 'cirrocumulus';
    return 'cirrus';
  }

  if (low > 40) return 'cumulus';
  if (mid > 40) return 'altocumulus';
  if (high > 40) return 'cirrus';

  return 'clear';
};

export const getCloudTypeDescription = (cloudType: CloudType): string => {
  switch (cloudType) {
    case 'clear': return 'Clear sky';
    case 'cirrus': return 'High wispy clouds';
    case 'cirrostratus': return 'High thin sheet clouds';
    case 'cirrocumulus': return 'High small puffy clouds';
    case 'altostratus': return 'Mid-level gray clouds';
    case 'altocumulus': return 'Mid-level puffy clouds';
    case 'stratus': return 'Low gray layer clouds';
    case 'stratocumulus': return 'Low puffy layer clouds';
    case 'cumulus': return 'Puffy fair-weather clouds';
    case 'nimbostratus': return 'Rain clouds';
    case 'cumulonimbus': return 'Thunderstorm clouds';
    default: return 'Unknown';
  }
};