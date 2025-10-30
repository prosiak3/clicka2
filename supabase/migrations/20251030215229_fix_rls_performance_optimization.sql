/*
  # Fix RLS Performance Issues
  
  This migration optimizes Row Level Security policies by wrapping auth.uid() calls in SELECT statements.
  This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale.
  
  ## Changes
  
  1. Roadmap Items Policies
     - Update INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  2. Changelog Entries Policies
     - Update INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  3. User Profiles Policies
     - Update SELECT, INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  4. Fishing Sessions Policies
     - Update SELECT, INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  5. Fish Catches Policies
     - Update SELECT, INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  6. App Versions Policies
     - Update INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  7. Weather API Providers Policies
     - Update SELECT, INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  8. Weather API Keys Policies
     - Update SELECT, INSERT, UPDATE, DELETE policies to use (select auth.uid())
  
  ## Performance Impact
  - Reduces function calls from O(n) to O(1) per query
  - Improves query performance for tables with many rows
  - Follows Supabase best practices for RLS
*/

-- =====================================================
-- ROADMAP ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert roadmap items" ON roadmap_items;
CREATE POLICY "Admins can insert roadmap items"
  ON roadmap_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can update roadmap items" ON roadmap_items;
CREATE POLICY "Admins can update roadmap items"
  ON roadmap_items FOR UPDATE
  TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete roadmap items" ON roadmap_items;
CREATE POLICY "Admins can delete roadmap items"
  ON roadmap_items FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));

-- =====================================================
-- CHANGELOG ENTRIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert changelog entries" ON changelog_entries;
CREATE POLICY "Admins can insert changelog entries"
  ON changelog_entries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can update changelog entries" ON changelog_entries;
CREATE POLICY "Admins can update changelog entries"
  ON changelog_entries FOR UPDATE
  TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete changelog entries" ON changelog_entries;
CREATE POLICY "Admins can delete changelog entries"
  ON changelog_entries FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can select profiles" ON user_profiles;
CREATE POLICY "Users and admins can select profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users and admins can update profiles" ON user_profiles;
CREATE POLICY "Users and admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));

-- =====================================================
-- FISHING SESSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can select sessions" ON fishing_sessions;
CREATE POLICY "Users and admins can select sessions"
  ON fishing_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Users can insert own sessions" ON fishing_sessions;
CREATE POLICY "Users can insert own sessions"
  ON fishing_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users and admins can update sessions" ON fishing_sessions;
CREATE POLICY "Users and admins can update sessions"
  ON fishing_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())))
  WITH CHECK ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Users and admins can delete sessions" ON fishing_sessions;
CREATE POLICY "Users and admins can delete sessions"
  ON fishing_sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

-- =====================================================
-- FISH CATCHES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users and admins can select catches" ON fish_catches;
CREATE POLICY "Users and admins can select catches"
  ON fish_catches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = (select auth.uid()) OR is_admin((select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can insert catches in own sessions" ON fish_catches;
CREATE POLICY "Users can insert catches in own sessions"
  ON fish_catches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND fishing_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users and admins can update catches" ON fish_catches;
CREATE POLICY "Users and admins can update catches"
  ON fish_catches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = (select auth.uid()) OR is_admin((select auth.uid())))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = (select auth.uid()) OR is_admin((select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users and admins can delete catches" ON fish_catches;
CREATE POLICY "Users and admins can delete catches"
  ON fish_catches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = (select auth.uid()) OR is_admin((select auth.uid())))
    )
  );

-- =====================================================
-- APP VERSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert versions" ON app_versions;
CREATE POLICY "Admins can insert versions"
  ON app_versions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can update versions" ON app_versions;
CREATE POLICY "Admins can update versions"
  ON app_versions FOR UPDATE
  TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete versions" ON app_versions;
CREATE POLICY "Admins can delete versions"
  ON app_versions FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));

-- =====================================================
-- WEATHER API PROVIDERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view weather API providers" ON weather_api_providers;
CREATE POLICY "Admins can view weather API providers"
  ON weather_api_providers FOR SELECT
  TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert weather API providers" ON weather_api_providers;
CREATE POLICY "Admins can insert weather API providers"
  ON weather_api_providers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can update weather API providers" ON weather_api_providers;
CREATE POLICY "Admins can update weather API providers"
  ON weather_api_providers FOR UPDATE
  TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete weather API providers" ON weather_api_providers;
CREATE POLICY "Admins can delete weather API providers"
  ON weather_api_providers FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));

-- =====================================================
-- WEATHER API KEYS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view weather API keys" ON weather_api_keys;
CREATE POLICY "Admins can view weather API keys"
  ON weather_api_keys FOR SELECT
  TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can insert weather API keys" ON weather_api_keys;
CREATE POLICY "Admins can insert weather API keys"
  ON weather_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can update weather API keys" ON weather_api_keys;
CREATE POLICY "Admins can update weather API keys"
  ON weather_api_keys FOR UPDATE
  TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "Admins can delete weather API keys" ON weather_api_keys;
CREATE POLICY "Admins can delete weather API keys"
  ON weather_api_keys FOR DELETE
  TO authenticated
  USING (is_admin((select auth.uid())));
