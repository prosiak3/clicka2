import { format } from 'date-fns';

interface MoonPhase {
  phase: string;
  illumination: number;
  emoji: string;
}

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  // Calculate days since new moon on Jan 6, 2000
  const knownNewMoon = new Date(2000, 0, 6, 18, 14).getTime();
  const current = date.getTime();
  const daysSinceKnownNewMoon = (current - knownNewMoon) / (1000 * 60 * 60 * 24);
  
  // Moon phase cycle is approximately 29.53 days
  const lunarCycle = 29.53;
  
  // Calculate current position in cycle (0 to 1)
  const position = (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;
  
  // Calculate illumination (0 to 1)
  const illumination = Math.abs(0.5 - position) * 2;
  
  // Determine phase name and emoji
  if (position < 0.0625 || position >= 0.9375) {
    return { phase: 'New Moon', illumination: 0, emoji: '🌑' };
  } else if (position < 0.1875) {
    return { phase: 'Waxing Crescent', illumination: 0.25, emoji: '🌒' };
  } else if (position < 0.3125) {
    return { phase: 'First Quarter', illumination: 0.5, emoji: '🌓' };
  } else if (position < 0.4375) {
    return { phase: 'Waxing Gibbous', illumination: 0.75, emoji: '🌔' };
  } else if (position < 0.5625) {
    return { phase: 'Full Moon', illumination: 1, emoji: '🌕' };
  } else if (position < 0.6875) {
    return { phase: 'Waning Gibbous', illumination: 0.75, emoji: '🌖' };
  } else if (position < 0.8125) {
    return { phase: 'Last Quarter', illumination: 0.5, emoji: '🌗' };
  } else {
    return { phase: 'Waning Crescent', illumination: 0.25, emoji: '🌘' };
  }
}