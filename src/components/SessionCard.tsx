import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { 
  Clock, MapPin, Fish, Sun, Cloud, XCircle, Calendar, Trophy, Ruler, ChevronDown, ChevronUp, 
  Pause, Play, Save, Trash2, Moon, Settings, Table, Flag, X, Sunrise, Sunset 
} from 'lucide-react';
import { FishingSession, Location } from '../types';
import { WeatherDisplay } from './WeatherDisplay';
import { WeatherCharts } from './WeatherCharts';
import { Map } from './Map';
import { ConfirmDialog } from './ConfirmDialog';
import { useSettings } from '../utils/settings';
import { getMoonPhase } from '../utils/moon';
import { CatchList } from './CatchList';
import { useGpsTracking } from '../hooks/useGpsTracking';

interface SessionCardProps {
  session: FishingSession;
  isActive: boolean;
  onEndSession?: () => void;
  onDiscardSession?: () => void;
  onPauseSession?: () => void;
  onResumeSession?: () => void;
  onDeleteCatch?: (catchId: string) => void;
  onEditCatch?: (catchId: string, photos: string[], description: string) => void;
  onToggleTracking?: (enabled: boolean) => void;
  onAddWaypoint?: (location: Location) => void;
}

function getTimeOfDay(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return { name: 'Morning', icon: <Sunrise className="w-5 h-5 text-amber-500" /> };
  if (hour >= 12 && hour < 17) return { name: 'Afternoon', icon: <Sun className="w-5 h-5 text-orange-500" /> };
  if (hour >= 17 && hour < 21) return { name: 'Evening', icon: <Sunset className="w-5 h-5 text-purple-500" /> };
  return { name: 'Night', icon: <Moon className="w-5 h-5 text-indigo-500" /> };
}

export function SessionCard({
  session,
  isActive,
  onEndSession,
  onDiscardSession,
  onPauseSession,
  onResumeSession,
  onDeleteCatch,
  onEditCatch,
  onToggleTracking,
  onAddWaypoint
}: SessionCardProps) {
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);
  const [showTrackingRecords, setShowTrackingRecords] = useState(false);
  const [isWaypointMode, setIsWaypointMode] = useState(false);
  const settings = useSettings();
  const { coords: currentLocation } = useGpsTracking();
  
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;
  
  const totalDuration = endTime 
    ? differenceInMinutes(endTime, startTime)
    : differenceInMinutes(new Date(), startTime);
  
  const activeDuration = totalDuration - (session.totalPauseTime || 0);
  
  const lastLocation = session.locations[session.locations.length - 1];
  const totalCatches = session.catches.length;
  
  const bestCatch = session.catches.length > 0
    ? session.catches.reduce((max, c) => c.weight > max.weight ? c : max)
    : null;

  const totalWeight = session.catches.reduce((sum, c) => sum + c.weight, 0);
  const averageWeight = totalCatches > 0 ? totalWeight / totalCatches : 0;

  const isPaused = session.pauses?.some(p => !p.endTime);

  const moonPhase = getMoonPhase(startTime);
  const timeOfDay = getTimeOfDay(startTime);

  const handleWaypointAdd = (location: Location) => {
    onAddWaypoint?.(location);
    setIsWaypointMode(false);
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-md overflow-hidden border transition-all ${
        isActive 
          ? 'border-blue-500 ring-2 ring-blue-100' 
          : 'border-gray-100 hover:shadow-lg'
      }`}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-blue-900">
                  Fishing Session
                </h3>
                {isActive && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    isPaused 
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{format(startTime, 'dd.MM.yyyy')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{format(startTime, 'HH:mm')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-100">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {activeDuration} min
                  </span>
                </div>
                {session.totalPauseTime && session.totalPauseTime > 0 && (
                  <span className="text-xs text-gray-500">
                    {session.totalPauseTime} min paused
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Session Controls */}
          {isActive && (
            <div className="flex items-center gap-3 mb-4">
              {isPaused ? (
                <button
                  onClick={() => setShowResumeConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-xs">Resume Session</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowPauseConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-xs">Pause Session</span>
                </button>
              )}
              <button
                onClick={() => setShowEndConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-xs">End & Save</span>
              </button>
              <button
                onClick={() => setShowDiscardConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-xs">Discard</span>
              </button>
            </div>
          )}

          {/* Waypoint Button */}
          {isActive && onAddWaypoint && (
            <div className="mb-4">
              <button
                onClick={() => setIsWaypointMode(!isWaypointMode)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isWaypointMode
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {isWaypointMode ? (
                  <>
                    <X className="w-4 h-4" />
                    <span className="text-xs">Cancel Waypoint</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    <span className="text-xs">Add Waypoint</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Map */}
          {lastLocation && (
            <div className="space-y-4 mb-4">
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <Map
                  center={[lastLocation.latitude, lastLocation.longitude]}
                  catches={session.catches.map(c => ({
                    location: c.location,
                    species: c.species
                  }))}
                  locations={session.locations}
                  showRadius={true}
                  height="180px"
                  currentLocation={isActive ? currentLocation : undefined}
                  onAddWaypoint={isWaypointMode ? handleWaypointAdd : undefined}
                  isActive={isActive}
                  interactive={isWaypointMode}
                />
              </div>

              {/* Time of Day and Moon Phase */}
              <div className="grid grid-cols-2 gap-4">
                {settings.display.showTimeOfDay && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {timeOfDay.icon}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Time of Day</p>
                      <p className="text-base font-semibold text-gray-900">{timeOfDay.name}</p>
                    </div>
                  </div>
                )}

                {settings.display.showMoonPhase && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Moon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Moon Phase</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{moonPhase.emoji}</span>
                        <p className="text-base font-semibold text-gray-900">{moonPhase.phase}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Current Weather */}
          {session.weather && (
            <div className="mb-4">
              <WeatherDisplay weather={session.weather} />
            </div>
          )}

          {/* Weather Trends */}
          {!isActive && session.locations.length > 1 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Weather Trends</h4>
              <WeatherCharts session={session} />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <Fish className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-900 font-medium">Total Catches</p>
                <p className="text-2xl font-bold text-blue-600">{totalCatches}</p>
              </div>
            </div>

            {bestCatch && (
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl">
                <div className="p-2.5 bg-green-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-900 font-medium">Best Catch</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">{bestCatch.weight}</span>
                    <span className="text-sm text-green-700">kg</span>
                  </div>
                </div>
              </div>
            )}

            {totalCatches > 0 && (
              <>
                <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl">
                  <div className="p-2.5 bg-purple-100 rounded-lg">
                    <Ruler className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-900 font-medium">Total Weight</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-purple-600">{totalWeight.toFixed(1)}</span>
                      <span className="text-sm text-purple-700">kg</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-xl">
                  <div className="p-2.5 bg-orange-100 rounded-lg">
                    <Fish className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-900 font-medium">Average Weight</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-orange-600">{averageWeight.toFixed(1)}</span>
                      <span className="text-sm text-orange-700">kg</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mb-4 bg-gray-50 p-4 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              <p className="text-sm text-gray-600">{session.notes}</p>
            </div>
          )}

          {/* Catches List */}
          {session.catches.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Catches</h4>
              <CatchList
                catches={session.catches}
                onDeleteCatch={onDeleteCatch}
                onEditCatch={onEditCatch}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={() => {
          setShowEndConfirm(false);
          onEndSession?.();
        }}
        title="End Fishing Session"
        message="Are you sure you want to end this session? All data will be saved."
        confirmText="End & Save"
        confirmColor="blue"
      />

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onDiscardSession?.();
        }}
        title="Discard Session"
        message="Are you sure you want to discard this session? All data will be lost."
        confirmText="Discard"
        confirmColor="red"
      />

      <ConfirmDialog
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={() => {
          setShowPauseConfirm(false);
          onPauseSession?.();
        }}
        title="Pause Session"
        message="Are you sure you want to pause this session? The timer will stop until you resume."
        confirmText="Pause"
        confirmColor="orange"
      />

      <ConfirmDialog
        isOpen={showResumeConfirm}
        onClose={() => setShowResumeConfirm(false)}
        onConfirm={() => {
          setShowResumeConfirm(false);
          onResumeSession?.();
        }}
        title="Resume Session"
        message="Are you sure you want to resume this session? The timer will continue."
        confirmText="Resume"
        confirmColor="green"
      />
    </>
  );
}