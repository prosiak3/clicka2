/*
  # Add pause tracking to fishing sessions

  1. Changes
    - Add pauses JSONB[] column to fishing_sessions table to store pause intervals
    - Add total_pause_time INTEGER column to store total pause duration in minutes

  2. Data Structure
    - pauses: Array of objects with structure:
      {
        startTime: timestamp,
        endTime: timestamp (optional)
      }
*/

ALTER TABLE fishing_sessions
ADD COLUMN IF NOT EXISTS pauses JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_pause_time INTEGER DEFAULT 0;