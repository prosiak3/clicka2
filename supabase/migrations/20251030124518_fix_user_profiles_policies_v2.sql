/*
  # Fix User Profiles RLS Policies v2

  1. Changes
    - Drop ALL existing policies
    - Create single SELECT policy that works for both users and admins
    - Simplify policy logic to avoid conflicts
    
  2. Security
    - Users can read their own profile
    - Admins can read all profiles
    - Users can update their own profile (except role)
    - Admins can update all profiles
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;

-- Single SELECT policy: users can read own profile OR admin can read all
CREATE POLICY "Allow read own or admin read all"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- INSERT policy: users can create their own profile
CREATE POLICY "Allow insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policy for regular users (cannot change role)
CREATE POLICY "Allow update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- UPDATE policy for admins (can change anything on any profile)
CREATE POLICY "Allow admin update all"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- DELETE policy for admins
CREATE POLICY "Allow admin delete"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );