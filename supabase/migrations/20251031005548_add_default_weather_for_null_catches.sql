/*
  # Add default weather for NULL catch weather data

  1. Summary
    - Updates any fish_catches with NULL weather to have a default weather object
    - Ensures data consistency while maintaining backward compatibility
  
  2. Changes
    - Updates all NULL weather values with a default weather object
  
  3. Default Weather
    - Temperature: 15°C (reasonable default)
    - Pressure: 1013 hPa (standard atmospheric pressure)
    - All other values set to neutral/unknown state
*/

-- Update any NULL weather values with a default object
UPDATE fish_catches
SET weather = jsonb_build_object(
  'temperature', 15,
  'pressure', 1013,
  'pressureTrend', 'stable',
  'windSpeed', 0,
  'windDirection', 'N',
  'cloudCover', 0,
  'cloudLayers', jsonb_build_object('low', 0, 'mid', 0, 'high', 0),
  'dominantCloudType', 'clear',
  'precipitation', 0,
  'precipitationType', 'none',
  'precipitationProbability', 0
)
WHERE weather IS NULL;