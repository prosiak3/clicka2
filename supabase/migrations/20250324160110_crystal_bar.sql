/*
  # Update Fish Species Data

  1. Changes
    - Add descriptions in multiple languages (PL, EN, DE)
    - Add habitat information
    - Add image URLs from Wikimedia Commons
    - Update thumbnails

  2. Species Updated
    - Pike (Esox lucius)
    - Perch (Perca fluviatilis)
*/

-- Update fish species data with descriptions and images
UPDATE fish_species
SET 
  description_pl = CASE code
    WHEN 'pike' THEN 'Szczupak to drapieżnik zasiedlający wody słodkie. Charakteryzuje się wydłużonym, walcowatym ciałem oraz dużą głową z charakterystycznym spłaszczonym pyskiem. Ubarwienie grzbietu jest ciemnozielone lub brązowe, boki jaśniejsze z żółtawymi lub białawymi plamami, brzuch biały.'
    WHEN 'perch' THEN 'Okoń to ryba drapieżna o charakterystycznym wysokim, bocznie spłaszczonym ciele. Ubarwienie jest oliwkowo-zielone z ciemnymi poprzecznymi pasami. Płetwy brzuszne i odbytowa są czerwone. Pierwsza płetwa grzbietowa ma charakterystyczną czarną plamę.'
    ELSE NULL
  END,
  description_en = CASE code
    WHEN 'pike' THEN 'The pike is a predatory fish inhabiting freshwater. It is characterized by an elongated, cylindrical body and a large head with a characteristic flattened snout. The back is dark green or brown, sides lighter with yellowish or whitish spots, belly white.'
    WHEN 'perch' THEN 'The perch is a predatory fish with a characteristic high, laterally flattened body. The coloration is olive-green with dark transverse stripes. The ventral and anal fins are red. The first dorsal fin has a characteristic black spot.'
    ELSE NULL
  END,
  description_de = CASE code
    WHEN 'pike' THEN 'Der Hecht ist ein Raubfisch, der im Süßwasser lebt. Er zeichnet sich durch einen länglichen, zylindrischen Körper und einen großen Kopf mit charakteristisch abgeflachter Schnauze aus. Der Rücken ist dunkelgrün oder braun, die Seiten heller mit gelblichen oder weißlichen Flecken, der Bauch weiß.'
    WHEN 'perch' THEN 'Der Barsch ist ein Raubfisch mit charakteristisch hohem, seitlich abgeflachtem Körper. Die Färbung ist olivgrün mit dunklen Querstreifen. Die Bauch- und Afterflossen sind rot. Die erste Rückenflosse hat einen charakteristischen schwarzen Fleck.'
    ELSE NULL
  END,
  habitat_pl = CASE code
    WHEN 'pike' THEN 'Występuje w różnorodnych zbiornikach wodnych, preferuje wody stojące lub wolno płynące z bogatą roślinnością.'
    WHEN 'perch' THEN 'Zasiedla różne typy wód, od jezior po rzeki, preferuje wody czyste z twardym dnem.'
    ELSE NULL
  END,
  habitat_en = CASE code
    WHEN 'pike' THEN 'Found in various water bodies, prefers standing or slow-flowing waters with rich vegetation.'
    WHEN 'perch' THEN 'Inhabits various types of waters, from lakes to rivers, prefers clean waters with hard bottom.'
    ELSE NULL
  END,
  habitat_de = CASE code
    WHEN 'pike' THEN 'Kommt in verschiedenen Gewässern vor, bevorzugt stehende oder langsam fließende Gewässer mit reicher Vegetation.'
    WHEN 'perch' THEN 'Bewohnt verschiedene Gewässertypen, von Seen bis zu Flüssen, bevorzugt sauberes Wasser mit hartem Grund.'
    ELSE NULL
  END,
  image_url = CASE code
    WHEN 'pike' THEN '["https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Esox_lucius_ZOO_1.jpg/1280px-Esox_lucius_ZOO_1.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Pike_in_Aquarium.jpg/1280px-Pike_in_Aquarium.jpg"]'
    WHEN 'perch' THEN '["https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/YellowPerch.jpg/1280px-YellowPerch.jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Perca_fluviatilis.jpg/1280px-Perca_fluviatilis.jpg"]'
    ELSE NULL
  END,
  thumbnail_url = CASE code
    WHEN 'pike' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Esox_lucius_ZOO_1.jpg/320px-Esox_lucius_ZOO_1.jpg'
    WHEN 'perch' THEN 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/YellowPerch.jpg/320px-YellowPerch.jpg'
    ELSE NULL
  END;