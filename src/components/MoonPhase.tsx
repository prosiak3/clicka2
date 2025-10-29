import React from 'react';
import { Moon } from 'lucide-react';
import { getMoonPhase } from '../utils/moon';

interface MoonPhaseProps {
  date?: Date;
}

export function MoonPhase({ date }: MoonPhaseProps) {
  const moonPhase = getMoonPhase(date);
  const illuminationPercentage = Math.round(moonPhase.illumination * 100);

  return (
    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
      <Moon className="text-blue-500 w-5 h-5" />
      <div>
        <p className="text-xs font-medium text-gray-600">Moon Phase</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{moonPhase.phase}</span>
          <span className="text-lg">{moonPhase.emoji}</span>
          <span className="text-xs text-gray-500">({illuminationPercentage}% illuminated)</span>
        </div>
      </div>
    </div>
  );
}