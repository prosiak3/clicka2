import { WeatherData, CloudType, CloudLayers } from '../types';
import { supabase } from './db';
import { estimateWeather } from './weatherEstimation';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Cache weather data with expiration
interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const weatherCache = new Map<string, CachedWeather>();
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
let lastRequestTime = 0;

const getCacheDuration = (): number => {
  try {
    const settingsStr = localStorage.getItem('clicka-better-fishing-settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      const intervalMinutes = settings?.state?.weather?.updateInterval || 5;
      return intervalMinutes * 60 * 1000;
    }
  } catch (error) {
    console.warn('[Weather API] Failed to get cache duration from settings:', error);
  }
  return 5 * 60 * 1000; // Default 5 minutes
};

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
  const cacheDuration = getCacheDuration();

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
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

const getEnabledProviders = async () => {
  try {
    const { data, error } = await supabase
      .from('weather_api_providers')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching weather providers:', error);
    return [{
      id: 'default',
      name: 'open-meteo',
      display_name: 'Open-Meteo',
      api_url: 'https://api.open-meteo.com/v1/forecast',
      requires_key: false,
      enabled: true,
      priority: 1
    }];
  }
};

const fetchFromNetatmo = async (lat: number, lon: number) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const requestUrl = `${supabaseUrl}/functions/v1/netatmo-weather-data?lat=${lat}&lon=${lon}`;

  console.log(`[Weather API] Fetching from Netatmo Edge Function: ${requestUrl}`);

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': 'application/json'
    }
  });

  console.log(`[Weather API] Netatmo response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Weather API] Netatmo request failed with status ${response.status}: ${errorText}`);
    throw new Error(`Netatmo API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Weather API] Successfully fetched Netatmo data from ${data.stationCount} station(s):`, data);
  return data;
};

const fetchFromNOAA = async (lat: number, lon: number) => {
  const USER_AGENT = 'ClickaFishingApp/1.3.0 (contact@clickafishing.app)';

  console.log(`[Weather API] Fetching from NOAA for coordinates: ${lat}, ${lon}`);

  try {
    const pointsUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    console.log(`[Weather API] NOAA Points request: ${pointsUrl}`);

    const pointsResponse = await fetch(pointsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
      }
    });

    if (!pointsResponse.ok) {
      const errorText = await pointsResponse.text();
      console.error(`[Weather API] NOAA points request failed: ${pointsResponse.status} ${errorText}`);
      throw new Error(`NOAA points API failed: ${pointsResponse.status}`);
    }

    const pointsData = await pointsResponse.json();
    const stationUrl = pointsData.properties?.observationStations;

    if (!stationUrl) {
      console.error('[Weather API] No observation stations URL in NOAA response');
      throw new Error('No NOAA stations available for this location');
    }

    console.log(`[Weather API] NOAA Stations request: ${stationUrl}`);

    const stationsResponse = await fetch(stationUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
      }
    });

    if (!stationsResponse.ok) {
      throw new Error(`NOAA stations API failed: ${stationsResponse.status}`);
    }

    const stationsData = await stationsResponse.json();
    const stations = stationsData.features;

    if (!stations || stations.length === 0) {
      throw new Error('No NOAA weather stations found in area');
    }

    const nearestStation = stations[0];
    const stationId = nearestStation.properties.stationIdentifier;
    console.log(`[Weather API] Using NOAA station: ${stationId}`);

    const obsUrl = `https://api.weather.gov/stations/${stationId}/observations/latest`;
    console.log(`[Weather API] NOAA Observation request: ${obsUrl}`);

    const obsResponse = await fetch(obsUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
      }
    });

    if (!obsResponse.ok) {
      throw new Error(`NOAA observation API failed: ${obsResponse.status}`);
    }

    const obsData = await obsResponse.json();
    console.log(`[Weather API] Successfully fetched NOAA observation data:`, obsData);

    return {
      source: 'noaa',
      stationId,
      properties: obsData.properties
    };
  } catch (error) {
    console.error('[Weather API] NOAA request failed:', error);
    throw error;
  }
};

const fetchFromOpenMeteo = async (lat: number, lon: number, apiUrl: string) => {
  const requestUrl = `${apiUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,wind_speed_10m,wind_direction_10m,precipitation,precipitation_probability&wind_speed_unit=ms`;

  console.log(`[Weather API] Fetching from Open-Meteo: ${requestUrl}`);

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  console.log(`[Weather API] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Weather API] Request failed with status ${response.status}: ${errorText}`);
    throw new Error(`Weather API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`[Weather API] Successfully fetched weather data:`, data);
  return data;
};

export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  const timestamp = new Date().toISOString();
  console.log(`[Weather API] ${timestamp} - Starting weather data fetch for coordinates: ${lat}, ${lon}`);

  try {
    // Check cache first
    const cachedData = getFromCache(lat, lon);
    if (cachedData) {
      console.log(`[Weather API] Returning cached data (age: ${Date.now() - weatherCache.get(getCacheKey(lat, lon))!.timestamp}ms)`);
      return cachedData;
    }

    console.log(`[Weather API] No cached data found, fetching from API...`);

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`[Weather API] Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();

    const providers = await getEnabledProviders();
    console.log(`[Weather API] Found ${providers.length} enabled provider(s):`, providers.map(p => p.display_name));

    let data = null;
    let lastError = null;

    for (const provider of providers) {
      try {
        console.log(`[Weather API] Trying provider: ${provider.display_name} (${provider.name})`);

        if (provider.name === 'netatmo') {
          data = await fetchFromNetatmo(lat, lon);
          console.log(`[Weather API] Successfully fetched data from ${provider.display_name}`);
          break;
        } else if (provider.name === 'noaa') {
          data = await fetchFromNOAA(lat, lon);
          console.log(`[Weather API] Successfully fetched data from ${provider.display_name}`);
          break;
        } else if (provider.name === 'open-meteo') {
          data = await fetchFromOpenMeteo(lat, lon, provider.api_url);
          console.log(`[Weather API] Successfully fetched data from ${provider.display_name}`);
          break;
        } else {
          console.warn(`[Weather API] Unknown provider type: ${provider.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[Weather API] Provider ${provider.display_name} failed:`, {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          provider: provider.name,
          apiUrl: provider.api_url
        });
        lastError = error;
        continue;
      }
    }

    if (!data) {
      const errorMsg = lastError instanceof Error ? lastError.message : 'Unknown error';
      console.error(`[Weather API] All ${providers.length} provider(s) failed. Last error:`, errorMsg);
      throw lastError || new Error(`All weather providers failed. Tried ${providers.length} provider(s)`);
    }

    // Handle different data formats (Netatmo vs Open-Meteo)
    let temp: number;
    let currentPressure: number;
    let humidity: number;
    let precip: number;
    let windSpeed: number;
    let windDirection: number;
    let cloudCover: number;
    let cloudLow: number;
    let cloudMid: number;
    let cloudHigh: number;
    let precipProb: number;

    if (data.source === 'netatmo') {
      // Netatmo data format
      console.log('[Weather API] Processing Netatmo data format');
      temp = data.temperature ?? 20;
      currentPressure = data.pressure ?? 1013;
      humidity = data.humidity ?? 50;
      precip = data.precipitation ?? 0;
      windSpeed = data.windSpeed ?? 0;
      windDirection = data.windDirection ?? 0;
      cloudCover = 0;
      cloudLow = 0;
      cloudMid = 0;
      cloudHigh = 0;
      precipProb = 0;
    } else if (data.source === 'noaa') {
      // NOAA data format
      console.log('[Weather API] Processing NOAA data format');
      const props = data.properties;
      temp = props.temperature?.value ? props.temperature.value : 20;
      currentPressure = props.barometricPressure?.value ? Math.round(props.barometricPressure.value / 100) : 1013;
      humidity = props.relativeHumidity?.value ?? 50;
      precip = props.precipitationLastHour?.value ?? 0;
      windSpeed = props.windSpeed?.value ? Math.round(props.windSpeed.value * 0.277778) : 0;
      windDirection = props.windDirection?.value ?? 0;
      cloudCover = 0;
      cloudLow = 0;
      cloudMid = 0;
      cloudHigh = 0;
      precipProb = 0;
    } else if (data.current) {
      // Open-Meteo data format
      console.log('[Weather API] Processing Open-Meteo data format');
      temp = data.current.temperature_2m ?? 20;
      currentPressure = Math.round(data.current.pressure_msl ?? 1013);
      humidity = data.current.relative_humidity_2m ?? 50;
      precip = data.current.precipitation ?? 0;
      windSpeed = Math.round(data.current.wind_speed_10m ?? 0);
      windDirection = data.current.wind_direction_10m ?? 0;
      cloudCover = Math.round(data.current.cloud_cover ?? 0);
      cloudLow = Math.round(data.current.cloud_cover_low ?? 0);
      cloudMid = Math.round(data.current.cloud_cover_mid ?? 0);
      cloudHigh = Math.round(data.current.cloud_cover_high ?? 0);
      precipProb = Math.round(data.current.precipitation_probability ?? 0);
    } else {
      throw new Error('Invalid weather data received');
    }

    const currentTime = Date.now();

    // Calculate pressure trend
    let pressureTrend: 'rising' | 'falling' | 'stable' = 'stable';

    if (lastPressureReading.timestamp > 0 &&
        currentTime - lastPressureReading.timestamp <= 3600000) {
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
    let precipType: 'none' | 'rain' | 'snow' | 'sleet' = 'none';

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
      low: cloudLow,
      mid: cloudMid,
      high: cloudHigh
    };

    const cloudBase = calculateCloudBase(temp, humidity);
    const dominantCloudType = determineCloudType(cloudLayers, cloudBase, precipType);

    const weatherData: WeatherData = {
      temperature: Math.round(temp),
      pressure: currentPressure,
      pressureTrend,
      windSpeed: Math.round(windSpeed),
      windDirection: getWindDirection(windDirection),
      cloudCover: cloudCover,
      cloudLayers,
      cloudBase,
      dominantCloudType,
      precipitation: precip,
      precipitationType: precipType,
      precipitationProbability: precipProb
    };

    // Save to cache
    saveToCache(lat, lon, weatherData);

    // Save to localStorage as fallback
    try {
      localStorage.setItem('lastWeatherData', JSON.stringify({
        data: weatherData,
        timestamp: Date.now(),
        location: { lat, lon }
      }));
      console.log(`[Weather API] Saved weather data to localStorage fallback`);
    } catch (e) {
      console.warn(`[Weather API] Failed to save to localStorage:`, e);
    }

    console.log(`[Weather API] Successfully completed weather data fetch`);
    return weatherData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Weather API] Failed to fetch weather data:`, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      coordinates: { lat, lon },
      timestamp: new Date().toISOString()
    });

    // Try to use localStorage fallback
    try {
      const fallbackData = localStorage.getItem('lastWeatherData');
      if (fallbackData) {
        const parsed = JSON.parse(fallbackData);
        const age = Date.now() - parsed.timestamp;
        const ageMinutes = Math.floor(age / 60000);

        if (age < 3600000) { // Less than 1 hour old
          console.log(`[Weather API] Using localStorage fallback data (${ageMinutes} minutes old)`);
          return parsed.data;
        } else {
          console.log(`[Weather API] localStorage fallback data too old (${ageMinutes} minutes), using estimation`);
        }
      }
    } catch (e) {
      console.warn(`[Weather API] Failed to retrieve localStorage fallback:`, e);
    }

    // Return estimated weather data based on location and current time
    console.log(`[Weather API] Falling back to estimated weather data`);
    return estimateWeather(new Date(), lat, lon);
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