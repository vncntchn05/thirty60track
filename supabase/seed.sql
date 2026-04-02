-- ============================================================
-- Development seed data — run AFTER schema.sql
-- Creates a shared exercise library. Trainer/client data is
-- created via the app UI or Supabase Auth dashboard.
-- ============================================================

INSERT INTO exercises (name, muscle_group, category) VALUES
  -- Chest
  ('Bench Press',            'Chest',     'strength'),
  ('Incline Bench Press',    'Chest',     'strength'),
  ('Push-Up',                'Chest',     'strength'),
  ('Cable Fly',              'Chest',     'strength'),
  -- Back
  ('Deadlift',               'Back',      'strength'),
  ('Pull-Up',                'Back',      'strength'),
  ('Barbell Row',            'Back',      'strength'),
  ('Lat Pulldown',           'Back',      'strength'),
  ('Seated Cable Row',       'Back',      'strength'),
  -- Shoulders
  ('Overhead Press',         'Shoulders', 'strength'),
  ('Lateral Raise',          'Shoulders', 'strength'),
  ('Face Pull',              'Shoulders', 'strength'),
  -- Arms
  ('Barbell Curl',           'Arms',      'strength'),
  ('Tricep Pushdown',        'Arms',      'strength'),
  ('Hammer Curl',            'Arms',      'strength'),
  ('Skull Crusher',          'Arms',      'strength'),
  -- Legs
  ('Squat',                  'Legs',      'strength'),
  ('Romanian Deadlift',      'Legs',      'strength'),
  ('Leg Press',              'Legs',      'strength'),
  ('Leg Curl',               'Legs',      'strength'),
  ('Leg Extension',          'Legs',      'strength'),
  ('Calf Raise',             'Legs',      'strength'),
  ('Lunges',                 'Legs',      'strength'),
  -- Core
  ('Plank',                  'Core',      'strength'),
  ('Crunch',                 'Core',      'strength'),
  ('Cable Crunch',           'Core',      'strength'),
  -- Cardio
  ('Treadmill Run',          'Legs',      'cardio'),
  ('Rowing Machine',         'Back',      'cardio'),
  ('Cycling',                'Legs',      'cardio'),
  ('Jump Rope',              'Full Body', 'cardio')
ON CONFLICT (name) DO NOTHING;

-- ─── Extended Exercise Library ────────────────────────────────
INSERT INTO exercises (name, muscle_group, category) VALUES
  -- Glutes
  ('Glute Bridge',                        'Glutes',    'strength'),
  ('Glute Bridge Hold',                   'Glutes',    'strength'),
  ('Glute Bridge (Pulsing)',              'Glutes',    'strength'),
  ('Single-Leg Bridge',                   'Glutes',    'strength'),
  -- Legs
  ('Air Squat',                           'Legs',      'strength'),
  ('Box Squat',                           'Legs',      'strength'),
  ('Reverse Lunge',                       'Legs',      'strength'),
  ('Single-Leg Reach (Bulg Squat)',       'Legs',      'strength'),
  ('Step-ups/Weighted',                   'Legs',      'strength'),
  ('Squat Press (DB/Bar)',                'Legs',      'strength'),
  ('Lateral Lunge',                       'Legs',      'strength'),
  ('Wall Sit',                            'Legs',      'strength'),
  ('Single-Leg Step-Up',                  'Legs',      'strength'),
  ('Box Jump',                            'Legs',      'cardio'),
  ('Jump Squats',                         'Legs',      'cardio'),
  ('Box Step-ups',                        'Legs',      'strength'),
  ('Walking Lunges',                      'Legs',      'strength'),
  ('DB Split Squat',                      'Legs',      'strength'),
  ('Leg Press + Leg Machines',            'Legs',      'strength'),
  ('Hamstring Curl',                      'Legs',      'strength'),
  ('DB Step-ups',                         'Legs',      'strength'),
  ('Wall Sits (Weighted)',                'Legs',      'strength'),
  ('Goblet Lateral Lunge',               'Legs',      'strength'),
  ('Lunge with Twist',                    'Legs',      'strength'),
  ('Skater Jumps',                        'Legs',      'cardio'),
  ('Single-Leg Hops',                     'Legs',      'cardio'),
  ('Lateral Bounds',                      'Legs',      'cardio'),
  ('DB Goblet Squat',                     'Legs',      'strength'),
  ('RDL',                                 'Legs',      'strength'),
  ('RDL (Dumbbells)',                     'Legs',      'strength'),
  ('KB Deadlift',                         'Legs',      'strength'),
  ('Pilates Squat + Squat',              'Legs',      'strength'),
  -- Chest
  ('Incline Push-up',                     'Chest',     'strength'),
  ('Floor Press + Mod Push-up',           'Chest',     'strength'),
  ('Tempo Push-ups',                      'Chest',     'strength'),
  ('T-Pushups',                           'Chest',     'strength'),
  ('Spiderman Push-ups',                  'Chest',     'strength'),
  ('Diamond + Wide Pushups',             'Chest',     'strength'),
  ('DB Bench Press',                      'Chest',     'strength'),
  ('DB Incline Press',                    'Chest',     'strength'),
  ('Chest Pass (Med Ball)',               'Chest',     'strength'),
  ('Push-up (Weighted)',                  'Chest',     'strength'),
  ('Dips',                                'Chest',     'strength'),
  ('Dips/Band Flyes',                    'Chest',     'strength'),
  -- Back
  ('Pull up/Lat Pulldown',               'Back',      'strength'),
  ('Mid Row',                             'Back',      'strength'),
  ('Cable Pullover',                      'Back',      'strength'),
  ('Scapular Pull-up',                   'Back',      'strength'),
  ('Scapular Push-ups',                  'Back',      'strength'),
  ('BW Back Extensions',                 'Back',      'strength'),
  ('Chin-up Negatives',                  'Back',      'strength'),
  ('DB Renegade Row',                     'Back',      'strength'),
  ('Cable Squat Row',                     'Back',      'strength'),
  -- Shoulders
  ('Cable Face Pulls',                    'Shoulders', 'strength'),
  ('DB Overhead Press',                   'Shoulders', 'strength'),
  ('Cable/Band Lateral Raise',           'Shoulders', 'strength'),
  ('Pike Push-ups',                       'Shoulders', 'strength'),
  -- Arms
  ('Towel Curls',                         'Arms',      'strength'),
  ('Bicep Curls',                         'Arms',      'strength'),
  ('Box Dips (Assist)',                   'Arms',      'strength'),
  -- Core
  ('Plank (Variations)',                  'Core',      'strength'),
  ('Plank Taps',                          'Core',      'strength'),
  ('Plank-to-Pushup',                    'Core',      'strength'),
  ('Side Planks',                         'Core',      'strength'),
  ('Side Plank Dips',                    'Core',      'strength'),
  ('Plank with Knee-to-Elbow',           'Core',      'strength'),
  ('Plank (Weighted)',                    'Core',      'strength'),
  ('Plank with Row',                      'Core',      'strength'),
  ('Plank Shoulder Taps',                'Core',      'strength'),
  ('Plank In and Outs',                  'Core',      'strength'),
  ('Plank Jacks',                         'Core',      'cardio'),
  ('Bicycle Crunches',                    'Core',      'strength'),
  ('Russian Twists',                      'Core',      'strength'),
  ('Decline Russian Twists',             'Core',      'strength'),
  ('V-Ups',                               'Core',      'strength'),
  ('V-Ups/Knee Raises',                  'Core',      'strength'),
  ('Flutter Kicks',                       'Core',      'strength'),
  ('Reverse Crunch',                      'Core',      'strength'),
  ('Weighted Sit-up',                     'Core',      'strength'),
  ('Deadbug (Weighted)',                  'Core',      'strength'),
  ('Deadbugs',                            'Core',      'strength'),
  ('Pallof Press',                        'Core',      'strength'),
  ('Cable Torso Rotations',              'Core',      'strength'),
  ('Static Squat Cable Torso Rotations', 'Core',      'strength'),
  ('Cable Woodchops',                     'Core',      'strength'),
  ('Hanging Leg Raises',                 'Core',      'strength'),
  ('Landmine Rotation',                   'Core',      'strength'),
  ('Windshields/Alternate Knee Raises',  'Core',      'strength'),
  ('Medicine Ball Rotational Toss',      'Core',      'strength'),
  ('Center Decline',                      'Core',      'strength'),
  ('Teapots',                             'Core',      'strength'),
  ('Single Leg Decline',                 'Core',      'strength'),
  ('Knee/Leg Raises',                    'Core',      'strength'),
  ('Knee to Elbows',                      'Core',      'strength'),
  ('Toe Taps',                            'Core',      'strength'),
  -- Full Body / Compound
  ('Landmine',                            'Full Body', 'strength'),
  ('Bear Crawl',                          'Full Body', 'strength'),
  ('Inchworm Push-Up',                   'Full Body', 'strength'),
  ('Ball Squat Toss',                     'Full Body', 'strength'),
  ('Med Ball Slams',                      'Full Body', 'strength'),
  ('Med Ball Overhead Hold',             'Full Body', 'strength'),
  ('Wall Balls',                          'Full Body', 'strength'),
  ('Burpee DB Press',                     'Full Body', 'strength'),
  ('Suitcase Carry (L/R)',               'Core',      'strength'),
  ('Farmer''s Walk',                      'Full Body', 'strength'),
  ('Squat Thrusts',                       'Full Body', 'cardio'),
  -- Cardio
  ('Mountain Climbers + Air Squats',     'Full Body', 'cardio'),
  ('Mountain Climbers',                   'Full Body', 'cardio'),
  ('Mountain Climber Burpee',            'Full Body', 'cardio'),
  ('In-Out Jumping Jacks',               'Full Body', 'cardio'),
  ('High Knees (s)',                      'Legs',      'cardio'),
  ('Butt Kicks (s)',                      'Legs',      'cardio'),
  ('Rope Ladder Broad Jumps',            'Legs',      'cardio'),
  ('Jumping Jacks (s)',                   'Full Body', 'cardio'),
  ('Shuttle Runs (yd)',                   'Legs',      'cardio'),
  ('Speed Skaters',                       'Legs',      'cardio'),
  ('Burpees',                             'Full Body', 'cardio'),
  ('Ice Skater Steps',                    'Legs',      'cardio'),
  -- Flexibility / Mobility
  ('Cobra Stretch',                       'Back',      'flexibility'),
  ('Hip Circles',                         'Hips',      'flexibility')
ON CONFLICT (name) DO NOTHING;

-- ─── Workout Templates ────────────────────────────────────────────
-- Run AFTER Migration 020 (subgroup column) has been applied.
-- Templates use a two-level hierarchy: split → subgroup.
-- Unique constraint is (name, split).
INSERT INTO workout_templates (name, split, subgroup, exercise_names) VALUES

  -- ── Full Body / Standard (guide-based 3-day sessions) ─────────
  ('Session A: Full Body', 'Full Body', 'Standard', ARRAY[
    'Back Squat', 'Bench Press', 'Bent-Over Row', 'Overhead Press', 'Plank'
  ]),
  ('Session B: Full Body', 'Full Body', 'Standard', ARRAY[
    'Goblet Squat', 'Romanian Deadlift', 'Incline Dumbbell Press', 'Lat Pulldown', 'Dead Bug'
  ]),
  ('Session C: Full Body', 'Full Body', 'Standard', ARRAY[
    'Deadlift', 'Front Squat', 'Push-Up', 'Cable Row', 'Pallof Press'
  ]),

  -- ── Full Body / Phase 1 ───────────────────────────────────────
  ('Workout A: Push Focus',   'Full Body', 'Phase 1', ARRAY['Air Squat', 'Glute Bridge', 'Incline Push-up', 'Floor Press + Mod Push-up', 'Dips', 'Plank (Variations)', 'Mountain Climbers + Air Squats', 'Cobra Stretch', 'Bear Crawl', 'Glute Bridge Hold']),
  ('Workout B: Pull Focus',   'Full Body', 'Phase 1', ARRAY['Reverse Lunge', 'Single-Leg Reach (Bulg Squat)', 'Pull up/Lat Pulldown', 'Mid Row', 'RDL', 'Cable Pullover', 'Towel Curls', 'Hammer Curl', 'Bear Crawl', 'Glute Bridge (Pulsing)']),
  ('Workout C: Stability',    'Full Body', 'Phase 1', ARRAY['Box Squat', 'Step-ups/Weighted', 'Landmine', 'Squat Press (DB/Bar)', 'Cable Squat Row', 'Cable Torso Rotations', 'Scapular Push-ups', 'Scapular Pull-up', 'Plank Taps', 'BW Back Extensions']),
  ('Workout D: Lateral/Total','Full Body', 'Phase 1', ARRAY['Lateral Lunge', 'Wall Sit', 'Plank-to-Pushup', 'Box Jump', 'Side Planks', 'Ball Squat Toss', 'Single-Leg Step-Up', 'Hip Circles', 'Mountain Climbers', 'In-Out Jumping Jacks']),

  -- ── Full Body / Phase 2 ───────────────────────────────────────
  ('Workout A: Push Focus (P2)',    'Full Body', 'Phase 2', ARRAY['Skater Jumps', 'Jump Squats', 'Tempo Push-ups', 'Chest Pass (Med Ball)', 'Plank Jacks', 'Flutter Kicks', 'T-Pushups', 'High Knees (s)', 'Box Jump', 'Deadbug (Weighted)']),
  ('Workout B: Pull Focus (P2)',    'Full Body', 'Phase 2', ARRAY['Box Step-ups', 'Walking Lunges', 'Chin-up Negatives', 'Med Ball Slams', 'Mountain Climbers', 'Bicycle Crunches', 'Cable Face Pulls', 'Butt Kicks (s)', 'Single-Leg Hops', 'Plank (Weighted)']),
  ('Workout C: Shoulder Focus',     'Full Body', 'Phase 2', ARRAY['Rope Ladder Broad Jumps', 'Lateral Bounds', 'Med Ball Overhead Hold', 'Wall Balls', 'Russian Twists', 'Static Squat Cable Torso Rotations', 'Pike Push-ups', 'Jumping Jacks (s)', 'Pilates Squat + Squat', 'Side Plank Dips']),
  ('Workout D: Agility/Total',      'Full Body', 'Phase 2', ARRAY['Shuttle Runs (yd)', 'Speed Skaters', 'V-Ups/Knee Raises', 'Burpees', 'Spiderman Push-ups', 'Plank with Knee-to-Elbow', 'Mountain Climber Burpee', 'Ice Skater Steps', 'Squat Thrusts', 'Deadlift']),

  -- ── Full Body / Phase 3 ───────────────────────────────────────
  ('Workout A: Chest/Push',  'Full Body', 'Phase 3', ARRAY['DB Goblet Squat', 'RDL (Dumbbells)', 'DB Bench Press', 'DB Incline Press', 'Deadbug (Weighted)', 'Pallof Press', 'Dips/Band Flyes', 'Inchworm Push-Up', 'Calf Raise', 'Weighted Sit-up']),
  ('Workout B: Back/Pull',   'Full Body', 'Phase 3', ARRAY['DB Split Squat', 'Leg Press + Leg Machines', 'Lat Pulldown', 'Seated Cable Row', 'Cable Woodchops', 'Plank with Row', 'Cable Face Pulls', 'Bicep Curls', 'Single-Leg Bridge', 'Reverse Crunch']),
  ('Workout C: Shoulders',   'Full Body', 'Phase 3', ARRAY['KB Deadlift', 'Hamstring Curl', 'DB Overhead Press', 'Cable/Band Lateral Raise', 'Hanging Leg Raises', 'Landmine Rotation', 'Burpee DB Press', 'Diamond + Wide Pushups', 'Wall Sits (Weighted)', 'Windshields/Alternate Knee Raises']),
  ('Workout D: Total Body',  'Full Body', 'Phase 3', ARRAY['DB Step-ups', 'Goblet Lateral Lunge', 'DB Renegade Row', 'Push-up (Weighted)', 'Medicine Ball Rotational Toss', 'Suitcase Carry (L/R)', 'Hammer Curl', 'Box Dips (Assist)', 'Lunge with Twist', 'Farmer''s Walk']),

  -- ── Upper / Lower / Upper ─────────────────────────────────────
  ('Upper A: Strength', 'Upper / Lower', 'Upper', ARRAY['Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Tricep Pushdown']),
  ('Upper B: Volume',   'Upper / Lower', 'Upper', ARRAY['Incline Dumbbell Press', 'Cable Row', 'Dumbbell Shoulder Press', 'Chest-Supported Row', 'Hammer Curl', 'Overhead Tricep Extension']),

  -- ── Upper / Lower / Lower ─────────────────────────────────────
  ('Lower A: Strength', 'Upper / Lower', 'Lower', ARRAY['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise']),
  ('Lower B: Volume',   'Upper / Lower', 'Lower', ARRAY['Deadlift', 'Bulgarian Split Squat', 'Leg Press', 'Leg Curl', 'Hip Thrust']),

  -- ── Push / Pull / Legs / Push ─────────────────────────────────
  ('Push Day 1', 'Push / Pull / Legs', 'Push', ARRAY['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Cable Lateral Raise', 'Tricep Pushdown', 'Overhead Tricep Extension']),
  ('Push Day 2', 'Push / Pull / Legs', 'Push', ARRAY['Overhead Press', 'Incline Dumbbell Press', 'Dips', 'Cable Fly', 'Cable Lateral Raise', 'Tricep Rope Pushdown']),

  -- ── Push / Pull / Legs / Pull ─────────────────────────────────
  ('Pull Day 1', 'Push / Pull / Legs', 'Pull', ARRAY['Barbell Row', 'Lat Pulldown', 'Cable Row', 'Face Pull', 'Barbell Curl', 'Hammer Curl']),
  ('Pull Day 2', 'Push / Pull / Legs', 'Pull', ARRAY['Deadlift', 'Lat Pulldown', 'Chest-Supported Row', 'Face Pull', 'Hammer Curl', 'Cable Row']),

  -- ── Push / Pull / Legs / Legs ─────────────────────────────────
  ('Legs Day 1', 'Push / Pull / Legs', 'Legs', ARRAY['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise', 'Plank', 'Hanging Leg Raise']),
  ('Legs Day 2', 'Push / Pull / Legs', 'Legs', ARRAY['Front Squat', 'Romanian Deadlift', 'Bulgarian Split Squat', 'Leg Curl', 'Hip Thrust', 'Calf Raise', 'Ab Wheel Rollout']),

  -- ── Abs & Core / Core Fundamentals ───────────────────────────
  ('Core: Beginner',      'Abs & Core', 'Core Fundamentals', ARRAY['Plank', 'Dead Bug', 'Bird Dog', 'Pallof Press', 'Glute Bridge', 'Side Plank']),
  ('Core: Intermediate',  'Abs & Core', 'Core Fundamentals', ARRAY['Ab Wheel Rollout', 'Hanging Knee Raise', 'Cable Crunch', 'Side Plank with Hip Dip', 'Copenhagen Plank', 'Pallof Press']),
  ('Core: Advanced',      'Abs & Core', 'Core Fundamentals', ARRAY['Hanging Leg Raise', 'Ab Wheel Rollout', 'Dragon Flag', 'Weighted Cable Crunch', 'Toes to Bar', 'L-Sit Hold']),

  -- ── Abs & Core / Ab Circuits ─────────────────────────────────
  ('Abs: Variation A', 'Abs & Core', 'Ab Circuits', ARRAY['Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank', 'Plank Shoulder Taps', 'Deadbugs', 'Plank In and Outs', 'Decline Russian Twists', 'Knee to Elbows', 'Toe Taps', 'V-Ups']),
  ('Abs: Variation B', 'Abs & Core', 'Ab Circuits', ARRAY['V-Ups', 'Toe Taps', 'Knee to Elbows', 'Decline Russian Twists', 'Plank In and Outs', 'Deadbugs', 'Plank Shoulder Taps', 'Plank', 'Knee/Leg Raises', 'Single Leg Decline', 'Teapots', 'Center Decline']),
  ('Abs: Variation C', 'Abs & Core', 'Ab Circuits', ARRAY['Plank', 'Deadbugs', 'V-Ups', 'Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank Shoulder Taps', 'Plank In and Outs', 'Decline Russian Twists', 'Knee to Elbows', 'Toe Taps']),
  ('Abs: Variation D', 'Abs & Core', 'Ab Circuits', ARRAY['Decline Russian Twists', 'Knee to Elbows', 'Toe Taps', 'V-Ups', 'Center Decline', 'Teapots', 'Single Leg Decline', 'Knee/Leg Raises', 'Plank', 'Plank Shoulder Taps', 'Deadbugs', 'Plank In and Outs'])

ON CONFLICT (name, split) DO NOTHING;

-- ─── Migration: backfill missing muscle_group values ──────────────
-- Run this in the Supabase SQL editor to fix existing rows.
UPDATE exercises SET muscle_group = 'Legs'      WHERE name IN ('Treadmill Run', 'Cycling', 'High Knees (s)', 'Butt Kicks (s)', 'Rope Ladder Broad Jumps', 'Shuttle Runs (yd)', 'Speed Skaters', 'Ice Skater Steps') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Back'      WHERE name IN ('Rowing Machine', 'Cobra Stretch') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Core'      WHERE name IN ('Suitcase Carry (L/R)') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Hips'      WHERE name IN ('Hip Circles') AND muscle_group IS NULL;
UPDATE exercises SET muscle_group = 'Full Body' WHERE muscle_group IS NULL;

-- ─── Migration 009: exercise tutorial links ────────────────────────
-- Verified YouTube tutorial links for core exercises.
UPDATE exercises SET help_url = 'https://youtu.be/vcBig73ojpE' WHERE name = 'Bench Press';
UPDATE exercises SET help_url = 'https://youtu.be/3PRwtVpyslo' WHERE name = 'Squat';
UPDATE exercises SET help_url = 'https://youtu.be/VL5Ab0T07e4' WHERE name = 'Deadlift';
UPDATE exercises SET help_url = 'https://youtu.be/CAwf7n6Luuc' WHERE name = 'Lat Pulldown';
