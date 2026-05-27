-- Migration 019 — workout_templates: add split column
-- Restores grouping support (previously "phase"), now named
-- "split" to align with Full Body / Upper-Lower / PPL etc.

ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS split TEXT;

-- Drop the plain name unique constraint and replace with
-- (name, split) so the same template name can exist in
-- different splits (mirrors the original phase behaviour).
ALTER TABLE workout_templates DROP CONSTRAINT IF EXISTS workout_templates_name_key;
ALTER TABLE workout_templates ADD CONSTRAINT workout_templates_name_split_key
  UNIQUE (name, split);

-- ── Backfill: assign splits to existing rows ──────────────────────
-- Phase 1
UPDATE workout_templates SET split = 'Phase 1' WHERE name IN (
  'Workout A: Push Focus',
  'Workout B: Pull Focus',
  'Workout C: Stability',
  'Workout D: Lateral/Total'
);

-- Phase 2 (some names were suffixed with " (P2)" by Migration 015
-- only when they conflicted with Phase 1 names)
UPDATE workout_templates SET split = 'Phase 2' WHERE name IN (
  'Workout A: Push Focus (P2)',
  'Workout B: Pull Focus (P2)',
  'Workout C: Shoulder Focus',
  'Workout D: Agility/Total'
);

-- Phase 3
UPDATE workout_templates SET split = 'Phase 3' WHERE name IN (
  'Workout A: Chest/Push',
  'Workout B: Back/Pull',
  'Workout C: Shoulders',
  'Workout D: Total Body'
);

-- Abs
UPDATE workout_templates SET split = 'Abs'
  WHERE name LIKE 'Abs: Variation %';

-- Full Body (guide-based)
UPDATE workout_templates SET split = 'Full Body' WHERE name IN (
  'Session A: Full Body',
  'Session B: Full Body',
  'Session C: Full Body'
);

-- Upper / Lower (guide-based)
UPDATE workout_templates SET split = 'Upper / Lower' WHERE name IN (
  'Upper A: Strength',
  'Lower A: Strength',
  'Upper B: Volume',
  'Lower B: Volume'
);

-- Push / Pull / Legs (guide-based)
UPDATE workout_templates SET split = 'Push / Pull / Legs' WHERE name IN (
  'Push Day 1',
  'Pull Day 1',
  'Legs Day 1',
  'Push Day 2',
  'Pull Day 2',
  'Legs Day 2'
);

-- Abs & Core (guide-based)
UPDATE workout_templates SET split = 'Abs & Core' WHERE name IN (
  'Core: Beginner',
  'Core: Intermediate',
  'Core: Advanced'
);
