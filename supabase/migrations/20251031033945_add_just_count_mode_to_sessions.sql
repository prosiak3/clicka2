/*
  # Add Just Count Mode to Fishing Sessions

  1. Changes
    - Add `just_count_mode` boolean column to `fishing_sessions` table
    - Default value is `false` for normal sessions
    - This flag indicates if session is in simplified "Just Count" mode

  2. Purpose
    - Enable simplified session UI for quick fish counting
    - No detailed catch information required
    - Just increment counter for each fish caught
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fishing_sessions' AND column_name = 'just_count_mode'
  ) THEN
    ALTER TABLE fishing_sessions ADD COLUMN just_count_mode boolean DEFAULT false;
  END IF;
END $$;