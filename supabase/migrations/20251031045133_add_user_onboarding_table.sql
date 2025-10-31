/*
  # Create User Onboarding Table

  ## Overview
  This migration creates infrastructure for tracking user onboarding/tutorial progress.

  ## New Tables
    - `user_onboarding`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `completed` (boolean) - Whether the tutorial has been completed
      - `current_step` (integer) - Current step number (0-based)
      - `total_steps` (integer) - Total number of tutorial steps
      - `skipped` (boolean) - Whether user skipped the tutorial
      - `completed_at` (timestamptz) - When tutorial was completed
      - `last_seen_step` (integer) - Last step user saw
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Security
    - Enable RLS on `user_onboarding` table
    - Add policy for users to read their own onboarding data
    - Add policy for users to update their own onboarding data
    - Add policy for users to insert their own onboarding data

  ## Important Notes
    1. Each user can have only one onboarding record
    2. Tutorial progress is saved automatically as user advances through steps
    3. Users can restart the tutorial from settings
    4. Completed/skipped status is tracked for analytics
*/

-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed boolean DEFAULT false NOT NULL,
  current_step integer DEFAULT 0 NOT NULL,
  total_steps integer DEFAULT 11 NOT NULL,
  skipped boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  last_seen_step integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own onboarding data
CREATE POLICY "Users can read own onboarding data"
  ON user_onboarding
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own onboarding data
CREATE POLICY "Users can insert own onboarding data"
  ON user_onboarding
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own onboarding data
CREATE POLICY "Users can update own onboarding data"
  ON user_onboarding
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on update
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at_trigger ON user_onboarding;
CREATE TRIGGER update_user_onboarding_updated_at_trigger
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();
