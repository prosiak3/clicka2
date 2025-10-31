import React, { useState, useEffect, useMemo } from 'react';
import { Camera, X } from 'lucide-react';
import { Map } from './Map';
import { WeatherDisplay } from './WeatherDisplay';
import { getWeatherData } from '../utils/weather';
import { FishCatch, WeatherData, FishSpecies } from '../types';
import { useSettings } from '../utils/settings';
import { useTranslation } from '../hooks/useTranslation';
import { useGpsTracking } from '../hooks/useGpsTracking';
import { useLastSpecies } from '../hooks/useLastSpecies';
import { getFishSpecies, FishSpeciesDetails, calculateSuggestedWeight } from '../utils/fish';

interface CatchFormProps {
  onSave: (catchData: Omit<FishCatch, 'id' | 'sessionId'>) => void;
  onCancel: () => void;
  selectedSpecies: FishSpecies[];
}

const MIN_WEIGHT = 0.25;

const TOP_SPECIES = ['Pike', 'Perch', 'Zander'];

export function CatchForm({ onSave, onCancel, selectedSpecies }: CatchFormProps) {
  const { language } = useSettings();
  const t = useTranslation();
  const { coords: currentLocation, status: locationStatus } = useGpsTracking();
  const { lastSpecies, setLastSpecies } = useLastSpecies();

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [species, setSpecies] = useState('');
  const [length, setLength] = useState(25);
  const [weight, setWeight] = useState(MIN_WEIGHT);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishSpeciesData, setFishSpeciesData] = useState<FishSpeciesDetails[]>([]);
  const [manualWeightEdit, setManualWeightEdit] = useState(false);

  const selectedSpeciesData = selectedSpecies.find(s => s.name[language] === species);

  const topSpeciesList = useMemo(() =>
    selectedSpecies.filter(s => TOP_SPECIES.includes(s.name.en) && s.enabled),
    [selectedSpecies]
  );

  useEffect(() => {
    console.log('Initial species useEffect - topSpeciesList:', topSpeciesList.length, 'lastSpecies:', lastSpecies);
    if (topSpeciesList.length > 0) {
      if (lastSpecies) {
        const lastUsedSpecies = topSpeciesList.find(s => s.name[language] === lastSpecies);
        if (lastUsedSpecies && lastUsedSpecies.minLength) {
          console.log('Setting species to last used:', lastSpecies, 'length:', lastUsedSpecies.minLength);
          setSpecies(lastSpecies);
          setLength(lastUsedSpecies.minLength);
          return;
        }
      }

      const defaultSpecies = topSpeciesList[0];
      if (defaultSpecies.minLength) {
        console.log('Setting species to default:', defaultSpecies.name[language], 'length:', defaultSpecies.minLength);
        setSpecies(defaultSpecies.name[language]);
        setLength(defaultSpecies.minLength);
      }
    }
  }, [topSpeciesList, language, lastSpecies]);

  useEffect(() => {
    const loadFishData = async () => {
      const data = await getFishSpecies();
      setFishSpeciesData(data);
    };
    loadFishData();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentLocation) {
          return;
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

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpeciesSelect = (selectedSpecies: FishSpecies) => {
    const speciesName = selectedSpecies.name[language];
    setSpecies(speciesName);
    if (selectedSpecies.minLength) {
      setLength(selectedSpecies.minLength);
    }
    setWeight(MIN_WEIGHT);
    setManualWeightEdit(false);
    setLastSpecies(speciesName);
  };

  useEffect(() => {
    console.log('Weight calculation useEffect triggered - length:', length, 'species:', species);
    if (!manualWeightEdit && selectedSpeciesData && selectedSpeciesData.maxWeight) {
      const fullSpeciesData = fishSpeciesData.find(fs => {
        const nameMatch = fs.name_pl === species || fs.name_en === species || fs.name_de === species;
        return nameMatch;
      });

      if (fullSpeciesData?.length_weight_data) {
        const suggestedWeight = calculateSuggestedWeight(
          length,
          fullSpeciesData.length_weight_data,
          MIN_WEIGHT
        );
        const clampedWeight = Math.max(MIN_WEIGHT, Math.min(suggestedWeight, selectedSpeciesData.maxWeight));
        console.log('Setting weight to:', clampedWeight, 'based on length:', length);
        setWeight(clampedWeight);
      }
    }
  }, [length, species, fishSpeciesData, manualWeightEdit, selectedSpeciesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentLocation) {
      setError('Location data not available');
      return;
    }

    if (!selectedSpeciesData) {
      setError('Please select a fish species');
      return;
    }

    if (!selectedSpeciesData.minLength || !selectedSpeciesData.maxLength || !selectedSpeciesData.maxWeight) {
      setError('Species data is incomplete');
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
      weather: weather || null,
      photoUrls: photos,
      timestamp: new Date().toISOString()
    };

    await onSave(catchData);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Species Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {topSpeciesList.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleSpeciesSelect(s)}
            className={`p-3 rounded-xl border-2 transition-all ${
              s.name[language] === species
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-center">
              <div className={`text-base font-semibold ${
                s.name[language] === species ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {s.name[language]}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {s.minLength}-{s.maxLength} cm / {s.maxWeight} kg
              </div>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {selectedSpeciesData && selectedSpeciesData.minLength && selectedSpeciesData.maxLength && selectedSpeciesData.maxWeight && (
        <>
          {/* Length Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Length ({selectedSpeciesData.minLength} - {selectedSpeciesData.maxLength} cm)
            </label>
            <input
              type="range"
              min={selectedSpeciesData.minLength}
              max={selectedSpeciesData.maxLength}
              step={1}
              value={length}
              onChange={(e) => {
                const newLength = parseFloat(e.target.value);
                console.log('Length slider onChange:', newLength, 'current:', length, 'manualWeightEdit:', manualWeightEdit);
                setLength(newLength);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{selectedSpeciesData.minLength} cm</span>
              <span className="text-lg font-bold text-blue-600">{length} cm</span>
              <span className="text-sm text-gray-500">{selectedSpeciesData.maxLength} cm</span>
            </div>
          </div>

          {/* Weight Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight ({MIN_WEIGHT} - {selectedSpeciesData.maxWeight} kg)
            </label>
            <input
              type="range"
              min={MIN_WEIGHT}
              max={selectedSpeciesData.maxWeight}
              step={0.01}
              value={weight}
              onChange={(e) => {
                const newWeight = parseFloat(e.target.value);
                console.log('Weight slider onChange:', newWeight, 'setting manualWeightEdit to true');
                setWeight(newWeight);
                setManualWeightEdit(true);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{MIN_WEIGHT} kg</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">{weight.toFixed(2)} kg</span>
                {!manualWeightEdit && (
                  <span className="text-xs text-gray-400">(suggested)</span>
                )}
              </div>
              <span className="text-sm text-gray-500">{selectedSpeciesData.maxWeight} kg</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentLocation || !selectedSpeciesData}
              className={`flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                !currentLocation || !selectedSpeciesData
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {!currentLocation ? 'Waiting for location...' : t.catch.saveButton}
            </button>
          </div>
        </>
      )}

      {/* Photos Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Photos</label>

        {photos.length === 0 ? (
          <label className="w-full flex flex-col items-center justify-center px-6 py-12 bg-white text-blue-500 rounded-xl border-2 border-blue-300 border-dashed cursor-pointer hover:bg-blue-50 transition-colors">
            <Camera className="h-12 w-12 mb-3" />
            <span className="text-base font-medium text-blue-600">Add photos</span>
            <span className="text-sm text-gray-500 mt-1">Tap to capture</span>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={handlePhotoCapture}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Catch photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">Add more photos</span>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handlePhotoCapture}
              />
            </label>
          </div>
        )}
      </div>

      {/* Map */}
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

      {/* Weather Information */}
      {weather && (
        <div>
          <WeatherDisplay weather={weather} />
        </div>
      )}
    </form>
  );
}
