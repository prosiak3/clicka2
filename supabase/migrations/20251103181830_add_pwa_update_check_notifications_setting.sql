/*
  # Add PWA Update Check Notifications Setting

  1. Changes
    - Add `show_update_check_notifications` column to `user_profiles` table
      - Type: boolean
      - Default: false (disabled by default to avoid spam)
      - Purpose: Allow users to see a notification each time the app checks for updates
  
  2. Security
    - No RLS changes needed - existing policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_profiles'
    AND column_name = 'show_update_check_notifications'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN show_update_check_notifications boolean DEFAULT false NOT NULL;
  END IF;
END $$;
