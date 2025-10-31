import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, Clock, Pause } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { FishingSession } from '../types';

interface ActiveSessionButtonProps {
  session: FishingSession;
  onClick?: () => void;
}

export function ActiveSessionButton({ session, onClick }: ActiveSessionButtonProps) {
  const navigate = useNavigate();
  const startTime = new Date(session.startTime);
  const duration = differenceInMinutes(new Date(), startTime);
  const isPaused = session.pauses?.some(p => !p.endTime);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-blue-100 p-3 hover:bg-blue-50 transition-colors z-50"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          isPaused ? 'bg-orange-100' : 'bg-blue-100'
        }`}>
          {isPaused ? (
            <Pause className="w-5 h-5 text-orange-600" />
          ) : (
            <Fish className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">Active Session</p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{format(startTime, 'HH:mm')}</span>
            <span className="text-gray-300">•</span>
            <span>{duration} min</span>
            {isPaused && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-orange-600">Paused</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}