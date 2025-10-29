import React, { useState, useEffect } from 'react';
import { Camera, Sun, Moon, Calendar, Clock, Cloud, CloudRain, Sunrise, Sunset } from 'lucide-react';
import { Map } from './Map';
import { WeatherDisplay } from './WeatherDisplay';
import { MoonPhase } from './MoonPhase';
import { getWeatherData } from '../utils/weather';
import { FishCatch, WeatherData, FishSpecies } from '../types';
import { useSettings } from '../utils/settings';
import { useTranslation } from '../hooks/useTranslation';
import { useGpsTracking } from '../hooks/useGpsTracking';
import { useLastSpecies } from '../hooks/useLastSpecies';
import { format } from 'date-fns';

interface CatchFormProps {
  onSave: (catchData: Omit<FishCatch, 'id' | 'sessionId'>) => void;
  selectedSpecies: FishSpecies[];
}

const MIN_WEIGHT = 0.25; // Minimum weight in kg

function getTimeOfDay(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return { name: 'Morning', icon: <Sunrise className="w-5 h-5 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: <Sun className="w-5 h-5 text-orange-500" /> };
  if (hour >= 17 && hour < 21) return { name: 'Evening', icon: <Sunset className="w-5 h-5 text-purple-500" /> };
  return { name: 'Night', icon: <Moon className="w-5 h-5 text-indigo-500" /> };
}

function getSeason(date: Date) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

export function CatchForm({ onSave, selectedSpecies }: CatchFormProps) {
  const { language } = useSettings();
  const t = useTranslation();
  const { coords: currentLocation, status: locationStatus } = useGpsTracking();
  const { lastSpecies, setLastSpecies } = useLastSpecies();
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [species, setSpecies] = useState('');
  const [length, setLength] = useState(0);
  const [weight, setWeight] = useState(MIN_WEIGHT);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const now = new Date();
  const timeOfDay = getTimeOfDay(now);
  const season = getSeason(now);

  // Get the selected species data
  const selectedSpeciesData = selectedSpecies.find(s => s.name[language] === species);

  useEffect(() => {
    if (selectedSpecies.length > 0) {
      // Set initial group
      if (!selectedGroup) {
        setSelectedGroup(selectedSpecies[0].group);
      }

      // Set initial species - prefer last used species if available
      if (lastSpecies) {
        const lastUsedSpecies = selectedSpecies.find(s => s.name[language] === lastSpecies);
        if (lastUsedSpecies?.enabled) {
          setSpecies(lastSpecies);
          setLength(lastUsedSpecies.minLength);
          setSelectedGroup(lastUsedSpecies.group);
          return;
        }
      }

      // Fallback to first enabled species
      const defaultSpecies = selectedSpecies.find(s => s.enabled);
      if (defaultSpecies) {
        setSpecies(defaultSpecies.name[language]);
        setLength(defaultSpecies.minLength);
      }
    }
  }, [selectedSpecies, selectedGroup, language, lastSpecies]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentLocation) {
          return; // Don't fetch weather until we have location
        }

        const weatherData = await getWeatherData(
          currentLocation.latitude,
          currentLocation.longitude
        );

        setWeather(weatherData);
        setError(null);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [currentLocation]);

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const handleSpeciesSelect = (selectedSpecies: FishSpecies) => {
    const speciesName = selectedSpecies.name[language];
    setSpecies(speciesName);
    setLength(selectedSpecies.minLength);
    setWeight(MIN_WEIGHT);
    setLastSpecies(speciesName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentLocation || !weather) {
      setError('Location or weather data not available');
      return;
    }

    if (!selectedSpeciesData) {
      setError('Please select a fish species');
      return;
    }

    if (length < selectedSpeciesData.minLength || length > selectedSpeciesData.maxLength) {
      setError(`Length must be between ${selectedSpeciesData.minLength} and ${selectedSpeciesData.maxLength} cm`);
      return;
    }

    if (weight < MIN_WEIGHT || weight > selectedSpeciesData.maxWeight) {
      setError(`Weight must be between ${MIN_WEIGHT} and ${selectedSpeciesData.maxWeight} kg`);
      return;
    }

    const catchData = {
      species,
      length,
      weight,
      location: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString(),
        source: currentLocation.source,
        accuracy: currentLocation.accuracy
      },
      weather,
      photoUrls: photos,
      timestamp: new Date().toISOString()
    };

    await onSave(catchData);

    // Reset form but keep the same species selected
    setLength(selectedSpeciesData.minLength);
    setWeight(MIN_WEIGHT);
    setPhotos([]);
    setError(null);
  };

  if (loading && !currentLocation) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600">Getting your location...</p>
      </div>
    );
  }

  // Group species by their group
  const groupedSpecies = selectedSpecies.reduce((acc, species) => {
    if (!acc[species.group]) {
      acc[species.group] = [];
    }
    acc[species.group].push(species);
    return acc;
  }, {} as Record<string, FishSpecies[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Time and Date Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {timeOfDay.icon}
          <div>
            <p className="text-sm font-medium text-gray-600">Time of Day</p>
            <p className="text-base font-semibold text-gray-900">{timeOfDay.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-gray-600">Season</p>
            <p className="text-base font-semibold text-gray-900">{season}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-600">Date</p>
            <p className="text-base font-semibold text-gray-900">{format(now, 'dd.MM.yyyy')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-gray-600">Time</p>
            <p className="text-base font-semibold text-gray-900">{format(now, 'HH:mm')}</p>
          </div>
        </div>
      </div>

      {currentLocation && (
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <Map 
            center={[currentLocation.latitude, currentLocation.longitude]}
            catches={[{ location: currentLocation, species }]}
            showRadius={true}
            height="150px"
            currentLocation={currentLocation}
          />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Weather Information */}
      {weather && (
        <div className="space-y-4">
          <WeatherDisplay weather={weather} />
          <MoonPhase />
        </div>
      )}

      <div className="space-y-4">
        {/* Species Selection */}
        <div>
          {/* Group Selection Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {Object.keys(groupedSpecies).map(group => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedGroup === group
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.fishGroups[group]}
              </button>
            ))}
          </div>

          {/* Species List */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {selectedGroup && groupedSpecies[selectedGroup]?.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSpeciesSelect(s)}
                className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-all ${
                  s.name[language] === species
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-base font-medium">{s.name[language]}</span>
                <div className="text-sm text-gray-500 mt-1">
                  {s.minLength}-{s.maxLength} cm / {s.maxWeight} kg
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedSpeciesData && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.catch.length} ({selectedSpeciesData.minLength} - {selectedSpeciesData.maxLength} cm)
              </label>
              <input
                type="range"
                min={selectedSpeciesData.minLength}
                max={selectedSpeciesData.maxLength}
                step={0.5}
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value))}
                className="mt-1 block w-full"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">{selectedSpeciesData.minLength} cm</span>
                <span className="text-sm font-medium text-blue-600">{length} cm</span>
                <span className="text-sm text-gray-500">{selectedSpeciesData.maxLength} cm</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t.catch.weight} ({MIN_WEIGHT} - {selectedSpeciesData.maxWeight} kg)
              </label>
              <input
                type="range"
                min={MIN_WEIGHT}
                max={selectedSpeciesData.maxWeight}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value))}
                className="mt-1 block w-full"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">{MIN_WEIGHT} kg</span>
                <span className="text-sm font-medium text-blue-600">{weight} kg</span>
                <span className="text-sm text-gray-500">{selectedSpeciesData.maxWeight} kg</span>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.catch.photos}</label>
          <div className="flex items-center justify-center w-full">
            <label className="w-full flex flex-col items-center justify-center px-4 py-6 bg-white text-blue-500 rounded-lg border-2 border-blue-400 border-dashed cursor-pointer hover:bg-blue-50 transition-colors">
              <Camera className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">{t.catch.addPhotos}</span>
              <span className="text-xs text-gray-500 mt-1">{t.catch.tapToCapture}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handlePhotoCapture}
              />
            </label>
          </div>
          {photos.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Catch photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!currentLocation || !weather || !selectedSpeciesData}
        className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
          !currentLocation || !weather || !selectedSpeciesData
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {!currentLocation || !weather ? 'Waiting for location...' : t.catch.saveButton}
      </button>
    </form>
  );
}