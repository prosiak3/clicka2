/*
  # Add Voice-Controlled Catch Logging to Roadmap

  1. Changes
    - Insert new roadmap item for voice-controlled catch logging feature
    - This is a Phase 3 high-priority feature for hands-free operation

  2. Feature Details
    - Voice assistant for logging catches during active fishing sessions
    - Multi-language support (EN/PL/DE)
    - Conversational flow: species → length → weight confirmation
    - Automatic weight calculation with manual override option
    - Optimized for outdoor fishing conditions with noise handling
    - Perfect for wet/dirty hands or when user is busy with equipment
*/

-- Insert voice-controlled catch logging roadmap item
INSERT INTO roadmap_items (title, description, status, phase, priority)
VALUES (
  'Voice-Controlled Catch Logging',
  'Hands-free voice assistant for logging catches during fishing. Users can add catches by speaking commands - app asks questions about species, length, and weight in user''s language. System uses speech recognition, reads fish species list aloud, auto-calculates weight from length, confirms all details verbally before saving. Perfect for situations when hands are wet, dirty, or busy with fishing equipment. Includes multi-language support (EN/PL/DE), noise handling for outdoor conditions, and full conversational flow with error recovery.',
  'planned',
  3,
  1
)
ON CONFLICT DO NOTHING;
