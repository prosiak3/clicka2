import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, FishSpecies } from '../types';

const DEFAULT_FISH_SPECIES: FishSpecies[] = [
  // Predatory Fish
  {
    id: 'pike',
    name: {
      en: 'Pike',
      pl: 'Szczupak',
      de: 'Hecht'
    },
    group: 'predatory',
    minLength: 55,
    maxLength: 150,
    maxWeight: 30,
    enabled: true,
  },
  {
    id: 'perch',
    name: {
      en: 'Perch',
      pl: 'Okoń',
      de: 'Barsch'
    },
    group: 'predatory',
    minLength: 25,
    maxLength: 60,
    maxWeight: 3,
    enabled: true,
  },
  {
    id: 'zander',
    name: {
      en: 'Zander',
      pl: 'Sandacz',
      de: 'Zander'
    },
    group: 'predatory',
    minLength: 55,
    maxLength: 130,
    maxWeight: 22,
    enabled: true,
  },
  {
    id: 'catfish',
    name: {
      en: 'Catfish',
      pl: 'Sum',
      de: 'Wels'
    },
    group: 'predatory',
    minLength: 70,
    maxLength: 250,
    maxWeight: 100,
    enabled: false,
  },
  {
    id: 'asp',
    name: {
      en: 'Asp',
      pl: 'Boleń',
      de: 'Rapfen'
    },
    group: 'predatory',
    minLength: 40,
    maxLength: 100,
    maxWeight: 8,
    enabled: false,
  },
  {
    id: 'eel',
    name: {
      en: 'Eel',
      pl: 'Węgorz',
      de: 'Aal'
    },
    group: 'predatory',
    minLength: 50,
    maxLength: 150,
    maxWeight: 6,
    enabled: false,
  },
  {
    id: 'trout',
    name: {
      en: 'Trout',
      pl: 'Pstrąg',
      de: 'Forelle'
    },
    group: 'predatory',
    minLength: 30,
    maxLength: 100,
    maxWeight: 15,
    enabled: false,
  },

  // Peaceful Fish
  {
    id: 'carp',
    name: {
      en: 'Carp',
      pl: 'Karp',
      de: 'Karpfen'
    },
    group: 'peaceful',
    minLength: 30,
    maxLength: 120,
    maxWeight: 40,
    enabled: false,
  },
  {
    id: 'tench',
    name: {
      en: 'Tench',
      pl: 'Lin',
      de: 'Schleie'
    },
    group: 'peaceful',
    minLength: 25,
    maxLength: 70,
    maxWeight: 8,
    enabled: false,
  },
  {
    id: 'bream',
    name: {
      en: 'Bream',
      pl: 'Leszcz',
      de: 'Brasse'
    },
    group: 'peaceful',
    minLength: 25,
    maxLength: 75,
    maxWeight: 6,
    enabled: false,
  },
  {
    id: 'roach',
    name: {
      en: 'Roach',
      pl: 'Płoć',
      de: 'Rotauge'
    },
    group: 'peaceful',
    minLength: 15,
    maxLength: 35,
    maxWeight: 2,
    enabled: false,
  },
  {
    id: 'ide',
    name: {
      en: 'Ide',
      pl: 'Jaź',
      de: 'Aland'
    },
    group: 'peaceful',
    minLength: 25,
    maxLength: 80,
    maxWeight: 6,
    enabled: false,
  },
  {
    id: 'chub',
    name: {
      en: 'Chub',
      pl: 'Kleń',
      de: 'Döbel'
    },
    group: 'peaceful',
    minLength: 30,
    maxLength: 80,
    maxWeight: 8,
    enabled: false,
  },
  {
    id: 'rudd',
    name: {
      en: 'Rudd',
      pl: 'Wzdręga',
      de: 'Rotfeder'
    },
    group: 'peaceful',
    minLength: 15,
    maxLength: 35,
    maxWeight: 2,
    enabled: false,
  },
  {
    id: 'crucian',
    name: {
      en: 'Crucian Carp',
      pl: 'Karaś',
      de: 'Karausche'
    },
    group: 'peaceful',
    minLength: 20,
    maxLength: 50,
    maxWeight: 3,
    enabled: false,
  },
  {
    id: 'barbel',
    name: {
      en: 'Barbel',
      pl: 'Brzana',
      de: 'Barbe'
    },
    group: 'peaceful',
    minLength: 40,
    maxLength: 100,
    maxWeight: 12,
    enabled: false,
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  measurementSystem: 'metric',
  notifications: {
    enabled: true,
    weatherAlerts: true,
    catchReminders: true,
  },
  fishSpecies: DEFAULT_FISH_SPECIES,
  display: {
    showCoordinates: true,
    showWeatherDetails: true,
    showMoonPhase: true,
    showTides: false,
    showTimeOfDay: true,
    showMapRadius: true,
    mapRadiusSize: 30,
    mapType: 'standard',
    hideScrollbar: true
  },
  tracking: {
    interval: 15,
    enabled: true,
    methods: {
      gps: true,
      network: true,
      ip: true
    }
  },
  session: {
    autoEndTimeout: 30,
    autoEndEnabled: true
  },
};

interface SettingsState extends AppSettings {
  pendingChanges: Partial<AppSettings>;
  hasPendingChanges: boolean;
  updateTheme: (theme: 'light' | 'dark') => void;
  updateLanguage: (language: string) => void;
  updateMeasurementSystem: (system: 'metric' | 'imperial') => void;
  updateNotifications: (notifications: Partial<AppSettings['notifications']>) => void;
  updateFishSpecies: (species: FishSpecies[]) => void;
  toggleFishSpecies: (id: string) => void;
  updateDisplaySettings: (display: Partial<AppSettings['display']>) => void;
  updateTrackingSettings: (tracking: Partial<AppSettings['tracking']> & { methods?: Partial<AppSettings['tracking']['methods']> }) => void;
  updateSessionSettings: (session: Partial<AppSettings['session']>) => void;
  applyPendingChanges: () => void;
  discardPendingChanges: () => void;
  resetSettings: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      pendingChanges: {},
      hasPendingChanges: false,
      updateTheme: (theme) => set((state) => ({
        theme,
        pendingChanges: { ...state.pendingChanges, theme },
        hasPendingChanges: true
      })),
      updateLanguage: (language) => set((state) => ({
        language,
        pendingChanges: { ...state.pendingChanges, language },
        hasPendingChanges: true
      })),
      updateMeasurementSystem: (measurementSystem) => set((state) => ({
        measurementSystem,
        pendingChanges: { ...state.pendingChanges, measurementSystem },
        hasPendingChanges: true
      })),
      updateNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications },
        pendingChanges: {
          ...state.pendingChanges,
          notifications: { ...state.notifications, ...notifications }
        },
        hasPendingChanges: true
      })),
      updateFishSpecies: (fishSpecies) => set((state) => ({
        fishSpecies,
        pendingChanges: { ...state.pendingChanges, fishSpecies },
        hasPendingChanges: true
      })),
      toggleFishSpecies: (id) => set((state) => {
        const enabledCount = state.fishSpecies.filter(s => s.enabled).length;
        const species = state.fishSpecies.find(s => s.id === id);
        
        if (!species) return state;

        const updatedSpecies = state.fishSpecies.map(s =>
          s.id === id ? { ...s, enabled: !s.enabled } : s
        );

        // Don't allow disabling if it's the last enabled species
        if (species.enabled && enabledCount <= 1) return state;

        // Don't allow enabling if already at max
        if (!species.enabled && enabledCount >= 3) return state;

        return {
          fishSpecies: updatedSpecies,
          pendingChanges: { ...state.pendingChanges, fishSpecies: updatedSpecies },
          hasPendingChanges: true
        };
      }),
      updateDisplaySettings: (display) => set((state) => ({
        display: { ...state.display, ...display },
        pendingChanges: {
          ...state.pendingChanges,
          display: { ...state.display, ...display }
        },
        hasPendingChanges: true
      })),
      updateTrackingSettings: (tracking) => set((state) => {
        const updatedTracking = {
          ...state.tracking,
          ...tracking,
          methods: {
            ...state.tracking.methods,
            ...(tracking.methods || {})
          }
        };

        return {
          tracking: updatedTracking,
          pendingChanges: {
            ...state.pendingChanges,
            tracking: updatedTracking
          },
          hasPendingChanges: true
        };
      }),
      updateSessionSettings: (session) => set((state) => ({
        session: { ...state.session, ...session },
        pendingChanges: {
          ...state.pendingChanges,
          session: { ...state.session, ...session }
        },
        hasPendingChanges: true
      })),
      applyPendingChanges: () => set((state) => {
        const updates = { ...state, ...state.pendingChanges };
        return {
          ...updates,
          pendingChanges: {},
          hasPendingChanges: false
        };
      }),
      discardPendingChanges: () => set((state) => ({
        ...state,
        pendingChanges: {},
        hasPendingChanges: false
      })),
      resetSettings: () => set({
        ...DEFAULT_SETTINGS,
        pendingChanges: {},
        hasPendingChanges: false
      }),
    }),
    {
      name: 'clicka-better-fishing-settings',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          return {
            ...persistedState,
            display: {
              ...persistedState.display,
              mapType: 'standard'
            }
          };
        }
        if (version === 2) {
          return {
            ...persistedState,
            session: {
              autoEndTimeout: 30,
              autoEndEnabled: true
            }
          };
        }
        if (version === 3) {
          return {
            ...persistedState,
            display: {
              ...persistedState.display,
              hideScrollbar: true
            }
          };
        }
        return persistedState;
      }
    }
  )
);