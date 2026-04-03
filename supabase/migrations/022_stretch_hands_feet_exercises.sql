-- ============================================================
-- Migration 022 — Add stretch category + Hands/Feet exercises
-- Adds:
--   • 36 stretch exercises across all muscle groups
--   • 8 hand/wrist stretches  (muscle_group = 'Hands')
--   • 10 hand/wrist strength  (muscle_group = 'Hands')
--   • 7 foot/ankle stretches  (muscle_group = 'Feet')
--   • 11 foot/ankle strength  (muscle_group = 'Feet')
-- ============================================================

-- Update schema comment to reflect new category
COMMENT ON COLUMN exercises.category IS
  '''strength'' | ''cardio'' | ''flexibility'' | ''stretch'' | ''other''';

INSERT INTO exercises (name, muscle_group, category) VALUES

  -- ── Back Stretches ─────────────────────────────────────────────
  ('Child''s Pose',               'Back',      'stretch'),
  ('Cat-Cow Stretch',             'Back',      'stretch'),
  ('Thoracic Spine Rotation',     'Back',      'stretch'),
  ('Thread the Needle',           'Back',      'stretch'),
  ('Prone Cobra',                 'Back',      'stretch'),
  ('Supine Twist',                'Back',      'stretch'),
  ('Lat Doorway Stretch',         'Back',      'stretch'),
  ('Levator Scapulae Stretch',    'Back',      'stretch'),
  ('Downward Dog',                'Back',      'stretch'),

  -- ── Chest Stretches ────────────────────────────────────────────
  ('Doorway Chest Stretch',       'Chest',     'stretch'),
  ('Chest Opener Stretch',        'Chest',     'stretch'),
  ('Pec Minor Stretch',           'Chest',     'stretch'),

  -- ── Shoulder Stretches ─────────────────────────────────────────
  ('Cross-Body Shoulder Stretch', 'Shoulders', 'stretch'),
  ('Shoulder Sleeper Stretch',    'Shoulders', 'stretch'),
  ('Neck Side Stretch',           'Shoulders', 'stretch'),
  ('Neck Flexion Stretch',        'Shoulders', 'stretch'),
  ('Posterior Shoulder Stretch',  'Shoulders', 'stretch'),

  -- ── Arm Stretches ──────────────────────────────────────────────
  ('Overhead Tricep Stretch',     'Arms',      'stretch'),
  ('Bicep Wall Stretch',          'Arms',      'stretch'),
  ('Forearm Flexor Stretch',      'Arms',      'stretch'),

  -- ── Hip Stretches ──────────────────────────────────────────────
  ('Hip Flexor Stretch',          'Hips',      'stretch'),
  ('90/90 Hip Stretch',           'Hips',      'stretch'),
  ('Butterfly Stretch',           'Hips',      'stretch'),
  ('Pigeon Pose',                 'Hips',      'stretch'),
  ('Figure Four Stretch',         'Hips',      'stretch'),

  -- ── Glute Stretches ────────────────────────────────────────────
  ('Piriformis Stretch',          'Glutes',    'stretch'),
  ('Seated Glute Stretch',        'Glutes',    'stretch'),

  -- ── Leg Stretches ──────────────────────────────────────────────
  ('Standing Quad Stretch',       'Legs',      'stretch'),
  ('Lying Quad Stretch',          'Legs',      'stretch'),
  ('Standing Hamstring Stretch',  'Legs',      'stretch'),
  ('Seated Hamstring Stretch',    'Legs',      'stretch'),
  ('Seated Forward Fold',         'Legs',      'stretch'),
  ('IT Band Stretch',             'Legs',      'stretch'),
  ('Couch Stretch',               'Legs',      'stretch'),
  ('Standing Calf Stretch',       'Legs',      'stretch'),

  -- ── Full Body Stretch ──────────────────────────────────────────
  ('World''s Greatest Stretch',   'Full Body', 'stretch'),

  -- ── Hand & Wrist Stretches ─────────────────────────────────────
  ('Wrist Flexor Stretch',             'Hands', 'stretch'),
  ('Wrist Extensor Stretch',           'Hands', 'stretch'),
  ('Prayer Stretch',                   'Hands', 'stretch'),
  ('Reverse Prayer Stretch',           'Hands', 'stretch'),
  ('Finger Extension Stretch',         'Hands', 'stretch'),
  ('Thumb Stretch',                    'Hands', 'stretch'),
  ('Wrist Circles',                    'Hands', 'stretch'),
  ('Tendon Glide',                     'Hands', 'stretch'),

  -- ── Hand & Wrist Strength ──────────────────────────────────────
  ('Wrist Curls',                      'Hands', 'strength'),
  ('Wrist Extensions',                 'Hands', 'strength'),
  ('Reverse Wrist Curls',              'Hands', 'strength'),
  ('Grip Squeezes',                    'Hands', 'strength'),
  ('Pinch Grip Hold',                  'Hands', 'strength'),
  ('Dead Hang',                        'Hands', 'strength'),
  ('Finger Curls',                     'Hands', 'strength'),
  ('Towel Grip Row',                   'Hands', 'strength'),
  ('Forearm Pronation & Supination',   'Hands', 'strength'),
  ('Rice Bucket Training',             'Hands', 'strength'),

  -- ── Foot & Ankle Stretches ─────────────────────────────────────
  ('Plantar Fascia Stretch',           'Feet',  'stretch'),
  ('Achilles Tendon Stretch',          'Feet',  'stretch'),
  ('Toe Flexor Stretch',               'Feet',  'stretch'),
  ('Ankle Circles',                    'Feet',  'stretch'),
  ('Toe Spread Stretch',               'Feet',  'stretch'),
  ('Ankle Dorsiflexion Stretch',       'Feet',  'stretch'),
  ('Seated Calf & Ankle Stretch',      'Feet',  'stretch'),

  -- ── Foot & Ankle Strength / Mobility ───────────────────────────
  ('Ankle Alphabet',                   'Feet',  'strength'),
  ('Towel Toe Scrunches',              'Feet',  'strength'),
  ('Marble Pickup',                    'Feet',  'strength'),
  ('Short Foot Exercise',              'Feet',  'strength'),
  ('Toe Raises',                       'Feet',  'strength'),
  ('Single Leg Heel Raise',            'Feet',  'strength'),
  ('Foot Doming',                      'Feet',  'strength'),
  ('Ankle Stability Balance',          'Feet',  'strength'),
  ('Resistance Band Ankle Inversion',  'Feet',  'strength'),
  ('Resistance Band Ankle Eversion',   'Feet',  'strength'),
  ('Intrinsic Foot Strengthening',     'Feet',  'strength')

ON CONFLICT (name) DO NOTHING;
