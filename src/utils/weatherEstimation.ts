import { WeatherData } from '../types';

interface HistoricalWeatherPattern {
  month: number;
  hour: number;
  avgTemperature: number;
  avgPressure: number;
  avgWindSpeed: number;
}

const historicalPatterns: HistoricalWeatherPattern[] = [
  { month: 0, hour: 6, avgTemperature: -2, avgPressure: 1013, avgWindSpeed: 3 },
  { month: 0, hour: 12, avgTemperature: 1, avgPressure: 1013, avgWindSpeed: 4 },
  { month: 0, hour: 18, avgTemperature: -1, avgPressure: 1014, avgWindSpeed: 3 },
  { month: 1, hour: 6, avgTemperature: -1, avgPressure: 1012, avgWindSpeed: 4 },
  { month: 1, hour: 12, avgTemperature: 3, avgPressure: 1012, avgWindSpeed: 5 },
  { month: 1, hour: 18, avgTemperature: 0, avgPressure: 1013, avgWindSpeed: 4 },
  { month: 2, hour: 6, avgTemperature: 3, avgPressure: 1011, avgWindSpeed: 4 },
  { month: 2, hour: 12, avgTemperature: 8, avgPressure: 1011, avgWindSpeed: 5 },
  { month: 2, hour: 18, avgTemperature: 5, avgPressure: 1012, avgWindSpeed: 4 },
  { month: 3, hour: 6, avgTemperature: 6, avgPressure: 1010, avgWindSpeed: 4 },
  { month: 3, hour: 12, avgTemperature: 12, avgPressure: 1010, avgWindSpeed: 5 },
  { month: 3, hour: 18, avgTemperature: 9, avgPressure: 1011, avgWindSpeed: 4 },
  { month: 4, hour: 6, avgTemperature: 11, avgPressure: 1009, avgWindSpeed: 4 },
  { month: 4, hour: 12, avgTemperature: 17, avgPressure: 1009, avgWindSpeed: 5 },
  { month: 4, hour: 18, avgTemperature: 14, avgPressure: 1010, avgWindSpeed: 4 },
  { month: 5, hour: 6, avgTemperature: 14, avgPressure: 1008, avgWindSpeed: 4 },
  { month: 5, hour: 12, avgTemperature: 20, avgPressure: 1008, avgWindSpeed: 5 },
  { month: 5, hour: 18, avgTemperature: 17, avgPressure: 1009, avgWindSpeed: 4 },
  { month: 6, hour: 6, avgTemperature: 16, avgPressure: 1007, avgWindSpeed: 3 },
  { month: 6, hour: 12, avgTemperature: 22, avgPressure: 1007, avgWindSpeed: 4 },
  { month: 6, hour: 18, avgTemperature: 19, avgPressure: 1008, avgWindSpeed: 3 },
  { month: 7, hour: 6, avgTemperature: 16, avgPressure: 1007, avgWindSpeed: 3 },
  { month: 7, hour: 12, avgTemperature: 22, avgPressure: 1007, avgWindSpeed: 4 },
  { month: 7, hour: 18, avgTemperature: 19, avgPressure: 1008, avgWindSpeed: 3 },
  { month: 8, hour: 6, avgTemperature: 12, avgPressure: 1009, avgWindSpeed: 4 },
  { month: 8, hour: 12, avgTemperature: 17, avgPressure: 1009, avgWindSpeed: 4 },
  { month: 8, hour: 18, avgTemperature: 14, avgPressure: 1010, avgWindSpeed: 3 },
  { month: 9, hour: 6, avgTemperature: 7, avgPressure: 1011, avgWindSpeed: 4 },
  { month: 9, hour: 12, avgTemperature: 12, avgPressure: 1011, avgWindSpeed: 4 },
  { month: 9, hour: 18, avgTemperature: 9, avgPressure: 1012, avgWindSpeed: 3 },
  { month: 10, hour: 6, avgTemperature: 3, avgPressure: 1012, avgWindSpeed: 4 },
  { month: 10, hour: 12, avgTemperature: 7, avgPressure: 1012, avgWindSpeed: 4 },
  { month: 10, hour: 18, avgTemperature: 4, avgPressure: 1013, avgWindSpeed: 3 },
  { month: 11, hour: 6, avgTemperature: 0, avgPressure: 1013, avgWindSpeed: 3 },
  { month: 11, hour: 12, avgTemperature: 3, avgPressure: 1013, avgWindSpeed: 4 },
  { month: 11, hour: 18, avgTemperature: 1, avgPressure: 1014, avgWindSpeed: 3 },
];

function findClosestPattern(month: number, hour: number): HistoricalWeatherPattern {
  let closestPattern = historicalPatterns[0];
  let minDistance = Infinity;

  for (const pattern of historicalPatterns) {
    const monthDiff = Math.abs(pattern.month - month);
    const hourDiff = Math.abs(pattern.hour - hour);
    const distance = monthDiff * 10 + hourDiff;

    if (distance < minDistance) {
      minDistance = distance;
      closestPattern = pattern;
    }
  }

  return closestPattern;
}

const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function getEstimatedWindDirection(month: number): string {
  if (month >= 10 || month <= 2) {
    return windDirections[Math.floor(Math.random() * 4)];
  }
  return windDirections[Math.floor(Math.random() * 8)];
}

function getEstimatedCloudCover(month: number): number {
  if (month >= 10 || month <= 2) {
    return Math.floor(Math.random() * 30) + 60;
  }
  if (month >= 5 && month <= 7) {
    return Math.floor(Math.random() * 40) + 10;
  }
  return Math.floor(Math.random() * 50) + 25;
}

export function estimateWeather(date: Date, latitude: number, longitude: number): WeatherData {
  const month = date.getMonth();
  const hour = date.getHours();

  const pattern = findClosestPattern(month, hour);

  const tempVariation = (Math.random() - 0.5) * 4;
  const pressureVariation = (Math.random() - 0.5) * 10;
  const windVariation = (Math.random() - 0.5) * 2;

  return {
    temperature: Math.round((pattern.avgTemperature + tempVariation) * 10) / 10,
    pressure: Math.round(pattern.avgPressure + pressureVariation),
    pressureTrend: 'stable',
    windSpeed: Math.max(0, Math.round((pattern.avgWindSpeed + windVariation) * 10) / 10),
    windDirection: getEstimatedWindDirection(month),
    cloudCover: getEstimatedCloudCover(month),
    cloudBase: Math.floor(Math.random() * 1000) + 500,
    dominantCloudType: month >= 10 || month <= 2 ? 'stratus' : 'cumulus',
    precipitation: 0,
    precipitationType: 'none',
    precipitationProbability: month >= 10 || month <= 2 ? 30 : 10
  };
}
