/*
  # Remove external website data

  1. Changes
    - Remove external website data from fish_species table
    - Update image URLs to be nullable
    - Remove existing data with external URLs
*/

-- Remove external website data
UPDATE fish_species
SET 
  image_url = NULL,
  thumbnail_url = NULL
WHERE 
  image_url LIKE '%rtw.org.pl%' OR 
  thumbnail_url LIKE '%rtw.org.pl%';

-- Remove external descriptions and data
UPDATE fish_species
SET
  description_pl = NULL,
  description_en = NULL,
  description_de = NULL,
  habitat_pl = NULL,
  habitat_en = NULL,
  habitat_de = NULL,
  feeding_pl = NULL,
  feeding_en = NULL,
  feeding_de = NULL,
  spawning_pl = NULL,
  spawning_en = NULL,
  spawning_de = NULL
WHERE 
  description_pl IS NOT NULL OR
  description_en IS NOT NULL OR
  description_de IS NOT NULL OR
  habitat_pl IS NOT NULL OR
  habitat_en IS NOT NULL OR
  habitat_de IS NOT NULL OR
  feeding_pl IS NOT NULL OR
  feeding_en IS NOT NULL OR
  feeding_de IS NOT NULL OR
  spawning_pl IS NOT NULL OR
  spawning_en IS NOT NULL OR
  spawning_de IS NOT NULL;