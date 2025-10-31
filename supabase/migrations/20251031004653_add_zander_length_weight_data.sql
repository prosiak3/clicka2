/*
  # Add length-weight data for Zander

  1. Summary
    - Adds scientifically-based length-weight reference points for Zander (Sandacz)
  
  2. Data Details
    - Based on typical Zander growth patterns in European waters
    - Data points cover the full size range from minimum to maximum length
    - Allows accurate weight estimation through linear interpolation
  
  3. Notes
    - All lengths are in centimeters (cm)
    - All weights are in kilograms (kg)
    - Data represents average specimens under typical conditions
*/

UPDATE fish_species
SET length_weight_data = '[
  {"length": 40, "weight": 0.5},
  {"length": 45, "weight": 0.75},
  {"length": 50, "weight": 1.1},
  {"length": 55, "weight": 1.5},
  {"length": 60, "weight": 2.0},
  {"length": 65, "weight": 2.6},
  {"length": 70, "weight": 3.3},
  {"length": 75, "weight": 4.1},
  {"length": 80, "weight": 5.0},
  {"length": 85, "weight": 6.0},
  {"length": 90, "weight": 7.2},
  {"length": 95, "weight": 8.5},
  {"length": 100, "weight": 10.0},
  {"length": 105, "weight": 11.6},
  {"length": 110, "weight": 13.3},
  {"length": 115, "weight": 15.2},
  {"length": 120, "weight": 17.3},
  {"length": 125, "weight": 19.5},
  {"length": 130, "weight": 22.0}
]'::jsonb
WHERE code = 'zander';