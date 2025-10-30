import React, { useState } from 'react';
import { FishingSession, CloudType } from '../types';
import { format, differenceInMinutes, getMonth } from 'date-fns';
import { Fish, Clock, Sun, Moon, Wind, Thermometer, Trophy, Scale, Calendar, BarChart as ChartBar, CloudRain, Cloud } from 'lucide-react';
import { getMoonPhase } from '../utils/moon';
import { useTranslation } from '../hooks/useTranslation';

interface AnalysisSectionProps {
  sessions: FishingSession[];
}

interface DateRange {
  start: Date;
  end: Date;
}

const temperatureRanges = [
  { min: 30, max: Infinity, label: 'Above 30°C' },
  { min: 25, max: 29.9, label: '25-29.9°C' },
  { min: 20, max: 24.9, label: '20-24.9°C' },
  { min: 15, max: 19.9, label: '15-19.9°C' },
  { min: 10, max: 14.9, label: '10-14.9°C' },
  { min: 5, max: 9.9, label: '5-9.9°C' },
  { min: 0, max: 4.99, label: '0-4.99°C' },
  { min: -Infinity, max: 0, label: 'Below 0°C' }
];

const seasons = [
  { name: 'Spring', months: [2, 3, 4] },
  { name: 'Summer', months: [5, 6, 7] },
  { name: 'Autumn', months: [8, 9, 10] },
  { name: 'Winter', months: [11, 0, 1] }
];

export function AnalysisSection({ sessions }: AnalysisSectionProps) {
  const t = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  });

  // Filter sessions by date range
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
  });

  // Calculate overall statistics
  const totalCatches = filteredSessions.reduce((sum, s) => sum + s.catches.length, 0);
  const totalSessions = filteredSessions.length;
  const completedSessions = filteredSessions.filter(s => s.endTime).length;
  const totalWeight = filteredSessions.reduce((sum, session) =>
    session.catches.reduce((catchSum, catch_) => catchSum + catch_.weight, 0)
  , 0);

  const bestCatch = filteredSessions.reduce((best, session) => {
    const sessionBest = session.catches.reduce((max, catch_) =>
      catch_.weight > max.weight ? catch_ : max
    , { weight: 0, species: '', length: 0 });
    return sessionBest.weight > best.weight ? sessionBest : best;
  }, { weight: 0, species: '', length: 0 });

  // Calculate moon phase distribution
  const moonPhaseStats = filteredSessions.reduce((stats, session) => {
    session.catches.forEach(catch_ => {
      const phase = getMoonPhase(new Date(catch_.timestamp));
      stats[phase.phase] = (stats[phase.phase] || 0) + 1;
    });
    return stats;
  }, {} as Record<string, number>);

  // Calculate cloud cover distribution
  const cloudCoverStats = filteredSessions.reduce((stats, session) => {
    session.catches.forEach(catch_ => {
      const cover = catch_.weather.cloudCover;
      if (cover <= 25) stats.clear++;
      else if (cover <= 50) stats.partlyCloudy++;
      else if (cover <= 75) stats.mostlyCloudy++;
      else stats.overcast++;
    });
    return stats;
  }, { clear: 0, partlyCloudy: 0, mostlyCloudy: 0, overcast: 0 });

  // Calculate cloud type distribution
  const cloudTypeStats = filteredSessions.reduce((stats, session) => {
    session.catches.forEach(catch_ => {
      const cloudType = catch_.weather.dominantCloudType || 'clear';
      stats[cloudType] = (stats[cloudType] || 0) + 1;
    });
    return stats;
  }, {} as Record<string, number>);

  // Calculate temperature distribution
  const tempStats = filteredSessions.reduce((stats, session) => {
    session.catches.forEach(catch_ => {
      const temp = catch_.weather.temperature;
      const hour = new Date(catch_.timestamp).getHours();
      const month = new Date(catch_.timestamp).getMonth();
      const season = seasons.find(s => s.months.includes(month))?.name || 'Unknown';

      // Add to temperature range stats
      const range = temperatureRanges.find(r => temp >= r.min && temp < r.max);
      if (range) {
        stats.ranges[range.label] = (stats.ranges[range.label] || 0) + 1;
      }

      // Add to time of day stats
      const timeOfDay = 
        hour >= 5 && hour < 12 ? 'Morning' :
        hour >= 12 && hour < 17 ? 'Afternoon' :
        hour >= 17 && hour < 21 ? 'Evening' : 'Night';
      
      if (!stats.byTimeOfDay[range?.label || '']) {
        stats.byTimeOfDay[range?.label || ''] = {};
      }
      stats.byTimeOfDay[range?.label || ''][timeOfDay] = 
        (stats.byTimeOfDay[range?.label || ''][timeOfDay] || 0) + 1;

      // Add to season stats
      if (!stats.bySeason[range?.label || '']) {
        stats.bySeason[range?.label || ''] = {};
      }
      stats.bySeason[range?.label || ''][season] = 
        (stats.bySeason[range?.label || ''][season] || 0) + 1;

      // Add to month stats
      if (!stats.byMonth[range?.label || '']) {
        stats.byMonth[range?.label || ''] = {};
      }
      const monthName = format(new Date(catch_.timestamp), 'MMMM');
      stats.byMonth[range?.label || ''][monthName] = 
        (stats.byMonth[range?.label || ''][monthName] || 0) + 1;
    });
    return stats;
  }, {
    ranges: {} as Record<string, number>,
    byTimeOfDay: {} as Record<string, Record<string, number>>,
    bySeason: {} as Record<string, Record<string, number>>,
    byMonth: {} as Record<string, Record<string, number>>
  });

  return (
    <div className="space-y-6">
      {/* Date Range Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Analysis Period</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={format(dateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={format(dateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Fish className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Catches</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalCatches}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Total Weight</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalWeight.toFixed(1)} kg</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{completedSessions}</p>
            <p className="text-sm text-purple-600">of {totalSessions} total</p>
          </div>

          {bestCatch.weight > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Best Catch</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{bestCatch.weight} kg</p>
              <p className="text-sm text-yellow-600">{bestCatch.species}</p>
            </div>
          )}
        </div>
      </div>

      {/* Moon Phase Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-6 h-6 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Moon Phase Analysis</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(moonPhaseStats).map(([phase, count]) => (
            <div key={phase} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-900">{phase}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(count / totalCatches) * 100}%` }}
                />
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {count} ({Math.round((count / totalCatches) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Cover Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cloud Cover Analysis</h2>
        </div>
        <div className="space-y-3">
          {Object.entries(cloudCoverStats).map(([condition, count]) => (
            <div key={condition} className="flex items-center gap-4">
              <div className="w-32 text-sm font-medium text-gray-900 capitalize">
                {condition.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(count / totalCatches) * 100}%` }}
                />
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {count} ({Math.round((count / totalCatches) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Type Analysis */}
      {Object.keys(cloudTypeStats).length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cloud Type Analysis</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(cloudTypeStats)
              .sort(([, a], [, b]) => b - a)
              .map(([cloudType, count]) => {
                const typedCloudType = cloudType as CloudType;
                return (
                  <div key={cloudType} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-medium text-gray-900">
                      {t.weather.cloudTypes[typedCloudType] || cloudType}
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: `${(count / totalCatches) * 100}%` }}
                      />
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {count} ({Math.round((count / totalCatches) * 100)}%)
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">
              This analysis shows which cloud types were present during your most successful catches.
              Understanding cloud patterns can help predict better fishing conditions.
            </p>
          </div>
        </div>
      )}

      {/* Temperature Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Temperature Analysis</h2>
        </div>

        {/* Overall Temperature Distribution */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Overall Distribution</h3>
          <div className="space-y-3">
            {temperatureRanges.map(range => {
              const count = tempStats.ranges[range.label] || 0;
              return (
                <div key={range.label} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-900">{range.label}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(count / totalCatches) * 100}%` }}
                    />
                  </div>
                  <div className="w-20 text-sm text-gray-600 text-right">
                    {count} ({Math.round((count / totalCatches) * 100)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Temperature by Time of Day */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Time of Day</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Temperature</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Morning</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Afternoon</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Evening</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Night</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {temperatureRanges.map(range => (
                  <tr key={range.label}>
                    <td className="px-3 py-2 text-sm text-gray-900">{range.label}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.byTimeOfDay[range.label]?.Morning || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.byTimeOfDay[range.label]?.Afternoon || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.byTimeOfDay[range.label]?.Evening || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.byTimeOfDay[range.label]?.Night || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Temperature by Season */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Season</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Temperature</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Spring</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Summer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Autumn</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Winter</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {temperatureRanges.map(range => (
                  <tr key={range.label}>
                    <td className="px-3 py-2 text-sm text-gray-900">{range.label}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.bySeason[range.label]?.Spring || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.bySeason[range.label]?.Summer || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.bySeason[range.label]?.Autumn || 0}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {tempStats.bySeason[range.label]?.Winter || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Temperature by Month */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">By Month</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Temperature</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      {format(new Date(2024, i, 1), 'MMM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {temperatureRanges.map(range => (
                  <tr key={range.label}>
                    <td className="px-3 py-2 text-sm text-gray-900">{range.label}</td>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthName = format(new Date(2024, i, 1), 'MMMM');
                      return (
                        <td key={i} className="px-3 py-2 text-sm text-gray-600">
                          {tempStats.byMonth[range.label]?.[monthName] || 0}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}