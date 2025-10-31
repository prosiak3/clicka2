/*
  # Setup Automatic Token Refresh Cron Job

  1. New Extension
    - Enable pg_cron extension for scheduled jobs
    
  2. New Cron Job
    - Schedule: Every 1 hour
    - Action: Call netatmo-refresh-token Edge Function via HTTP request
    - Purpose: Automatically refresh Netatmo OAuth tokens before they expire
    
  3. Security
    - Cron jobs run with elevated privileges
    - Edge Function handles authentication internally
    
  Note: pg_cron extension must be enabled in Supabase Dashboard under Database > Extensions
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the netatmo-refresh-token Edge Function
CREATE OR REPLACE FUNCTION refresh_netatmo_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  function_url text;
  response text;
BEGIN
  -- Get Supabase URL from environment or use current_setting
  supabase_url := current_setting('app.settings.supabase_url', true);
  
  -- If not set, try to construct it from the database host
  IF supabase_url IS NULL THEN
    -- This is a fallback - you'll need to update this with your actual Supabase URL
    supabase_url := 'https://your-project-ref.supabase.co';
  END IF;
  
  function_url := supabase_url || '/functions/v1/netatmo-refresh-token';
  
  -- Call the Edge Function using http extension
  -- Note: This requires the http extension to be enabled
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  
  -- Log the refresh attempt
  RAISE NOTICE 'Netatmo token refresh triggered at %', now();
END;
$$;

-- Schedule the cron job to run every hour
-- Syntax: minute hour day month weekday
-- '0 * * * *' means: at minute 0 of every hour
SELECT cron.schedule(
  'netatmo-token-refresh',
  '0 * * * *',
  $$SELECT refresh_netatmo_token();$$
);

-- Alternative: Run every 30 minutes for more frequent checks
-- Uncomment the following and comment the above if you want 30-minute intervals:
-- SELECT cron.schedule(
--   'netatmo-token-refresh',
--   '*/30 * * * *',
--   $$SELECT refresh_netatmo_token();$$
-- );

-- View scheduled jobs
COMMENT ON FUNCTION refresh_netatmo_token() IS 'Automatically refreshes Netatmo OAuth tokens by calling the Edge Function';

-- To view all cron jobs, run: SELECT * FROM cron.job;
-- To unschedule a job, run: SELECT cron.unschedule('netatmo-token-refresh');