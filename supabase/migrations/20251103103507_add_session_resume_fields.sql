/*
  # Add Session Resume Fields

  1. Changes
    - Add `last_activity_at` column to `fishing_sessions` table
      - Type: timestamptz (timestamp with timezone)
      - Default: now()
      - Tracks when the session was last active
    
    - Add `resumed_count` column to `fishing_sessions` table
      - Type: integer
      - Default: 0
      - Tracks how many times the session has been resumed

  2. Purpose
    - Enable tracking of session activity for better session management
    - Support resuming closed sessions
    - Prevent data loss when app is accidentally closed
    - Track session resume history

  3. Indexes
    - Add index on last_activity_at for efficient queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'fishing_sessions'
    AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE fishing_sessions 
    ADD COLUMN last_activity_at timestamptz DEFAULT now() NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'fishing_sessions'
    AND column_name = 'resumed_count'
  ) THEN
    ALTER TABLE fishing_sessions 
    ADD COLUMN resumed_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_fishing_sessions_last_activity 
  ON fishing_sessions(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_fishing_sessions_active 
  ON fishing_sessions(user_id, end_time) 
  WHERE end_time IS NULL;