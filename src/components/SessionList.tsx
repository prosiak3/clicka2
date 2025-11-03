import React from 'react';
import { format } from 'date-fns';
import { Fish, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react';
import { FishingSession } from '../types';
import { useLongPress } from '../hooks/useLongPress';

interface SessionListProps {
  sessions: FishingSession[];
  onSessionSelect: (session: FishingSession) => void;
  selectionMode: boolean;
  selectedSessions: string[];
  onToggleSelection: (sessionId: string) => void;
  onEnterSelectionMode: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  onSessionSelect,
  selectionMode,
  selectedSessions,
  onToggleSelection,
  onEnterSelectionMode
}: SessionListProps) {
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

        const isSelected = selectedSessions.includes(session.id);

        return (
          <SessionCard
            key={session.id}
            session={session}
            startTime={startTime}
            duration={duration}
            totalCatches={totalCatches}
            bestCatch={bestCatch}
            isSelected={isSelected}
            selectionMode={selectionMode}
            onSelect={() => onSessionSelect(session)}
            onToggleSelection={() => onToggleSelection(session.id)}
            onEnterSelectionMode={() => onEnterSelectionMode(session.id)}
          />
        );
      })}
    </div>
  );
}

interface SessionCardProps {
  session: FishingSession;
  startTime: Date;
  duration: number;
  totalCatches: number;
  bestCatch: any;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onToggleSelection: () => void;
  onEnterSelectionMode: () => void;
}

function SessionCard({
  session,
  startTime,
  duration,
  totalCatches,
  bestCatch,
  isSelected,
  selectionMode,
  onSelect,
  onToggleSelection,
  onEnterSelectionMode,
}: SessionCardProps) {
  const longPressHandlers = useLongPress({
    onLongPress: onEnterSelectionMode,
    onClick: selectionMode ? onToggleSelection : onSelect,
    threshold: 500,
  });

  return (
    <button
      {...longPressHandlers}
      className={`touch-target-min w-full text-left bg-white rounded-xl shadow-sm border transition-all touch-feedback active:scale-98 ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 scale-[0.98]'
          : 'border-gray-100 hover:shadow-md'
      } p-5`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {selectionMode && (
            <div className="flex-shrink-0">
              {isSelected ? (
                <CheckCircle2 className="w-7 h-7 text-blue-600" />
              ) : (
                <Circle className="w-7 h-7 text-gray-400" />
              )}
            </div>
          )}
          <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
            <Fish className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900">Fishing Session</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{format(startTime, 'dd.MM.yyyy')}</span>
              <span className="text-gray-300">•</span>
              <Clock className="w-4 h-4" />
              <span className="font-medium">{format(startTime, 'HH:mm')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-gray-700 flex-shrink-0 border border-gray-200">
          <Clock className="w-5 h-5" />
          <span className="text-base font-semibold">{duration} min</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <span className="text-sm font-semibold text-blue-900">Catches:</span>
          <span className="text-lg font-bold text-blue-700">{totalCatches}</span>
        </div>
        {bestCatch && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
            <span className="text-sm font-semibold text-green-900">Best:</span>
            <span className="text-lg font-bold text-green-700">{bestCatch.weight} kg</span>
          </div>
        )}
      </div>
    </button>
  );
}
