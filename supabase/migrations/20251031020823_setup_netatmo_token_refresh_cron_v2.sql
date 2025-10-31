/*
  # Setup Automatic Token Refresh Cron Job (v2)

  1. Extensions
    - Enable pg_net extension for HTTP requests
    - pg_cron is already enabled
    
  2. New Cron Job
    - Schedule: Every 1 hour
    - Action: Call netatmo-refresh-token Edge Function via HTTP POST
    - Purpose: Automatically refresh Netatmo OAuth tokens before they expire
    
  3. Security
    - Cron jobs run with elevated privileges
    - Edge Function handles authentication internally
    
  4. Monitoring
    - Check logs with: SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'netatmo-token-refresh') ORDER BY start_time DESC LIMIT 10;
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop old function if exists
DROP FUNCTION IF EXISTS refresh_netatmo_token();

-- Create a function to call the netatmo-refresh-token Edge Function
CREATE OR REPLACE FUNCTION refresh_netatmo_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  request_id bigint;
BEGIN
  -- Construct Edge Function URL
  function_url := 'https://czopkukjtdwpesebelcp.supabase.co/functions/v1/netatmo-refresh-token';
  
  -- Make async HTTP POST request using pg_net
  SELECT net.http_post(
    url := function_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) INTO request_id;
  
  -- Log the refresh attempt
  RAISE NOTICE 'Netatmo token refresh triggered at % with request_id: %', now(), request_id;
  
  -- Update provider last_sync_at
  UPDATE weather_api_providers 
  SET last_sync_at = now() 
  WHERE name = 'netatmo';
END;
$$;

-- Unschedule existing job if it exists
SELECT cron.unschedule('netatmo-token-refresh') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'netatmo-token-refresh'
);

-- Schedule the cron job to run every hour at minute 0
-- Syntax: minute hour day month weekday
-- '0 * * * *' means: at minute 0 of every hour (00:00, 01:00, 02:00, etc.)
SELECT cron.schedule(
  'netatmo-token-refresh',
  '0 * * * *',
  $$SELECT refresh_netatmo_token();$$
);

-- Add comment
COMMENT ON FUNCTION refresh_netatmo_token() IS 'Automatically refreshes Netatmo OAuth tokens every hour by calling the Edge Function via pg_net';

-- Create a view to easily check cron job status
CREATE OR REPLACE VIEW cron_job_status AS
SELECT 
  j.jobname,
  j.schedule,
  j.active,
  j.jobid,
  (SELECT start_time FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_run,
  (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_status
FROM cron.job j
WHERE j.jobname = 'netatmo-token-refresh';

COMMENT ON VIEW cron_job_status IS 'Quick view of Netatmo token refresh cron job status';

-- Grant permissions to view cron job status
GRANT SELECT ON cron_job_status TO authenticated;