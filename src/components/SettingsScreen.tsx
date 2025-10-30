import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Languages,
  FileDown,
  FileUp,
  Fish,
  Bell,
  Ruler,
  Eye,
  RotateCcw,
  Check,
  Clock,
  Info,
  Save,
  MapPin,
  ChevronDown,
  ChevronUp,
  Navigation2,
  Wifi,
  Download,
  Trash2,
  Globe,
  Map as MapIcon,
  Satellite,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useSettings } from '../utils/settings';
import { FishSpecies, User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { ConfirmSettingsDialog } from './ConfirmSettingsDialog';
import { ExportDialog } from './ExportDialog';
import { StatsCleanupDialog } from './StatsCleanupDialog';
import { signOut } from '../utils/auth';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' }
] as const;

const MAP_TYPES = [
  { 
    id: 'standard', 
    name: 'Standard Map',
    description: 'Clear street view with detailed roads and landmarks',
    icon: MapIcon 
  },
  { 
    id: 'satellite', 
    name: 'Satellite View',
    description: 'Aerial imagery with terrain details',
    icon: Satellite 
  }
] as const;

function SettingsSection({ 
  title, 
  icon, 
  children, 
  defaultExpanded = false,
  isExpanded,
  onToggle
}: SettingsSectionProps) {
  const [isExpandedInternal, setIsExpandedInternal] = useState(defaultExpanded);
  
  const expanded = isExpanded !== undefined ? isExpanded : isExpandedInternal;
  const toggleExpanded = onToggle || (() => setIsExpandedInternal(!isExpandedInternal));

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-100 dark:border-dark-600 overflow-hidden">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-50">{title}</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-6 border-t border-gray-100 dark:border-dark-600">
          {children}
        </div>
      )}
    </div>
  );
}

interface SettingsScreenProps {
  user?: User;
  onLogout?: () => void;
}

export function SettingsScreen({ user, onLogout }: SettingsScreenProps = {}) {
  const settings = useSettings();
  const t = useTranslation();
  const enabledCount = settings.fishSpecies.filter(s => s.enabled).length;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLanguageChange = (newLanguage: string) => {
    settings.updateLanguage(newLanguage);
    setExpandedSection(expandedSection);
  };

  const handleSaveChanges = () => {
    settings.applyPendingChanges();
    setShowConfirm(false);
  };

  const handleDiscardChanges = () => {
    settings.discardPendingChanges();
    setShowConfirm(false);
  };

  const getChangedSettings = () => {
    const changes = settings.pendingChanges;
    return {
      theme: 'theme' in changes,
      language: 'language' in changes,
      measurementSystem: 'measurementSystem' in changes,
      notifications: 'notifications' in changes,
      fishSpecies: 'fishSpecies' in changes,
      display: 'display' in changes,
      tracking: 'tracking' in changes,
    };
  };

  const groupedSpecies = settings.fishSpecies.reduce((acc, species) => {
    if (!acc[species.group]) {
      acc[species.group] = [];
    }
    acc[species.group].push(species);
    return acc;
  }, {} as Record<string, FishSpecies[]>);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {user && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.full_name || user.email}
              </h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.provider && user.provider !== 'email' && (
                <p className="text-xs text-gray-400 mt-1">
                  Signed in with {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      )}
      <div className={`sticky top-0 z-10 bg-white dark:bg-dark-800 p-4 -mx-4 border-b border-gray-200 dark:border-dark-600 shadow-sm transition-opacity ${
        settings.hasPendingChanges ? 'opacity-100' : 'opacity-50 pointer-events-none'
      }`}>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!settings.hasPendingChanges}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            settings.hasPendingChanges
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-5 h-5" />
          <span className="font-medium">{t.common.save}</span>
        </button>
      </div>

      <SettingsSection 
        title={t.settings.theme} 
        icon={<Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        isExpanded={expandedSection === 'theme'}
        onToggle={() => setExpandedSection(expandedSection === 'theme' ? null : 'theme')}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => settings.updateTheme('light')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              settings.theme === 'light'
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-200'
            }`}
          >
            <Sun className="w-6 h-6 mb-2" />
            <span>{t.settings.light}</span>
          </button>
          <button
            onClick={() => settings.updateTheme('dark')}
            className={`p-4 rounded-lg border flex flex-col items-center transition-colors ${
              settings.theme === 'dark'
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-200'
            }`}
          >
            <Moon className="w-6 h-6 mb-2" />
            <span>{t.settings.dark}</span>
          </button>
        </div>
      </SettingsSection>

      <SettingsSection 
        title={t.settings.language} 
        icon={<Languages className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
        isExpanded={expandedSection === 'language'}
        onToggle={() => setExpandedSection(expandedSection === 'language' ? null : 'language')}
      >
        <div className="space-y-3">
          {SUPPORTED_LANGUAGES.map(({ code, name }) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                settings.language === code
                  ? 'bg-purple-50 dark:bg-purple-900/50 border-2 border-purple-500 dark:border-purple-400'
                  : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
              }`}
            >
              <span className={`text-lg ${
                settings.language === code 
                  ? 'text-purple-700 dark:text-purple-300 font-medium' 
                  : 'text-gray-900 dark:text-dark-50'
              }`}>
                {name}
              </span>
              {settings.language === code && (
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-purple-500 dark:border-purple-400 bg-purple-500 dark:bg-purple-400">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection 
        title={t.settings.measurementSystem} 
        icon={<Ruler className="w-5 h-5 text-green-600 dark:text-green-400" />}
        isExpanded={expandedSection === 'measurement'}
        onToggle={() => setExpandedSection(expandedSection === 'measurement' ? null : 'measurement')}
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => settings.updateMeasurementSystem('metric')}
            className={`p-3 rounded-lg border transition-colors ${
              settings.measurementSystem === 'metric'
                ? 'bg-green-50 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-200'
            }`}
          >
            {t.settings.metric}
          </button>
          <button
            onClick={() => settings.updateMeasurementSystem('imperial')}
            className={`p-3 rounded-lg border transition-colors ${
              settings.measurementSystem === 'imperial'
                ? 'bg-green-50 dark:bg-green-900/50 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-200'
            }`}
          >
            {t.settings.imperial}
          </button>
        </div>
      </SettingsSection>

      <SettingsSection 
        title={t.settings.tracking.title} 
        icon={<MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        isExpanded={expandedSection === 'tracking'}
        onToggle={() => setExpandedSection(expandedSection === 'tracking' ? null : 'tracking')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.tracking.interval}
            </label>
            <select
              value={settings.tracking.interval}
              onChange={(e) => settings.updateTrackingSettings({ interval: Number(e.target.value) })}
              className="w-full p-3 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
            >
              <option value={1}>Every minute</option>
              <option value={5}>Every 5 minutes</option>
              <option value={15}>Every 15 minutes</option>
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
            </select>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-300">
              {t.settings.tracking.intervalDescription}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-dark-50">GPS Tracking</span>
                <p className="text-sm text-gray-500 dark:text-dark-300">High accuracy, uses more battery</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tracking.methods.gps}
                onChange={(e) => settings.updateTrackingSettings({ 
                  methods: { ...settings.tracking.methods, gps: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-dark-50">Network Location</span>
                <p className="text-sm text-gray-500 dark:text-dark-300">Medium accuracy, uses less battery</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tracking.methods.network}
                onChange={(e) => settings.updateTrackingSettings({ 
                  methods: { ...settings.tracking.methods, network: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-dark-50">IP Location</span>
                <p className="text-sm text-gray-500 dark:text-dark-300">Low accuracy, fallback option</p>
              </div>
              <input
                type="checkbox"
                checked={settings.tracking.methods.ip}
                onChange={(e) => settings.updateTrackingSettings({ 
                  methods: { ...settings.tracking.methods, ip: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Session Settings"
        icon={<Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        isExpanded={expandedSection === 'session'}
        onToggle={() => setExpandedSection(expandedSection === 'session' ? null : 'session')}
      >
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div>
              <span className="font-medium text-gray-900 dark:text-dark-50">Auto-End Session</span>
              <p className="text-sm text-gray-500 dark:text-dark-300">Automatically end session after inactivity</p>
            </div>
            <input
              type="checkbox"
              checked={settings.session.autoEndEnabled}
              onChange={(e) => settings.updateSessionSettings({ autoEndEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 dark:bg-dark-600"
            />
          </label>

          {settings.session.autoEndEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-2">
                Inactivity Timeout
              </label>
              <select
                value={settings.session.autoEndTimeout}
                onChange={(e) => settings.updateSessionSettings({ autoEndTimeout: Number(e.target.value) })}
                className="w-full p-3 border border-gray-200 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-800 text-gray-900 dark:text-dark-50"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-dark-300">
                You'll receive a warning 5 minutes before the session ends. Any interaction extends the session automatically.
              </p>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title={t.settings.fishSpecies}
        icon={<Fish className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
        isExpanded={expandedSection === 'species'}
        onToggle={() => setExpandedSection(expandedSection === 'species' ? null : 'species')}
      >
        <div>
          <p className="text-sm text-gray-500 dark:text-dark-200 mb-4">
            {t.settings.speciesLimit} ({enabledCount}/3)
          </p>
          <div className="space-y-6">
            {Object.entries(groupedSpecies).map(([group, species]) => (
              <div key={group} className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-dark-50 border-b border-gray-200 dark:border-dark-600 pb-2">
                  {t.fishGroups[group]}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {species.map((species) => (
                    <button
                      key={species.id}
                      onClick={() => settings.toggleFishSpecies(species.id)}
                      disabled={!species.enabled && enabledCount >= 3}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        species.enabled
                          ? 'bg-blue-50 dark:bg-blue-900/50 border-2 border-blue-500 dark:border-blue-400'
                          : enabledCount >= 3
                          ? 'bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 opacity-50 cursor-not-allowed'
                          : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-lg font-medium ${
                            species.enabled 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-900 dark:text-dark-50'
                          }`}>
                            {species.name[settings.language]}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            {Object.entries(species.name)
                              .filter(([lang]) => lang !== settings.language)
                              .map(([lang, name]) => (
                                <span 
                                  key={lang} 
                                  className="px-2 py-0.5 text-sm bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 rounded"
                                >
                                  {name}
                                </span>
                              ))}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className={`text-sm mt-1 ${
                            species.enabled 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-500 dark:text-dark-200'
                          }`}>
                            {species.minLength}-{species.maxLength} cm, {t.common.of} {species.maxWeight} kg
                          </p>
                        </div>
                      </div>
                      <div className={`ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        species.enabled
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400'
                          : 'border-gray-300 dark:border-dark-500'
                      }`}>
                        {species.enabled && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection 
        title={t.settings.notifications} 
        icon={<Bell className="w-5 h-5 text-red-600 dark:text-red-400" />}
        isExpanded={expandedSection === 'notifications'}
        onToggle={() => setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')}
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.enableNotifications}</span>
            <input
              type="checkbox"
              checked={settings.notifications.enabled}
              onChange={(e) =>
                settings.updateNotifications({ enabled: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.weatherAlerts}</span>
            <input
              type="checkbox"
              checked={settings.notifications.weatherAlerts}
              onChange={(e) =>
                settings.updateNotifications({ weatherAlerts: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.catchReminders}</span>
            <input
              type="checkbox"
              checked={settings.notifications.catchReminders}
              onChange={(e) =>
                settings.updateNotifications({ catchReminders: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
            />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection 
        title={t.settings.display} 
        icon={<Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        isExpanded={expandedSection === 'display'}
        onToggle={() => setExpandedSection(expandedSection === 'display' ? null : 'display')}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Map Type</h3>
            <div className="grid grid-cols-1 gap-3">
              {MAP_TYPES.map(({ id, name, description, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => settings.updateDisplaySettings({ mapType: id })}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    settings.display.mapType === id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                      : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    settings.display.mapType === id
                      ? 'bg-indigo-100 dark:bg-indigo-800'
                      : 'bg-gray-100 dark:bg-dark-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      settings.display.mapType === id
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium ${
                      settings.display.mapType === id
                        ? 'text-indigo-900 dark:text-indigo-200'
                        : 'text-gray-900 dark:text-gray-200'
                    }`}>
                      {name}
                    </p>
                    <p className={`text-sm ${
                      settings.display.mapType === id
                        ? 'text-indigo-600 dark:text-indigo-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {description}
                    </p>
                  </div>
                  {settings.display.mapType === id && (
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-indigo-500 dark:border-indigo-400 bg-indigo-500 dark:bg-indigo-400">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.showCoordinates}</span>
              <input
                type="checkbox"
                checked={settings.display.showCoordinates}
                onChange={(e) =>
                  settings.updateDisplaySettings({
                    showCoordinates: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.showWeatherDetails}</span>
              <input
                type="checkbox"
                checked={settings.display.showWeatherDetails}
                onChange={(e) =>
                  settings.updateDisplaySettings({
                    showWeatherDetails: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.showMoonPhase}</span>
              <input
                type="checkbox"
                checked={settings.display.showMoonPhase}
                onChange={(e) =>
                  settings.updateDisplaySettings({
                    showMoonPhase: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-dark-50">{t.settings.showTides}</span>
              <input
                type="checkbox"
                checked={settings.display.showTides}
                onChange={(e) =>
                  settings.updateDisplaySettings({
                    showTides: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:bg-dark-600"
              />
            </label>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection 
        title="Data Management" 
        icon={<Download className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
        isExpanded={expandedSection === 'data'}
        onToggle={() => setExpandedSection(expandedSection === 'data' ? null : 'data')}
      >
        <div className="space-y-4">
          <button
            onClick={() => setShowExport(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Location Data</span>
          </button>

          <button
            onClick={() => setShowCleanup(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clean Up Statistics</span>
          </button>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t.settings.reset}
        icon={<RotateCcw className="w-5 h-5 text-red-600 dark:text-red-400" />}
        isExpanded={expandedSection === 'reset'}
        onToggle={() => setExpandedSection(expandedSection === 'reset' ? null : 'reset')}
      >
        <button
          onClick={settings.resetSettings}
          className="w-full py-2 px-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
        >
          {t.settings.resetSettings}
        </button>
      </SettingsSection>

      <ConfirmSettingsDialog
        isOpen={showConfirm}
        onClose={handleDiscardChanges}
        onConfirm={handleSaveChanges}
        changes={getChangedSettings()}
      />

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        sessions={[]}
      />

      <StatsCleanupDialog
        isOpen={showCleanup}
        onClose={() => setShowCleanup(false)}
        onConfirm={(startDate, endDate) => {
          setShowCleanup(false);
        }}
      />
    </div>
  );
}