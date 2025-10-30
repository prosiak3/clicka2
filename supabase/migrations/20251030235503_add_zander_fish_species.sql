/*
  # Add Zander (Sandacz) fish species

  1. New Species
    - Zander (Sandacz, Zander, Stizostedion lucioperca)
      - Length range: 55-130 cm
      - Max weight: 22 kg
      - Group: predatory
  
  2. Purpose
    - Add popular predatory fish species for quick catch selection
*/

-- Add Zander to fish_species table
INSERT INTO fish_species (
  code, name_en, name_pl, name_de, latin_name, group_name,
  min_length, max_length, max_weight,
  description_pl, description_en, description_de,
  habitat_pl, habitat_en, habitat_de,
  image_url, thumbnail_url
) VALUES
  (
    'zander', 'Zander', 'Sandacz', 'Zander', 'Stizostedion lucioperca', 'predatory',
    55, 130, 22.0,
    'Duży drapieżnik o wydłużonym ciele, szarozielonym ubarwieniu z ciemnymi poprzecznymi pasami. Preferuje wody czyste o twardym dnie.',
    'A large predator with an elongated body, grey-green coloration with dark transverse bands. Prefers clean waters with hard bottom.',
    'Ein großer Raubfisch mit länglich gestrecktem Körper, graugrüner Färbung mit dunklen Querbändern. Bevorzugt saubere Gewässer mit hartem Grund.',
    'Występuje w jeziorach i rzekach, aktywny w zmierzchu i nocy, poluje na małe ryby.',
    'Found in lakes and rivers, active at dusk and night, hunts small fish.',
    'Kommt in Seen und Flüssen vor, aktiv in der Dämmerung und Nacht, jagt kleine Fische.',
    'https://www.rtw.org.pl/images/sandacz.jpg',
    'https://www.rtw.org.pl/images/sandacz-thumb.jpg'
  )
ON CONFLICT (code) DO NOTHING;