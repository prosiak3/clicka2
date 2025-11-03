/*
  # Create Weather Snapshots Table

  1. New Table
    - `weather_snapshots`
      - `id` (uuid, primary key) - Unique identifier for each snapshot
      - `session_id` (uuid, foreign key) - Links to fishing_sessions table
      - `weather_data` (jsonb) - Complete weather data at time of snapshot
      - `location` (jsonb) - GPS coordinates where weather was recorded
      - `provider_name` (text) - Name of weather provider (noaa, open-meteo, netatmo)
      - `timestamp` (timestamptz) - When the snapshot was taken
      - `created_at` (timestamptz) - Record creation time
    
  2. Purpose
    - Store weather conditions every 5 minutes during active fishing sessions
    - Enable detailed analysis of weather changes throughout the session
    - Track which weather provider was used for each reading
    - Support correlating catches with specific weather conditions
    
  3. Security
    - Enable RLS on weather_snapshots table
    - Users can only view snapshots from their own sessions
    - Users can insert snapshots for their own sessions
    - Users can delete snapshots when deleting sessions
    
  4. Performance
    - Index on session_id for fast session-based queries
    - Index on timestamp for time-based analysis
    - Cascade delete when session is deleted
    
  5. Data Retention
    - Snapshots are kept as long as the session exists
    - Automatic cleanup when session is deleted via CASCADE
*/

-- Create weather_snapshots table
CREATE TABLE IF NOT EXISTS weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES fishing_sessions(id) ON DELETE CASCADE,
  weather_data jsonb NOT NULL,
  location jsonb NOT NULL,
  provider_name text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE weather_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view snapshots from their own sessions
CREATE POLICY "Users can view their own session weather snapshots"
  ON weather_snapshots
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM fishing_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert snapshots for their own sessions
CREATE POLICY "Users can insert weather snapshots for their sessions"
  ON weather_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM fishing_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete snapshots from their own sessions
CREATE POLICY "Users can delete their own session weather snapshots"
  ON weather_snapshots
  FOR DELETE
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM fishing_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_session_id 
  ON weather_snapshots(session_id);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_timestamp 
  ON weather_snapshots(timestamp);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_session_timestamp 
  ON weather_snapshots(session_id, timestamp);

-- Add comment to table
COMMENT ON TABLE weather_snapshots IS 'Stores periodic weather readings during fishing sessions for detailed analysis';
COMMENT ON COLUMN weather_snapshots.weather_data IS 'Complete WeatherData object with temperature, pressure, wind, etc.';
COMMENT ON COLUMN weather_snapshots.provider_name IS 'Weather data source: noaa, open-meteo, or netatmo';
COMMENT ON COLUMN weather_snapshots.location IS 'GPS coordinates {lat, lon} where weather was recorded';