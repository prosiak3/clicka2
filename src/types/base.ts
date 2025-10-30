export interface User {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
  provider?: 'email' | 'google' | 'apple';
  role?: 'user' | 'admin';
}

export interface CloudLayers {
  low: number;
  mid: number;
  high: number;
}

export type CloudType =
  | 'clear'
  | 'cirrus'
  | 'cirrostratus'
  | 'cirrocumulus'
  | 'altostratus'
  | 'altocumulus'
  | 'stratus'
  | 'stratocumulus'
  | 'cumulus'
  | 'nimbostratus'
  | 'cumulonimbus';

export interface WeatherData {
  temperature: number;
  pressure: number;
  pressureTrend?: 'rising' | 'falling' | 'stable';
  windSpeed: number;
  windDirection: string;
  cloudCover: number;
  cloudLayers?: CloudLayers;
  cloudBase?: number;
  dominantCloudType?: CloudType;
  precipitation: number;
  precipitationType: 'none' | 'rain' | 'snow';
  precipitationProbability: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
  source: 'gps' | 'network' | 'ip';
  accuracy?: number;
}

export interface FishCatch {
  id: string;
  sessionId: string;
  species: string;
  length: number;
  weight: number;
  location: Location;
  weather: WeatherData;
  photoUrls?: string[];
  timestamp: string;
}

export interface FishSpecies {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  group?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  measurementSystem: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    weatherAlerts: boolean;
    catchReminders: boolean;
  };
  fishSpecies: FishSpecies[];
  display: {
    showCoordinates: boolean;
    showWeatherDetails: boolean;
    showMoonPhase: boolean;
    showTides: boolean;
    showTimeOfDay: boolean;
    showMapRadius: boolean;
    mapRadiusSize: number;
    mapType: 'standard' | 'satellite';
  };
  tracking: {
    interval: number;
    enabled: boolean;
    methods: {
      gps: boolean;
      network: boolean;
      ip: boolean;
    };
  };
  session: {
    autoEndTimeout: number;
    autoEndEnabled: boolean;
  };
}