/*
  # Add tracking enabled flag to fishing sessions

  1. Changes
    - Add tracking_enabled column to fishing_sessions table
    - Set default value to true for existing sessions
*/

ALTER TABLE fishing_sessions
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT true;