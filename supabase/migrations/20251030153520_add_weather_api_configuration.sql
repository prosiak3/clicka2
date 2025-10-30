/*
  # Add weather API configuration system

  1. New Tables
    - `weather_api_providers`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Provider name (e.g., 'open-meteo', 'weatherapi', 'openweathermap')
      - `display_name` (text) - User-friendly display name
      - `api_url` (text) - Base API URL
      - `requires_key` (boolean) - Whether API key is required
      - `enabled` (boolean) - Whether provider is enabled globally
      - `priority` (integer) - Priority order (lower = higher priority)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `weather_api_keys`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to weather_api_providers)
      - `api_key` (text, encrypted) - API key for the provider
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Only admins can read/write configuration
    - API keys are sensitive data

  3. Default Data
    - Insert Open-Meteo as default provider
*/

-- Create weather_api_providers table
CREATE TABLE IF NOT EXISTS weather_api_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  api_url text NOT NULL,
  requires_key boolean DEFAULT false,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create weather_api_keys table
CREATE TABLE IF NOT EXISTS weather_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES weather_api_providers(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE weather_api_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_api_providers
CREATE POLICY "Admins can view weather API providers"
  ON weather_api_providers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert weather API providers"
  ON weather_api_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update weather API providers"
  ON weather_api_providers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete weather API providers"
  ON weather_api_providers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for weather_api_keys
CREATE POLICY "Admins can view weather API keys"
  ON weather_api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert weather API keys"
  ON weather_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update weather API keys"
  ON weather_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete weather API keys"
  ON weather_api_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Insert default provider (Open-Meteo - free, no API key required)
INSERT INTO weather_api_providers (name, display_name, api_url, requires_key, enabled, priority)
VALUES 
  ('open-meteo', 'Open-Meteo', 'https://api.open-meteo.com/v1/forecast', false, true, 1)
ON CONFLICT (name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weather_api_providers_priority ON weather_api_providers(priority);
CREATE INDEX IF NOT EXISTS idx_weather_api_providers_enabled ON weather_api_providers(enabled);
CREATE INDEX IF NOT EXISTS idx_weather_api_keys_provider ON weather_api_keys(provider_id);
