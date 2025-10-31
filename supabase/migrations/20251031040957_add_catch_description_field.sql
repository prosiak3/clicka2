/*
  # Add catch description field to fish_catches table

  ## Description
  This migration adds a description field to individual catches, allowing users to add
  detailed notes about specific catches beyond the photos.

  ## Changes
  - Add `description` column to `fish_catches` table (text, nullable)
  - This allows users to add contextual notes about each catch
  - Field is optional to maintain backward compatibility

  ## Security
  - No RLS policy changes needed (inherits from existing session policies)
*/

-- Add description field to fish_catches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fish_catches' AND column_name = 'description'
  ) THEN
    ALTER TABLE fish_catches ADD COLUMN description text;
  END IF;
END $$;