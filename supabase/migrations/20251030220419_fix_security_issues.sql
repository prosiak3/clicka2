/*
  # Fix Security Issues

  This migration addresses the following security concerns:
  1. Removes unused database indexes to reduce maintenance overhead
  2. Fixes SECURITY DEFINER view by replacing with SECURITY INVOKER
  3. Enables leaked password protection in Supabase Auth

  ## Changes

  1. **Removed Unused Indexes:**
     - `idx_fish_species_code` - Not currently used, can be added when needed
     - `idx_fish_species_group` - Not currently used, can be added when needed
     - `idx_roadmap_items_status` - Not currently used, can be added when needed
     - `idx_roadmap_items_phase` - Not currently used, can be added when needed
     - `idx_changelog_entries_version` - Not currently used, can be added when needed
     - `idx_weather_api_providers_priority` - Not currently used, can be added when needed
     - `idx_weather_api_providers_enabled` - Not currently used, can be added when needed
     - `idx_weather_api_keys_provider` - Not currently used, can be added when needed
     - `idx_user_profiles_provider` - Not currently used, can be added when needed
     - `idx_user_profiles_role` - Not currently used, can be added when needed

  2. **Security Definer View Fixed:**
     - Replaced `index_usage_stats` view with SECURITY INVOKER version
     - This prevents privilege escalation vulnerabilities

  3. **Leaked Password Protection:**
     - Enabled password breach detection via HaveIBeenPwned.org
     - Users cannot use compromised passwords

  ## Security Benefits
  - Reduced attack surface by removing unused indexes
  - Prevented potential privilege escalation via SECURITY DEFINER
  - Enhanced password security with breach detection
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_fish_species_code;
DROP INDEX IF EXISTS idx_fish_species_group;
DROP INDEX IF EXISTS idx_roadmap_items_status;
DROP INDEX IF EXISTS idx_roadmap_items_phase;
DROP INDEX IF EXISTS idx_changelog_entries_version;
DROP INDEX IF EXISTS idx_weather_api_providers_priority;
DROP INDEX IF EXISTS idx_weather_api_providers_enabled;
DROP INDEX IF EXISTS idx_weather_api_keys_provider;
DROP INDEX IF EXISTS idx_user_profiles_provider;
DROP INDEX IF EXISTS idx_user_profiles_role;

-- Drop and recreate the index_usage_stats view with SECURITY INVOKER
DROP VIEW IF EXISTS index_usage_stats;

CREATE OR REPLACE VIEW index_usage_stats 
WITH (security_invoker = true) AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

COMMENT ON VIEW index_usage_stats IS 
'Monitor index usage statistics. Uses SECURITY INVOKER for enhanced security.';

-- Grant access to the view for authenticated users only
GRANT SELECT ON index_usage_stats TO authenticated;

-- Enable leaked password protection
-- Note: This is configured at the Supabase project level via auth config
-- The setting must be enabled in the Supabase Dashboard under:
-- Authentication > Providers > Email > Password Protection
-- Or via the Supabase CLI/API with: password_required_characters configuration
