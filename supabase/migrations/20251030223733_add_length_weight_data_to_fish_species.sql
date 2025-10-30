/*
  # Add length-weight data to fish species table

  ## Summary
  This migration adds support for automatic weight suggestions based on fish length by adding a new column to store length-weight reference points for each fish species.

  ## Changes
  1. New Column
    - `length_weight_data` (JSONB)
      - Stores array of length-weight reference points
      - Format: [{"length": 30, "weight": 0.22}, {"length": 40, "weight": 0.53}, ...]
      - Nullable (optional for species without data)
      - Default: NULL

  2. Security
    - RLS policies remain unchanged
    - Authenticated users can read the new column
    - Only admins can modify fish species data

  ## Purpose
  Enable automatic weight suggestions when users log catches by interpolating between known length-weight data points for each species.
*/

-- Add length_weight_data column to fish_species table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fish_species' AND column_name = 'length_weight_data'
  ) THEN
    ALTER TABLE fish_species ADD COLUMN length_weight_data JSONB DEFAULT NULL;
  END IF;
END $$;

-- Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_fish_species_length_weight_data ON fish_species USING GIN (length_weight_data);