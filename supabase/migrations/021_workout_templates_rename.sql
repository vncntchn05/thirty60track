-- ============================================================
-- Migration 021 — workout_templates: clean up naming
-- Removes "Workout A/B/C/D:" letter prefixes; names now reflect
-- only the target area / emphasis.
-- Also tightens the unique constraint from (name, split) to
-- (name, split, subgroup) so the same focus name can appear in
-- different subgroups within the same split (e.g. "Push Emphasis"
-- in both Phase 1 and Phase 2 under Full Body).
-- ============================================================

-- ── 1. Upgrade unique constraint ─────────────────────────────
ALTER TABLE workout_templates
  DROP CONSTRAINT IF EXISTS workout_templates_name_split_key;

ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_name_split_subgroup_key
  UNIQUE (name, split, subgroup);

-- ── 2. Full Body / Standard ───────────────────────────────────
UPDATE workout_templates SET name = 'Full Body 1'
  WHERE name = 'Session A: Full Body'   AND split = 'Full Body' AND subgroup = 'Standard';
UPDATE workout_templates SET name = 'Full Body 2'
  WHERE name = 'Session B: Full Body'   AND split = 'Full Body' AND subgroup = 'Standard';
UPDATE workout_templates SET name = 'Full Body 3'
  WHERE name = 'Session C: Full Body'   AND split = 'Full Body' AND subgroup = 'Standard';

-- ── 3. Full Body / Phase 1 ────────────────────────────────────
UPDATE workout_templates SET name = 'Push Emphasis'
  WHERE name = 'Workout A: Push Focus'     AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Pull Emphasis'
  WHERE name = 'Workout B: Pull Focus'     AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Stability'
  WHERE name = 'Workout C: Stability'      AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Lateral & Total'
  WHERE name = 'Workout D: Lateral/Total'  AND split = 'Full Body' AND subgroup = 'Phase 1';

-- ── 4. Full Body / Phase 2 ────────────────────────────────────
UPDATE workout_templates SET name = 'Push Emphasis'
  WHERE name = 'Workout A: Push Focus (P2)'  AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Pull Emphasis'
  WHERE name = 'Workout B: Pull Focus (P2)'  AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Shoulder Emphasis'
  WHERE name = 'Workout C: Shoulder Focus'   AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Agility & Total'
  WHERE name = 'Workout D: Agility/Total'    AND split = 'Full Body' AND subgroup = 'Phase 2';

-- ── 5. Full Body / Phase 3 ────────────────────────────────────
UPDATE workout_templates SET name = 'Chest & Push'
  WHERE name = 'Workout A: Chest/Push'  AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Back & Pull'
  WHERE name = 'Workout B: Back/Pull'   AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Shoulders & Arms'
  WHERE name = 'Workout C: Shoulders'   AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Total Body'
  WHERE name = 'Workout D: Total Body'  AND split = 'Full Body' AND subgroup = 'Phase 3';

-- ── 6. Upper / Lower ─────────────────────────────────────────
UPDATE workout_templates SET name = 'Upper 1'
  WHERE name = 'Upper A: Strength' AND split = 'Upper / Lower' AND subgroup = 'Upper';
UPDATE workout_templates SET name = 'Upper 2'
  WHERE name = 'Upper B: Volume'   AND split = 'Upper / Lower' AND subgroup = 'Upper';
UPDATE workout_templates SET name = 'Lower 1'
  WHERE name = 'Lower A: Strength' AND split = 'Upper / Lower' AND subgroup = 'Lower';
UPDATE workout_templates SET name = 'Lower 2'
  WHERE name = 'Lower B: Volume'   AND split = 'Upper / Lower' AND subgroup = 'Lower';

-- ── 7. Push / Pull / Legs ─────────────────────────────────────
UPDATE workout_templates SET name = 'Push 1'
  WHERE name = 'Push Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Push';
UPDATE workout_templates SET name = 'Push 2'
  WHERE name = 'Push Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Push';
UPDATE workout_templates SET name = 'Pull 1'
  WHERE name = 'Pull Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Pull';
UPDATE workout_templates SET name = 'Pull 2'
  WHERE name = 'Pull Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Pull';
UPDATE workout_templates SET name = 'Legs 1'
  WHERE name = 'Legs Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Legs';
UPDATE workout_templates SET name = 'Legs 2'
  WHERE name = 'Legs Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Legs';
