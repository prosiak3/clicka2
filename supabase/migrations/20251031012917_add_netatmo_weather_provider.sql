/*
  # Add Netatmo Weather Provider

  ## Description
  Adds Netatmo as a weather data provider with priority 1 (highest priority).
  Netatmo provides real-time weather data from nearby public weather stations,
  offering more accurate local conditions than model-based forecasts.

  ## Changes
  
  1. Updates existing Open-Meteo provider priority from 1 to 2
  2. Inserts Netatmo provider with priority 1
  
  ## Provider Details
  
  ### Netatmo
  - **Name**: netatmo
  - **Display Name**: Netatmo Weather
  - **API URL**: https://api.netatmo.com/api/getpublicdata
  - **Requires Key**: true (OAuth 2.0)
  - **Priority**: 1 (highest - checked first)
  - **Enabled**: false (until OAuth is configured)
  
  ### Open-Meteo (Updated)
  - **Priority**: Updated to 2 (fallback if Netatmo fails)
  
  ## Data Sources Priority
  
  With this change, the system will attempt to fetch weather data in this order:
  1. Netatmo (priority 1) - Real local station data
  2. Open-Meteo (priority 2) - Model-based forecast data
  3. Estimation (fallback) - If both APIs fail

  ## Important Notes
  - Netatmo starts as disabled and requires OAuth configuration
  - Admin must complete OAuth setup before Netatmo can be used
  - Open-Meteo remains enabled as reliable fallback
  - If Netatmo is disabled, system automatically uses Open-Meteo
*/

-- Update Open-Meteo priority to 2 (fallback)
UPDATE weather_api_providers
SET priority = 2
WHERE name = 'open-meteo';

-- Insert Netatmo provider with priority 1
INSERT INTO weather_api_providers (
  name,
  display_name,
  api_url,
  requires_key,
  enabled,
  priority
)
VALUES (
  'netatmo',
  'Netatmo Weather',
  'https://api.netatmo.com/api/getpublicdata',
  true,
  false,
  1
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_url = EXCLUDED.api_url,
  requires_key = EXCLUDED.requires_key,
  priority = EXCLUDED.priority,
  updated_at = now();