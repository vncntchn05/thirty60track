-- Migration 020 — workout_templates: add subgroup column
-- Introduces a second grouping level within each split
-- (e.g. Push / Pull / Legs → Push | Pull | Legs).
-- Also re-homes Phase 1/2/3 into Full Body with subgroups,
-- and merges the old Abs split into Abs & Core.

ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS subgroup TEXT;

-- ── Re-home Phase templates into Full Body ────────────────────────
-- (split was set to 'Phase 1/2/3' by Migration 019)

UPDATE workout_templates
  SET split = 'Full Body', subgroup = 'Phase 1'
  WHERE split = 'Phase 1';

UPDATE workout_templates
  SET split = 'Full Body', subgroup = 'Phase 2'
  WHERE split = 'Phase 2';

UPDATE workout_templates
  SET split = 'Full Body', subgroup = 'Phase 3'
  WHERE split = 'Phase 3';

-- ── Re-home old Abs split into Abs & Core ─────────────────────────

UPDATE workout_templates
  SET split = 'Abs & Core', subgroup = 'Ab Circuits'
  WHERE split = 'Abs';

-- ── Backfill subgroups for guide-based templates ──────────────────

-- Full Body — guide sessions
UPDATE workout_templates
  SET subgroup = 'Standard'
  WHERE split = 'Full Body' AND subgroup IS NULL;

-- Upper / Lower
UPDATE workout_templates
  SET subgroup = 'Upper'
  WHERE split = 'Upper / Lower' AND name LIKE 'Upper%';

UPDATE workout_templates
  SET subgroup = 'Lower'
  WHERE split = 'Upper / Lower' AND name LIKE 'Lower%';

-- Push / Pull / Legs
UPDATE workout_templates
  SET subgroup = 'Push'
  WHERE split = 'Push / Pull / Legs' AND name LIKE 'Push%';

UPDATE workout_templates
  SET subgroup = 'Pull'
  WHERE split = 'Push / Pull / Legs' AND name LIKE 'Pull%';

UPDATE workout_templates
  SET subgroup = 'Legs'
  WHERE split = 'Push / Pull / Legs' AND name LIKE 'Legs%';

-- Abs & Core — tiered core templates
UPDATE workout_templates
  SET subgroup = 'Core Fundamentals'
  WHERE split = 'Abs & Core' AND name LIKE 'Core:%';
