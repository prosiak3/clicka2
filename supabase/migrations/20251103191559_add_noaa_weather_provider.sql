/*
  # Add NOAA Weather Provider

  1. Changes
    - Add NOAA as a weather API provider with priority 2
    - NOAA provides real-time weather data from US weather stations
    - Free API, no authentication required
    - Set sync interval to 5 minutes as requested
    
  2. Provider Details
    - Name: noaa
    - Display Name: NOAA (US Weather Service)
    - API URL: https://api.weather.gov
    - Requires Key: false (public API)
    - Enabled: true by default
    - Priority: 2 (after Netatmo if available, before Open-Meteo)
    - Sync Interval: 5 minutes
    
  3. Notes
    - NOAA API requires User-Agent header identifying the application
    - Coverage: USA and territories only
    - Will automatically fallback to other providers outside USA
    - Rate limit: Keep requests reasonable, 5-minute intervals recommended
*/

-- Insert NOAA as a weather provider
INSERT INTO weather_api_providers (
  name, 
  display_name, 
  api_url, 
  requires_key, 
  enabled, 
  priority,
  sync_interval_minutes
)
VALUES (
  'noaa',
  'NOAA (US Weather Service)',
  'https://api.weather.gov',
  false,
  true,
  2,
  5
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_url = EXCLUDED.api_url,
  requires_key = EXCLUDED.requires_key,
  priority = EXCLUDED.priority,
  sync_interval_minutes = EXCLUDED.sync_interval_minutes;