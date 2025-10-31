/*
  # Make weather column nullable in fish_catches table

  1. Summary
    - Changes the weather column in fish_catches table to allow NULL values
    - This fixes sync issues when old catch data doesn't have weather information
  
  2. Changes
    - Alters fish_catches.weather column to be nullable
  
  3. Rationale
    - Weather data might not always be available (offline mode, API failures)
    - Old cached data might not have weather information
    - Making it nullable prevents sync failures without losing catch data
  
  4. Data Safety
    - This is a non-destructive change (only relaxes constraint)
    - All existing data remains intact
*/

ALTER TABLE fish_catches 
ALTER COLUMN weather DROP NOT NULL;