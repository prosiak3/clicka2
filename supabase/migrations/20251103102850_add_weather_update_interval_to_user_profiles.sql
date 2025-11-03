/*
  # Add Weather Update Interval to User Profiles

  1. Changes
    - Add `weather_update_interval` column to `user_profiles` table
      - Type: integer (number of minutes)
      - Default: 5 (5 minutes)
      - Options: 1, 5, 10, 15, 30, 60, 180 minutes
    - Add check constraint to ensure valid interval values

  2. Purpose
    - Allow users to configure how frequently weather data is updated
    - Support intervals: 1min, 5min, 10min, 15min, 30min, 1h, 3h
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'weather_update_interval'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN weather_update_interval integer DEFAULT 5 NOT NULL;
    
    ALTER TABLE user_profiles
    ADD CONSTRAINT valid_weather_interval 
    CHECK (weather_update_interval IN (1, 5, 10, 15, 30, 60, 180));
  END IF;
END $$;