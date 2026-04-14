-- ============================================================
-- Migration 032 — Fat Loss Workout Templates
-- ============================================================
-- Adds 4 fat loss templates under a new "Fat Loss" split:
--   · HIIT Circuits   — HIIT Circuit A, HIIT Circuit B
--   · Metabolic Strength — Metabolic Strength A, Metabolic Strength B
--
-- All exercise names are verified against the exercises table.
-- The unique constraint is (name, split, subgroup).
-- ============================================================

INSERT INTO workout_templates (name, split, subgroup, exercise_names)
VALUES
  (
    'HIIT Circuit A',
    'Fat Loss',
    'HIIT Circuits',
    ARRAY[
      'Jump Squats',
      'Push-Up',
      'Mountain Climbers',
      'Burpees',
      'Air Squat',
      'High Knees (s)',
      'Plank',
      'Jumping Jacks (s)'
    ]
  ),
  (
    'HIIT Circuit B',
    'Fat Loss',
    'HIIT Circuits',
    ARRAY[
      'Box Jump',
      'Skater Jumps',
      'Mountain Climber Burpee',
      'Speed Skaters',
      'Squat Thrusts',
      'Lateral Bounds',
      'Plank Jacks',
      'Jump Rope'
    ]
  ),
  (
    'Metabolic Strength A',
    'Fat Loss',
    'Metabolic Strength',
    ARRAY[
      'Goblet Squat',
      'Romanian Deadlift',
      'Push-Up',
      'Walking Lunges',
      'Burpees',
      'Bicycle Crunches',
      'Jump Rope',
      'Plank'
    ]
  ),
  (
    'Metabolic Strength B',
    'Fat Loss',
    'Metabolic Strength',
    ARRAY[
      'Deadlift',
      'DB Goblet Squat',
      'Reverse Lunge',
      'Mountain Climbers',
      'Jump Squats',
      'Russian Twists',
      'Burpees',
      'Flutter Kicks'
    ]
  )
ON CONFLICT (name, split, subgroup) DO NOTHING;
