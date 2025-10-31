/*
  # Add Provider Sync Metadata

  1. Changes to weather_api_providers
    - Add `last_sync_at` (timestamptz) - When provider was last contacted
    - Add `last_successful_sync_at` (timestamptz) - Last successful data fetch
    - Add `sync_interval_minutes` (integer) - How often to sync with provider (default 5 minutes)
    - Add `sync_error_count` (integer) - Track consecutive errors
    - Add `last_sync_error` (text) - Last error message
    
  2. Changes to weather_oauth_config
    - Add `last_data_fetch_at` (timestamptz) - Last time we fetched data using these credentials
    
  3. Security
    - No RLS changes needed (existing policies apply)
*/

-- Add sync metadata to weather_api_providers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weather_api_providers' AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE weather_api_providers 
    ADD COLUMN last_sync_at timestamptz,
    ADD COLUMN last_successful_sync_at timestamptz,
    ADD COLUMN sync_interval_minutes integer DEFAULT 5 NOT NULL,
    ADD COLUMN sync_error_count integer DEFAULT 0 NOT NULL,
    ADD COLUMN last_sync_error text;
  END IF;
END $$;

-- Add last data fetch to OAuth config
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weather_oauth_config' AND column_name = 'last_data_fetch_at'
  ) THEN
    ALTER TABLE weather_oauth_config 
    ADD COLUMN last_data_fetch_at timestamptz;
  END IF;
END $$;

-- Add comment explaining sync intervals
COMMENT ON COLUMN weather_api_providers.sync_interval_minutes IS 'Minimum time between sync attempts in minutes. Default: 5 minutes';
COMMENT ON COLUMN weather_api_providers.last_sync_at IS 'Last time we attempted to contact this provider';
COMMENT ON COLUMN weather_api_providers.last_successful_sync_at IS 'Last time we successfully fetched data from this provider';
COMMENT ON COLUMN weather_api_providers.sync_error_count IS 'Number of consecutive sync errors. Reset to 0 on successful sync';
COMMENT ON COLUMN weather_oauth_config.last_data_fetch_at IS 'Last time we successfully fetched weather data using these credentials';