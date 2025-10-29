/*
  # Add tracking interval to fishing sessions

  1. Changes
    - Add tracking_interval column to fishing_sessions table
    - Default value is 5 minutes
    - Can be set to 1, 5, 15, 30, or 60 minutes
*/

ALTER TABLE fishing_sessions
ADD COLUMN IF NOT EXISTS tracking_interval INTEGER DEFAULT 5 CHECK (tracking_interval IN (1, 5, 15, 30, 60));