/*
  # Update tracking interval constraints

  1. Changes
    - Add check constraint to ensure tracking_interval is one of the allowed values (1, 5, 15, 30, 60)
*/

-- Drop existing check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.constraint_column_usage 
    WHERE table_name = 'fishing_sessions' 
    AND constraint_name = 'fishing_sessions_tracking_interval_check'
  ) THEN
    ALTER TABLE fishing_sessions DROP CONSTRAINT fishing_sessions_tracking_interval_check;
  END IF;
END $$;

-- Add new check constraint with updated values
ALTER TABLE fishing_sessions
ADD CONSTRAINT fishing_sessions_tracking_interval_check 
CHECK (tracking_interval IN (1, 5, 15, 30, 60));

-- Update any existing values that don't match the new constraints
UPDATE fishing_sessions 
SET tracking_interval = 5
WHERE tracking_interval NOT IN (1, 5, 15, 30, 60) 
OR tracking_interval IS NULL;