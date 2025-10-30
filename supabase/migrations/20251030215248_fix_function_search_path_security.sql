/*
  # Fix Function Search Path Security
  
  This migration fixes security issues with database functions by setting explicit search_path.
  Functions without explicit search_path are vulnerable to search_path injection attacks.
  
  ## Changes
  
  1. Fix handle_updated_at function
     - Set search_path to pg_catalog, public for security
  
  2. Fix update_updated_at_column function
     - Set search_path to pg_catalog, public for security
  
  3. Fix handle_new_user function
     - Set search_path to pg_catalog, public for security
  
  ## Security Impact
  - Prevents search_path injection attacks
  - Ensures functions use correct schema resolution
  - Follows PostgreSQL security best practices
*/

-- =====================================================
-- FIX handle_updated_at FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX update_updated_at_column FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FIX handle_new_user FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
DECLARE
  user_provider TEXT;
BEGIN
  -- Get the provider from auth.users
  SELECT 
    COALESCE(
      raw_app_meta_data->>'provider',
      raw_user_meta_data->>'provider',
      'email'
    )
  INTO user_provider
  FROM auth.users
  WHERE id = NEW.id;

  -- Insert profile
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, provider, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    user_provider,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Verify the triggers are still active
DO $$
BEGIN
  -- Recreate triggers if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created' 
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

COMMENT ON FUNCTION handle_updated_at() IS 'Automatically updates the updated_at timestamp. SECURITY DEFINER with explicit search_path.';
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column. SECURITY DEFINER with explicit search_path.';
COMMENT ON FUNCTION handle_new_user() IS 'Creates user profile on new user registration. SECURITY DEFINER with explicit search_path.';
