/*
  # Add Admin Role System to User Profiles

  1. Changes
    - Add `role` column to `user_profiles` table
      - Values: 'user' (default) or 'admin'
      - NOT NULL with default 'user'
    
  2. Security Updates
    - Add RLS policies for admins to view all profiles
    - Add RLS policies for admins to update any user's role
    - Keep existing policies for regular users
    
  3. Important Notes
    - All existing users will be assigned 'user' role by default
    - Only admins can modify roles
    - Admins can view and manage all user profiles
    - Regular users can only view/edit their own profile
*/

-- Add role column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Add check constraint to ensure only valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_role_check'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_role_check 
    CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add policy for admins to delete any profile
CREATE POLICY "Admins can delete any profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update the handle_new_user function to set default role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_app_meta_data->>'provider', 'email'),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;