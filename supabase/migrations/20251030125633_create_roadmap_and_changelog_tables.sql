/*
  # Create Roadmap and Changelog Tables

  1. New Tables
    - `app_versions`
      - `id` (uuid, primary key)
      - `version` (text, unique) - Version number (e.g., "0.1.0")
      - `release_date` (timestamp)
      - `is_current` (boolean) - Is this the current version
      - `created_at` (timestamp)
      
    - `roadmap_items`
      - `id` (uuid, primary key)
      - `title` (text) - Title of the feature/task
      - `description` (text) - Detailed description
      - `status` (text) - planned, in_progress, completed
      - `phase` (integer) - Phase number (1, 2, 3, etc.)
      - `priority` (integer) - Priority level
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `changelog_entries`
      - `id` (uuid, primary key)
      - `version_id` (uuid, foreign key)
      - `type` (text) - added, changed, fixed, removed
      - `description` (text) - What was changed
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Everyone can read (for public roadmap access)
    - Only admins can create/update/delete
*/

-- Create app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text UNIQUE NOT NULL,
  release_date timestamptz DEFAULT now(),
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view versions"
  ON app_versions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert versions"
  ON app_versions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update versions"
  ON app_versions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete versions"
  ON app_versions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create roadmap_items table
CREATE TABLE IF NOT EXISTS roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned',
  phase integer NOT NULL DEFAULT 1,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('planned', 'in_progress', 'completed'))
);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roadmap items"
  ON roadmap_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert roadmap items"
  ON roadmap_items FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roadmap items"
  ON roadmap_items FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roadmap items"
  ON roadmap_items FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create changelog_entries table
CREATE TABLE IF NOT EXISTS changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('added', 'changed', 'fixed', 'removed'))
);

ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view changelog entries"
  ON changelog_entries FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert changelog entries"
  ON changelog_entries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update changelog entries"
  ON changelog_entries FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete changelog entries"
  ON changelog_entries FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Insert initial version and changelog
INSERT INTO app_versions (version, release_date, is_current)
VALUES ('0.1.0', now(), true);

-- Get the version ID for initial changelog entries
DO $$
DECLARE
  v_version_id uuid;
BEGIN
  SELECT id INTO v_version_id FROM app_versions WHERE version = '0.1.0';
  
  -- Insert initial changelog entries
  INSERT INTO changelog_entries (version_id, type, description) VALUES
    (v_version_id, 'added', 'User authentication with email/password'),
    (v_version_id, 'added', 'OAuth login support (Google, Facebook, GitHub)'),
    (v_version_id, 'added', 'Fishing session tracking with GPS'),
    (v_version_id, 'added', 'Weather data integration'),
    (v_version_id, 'added', 'Moon phase display'),
    (v_version_id, 'added', 'Fish catch logging with photos'),
    (v_version_id, 'added', 'Session analysis and statistics'),
    (v_version_id, 'added', 'Admin panel for user management'),
    (v_version_id, 'added', 'Multi-language support (EN, PL, DE)'),
    (v_version_id, 'added', 'Dark mode support'),
    (v_version_id, 'added', 'PWA support for offline usage');
END $$;

-- Insert initial roadmap items
INSERT INTO roadmap_items (title, description, status, phase, priority) VALUES
  ('User Authentication System', 'Complete login system with OAuth and email/password support', 'completed', 1, 1),
  ('Fishing Session Tracking', 'GPS-based tracking with pause/resume functionality', 'completed', 1, 1),
  ('Weather Integration', 'Real-time weather data and historical tracking', 'completed', 1, 2),
  ('Catch Logging', 'Log catches with photos, species, and measurements', 'completed', 1, 1),
  ('Admin Panel', 'User management and system administration', 'completed', 1, 3),
  
  ('Advanced Statistics', 'Detailed analytics and catch patterns', 'planned', 2, 1),
  ('Export Functionality', 'Export data to CSV, PDF, and other formats', 'planned', 2, 2),
  ('Social Features', 'Share catches and compete with friends', 'planned', 2, 3),
  ('Fishing Spots Database', 'Community-driven fishing locations database', 'planned', 2, 2),
  
  ('AI Fish Recognition', 'Automatic fish species identification from photos', 'planned', 3, 2),
  ('Fishing Forecasts', 'AI-powered predictions for best fishing times', 'planned', 3, 1),
  ('Mobile Apps', 'Native iOS and Android applications', 'planned', 3, 3);

CREATE INDEX idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX idx_roadmap_items_phase ON roadmap_items(phase);
CREATE INDEX idx_changelog_entries_version ON changelog_entries(version_id);