/*
  # Update tracking interval default value

  1. Changes
    - Update default tracking interval to 15 minutes
    - Update existing sessions to use 15 minutes interval
*/

-- Update existing sessions to use 15 minutes interval
UPDATE fishing_sessions 
SET tracking_interval = 15
WHERE tracking_interval != 15;

-- Set new default value
ALTER TABLE fishing_sessions 
ALTER COLUMN tracking_interval SET DEFAULT 15;