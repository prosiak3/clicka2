/*
  # Add Quick Count Mode Setting to User Profiles

  1. Changes
    - Add `enable_quick_count` column to `user_profiles` table
      - Boolean field to enable/disable quick count mode
      - Default: false (disabled by default)
      
  2. Notes
    - Quick count mode allows users to quickly log catches without entering species, length, or weight
    - All other session data (location, weather, etc.) is still recorded automatically
    - This is a user preference that can be toggled in settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'enable_quick_count'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN enable_quick_count boolean DEFAULT false NOT NULL;
  END IF;
END $$;