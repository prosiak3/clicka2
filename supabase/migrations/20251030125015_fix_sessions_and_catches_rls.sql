/*
  # Fix RLS Policies for Sessions and Catches

  1. Changes
    - Drop existing policies that use FOR ALL
    - Create separate policies for SELECT, INSERT, UPDATE, DELETE
    - Add admin support for all tables
    
  2. Security
    - Users can manage their own sessions and catches
    - Admins can see and manage all sessions and catches
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON fishing_sessions;
DROP POLICY IF EXISTS "Users can manage catches in their sessions" ON fish_catches;

-- fishing_sessions policies
CREATE POLICY "Users and admins can select sessions"
  ON fishing_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Users can insert own sessions"
  ON fishing_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and admins can update sessions"
  ON fishing_sessions FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

CREATE POLICY "Users and admins can delete sessions"
  ON fishing_sessions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR is_admin(auth.uid())
  );

-- fish_catches policies
CREATE POLICY "Users and admins can select catches"
  ON fish_catches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can insert catches in own sessions"
  ON fish_catches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND fishing_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users and admins can update catches"
  ON fish_catches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users and admins can delete catches"
  ON fish_catches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fishing_sessions
      WHERE fishing_sessions.id = fish_catches.session_id
      AND (fishing_sessions.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );