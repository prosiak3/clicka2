/*
  # Initial Schema Setup for Fishing Tracker

  1. New Tables
    - fishing_sessions
      - Stores fishing session data
      - Includes weather conditions and location tracking
    - fish_catches
      - Records individual fish catches
      - Links to fishing sessions
      - Stores species, size, and location data

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Proper policies for data access control
*/

-- Create fishing_sessions table
CREATE TABLE IF NOT EXISTS fishing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  weather JSONB NOT NULL,
  locations JSONB[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fish_catches table
CREATE TABLE IF NOT EXISTS fish_catches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fishing_sessions(id) NOT NULL,
  species TEXT NOT NULL,
  length DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  location JSONB NOT NULL,
  weather JSONB NOT NULL,
  photo_urls TEXT[],
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE fishing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fish_catches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own sessions" ON fishing_sessions;
DROP POLICY IF EXISTS "Users can manage catches in their sessions" ON fish_catches;

-- Create policies with proper auth.uid() checks
CREATE POLICY "Users can manage their own sessions"
  ON fishing_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage catches in their sessions"
  ON fish_catches
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM fishing_sessions 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM fishing_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fishing_sessions_user_id'
  ) THEN
    CREATE INDEX idx_fishing_sessions_user_id ON fishing_sessions(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_fish_catches_session_id'
  ) THEN
    CREATE INDEX idx_fish_catches_session_id ON fish_catches(session_id);
  END IF;
END $$;