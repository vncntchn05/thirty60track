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
  ('Treadmill Run',          NULL,        'cardio'),
  ('Rowing Machine',         NULL,        'cardio'),
  ('Cycling',                NULL,        'cardio'),
  ('Jump Rope',              NULL,        'cardio')
ON CONFLICT (name) DO NOTHING;
