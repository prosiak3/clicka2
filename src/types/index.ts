import { WeatherData, Location, FishCatch, User, FishSpecies, AppSettings, CloudType, CloudLayers } from './base';

export interface Translation {
  common: {
    appName: string;
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    minutes: string;
    of: string;
  };
  loading: {
    checkingGPS: string;
    gettingLocation: string;
    gettingWeather: string;
    startingSession: string;
    ready: string;
  };
  navigation: {
    home: string;
    stats: string;
    history: string;
    settings: string;
  };
  home: {
    startFishing: string;
    readyToFish: string;
    trackingDescription: string;
    totalCatches: string;
    bestCatch: string;
    lastSession: string;
    sessions: string;
    quickAddCatch: string;
    quickAddDescription: string;
  };
  session: {
    fishingSession: string;
    active: string;
    paused: string;
    pauseSession: string;
    resumeSession: string;
    endAndSave: string;
    discard: string;
    addCatch: string;
    totalWeight: string;
    averageWeight: string;
    weatherAndLocation: string;
    time: string;
    temperature: string;
    pressure: string;
    wind: string;
    location: string;
    notes: string;
    catches: string;
    confirmEnd: string;
    confirmEndMessage: string;
    confirmDiscard: string;
    confirmDiscardMessage: string;
    pausedTime: string;
  };
  catch: {
    species: string;
    length: string;
    weight: string;
    photos: string;
    addPhotos: string;
    tapToCapture: string;
    saveButton: string;
  };
  weather: {
    airTemp: string;
    waterTemp: string;
    cloudCover: string;
    windSpeed: string;
    weatherConditions: string;
    weatherTrends: string;
    cloudBase: string;
    cloudLayers: string;
    cloudTypes: {
      clear: string;
      cirrus: string;
      cirrostratus: string;
      cirrocumulus: string;
      altostratus: string;
      altocumulus: string;
      stratus: string;
      stratocumulus: string;
      cumulus: string;
      nimbostratus: string;
      cumulonimbus: string;
    };
    lowClouds: string;
    midClouds: string;
    highClouds: string;
  };
  stats: {
    overallStatistics: string;
    speciesDistribution: string;
    bestCatches: string;
    averageCatchesPerSession: string;
    averageSessionLength: string;
    timeOfDay: string;
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  settings: {
    theme: string;
    light: string;
    dark: string;
    language: string;
    measurementSystem: string;
    metric: string;
    imperial: string;
    fishSpecies: string;
    speciesLimit: string;
    notifications: string;
    enableNotifications: string;
    weatherAlerts: string;
    catchReminders: string;
    display: string;
    showCoordinates: string;
    showWeatherDetails: string;
    showMoonPhase: string;
    showTides: string;
    importExport: string;
    exportSettings: string;
    importSettings: string;
    reset: string;
    resetSettings: string;
    tracking: {
      title: string;
      enable: string;
      description: string;
      interval: string;
      intervalDescription: string;
      intervals: {
        minute: string;
        minutes: string;
        hour: string;
      };
    };
  };
  fishGroups: {
    predatory: string;
    peaceful: string;
  };
  pwa?: {
    installTitle: string;
    installDescription: string;
    installButton: string;
    laterButton: string;
  };
  tutorial: {
    skip: string;
    next: string;
    previous: string;
    finish: string;
    step: string;
    of: string;
    steps: {
      [key: number]: {
        title: string;
        description: string;
      };
    };
    welcome: {
      title: string;
      description: string;
      startButton: string;
      skipButton: string;
      skipWarning: string;
    };
    skipConfirm: {
      title: string;
      description: string;
      confirmButton: string;
      cancelButton: string;
    };
  };
}

export interface PauseInterval {
  startTime: string;
  endTime?: string;
}

export interface FishingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  initialWeather: WeatherData;
  weather: WeatherData;
  locations: Location[];
  notes?: string;
  catches: FishCatch[];
  synced: boolean;
  pauses?: PauseInterval[];
  totalPauseTime?: number;
  tracking_enabled: boolean;
  tracking_interval: number;
  last_activity_at?: string;
  resumed_count?: number;
}

export type { WeatherData, Location, FishCatch, User, FishSpecies, AppSettings, CloudType, CloudLayers };