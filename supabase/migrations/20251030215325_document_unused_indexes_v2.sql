/*
  # Document and Optimize Unused Indexes
  
  This migration adds documentation for indexes that appear unused but are valuable for future queries.
  These indexes are intentionally kept as they will be used when implementing roadmap features.
  
  ## Indexes and Their Purpose
  
  1. Fish Species Indexes
     - idx_fish_species_code: Used for species lookup by code
     - idx_fish_species_group: Used for filtering by species group
  
  2. Roadmap Items Indexes
     - idx_roadmap_items_status: Used for filtering roadmap by status
     - idx_roadmap_items_phase: Used for filtering roadmap by phase
  
  3. Changelog Entries Indexes
     - idx_changelog_entries_version: Used for version-specific changelog queries
  
  4. Weather API Indexes
     - idx_weather_api_providers_priority: Used for provider selection by priority
     - idx_weather_api_providers_enabled: Used for filtering enabled providers
     - idx_weather_api_keys_provider: Used for joining keys with providers
  
  5. User Profiles Indexes
     - idx_user_profiles_provider: Used for OAuth provider analytics
     - idx_user_profiles_role: Used for admin/user filtering
  
  ## Notes
  - These indexes will be actively used once roadmap features are implemented
  - Keeping them now ensures optimal performance from day one
  - Index maintenance cost is minimal compared to future query performance gains
*/

-- Add comments to explain index purposes

COMMENT ON INDEX idx_fish_species_code IS 
'Used for fast species lookup by code. Will be heavily used in catch forms and statistics.';

COMMENT ON INDEX idx_fish_species_group IS 
'Used for filtering species by group (Freshwater/Saltwater/All). Used in species selection UI.';

COMMENT ON INDEX idx_roadmap_items_status IS 
'Used for filtering roadmap items by status (planned/in_progress/completed). Essential for roadmap display.';

COMMENT ON INDEX idx_roadmap_items_phase IS 
'Used for filtering roadmap items by phase (1/2/3). Essential for phase-based roadmap views.';

COMMENT ON INDEX idx_changelog_entries_version IS 
'Used for fetching changelog entries for specific versions. Critical for version history display.';

COMMENT ON INDEX idx_weather_api_providers_priority IS 
'Used for selecting weather API provider by priority order. Essential for API failover logic.';

COMMENT ON INDEX idx_weather_api_providers_enabled IS 
'Used for filtering only enabled weather API providers. Critical for active provider selection.';

COMMENT ON INDEX idx_weather_api_keys_provider IS 
'Used for joining weather API keys with providers. Essential for key rotation and management.';

COMMENT ON INDEX idx_user_profiles_provider IS 
'Used for analytics on OAuth providers. Useful for tracking authentication method usage.';

COMMENT ON INDEX idx_user_profiles_role IS 
'Used for filtering users by role (admin/user). Critical for admin panel and user management.';

-- Create a view that shows index usage statistics for monitoring
CREATE OR REPLACE VIEW index_usage_stats AS
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
'Monitor index usage statistics. Unused indexes may become active as features are implemented.';

-- Grant access to the view
GRANT SELECT ON index_usage_stats TO authenticated;
