import { format } from 'date-fns';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Ruler,
  Scale,
  Clock,
  Calendar,
  Sun,
  Cloud,
  Wind,
  Thermometer,
  Camera,
  Navigation,
  Trash2,
  Sunrise,
  Sunset,
  Moon,
  Satellite,
  Antenna
} from 'lucide-react';
import { WeatherDisplay } from './WeatherDisplay';
import { Map } from './Map';
import { FishCatch } from '../types';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface CatchListProps {
  catches: FishCatch[];
  onDeleteCatch?: (catchId: string) => void;
}

export function CatchList({ catches, onDeleteCatch }: CatchListProps) {
  const [expandedCatchId, setExpandedCatchId] = useState<string | null>(null);
  const [catchToDelete, setCatchToDelete] = useState<string | null>(null);

  const getTimeOfDay = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return { name: 'Morning', icon: <Sunrise className="w-4 h-4 text-amber-500" /> };
    if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: <Sun className="w-4 h-4 text-orange-500" /> };
    if (hour >= 17 && hour < 21) return { name: 'Evening', icon: <Sunset className="w-4 h-4 text-purple-500" /> };
    return { name: 'Night', icon: <Moon className="w-4 h-4 text-indigo-500" /> };
  };

  const getSeason = (date: Date) => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Autumn';
    return 'Winter';
  };

  const toggleCatchDetails = (catchId: string) => {
    setExpandedCatchId(expandedCatchId === catchId ? null : catchId);
  };

  const handleDelete = (catchId: string) => {
    setCatchToDelete(catchId);
  };

  const confirmDelete = () => {
    if (catchToDelete && onDeleteCatch) {
      onDeleteCatch(catchToDelete);
      if (expandedCatchId === catchToDelete) {
        setExpandedCatchId(null);
      }
    }
    setCatchToDelete(null);
  };

  return (
    <div className="space-y-4">
      {catches.map((catch_) => {
        const catchDate = new Date(catch_.timestamp);
        const isExpanded = expandedCatchId === catch_.id;
        const timeOfDay = getTimeOfDay(catchDate);
        
        return (
          <div 
            key={catch_.id} 
            className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
              isExpanded ? 'border-blue-200 shadow-md' : 'border-gray-100'
            }`}
          >
            {/* Summary Card - Always Visible */}
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => toggleCatchDetails(catch_.id)}
                className="flex-1 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{catch_.species}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      <span>{format(catchDate, 'dd.MM.yyyy HH:mm')}</span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{catch_.length}cm</span>
                      <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{catch_.weight}kg</span>
                      {catch_.photoUrls && catch_.photoUrls.length > 0 && (
                        <>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{catch_.photoUrls.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
              {onDeleteCatch && (
                <button
                  onClick={() => handleDelete(catch_.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Time and Environmental Info */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Sun className="w-4 h-4" />
                      <span className="text-sm font-medium">Time of Day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {timeOfDay.icon}
                      <p className="text-lg font-medium text-blue-900">
                        {timeOfDay.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Season</span>
                    </div>
                    <p className="text-lg font-medium text-green-900">
                      {getSeason(catchDate)}
                    </p>
                  </div>

                  {catch_.weather && (
                    <>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <Thermometer className="w-4 h-4" />
                          <span className="text-sm font-medium">Temperature</span>
                        </div>
                        <p className="text-lg font-medium text-purple-900">
                          {catch_.weather.temperature}°C
                        </p>
                      </div>

                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                          <Wind className="w-4 h-4" />
                          <span className="text-sm font-medium">Wind</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-medium text-orange-900">
                            {catch_.weather.windSpeed} m/s
                          </span>
                          <Navigation
                            className="w-4 h-4 text-orange-600"
                            style={{
                              transform: `rotate(${
                                catch_.weather.windDirection === 'N' ? 0 :
                                catch_.weather.windDirection === 'NE' ? 45 :
                                catch_.weather.windDirection === 'E' ? 90 :
                                catch_.weather.windDirection === 'SE' ? 135 :
                                catch_.weather.windDirection === 'S' ? 180 :
                                catch_.weather.windDirection === 'SW' ? 225 :
                                catch_.weather.windDirection === 'W' ? 270 :
                                catch_.weather.windDirection === 'NW' ? 315 : 0
                              }deg)`
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Location Details */}
                <div className="px-4 pb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Location Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Latitude</span>
                      </div>
                      <p className="text-base font-medium text-blue-900">
                        {catch_.location.latitude.toFixed(6)}°
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Longitude</span>
                      </div>
                      <p className="text-base font-medium text-green-900">
                        {catch_.location.longitude.toFixed(6)}°
                      </p>
                    </div>

                    {catch_.location.accuracy && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <Satellite className="w-4 h-4" />
                          <span className="text-sm font-medium">Accuracy</span>
                        </div>
                        <p className="text-base font-medium text-purple-900">
                          ±{Math.round(catch_.location.accuracy)}m
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        {catch_.location.source === 'gps' ? <Satellite className="w-4 h-4" /> :
                         catch_.location.source === 'network' ? <Antenna className="w-4 h-4" /> :
                         <MapPin className="w-4 h-4" />}
                        <span className="text-sm font-medium">Source</span>
                      </div>
                      <p className="text-base font-medium text-orange-900 capitalize">
                        {catch_.location.source === 'gps' ? 'GPS' :
                         catch_.location.source === 'network' ? 'Network' : 'IP'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-gray-100">
                    <Map
                      center={[catch_.location.latitude, catch_.location.longitude]}
                      catches={[{ location: catch_.location, species: catch_.species }]}
                      showRadius={true}
                    />
                  </div>
                </div>

                {/* Weather Details */}
                {catch_.weather && (
                  <div className="px-4 pb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Weather Conditions</h4>
                    <WeatherDisplay weather={catch_.weather} />
                  </div>
                )}

                {/* Photos */}
                {catch_.photoUrls && catch_.photoUrls.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-4 h-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-700">Photos</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {catch_.photoUrls.map((url, photoIndex) => (
                        <img
                          key={photoIndex}
                          src={url}
                          alt={`${catch_.species} catch photo ${photoIndex + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Measurements */}
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Ruler className="w-4 h-4" />
                        <span className="text-sm font-medium">Length</span>
                      </div>
                      <p className="text-2xl font-medium text-indigo-900">
                        {catch_.length} <span className="text-base text-indigo-600">cm</span>
                      </p>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <div className="flex items-center gap-2 text-teal-600 mb-1">
                        <Scale className="w-4 h-4" />
                        <span className="text-sm font-medium">Weight</span>
                      </div>
                      <p className="text-2xl font-medium text-teal-900">
                        {catch_.weight} <span className="text-base text-teal-600">kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!catchToDelete}
        onClose={() => setCatchToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Catch"
        message="Are you sure you want to delete this catch? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
}