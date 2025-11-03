/*
  # Add ICON Weather Provider (DWD Model)

  1. Changes
    - Add ICON (DWD) as a weather API provider with priority 3
    - ICON provides high-resolution weather data from German Weather Service
    - Uses Open-Meteo infrastructure to access ICON model data
    - Free API, no authentication required
    - Set sync interval to 5 minutes as requested
    
  2. Provider Details
    - Name: icon
    - Display Name: ICON (DWD Model)
    - API URL: https://api.open-meteo.com/v1/dwd-icon
    - Requires Key: false (public API)
    - Enabled: true by default
    - Priority: 3 (after Netatmo, NOAA, before generic Open-Meteo)
    - Sync Interval: 5 minutes
    
  3. Coverage & Features
    - Global coverage with 11km resolution (ICON global)
    - High-resolution 15-minute data for Central Europe (ICON-D2 at 2.2km)
    - Particularly accurate for European region
    - Provides temperature, pressure, wind, clouds, precipitation
    
  4. Notes
    - ICON-D2 (high-res): Central Europe only, 15-minute updates
    - ICON-EU: Europe coverage
    - ICON Global: Worldwide coverage
    - Data updated every 3-6 hours depending on model run
    - Excellent for European fishing locations
*/

-- Insert ICON as a weather provider
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
  'icon',
  'ICON (DWD Model)',
  'https://api.open-meteo.com/v1/dwd-icon',
  false,
  true,
  3,
  5
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_url = EXCLUDED.api_url,
  requires_key = EXCLUDED.requires_key,
  priority = EXCLUDED.priority,
  sync_interval_minutes = EXCLUDED.sync_interval_minutes;