/*
  # Fish Species Database Schema

  1. New Tables
    - fish_species
      - Stores detailed fish information
      - Includes translations for names
      - Stores image URLs and descriptions
      - Contains legal and biological information

  2. Security
    - Enable RLS
    - Allow authenticated users to read data
    - Only allow admin users to modify data
*/

-- Create fish_species table
CREATE TABLE IF NOT EXISTS fish_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_pl TEXT NOT NULL,
  name_de TEXT NOT NULL,
  latin_name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  min_length INTEGER NOT NULL,
  max_length INTEGER NOT NULL,
  max_weight DECIMAL(10,2) NOT NULL,
  description_pl TEXT,
  description_en TEXT,
  description_de TEXT,
  habitat_pl TEXT,
  habitat_en TEXT,
  habitat_de TEXT,
  feeding_pl TEXT,
  feeding_en TEXT,
  feeding_de TEXT,
  spawning_pl TEXT,
  spawning_en TEXT,
  spawning_de TEXT,
  legal_size INTEGER,
  protected_period_start DATE,
  protected_period_end DATE,
  image_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE fish_species ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for authenticated users"
  ON fish_species
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_fish_species_code ON fish_species(code);
CREATE INDEX idx_fish_species_group ON fish_species(group_name);

-- Insert initial data
INSERT INTO fish_species (
  code, name_en, name_pl, name_de, latin_name, group_name,
  min_length, max_length, max_weight,
  description_pl, description_en, description_de,
  habitat_pl, habitat_en, habitat_de,
  image_url, thumbnail_url
) VALUES
  (
    'pike', 'Pike', 'Szczupak', 'Hecht', 'Esox lucius', 'predatory',
    30, 150, 35.0,
    'Drapieżnik zasiedlający wody słodkie. Charakteryzuje się wydłużonym, walcowatym ciałem oraz dużą głową z charakterystycznym spłaszczonym pyskiem przypominającym "kaczym dziób".',
    'A predatory fish inhabiting freshwater. Characterized by an elongated, cylindrical body and a large head with a characteristic flattened snout resembling a "duck''s bill".',
    'Ein Raubfisch, der im Süßwasser lebt. Gekennzeichnet durch einen länglichen, zylindrischen Körper und einen großen Kopf mit einer charakteristischen abgeflachten Schnauze, die einem "Entenschnabel" ähnelt.',
    'Zasiedla różnorodne zbiorniki wodne, preferuje wody stojące lub wolno płynące z bogatą roślinnością.',
    'Inhabits various water bodies, prefers standing or slow-flowing waters with rich vegetation.',
    'Bewohnt verschiedene Gewässer, bevorzugt stehende oder langsam fließende Gewässer mit reicher Vegetation.',
    'https://www.rtw.org.pl/images/szczupak.jpg',
    'https://www.rtw.org.pl/images/szczupak-thumb.jpg'
  ),
  (
    'perch', 'Perch', 'Okoń', 'Barsch', 'Perca fluviatilis', 'predatory',
    15, 60, 3.0,
    'Ryba drapieżna o charakterystycznym wysokim, bocznie spłaszczonym ciele w oliwkowo-zielonym kolorze z ciemnymi poprzecznymi pasami.',
    'A predatory fish with a characteristic high, laterally flattened body in olive-green color with dark transverse stripes.',
    'Ein Raubfisch mit charakteristisch hohem, seitlich abgeflachtem Körper in olivgrüner Farbe mit dunklen Querstreifen.',
    'Występuje w różnych typach wód, od jezior po rzeki, preferuje wody czyste z twardym dnem.',
    'Found in various types of waters, from lakes to rivers, prefers clean waters with hard bottom.',
    'Kommt in verschiedenen Gewässertypen vor, von Seen bis zu Flüssen, bevorzugt sauberes Wasser mit hartem Grund.',
    'https://www.rtw.org.pl/images/okon.jpg',
    'https://www.rtw.org.pl/images/okon-thumb.jpg'
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_fish_species_updated_at
    BEFORE UPDATE ON fish_species
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();