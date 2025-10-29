import React from 'react';
import { format } from 'date-fns';
import { Fish, Calendar, Clock } from 'lucide-react';
import { FishingSession } from '../types';

interface SessionListProps {
  sessions: FishingSession[];
  onSessionSelect: (session: FishingSession) => void;
}

export function SessionList({ sessions, onSessionSelect }: SessionListProps) {
  return (
    <div className="space-y-4">
      {sessions.map(session => {
        const startTime = new Date(session.startTime);
        const endTime = session.endTime ? new Date(session.endTime) : null;
        const duration = endTime 
          ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) 
          : 0;
        
        const totalCatches = session.catches.length;
        const bestCatch = session.catches.length > 0
          ? session.catches.reduce((max, c) => c.weight > max.weight ? c : max)
          : null;

        return (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session)}
            className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Fish className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Fishing Session</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{format(startTime, 'dd.MM.yyyy')}</span>
                    <span className="text-gray-300">•</span>
                    <Clock className="w-4 h-4" />
                    <span>{format(startTime, 'HH:mm')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{duration} min</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-900">Catches:</span>
                <span className="text-blue-700">{totalCatches}</span>
              </div>
              {bestCatch && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">Best:</span>
                  <span className="text-green-700">{bestCatch.weight} kg</span>
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}