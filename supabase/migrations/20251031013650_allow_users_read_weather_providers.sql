/*
  # Allow authenticated users to read weather API providers

  ## Problem
  The weather_api_providers table has RLS policies that only allow admins to read data.
  This prevents regular users from fetching weather data because the getEnabledProviders()
  function cannot access the providers list.

  ## Solution
  Add a SELECT policy that allows all authenticated users to read weather API providers.
  This is safe because:
  - Provider information is not sensitive (just API URLs and config)
  - No API keys are stored in this table (they're in separate tables with proper RLS)
  - Users need this info to fetch weather data for their fishing sessions

  ## Changes
  - Add new SELECT policy for authenticated users to read weather_api_providers
  - Admin policies remain unchanged (admins can still manage providers)

  ## Security
  - This does NOT expose any sensitive data
  - API keys are in weather_api_keys table (protected by RLS)
  - OAuth secrets are in weather_oauth_config table (protected by RLS)
  - Only configuration data (URLs, names) is exposed
*/

-- Add policy for authenticated users to read weather providers
CREATE POLICY "Authenticated users can view weather API providers"
  ON weather_api_providers
  FOR SELECT
  TO authenticated
  USING (true);