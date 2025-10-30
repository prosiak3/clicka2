// Update AppSettings interface to include mapType
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