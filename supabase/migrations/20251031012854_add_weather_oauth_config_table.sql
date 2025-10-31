/*
  # Add Weather OAuth Configuration Table

  ## Description
  Creates a secure table to store OAuth credentials and tokens for weather API providers
  that require authentication (e.g., Netatmo). This enables the application to authenticate
  with external weather services and automatically refresh access tokens.

  ## New Tables
  
  ### `weather_oauth_config`
  Stores OAuth credentials and tokens for weather providers:
  - `id` (uuid, primary key) - Unique identifier for the configuration
  - `provider_id` (uuid, foreign key) - Links to weather_api_providers table
  - `client_id` (text) - OAuth client ID from the provider
  - `client_secret` (text) - OAuth client secret (encrypted)
  - `access_token` (text, nullable) - Current OAuth access token
  - `refresh_token` (text, nullable) - OAuth refresh token for renewing access
  - `token_expires_at` (timestamptz, nullable) - When the access token expires
  - `redirect_uri` (text) - OAuth callback URL
  - `scopes` (text array) - Required OAuth scopes
  - `is_configured` (boolean) - Whether OAuth setup is complete
  - `last_token_refresh` (timestamptz, nullable) - When token was last refreshed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on the table
  - Only authenticated admin users can view OAuth configuration
  - Only authenticated admin users can insert/update OAuth configuration
  - Prevent deletion of OAuth config (use is_configured flag instead)
  
  ### Data Protection
  - client_secret is sensitive and should be handled carefully
  - access_token and refresh_token are sensitive credentials
  - All tokens should be transmitted over HTTPS only

  ## Important Notes
  - This table supports multiple OAuth providers (one row per provider)
  - Tokens are automatically refreshed by Edge Functions
  - Client secrets should ideally be encrypted at rest (future enhancement)
  - Only one active configuration per provider (enforced by unique constraint)
*/

-- Create weather_oauth_config table
CREATE TABLE IF NOT EXISTS weather_oauth_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES weather_api_providers(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  redirect_uri text NOT NULL DEFAULT '',
  scopes text[] DEFAULT ARRAY[]::text[],
  is_configured boolean DEFAULT false,
  last_token_refresh timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_provider_oauth UNIQUE (provider_id)
);

-- Enable RLS
ALTER TABLE weather_oauth_config ENABLE ROW LEVEL SECURITY;

-- Create policies for weather_oauth_config
CREATE POLICY "Admins can view OAuth config"
  ON weather_oauth_config
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert OAuth config"
  ON weather_oauth_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update OAuth config"
  ON weather_oauth_config
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

-- Prevent deletion, only allow disabling via is_configured flag
CREATE POLICY "Prevent OAuth config deletion"
  ON weather_oauth_config
  FOR DELETE
  TO authenticated
  USING (false);

-- Create index for faster provider lookups
CREATE INDEX IF NOT EXISTS idx_weather_oauth_provider ON weather_oauth_config(provider_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weather_oauth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS set_weather_oauth_updated_at ON weather_oauth_config;
CREATE TRIGGER set_weather_oauth_updated_at
  BEFORE UPDATE ON weather_oauth_config
  FOR EACH ROW
  EXECUTE FUNCTION update_weather_oauth_updated_at();