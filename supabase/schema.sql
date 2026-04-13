-- ============================================================
-- thirty60track — Supabase Schema
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
-- gen_random_uuid() is available by default in Supabase.

-- ─── Trainers ────────────────────────────────────────────────
-- One row per gym staff member. Linked 1-to-1 with auth.users.
CREATE TABLE trainers (
  id          UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create trainer row when a new user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.trainers (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Clients ─────────────────────────────────────────────────
-- Gym members being trained. Each belongs to one trainer.
CREATE TABLE clients (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id      UUID          NOT NULL REFERENCES trainers (id) ON DELETE CASCADE,
  full_name       TEXT          NOT NULL,
  email           TEXT,
  phone           TEXT,
  date_of_birth   DATE,
  notes           TEXT,
  weight_kg       NUMERIC(5,2)  CHECK (weight_kg > 0),
  height_cm       NUMERIC(5,1)  CHECK (height_cm > 0),
  bf_percent      NUMERIC(4,2)  CHECK (bf_percent BETWEEN 0 AND 100),
  bmi             NUMERIC(5,2)  GENERATED ALWAYS AS (
    CASE WHEN height_cm IS NOT NULL AND weight_kg IS NOT NULL AND height_cm > 0
      THEN ROUND(weight_kg / ((height_cm / 100.0) ^ 2), 2) ELSE NULL END) STORED,
  lean_body_mass  NUMERIC(6,2),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX clients_trainer_id_idx ON clients (trainer_id);

-- ─── Exercise Library ─────────────────────────────────────────
-- Shared catalog of exercises for the whole gym.
CREATE TABLE exercises (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL UNIQUE,
  muscle_group  TEXT,       -- e.g. 'Chest', 'Back', 'Legs'
  category      TEXT        NOT NULL DEFAULT 'strength',
                            -- 'strength' | 'cardio' | 'flexibility' | 'stretch' | 'other'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Workouts ─────────────────────────────────────────────────
-- A single training session for one client on one date.
CREATE TABLE workouts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID        NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  trainer_id        UUID        NOT NULL REFERENCES trainers (id),
  performed_at      DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  body_weight_kg    NUMERIC(5,2) CHECK (body_weight_kg > 0),
  body_fat_percent  NUMERIC(4,2) CHECK (body_fat_percent BETWEEN 0 AND 100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workouts_client_id_idx    ON workouts (client_id);
CREATE INDEX workouts_trainer_id_idx   ON workouts (trainer_id);
CREATE INDEX workouts_performed_at_idx ON workouts (performed_at DESC);

-- ─── Workout Sets ─────────────────────────────────────────────
-- Individual sets within a workout. One row = one set.
CREATE TABLE workout_sets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id       UUID        NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  exercise_id      UUID        NOT NULL REFERENCES exercises (id),
  set_number       SMALLINT    NOT NULL CHECK (set_number > 0),
  reps             SMALLINT    CHECK (reps > 0),
  weight_kg        NUMERIC(6, 2) CHECK (weight_kg >= 0),
  duration_seconds INTEGER     CHECK (duration_seconds > 0),  -- for timed sets
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workout_sets_workout_id_idx  ON workout_sets (workout_id);
CREATE INDEX workout_sets_exercise_id_idx ON workout_sets (exercise_id);

-- ─── updated_at trigger helper ────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE trainers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Trainers: any authenticated trainer can read all profiles; only own row for writes.
CREATE POLICY "trainers: authenticated read" ON trainers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trainers: own row write" ON trainers
  FOR ALL USING (auth.uid() = id);

-- Clients: any authenticated trainer can read; only the owning trainer can write.
CREATE POLICY "clients: authenticated read" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients: own trainer insert" ON clients
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "clients: own trainer update" ON clients
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "clients: own trainer delete" ON clients
  FOR DELETE USING (auth.uid() = trainer_id);

-- Exercises: any authenticated user can read; only authenticated users insert.
-- (Gym staff share a single exercise library.)
CREATE POLICY "exercises: authenticated read" ON exercises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "exercises: authenticated insert" ON exercises
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No DELETE/UPDATE on exercises from the client — manage via Supabase dashboard.

-- ─── Migration 002: body metrics on workouts ──────────────────────
-- Run this in the Supabase SQL editor if the workouts table already exists.
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS body_weight_kg   NUMERIC(5,2) CHECK (body_weight_kg > 0),
  ADD COLUMN IF NOT EXISTS body_fat_percent NUMERIC(4,2) CHECK (body_fat_percent BETWEEN 0 AND 100);

-- ─── Migration 003: shared trainer access to workouts ─────────────
-- Allow all authenticated trainers to view and edit any client's workouts.
-- Run this in the Supabase SQL editor if the above policies already exist.
DROP POLICY IF EXISTS "workouts: own trainer" ON workouts;
DROP POLICY IF EXISTS "workout_sets: via workout trainer" ON workout_sets;

CREATE POLICY "workouts: authenticated" ON workouts
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "workout_sets: authenticated" ON workout_sets
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Migration 004: workout_templates table ───────────────────────
-- Stores editable workout templates (replaces the static TS constant).
CREATE TABLE IF NOT EXISTS workout_templates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  phase          TEXT        NOT NULL,
  category       TEXT        NOT NULL DEFAULT 'Main',
  exercise_names TEXT[]      NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, phase)
);

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_templates: authenticated" ON workout_templates
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Migration 005: fix workout_templates unique constraint ────────
-- Run this if you already ran Migration 004.
-- The old UNIQUE(name) prevented same-named workouts across phases.
ALTER TABLE workout_templates DROP CONSTRAINT IF EXISTS workout_templates_name_key;
ALTER TABLE workout_templates ADD CONSTRAINT workout_templates_name_phase_key UNIQUE (name, phase);

-- ─── Migration 006: superset grouping on workout_sets ──────────────
-- Group numbers are app-assigned integers, scoped to a workout.
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS superset_group SMALLINT;

-- ─── Migration 008: gender on clients ─────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gender TEXT; -- 'male' | 'female' | 'other'

-- ─── Migration 007: client media gallery ───────────────────────────
-- Stores image/video metadata; actual files live in the 'client-media' Storage bucket.
-- Before running: create a public bucket named 'client-media' in Supabase Dashboard → Storage.
CREATE TABLE IF NOT EXISTS client_media (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID        NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  trainer_id   UUID        NOT NULL REFERENCES trainers (id),
  storage_path TEXT        NOT NULL,  -- path within the 'client-media' bucket
  media_type   TEXT        NOT NULL DEFAULT 'image', -- 'image' | 'video'
  taken_at     DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_media_client_id_idx ON client_media (client_id);

DROP TRIGGER IF EXISTS client_media_updated_at ON client_media;
CREATE TRIGGER client_media_updated_at
  BEFORE UPDATE ON client_media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE client_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_media: authenticated" ON client_media;
CREATE POLICY "client_media: authenticated" ON client_media
  FOR ALL USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Migration 010: workout groups ("worked out with") ────────────
-- Groups workouts across clients that happened in the same session.
-- All workouts sharing a workout_group_id are kept in sync (same sets).
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS workout_group_id UUID;
CREATE INDEX IF NOT EXISTS workouts_group_id_idx ON workouts (workout_group_id);

-- ─── Migration 009: exercise form notes + tutorial link ───────────
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS form_notes TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS help_url   TEXT;

-- Allow authenticated trainers to update exercises (form notes, help URL, etc.)
DROP POLICY IF EXISTS "exercises: authenticated update" ON exercises;
CREATE POLICY "exercises: authenticated update" ON exercises
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Storage bucket policies for 'client-media' (run separately in SQL editor).
-- The bucket itself must be created first in Dashboard → Storage → New bucket.
-- CREATE POLICY "client-media: authenticated upload"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'client-media');
-- CREATE POLICY "client-media: authenticated update"
--   ON storage.objects FOR UPDATE TO authenticated
--   USING (bucket_id = 'client-media');
-- CREATE POLICY "client-media: authenticated delete"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'client-media');
-- CREATE POLICY "client-media: public read"
--   ON storage.objects FOR SELECT TO public
--   USING (bucket_id = 'client-media');

-- ─── Migration 011: client auth support ───────────────────────────

-- Link clients table to auth
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_idx ON clients(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Track who logged each workout (trainer vs client)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS logged_by_role TEXT NOT NULL DEFAULT 'trainer' CHECK (logged_by_role IN ('trainer', 'client'));
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS logged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update handle_new_user to skip trainer-row creation when a client signs up.
-- Clients pass role:'client' in raw_user_meta_data at signUp time.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.trainers (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- RLS: clients can read their own client row
CREATE POLICY "clients_read_own" ON clients
  FOR SELECT USING (auth.uid() = auth_user_id);

-- RLS: clients can read their own workouts
CREATE POLICY "clients_read_own_workouts" ON workouts
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- RLS: clients can insert workouts for themselves only
CREATE POLICY "clients_insert_own_workouts" ON workouts
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    AND logged_by_role = 'client'
    AND logged_by_user_id = auth.uid()
  );

-- RLS: clients can update/delete only workouts THEY logged
CREATE POLICY "clients_update_own_workouts" ON workouts
  FOR UPDATE USING (
    logged_by_role = 'client'
    AND logged_by_user_id = auth.uid()
  );

CREATE POLICY "clients_delete_own_workouts" ON workouts
  FOR DELETE USING (
    logged_by_role = 'client'
    AND logged_by_user_id = auth.uid()
  );

-- RLS: clients can read workout_sets for their workouts
CREATE POLICY "clients_read_own_sets" ON workout_sets
  FOR SELECT USING (
    workout_id IN (
      SELECT id FROM workouts
      WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    )
  );

-- RLS: clients can insert/update/delete sets only on workouts they logged
CREATE POLICY "clients_write_own_sets" ON workout_sets
  FOR ALL USING (
    workout_id IN (
      SELECT id FROM workouts
      WHERE logged_by_role = 'client'
        AND logged_by_user_id = auth.uid()
    )
  );

-- ─── Migration 012: client intake form ───────────────────────────

-- Flag on clients to gate the first-time form; default false so all existing clients must complete it
ALTER TABLE clients ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Health/lifestyle intake fields (non-overlapping with the existing clients columns)
CREATE TABLE IF NOT EXISTS client_intake (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  -- Contact
  address             TEXT,
  -- Emergency contact
  emergency_name      TEXT,
  emergency_phone     TEXT,
  emergency_relation  TEXT,
  -- Lifestyle
  occupation          TEXT,
  -- Health history
  current_injuries    TEXT,
  past_injuries       TEXT,   -- injuries + surgeries
  chronic_conditions  TEXT,
  medications         TEXT,
  -- Fitness
  activity_level      TEXT,   -- 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goals               TEXT,
  goal_timeframe      TEXT,
  -- Metadata
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS client_intake_updated_at ON client_intake;
CREATE TRIGGER client_intake_updated_at
  BEFORE UPDATE ON client_intake
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;

-- Trainers: full access
CREATE POLICY "client_intake: authenticated" ON client_intake
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Clients: read their own intake row
CREATE POLICY "clients_read_own_intake" ON client_intake
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Clients: write their own intake row
CREATE POLICY "clients_write_own_intake" ON client_intake
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Allow clients to update their own client row (for intake_completed + name/DOB/phone sync)
CREATE POLICY "clients: client update own" ON clients
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- RLS: clients can read and insert their own media
CREATE POLICY "clients_read_own_media" ON client_media
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "clients_insert_own_media" ON client_media
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "clients_delete_own_media" ON client_media
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- ─── Migration 013: Trainer-assigned future workouts ──────────────

CREATE TABLE assigned_workouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id            UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title                 TEXT,
  scheduled_date        DATE NOT NULL,
  notes                 TEXT,
  status                TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  completed_at          TIMESTAMPTZ,
  completed_workout_id  UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assigned_workout_exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_id   UUID NOT NULL REFERENCES assigned_workouts(id) ON DELETE CASCADE,
  exercise_id           UUID NOT NULL REFERENCES exercises(id),
  order_index           INTEGER NOT NULL DEFAULT 0,
  superset_group        INTEGER
);

CREATE TABLE assigned_workout_sets (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_exercise_id  UUID NOT NULL REFERENCES assigned_workout_exercises(id) ON DELETE CASCADE,
  set_number                    INTEGER NOT NULL,
  reps                          INTEGER,
  weight_kg                     NUMERIC(6,2),
  duration_seconds              INTEGER,
  notes                         TEXT
);

ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_workout_sets ENABLE ROW LEVEL SECURITY;

-- Trainers: full CRUD on their own assigned workouts
CREATE POLICY "trainer_all_assigned_workouts" ON assigned_workouts
  FOR ALL USING (trainer_id = auth.uid());

CREATE POLICY "trainer_all_assigned_exercises" ON assigned_workout_exercises
  FOR ALL USING (
    assigned_workout_id IN (
      SELECT id FROM assigned_workouts WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "trainer_all_assigned_sets" ON assigned_workout_sets
  FOR ALL USING (
    assigned_workout_exercise_id IN (
      SELECT awe.id FROM assigned_workout_exercises awe
      JOIN assigned_workouts aw ON aw.id = awe.assigned_workout_id
      WHERE aw.trainer_id = auth.uid()
    )
  );

-- Clients: read assigned workouts for their own client record
CREATE POLICY "clients_read_assigned_workouts" ON assigned_workouts
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "clients_read_assigned_exercises" ON assigned_workout_exercises
  FOR SELECT USING (
    assigned_workout_id IN (
      SELECT aw.id FROM assigned_workouts aw
      JOIN clients c ON c.id = aw.client_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "clients_read_assigned_sets" ON assigned_workout_sets
  FOR SELECT USING (
    assigned_workout_exercise_id IN (
      SELECT awe.id FROM assigned_workout_exercises awe
      JOIN assigned_workouts aw ON aw.id = awe.assigned_workout_id
      JOIN clients c ON c.id = aw.client_id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Clients: update assigned_workouts (to mark as completed)
CREATE POLICY "clients_update_assigned_workouts" ON assigned_workouts
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- ─── Migration 014: Nutrition tracking ───────────────────────────

CREATE TABLE nutrition_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id        UUID        NOT NULL REFERENCES trainers(id),
  logged_date       DATE        NOT NULL,
  meal_type         TEXT        NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name         TEXT        NOT NULL,
  serving_size_g    NUMERIC(7,2) NOT NULL DEFAULT 100,
  calories          NUMERIC(7,2),
  protein_g         NUMERIC(7,2),
  carbs_g           NUMERIC(7,2),
  fat_g             NUMERIC(7,2),
  fiber_g           NUMERIC(7,2),
  usda_food_id      TEXT,
  logged_by_role    TEXT        NOT NULL DEFAULT 'trainer' CHECK (logged_by_role IN ('trainer', 'client')),
  logged_by_user_id UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_logs_client_date ON nutrition_logs(client_id, logged_date);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- Trainers: full access to their clients' logs
CREATE POLICY "trainer_all_nutrition_logs" ON nutrition_logs
  FOR ALL USING (trainer_id = auth.uid());

-- Clients: read own logs
CREATE POLICY "clients_read_own_nutrition_logs" ON nutrition_logs
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Clients: insert own logs
CREATE POLICY "clients_insert_own_nutrition_logs" ON nutrition_logs
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- Clients: delete their own logged entries only
CREATE POLICY "clients_delete_own_nutrition_logs" ON nutrition_logs
  FOR DELETE USING (
    logged_by_role = 'client'
    AND logged_by_user_id = auth.uid()
    AND client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- ── Nutrition goals (one row per client, upserted by trainer) ─────

CREATE TABLE nutrition_goals (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID         NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id   UUID         NOT NULL REFERENCES trainers(id),
  calories     NUMERIC(7,2) NOT NULL,
  protein_pct  NUMERIC(5,2) NOT NULL,
  carbs_pct    NUMERIC(5,2) NOT NULL,
  fat_pct      NUMERIC(5,2) NOT NULL,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

DROP TRIGGER IF EXISTS nutrition_goals_updated_at ON nutrition_goals;
CREATE TRIGGER nutrition_goals_updated_at
  BEFORE UPDATE ON nutrition_goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Trainers: full access
CREATE POLICY "trainer_all_nutrition_goals" ON nutrition_goals
  FOR ALL USING (trainer_id = auth.uid());

-- Clients: read own goal
CREATE POLICY "clients_read_own_nutrition_goals" ON nutrition_goals
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- ─── Migration 015: Remove phase/category from workout_templates ──
-- Rename duplicate template names (same name existed across phases) before
-- adding the unique constraint, then drop the phase/category columns.

UPDATE workout_templates SET name = name || ' (P2)' WHERE phase = 'Phase 2' AND name IN (
  SELECT name FROM workout_templates WHERE phase = 'Phase 1'
);
UPDATE workout_templates SET name = name || ' (P3)' WHERE phase = 'Phase 3' AND name IN (
  SELECT name FROM workout_templates WHERE phase IN ('Phase 1', 'Phase 2')
);

ALTER TABLE workout_templates DROP CONSTRAINT IF EXISTS workout_templates_name_phase_key;
ALTER TABLE workout_templates DROP CONSTRAINT IF EXISTS workout_templates_name_key;
ALTER TABLE workout_templates ADD CONSTRAINT workout_templates_name_key UNIQUE (name);

ALTER TABLE workout_templates DROP COLUMN IF EXISTS phase;
ALTER TABLE workout_templates DROP COLUMN IF EXISTS category;

-- ─── Migration 016: All trainers can manage any client's assigned workouts ──
-- Previously each policy restricted to trainer_id = auth.uid() (the assigning
-- trainer only). Now any authenticated trainer can read, edit, and complete any
-- client's assigned workout, enabling cross-trainer collaboration.

DROP POLICY IF EXISTS "trainer_all_assigned_workouts"   ON assigned_workouts;
DROP POLICY IF EXISTS "trainer_all_assigned_exercises"  ON assigned_workout_exercises;
DROP POLICY IF EXISTS "trainer_all_assigned_sets"       ON assigned_workout_sets;

-- Any trainer: full CRUD on all assigned workouts
CREATE POLICY "any_trainer_all_assigned_workouts" ON assigned_workouts
  FOR ALL USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "any_trainer_all_assigned_exercises" ON assigned_workout_exercises
  FOR ALL USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "any_trainer_all_assigned_sets" ON assigned_workout_sets
  FOR ALL USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ─── Migration 017: client self-link RPC ──────────────────────────
-- The UPDATE policies on clients require auth.uid() = auth_user_id, but at
-- signup time auth_user_id IS NULL so the check is always false — the update
-- silently fails.  This SECURITY DEFINER function runs as the DB owner and can
-- write auth_user_id directly.  It only touches unlinked rows matching the
-- caller's own email, so it cannot be abused to claim someone else's row.
CREATE OR REPLACE FUNCTION link_client_to_auth_user()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email   TEXT;
  v_id      UUID;
BEGIN
  -- Resolve the caller's email from auth.users (lowercased for case-insensitive matching)
  SELECT LOWER(email) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find an unlinked client row for this email (case-insensitive)
  SELECT id INTO v_id
  FROM clients
  WHERE LOWER(email) = v_email
    AND auth_user_id IS NULL
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE clients
  SET auth_user_id = auth.uid()
  WHERE id = v_id
    AND auth_user_id IS NULL;

  RETURN v_id;
END;
$$;

-- ─── Migration 014: Populate form_notes for all exercises ─────────────────────
-- Adds detailed coaching cues to every exercise in the library.
-- form_notes column already exists (added in migration 009).

UPDATE exercises SET form_notes = 'Stand feet shoulder-width apart, toes slightly out. Push hips back and down, keeping chest tall. Drive knees out over toes. Reach depth where hip crease passes below knee. Stand through heels, squeezing glutes at top.'
WHERE id = '6766b3a5-293c-438e-bbe4-e2e946b4a16d'; -- Air Squat

UPDATE exercises SET form_notes = 'Stand or sit with dumbbells at sides, palms facing in. Curl one arm up keeping elbow pinned to side. Lower slowly with control. Alternate arms each rep. Keep wrists neutral throughout — do not rotate to supinate.'
WHERE id = '0cf918e5-18dd-448c-962c-5acba7da0151'; -- Alternate Hammer Curl

UPDATE exercises SET form_notes = 'Hinge at hips with soft knees and flat back. Brace core. Row one kettlebell to hip, driving elbow back and up. Lower with control. Alternate sides each rep. Avoid twisting or rotating the torso.'
WHERE id = '9ff32d08-fab2-4657-a276-094f335e0b7d'; -- Alternating Kettlebell Row

UPDATE exercises SET form_notes = 'Hold med ball at chest, feet shoulder-width. Squat to depth, then explosively stand and toss ball overhead or to a partner. Receive ball with soft, bent knees. Core braced throughout. Reset before each rep.'
WHERE id = '6ca47d6e-e9fa-4595-9892-281633b47a5e'; -- Ball Squat Toss

UPDATE exercises SET form_notes = 'Stand with underhand grip slightly wider than hip-width. Pin elbows firmly to sides throughout the movement. Curl bar to shoulder height. Squeeze biceps hard at top. Lower slowly to full extension over 3 seconds. Avoid swinging the torso.'
WHERE id = '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707'; -- Barbell Curl

UPDATE exercises SET form_notes = 'Hinge forward ~45° with flat back, overhand grip just outside shoulder-width. Pull bar to lower chest or navel, driving elbows straight back. Squeeze shoulder blades together at the top. Lower with control. Keep spine neutral throughout.'
WHERE id = 'fff3711b-38a4-487e-93d0-7c52efdbe890'; -- Barbell Row

UPDATE exercises SET form_notes = 'Start on all fours with knees hovering 1 inch off the ground. Move opposite hand and foot forward simultaneously. Keep hips level with shoulders — no side-to-side rocking. Core tight, take short controlled steps. Eyes look down.'
WHERE id = 'd8ce097b-5caf-49ae-88d6-2e80bdadafe3'; -- Bear Crawl

UPDATE exercises SET form_notes = 'Lie on bench with feet flat on floor. Grip bar just outside shoulder-width, wrists stacked directly over elbows. Lower bar to mid-chest under control. Press to full extension. Maintain a slight arch, keep shoulder blades retracted and depressed throughout.'
WHERE id = '2fa2d1d3-4ea2-420a-a514-fd0800e0d90f'; -- Bench Press

UPDATE exercises SET form_notes = 'Stand beside or behind a bench. Alternately step or hop feet on and off the bench surface as fast as possible. Stay on balls of feet. Drive arms in opposition. Keep core braced and torso upright.'
WHERE id = 'ad5739d0-0cf0-4850-8d38-10888a207ec2'; -- Bench Sprint

UPDATE exercises SET form_notes = 'Stand with dumbbells, palms facing forward. Pin elbows at sides. Curl both arms to shoulder height. Squeeze biceps hard at top. Lower with a 3-second eccentric. Avoid shrugging shoulders or rocking the torso to generate momentum.'
WHERE id = '943d0c35-70bf-4fb3-993e-69782f63aee7'; -- Bicep Curls

UPDATE exercises SET form_notes = 'Lie on back, hands lightly behind head (do not pull on neck). Bring opposite elbow to opposite knee as you extend the other leg low. Achieve full trunk rotation at the top. Move slow and controlled — do not rush or use momentum.'
WHERE id = 'e42fbdc9-2ae5-4813-9df9-1947777346f4'; -- Bicycle Crunches

UPDATE exercises SET form_notes = 'Sit on edge of box, hands beside hips with fingers forward. Walk feet out in front. Lower body until upper arms are parallel to floor — do not go deeper. Press through palms to full arm extension. Keep back close to the box throughout.'
WHERE id = '85d962a1-5274-4089-a627-624e783a81c2'; -- Box Dips (Assist)

UPDATE exercises SET form_notes = 'Stand facing box at hip-width stance. Load hips by swinging arms back into a quarter squat. Explode up and land softly on the box with both feet — absorb the landing with bent knees. Stand fully tall, then step (do not jump) back down to reset.'
WHERE id = '57854382-962e-41d6-9c02-09fe7de709fa'; -- Box Jump

UPDATE exercises SET form_notes = 'Set box height at or just below parallel. Sit back onto the box by pushing hips back, not straight down. Touch the box briefly without rocking or relaxing, then drive through heels to stand. Keep chest tall and knees tracking over toes throughout.'
WHERE id = 'b6e39f07-c69d-4a85-8d00-114466ab6e12'; -- Box Squat

UPDATE exercises SET form_notes = 'Step one foot fully onto the box and press through the heel to stand completely upright. Lower the trailing leg under control — do not drop it. Avoid pushing off the floor with the trailing foot. Complete all reps on one leg before switching.'
WHERE id = '2a6c163b-5e09-4f99-8d26-805e3dfabe8e'; -- Box Step-ups

UPDATE exercises SET form_notes = 'Place dumbbells on floor shoulder-width apart. Jump or step feet back to plank, perform a push-up, jump feet forward to between dumbbells, stand and press DBs overhead. Keep core tight throughout. Land softly. Do not round the lower back when hinging.'
WHERE id = '2da0485e-39b8-4bc6-98b5-e6965aa1d947'; -- Burpee DB Press

UPDATE exercises SET form_notes = 'Stand tall, place hands on floor, jump or step feet back to plank. Perform a push-up (optional). Jump feet back to hands, then jump up explosively with arms overhead. Move fast but maintain control. Land on balls of feet with soft knees.'
WHERE id = '5af004e8-94b3-4cbb-9b0e-df6ca4b28963'; -- Burpees

UPDATE exercises SET form_notes = 'Run in place, driving heels up rapidly toward glutes. Stay on balls of feet throughout. Swing arms in opposition to legs. Keep torso upright and core lightly engaged. Perform at the pace prescribed — typically used as a warm-up or cardio drill.'
WHERE id = '1864aeec-79c9-4c11-84c2-1042e3878e09'; -- Butt Kicks (s)

UPDATE exercises SET form_notes = 'Lie face down on the hyperextension bench, feet secured. Hinge at the hip — not the lower back. Raise torso until it reaches neutral spine alignment — do not hyperextend past parallel. Squeeze glutes at the top. Slow, controlled descent each rep.'
WHERE id = '9357fd37-c9af-4342-b0d8-5bcab3f6a576'; -- BW Back Extensions

UPDATE exercises SET form_notes = 'Kneel facing the cable stack with a rope attachment at the high pulley. Hold the rope beside your ears. Flex the spine by crunching ribs toward pelvis — do not pull with the arms or flex at the hips. Squeeze abs at the bottom. Slow eccentric return.'
WHERE id = '45de9606-18c3-4500-9a28-cdf440454d51'; -- Cable Crunch

UPDATE exercises SET form_notes = 'Set pulley at forehead height using a rope attachment. Pull rope to face with elbows high and flaring out wide. Separate hands at your cheeks. At end position rotate forearms back — thumbs behind ears. Squeeze rear delts and external rotators. Slow return. Excellent for shoulder health.'
WHERE id = 'f6f05350-3435-48ba-af10-d377d0c08941'; -- Cable Face Pulls

UPDATE exercises SET form_notes = 'Set pulleys at shoulder height. Stand with a slight forward lean at the hips. Keep elbows slightly bent throughout. Arc arms together in front of chest. Squeeze pecs hard at midpoint — pause briefly. Slow controlled return to full stretch. Do not lock elbows.'
WHERE id = 'b3cf51a0-28e6-4669-8764-384cd46702fc'; -- Cable Fly

UPDATE exercises SET form_notes = 'Stand or kneel below a high pulley with a straight bar or rope attachment. Keep arms slightly bent. Hinge from the shoulder — not the elbow. Pull the bar in an arc down and back to the hip. Feel the lat stretch at the top. Keep core braced.'
WHERE id = 'e54ceba1-10c3-45a1-871f-e432d8fd1467'; -- cable pullover (lowercase)

UPDATE exercises SET form_notes = 'Stand or kneel below a high pulley with a straight bar or rope attachment. Keep arms slightly bent. Pull the bar in an arc from overhead to the hip, squeezing lats at the bottom. Slow return to full overhead stretch. Avoid bending excessively at the elbows.'
WHERE id = 'd8f7ec36-03ff-411d-a9b4-ed64773a3845'; -- Cable Pullover

UPDATE exercises SET form_notes = 'Attach handle to low pulley. Hold with both hands and step back to create tension. Sit into a squat simultaneously with the row — legs and back extend together to standing. Pull handle to lower chest. Avoid leaning back excessively at the top.'
WHERE id = 'fd61b1ba-c236-4e99-8e02-cf48b6517ba4'; -- Cable Squat Row

UPDATE exercises SET form_notes = 'Set pulley at shoulder height. Stand perpendicular to the cable stack. Extend arms forward holding the handle. Rotate away from the cable using core — not the arms or lower back. Hips stay squared forward. Control the return slowly. Repeat and switch sides.'
WHERE id = '7414faf7-5b3d-4516-b547-402aef80f6cb'; -- Cable Torso Rotations

UPDATE exercises SET form_notes = 'Set pulley at a high position (chop down) or low position (chop up). Grip the handle with both hands. Rotate diagonally across your body with arms extended. Movement comes from the core rotation — hips pivot but stay controlled. Slow controlled return each rep.'
WHERE id = 'b1254d46-2f3a-4be9-a649-cfbc86c40e71'; -- Cable Woodchops

UPDATE exercises SET form_notes = 'Attach low cable or band to wrist or handle. Raise arm out to the side to shoulder height with a slight elbow bend. Lead with the elbow, not the wrist — imagine pouring a cup. Pause at top. Slow controlled lowering over 3 seconds. Do not shrug the shoulder.'
WHERE id = 'f13a998b-eb1a-4455-9105-33250861b7a1'; -- Cable/Band Lateral Raise

UPDATE exercises SET form_notes = 'Stand on the edge of a step with heels hanging off. Lower heels fully below step level to get a full Achilles stretch. Press up onto toes through the big toe. Hold the top contraction for 1 second. Full range of motion every rep. Single-leg variation increases difficulty significantly.'
WHERE id = 'e89a3b3a-1f94-45b6-b8ac-a04051d6e3fe'; -- Calf Raise

UPDATE exercises SET form_notes = 'On a decline bench or board, perform crunches straight up — no rotation. Keep hands lightly behind head (do not pull). Crunch ribs toward pelvis using the upper abs. Lower under control. Feet secured throughout. Keep movement strict and slow.'
WHERE id = 'eb1d1628-615c-42d2-b565-922f635fa96f'; -- Center Decline

UPDATE exercises SET form_notes = 'Stand facing a wall or partner, feet shoulder-width. Hold the ball at chest height with elbows out. Push the ball explosively by extending arms fully. Receive with soft, yielding arms. Keep core braced throughout. Increase distance to emphasize power output.'
WHERE id = '546e0d13-6653-4d60-a113-a094fc6e1c97'; -- Chest Pass (Med Ball)

UPDATE exercises SET form_notes = 'Use an underhand shoulder-width grip. Get to the top position using a box or band assist. Lower your body as slowly as possible — aim for 5 or more seconds on the way down. Step back up and repeat. Builds the pulling strength required for full chin-ups.'
WHERE id = 'd28bad1f-9317-4fe5-8af9-c30d4f5a25ac'; -- Chin-up Negatives

UPDATE exercises SET form_notes = 'Lie face down with hands under shoulders. Press your chest up using your arms while keeping hips on the floor. Do not squeeze glutes or tuck pelvis. Hold 2–3 seconds at the top. Breathe into the stretch. Do not force range beyond comfort — this is a mobility drill.'
WHERE id = '6cbdef15-f16c-43b0-b382-439659baf9dc'; -- Cobra Stretch

UPDATE exercises SET form_notes = 'Sit on the floor with hands behind you, fingers pointing forward, and feet flat. Lift hips off the floor. Move forward, backward, or laterally by moving opposite hands and feet simultaneously. Keep hips level and raised. Core engaged throughout.'
WHERE id = '12629028-b516-4911-ba6c-6bd9dd9f3b1a'; -- Crab Walk

UPDATE exercises SET form_notes = 'Lie on back with knees bent and feet flat on floor. Cross arms on chest or rest fingertips lightly at temples. Flex the spine by lifting shoulder blades off the floor — this is not a full sit-up. Exhale on the way up. Controlled lowering each rep.'
WHERE id = 'bb8a0810-ec61-4c99-a113-d7bb8798a6a0'; -- Crunch

UPDATE exercises SET form_notes = 'Maintain an upright posture on the stationary bike. Adjust the seat height so there is a slight bend in the knee at the bottom of the pedal stroke. Engage core, relax shoulders. Set resistance and cadence per trainer prescription.'
WHERE id = '7bc2f8b9-d78d-4b23-b155-37cc23187b10'; -- Cycling

UPDATE exercises SET form_notes = 'Follow the prescribed push-day sequence for this training block. Typically includes horizontal pressing (bench/DB press) and vertical pressing (overhead press) movements. Focus on full range of motion and controlled tempo with progressive overload over time.'
WHERE id = '1804af5b-0324-4a07-88d1-5d2710aaa75d'; -- Day 1 Push

UPDATE exercises SET form_notes = 'Lie on bench with feet flat on floor. Press dumbbells from shoulder level to full extension over the chest. Control the descent over 2–3 seconds. Keep shoulder blades retracted and depressed throughout. Do not let dumbbells drift over the face or stomach.'
WHERE id = 'bcd106ef-4d81-4360-8d5d-096f8d712a25'; -- DB Bench Press

UPDATE exercises SET form_notes = 'Hold a dumbbell vertically at chest height, elbows pointing down. Feet slightly wider than hip-width, toes turned out. Squat as deep as range allows — elbows inside knees at the bottom helps maintain an upright torso. Drive through heels to stand.'
WHERE id = '065a0722-2eb1-4a19-81f0-7d9f0cf918a4'; -- DB Goblet Squat

UPDATE exercises SET form_notes = 'Set bench to 30–45°. Press dumbbells from shoulder level to full extension. Control the descent with a slight pause at the bottom. Do not let elbows drop below the bench level. Shoulder blades pinched together and depressed throughout.'
WHERE id = '3153bf6c-a798-47b4-87eb-92b2fb654c99'; -- DB Incline Press

UPDATE exercises SET form_notes = 'Stand or sit with dumbbells at shoulder height, palms facing forward. Press overhead to full extension — avoid fully locking out elbows. Core braced throughout. Do not arch lower back. Lower with control back to start. Keep wrists stacked over elbows.'
WHERE id = 'e4f70e4e-b998-4289-b2ba-8fd80d1d386e'; -- DB Overhead Press

UPDATE exercises SET form_notes = 'Start in a push-up position with hands on dumbbells at shoulder-width. Row one dumbbell to the hip while keeping the hips perfectly square to the floor — no rotation. Lower with control and repeat on the other side. An optional push-up between rows adds difficulty.'
WHERE id = '8996206f-c166-4c1a-b6b2-7c5228fc6a1f'; -- DB Renegade Row

UPDATE exercises SET form_notes = 'Stand in a split stance with one foot forward. Lower the back knee toward the floor while keeping the front shin vertical. Drive through the front heel to stand. Keep torso upright. Complete all prescribed reps on one side before switching. Rear foot may be elevated for more difficulty.'
WHERE id = 'fb082ab1-e28e-4c32-bd10-c9bb21d23503'; -- DB Split Squat

UPDATE exercises SET form_notes = 'Hold dumbbells at sides. Step one foot fully onto the elevated surface and press through the heel to stand upright. Step back down under control. Keep the knee tracking over the toes throughout. Avoid pushing off with the back foot. Complete all reps one side then switch.'
WHERE id = '1ee110eb-9d11-442a-bacb-c06c4412dd13'; -- DB Step-ups

UPDATE exercises SET form_notes = 'Lie on back with arms extended to ceiling holding a light weight. Press lower back firmly into the floor. Lower the opposite arm and leg simultaneously toward the floor, keeping lower back pressed down. Return and alternate. Core stays braced — do not let the back arch off the floor.'
WHERE id = 'b664e58f-b1b8-400f-b3b0-4be5f9d7339a'; -- Deadbug (Weighted)

UPDATE exercises SET form_notes = 'Lie on back with arms straight to ceiling and knees at 90°. Press lower back flat into the floor. Lower the opposite arm and leg toward the floor simultaneously while maintaining that flat lower back. Return and alternate. Breathe out as you lower. Core is the sole focus.'
WHERE id = '7484fdbf-c56e-4a23-b291-efb688ed9136'; -- Deadbugs

UPDATE exercises SET form_notes = 'Stand with bar over mid-foot, hip-width stance. Hinge and grip just outside shins. Drive chest tall and brace core hard before initiating the lift. Push the floor away — bar stays in contact with the legs. Hips and shoulders rise at the same rate. Lock out fully at the top. Hinge back with control on the descent.'
WHERE id = '300ee56b-df67-4e5e-aff8-51ce6416e171'; -- Deadlift

UPDATE exercises SET form_notes = 'Set bench to 15–30° decline. Press dumbbells from chest level to full extension. Control the descent. The decline angle targets the lower pecs. Shoulder blades remain retracted throughout. Secure feet on footpad before un-racking.'
WHERE id = '45d918fa-d696-48ae-9554-89761ec98837'; -- decline DB press

UPDATE exercises SET form_notes = 'Set bench to a decline angle. Lower barbell or dumbbells to the lower chest with control. Press to full extension. Keep feet secured on the footpads. Control the descent — especially at the bottom of the range where shoulders are most vulnerable.'
WHERE id = '2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3'; -- decline press

UPDATE exercises SET form_notes = 'Secure feet on decline bench. Lean back to roughly 45°. Hold a weight at your chest or extended in front. Rotate side to side, bringing weight near the floor on each side. Control the speed — this is a core rotation movement, not a momentum swing.'
WHERE id = 'cf95ab21-d763-4b59-a32c-2bae48a03a1c'; -- Decline Russian Twists

UPDATE exercises SET form_notes = 'Secure feet on the decline board. Lower your torso fully back toward the board, then curl up to a full upright sit. Hands across chest or behind head — do not pull the neck. Engage abs throughout. Full range of motion every rep.'
WHERE id = 'ecb029d5-ea2f-425a-8782-f42df8abc9fb'; -- decline situp

UPDATE exercises SET form_notes = 'Diamond: place thumbs and forefingers together to form a diamond shape directly under your chest. Perform the prescribed set of push-ups, then immediately transition to a wide-grip push-up position. Diamond targets triceps; wide targets outer chest. Full chest-to-floor range each rep.'
WHERE id = '77f163e9-432b-46d0-b862-11a98e9e9f4a'; -- Diamond + Wide Pushups

UPDATE exercises SET form_notes = 'Grip the dip bars with arms straight. Lean forward slightly for chest emphasis; stay upright for more tricep focus. Lower until elbows reach approximately 90°. Press back up avoiding full lockout. Keep core braced. Do not shrug shoulders at the top.'
WHERE id = 'd405ed82-6a39-4013-ac8c-7a4ada1a4f5d'; -- Dips

UPDATE exercises SET form_notes = 'Superset: perform dips first then immediately transition to band flyes with minimal rest. Dips: lean forward, lower to 90°, press up (see Dips). Band flyes: slight elbow bend, arc arms wide apart then squeeze together at chest height. Feel full pec stretch on the fly.'
WHERE id = 'a2ccc581-cdd3-46fa-9d7b-71aee49f2aba'; -- Dips/Band Flyes

UPDATE exercises SET form_notes = 'Set cable at forehead height using a rope or two-handle attachment. Pull to the face with elbows high and wide. At end position, rotate the forearms back so thumbs point behind your ears. Squeeze rear delts and rotator cuff muscles. Slow controlled return. Excellent for shoulder health and posture.'
WHERE id = 'bbf96dcd-7134-4afb-bd56-5ccd28737a24'; -- Face Pull

UPDATE exercises SET form_notes = 'Hold heavy dumbbells or kettlebells at your sides. Stand tall — shoulders pulled back, core braced, chin level, gaze forward. Walk with controlled, deliberate steps. Do not lean side to side. Breathe steadily. Turn at the end slowly and carefully to protect the spine.'
WHERE id = '18be71da-bf4e-459d-9a6c-d58432d5f1ab'; -- Farmer''s Walk

UPDATE exercises SET form_notes = 'Lie flat on a bench holding dumbbells. Press from chest level to full extension overhead. Control the descent with a 2–3 second lowering. Keep shoulder blades retracted and depressed. Do not let dumbbells drift over the face. Wrists stay neutral.'
WHERE id = '2be4ff68-fb19-42cc-afbf-beee30488728'; -- flat bench

UPDATE exercises SET form_notes = 'Lie flat on bench with feet on the floor. Grip barbell slightly wider than shoulder-width. Lower to mid-chest under control — 2–3 seconds down. Press to full extension. Maintain slight arch in lower back. Bar path traces a slight diagonal, not straight up. Shoulder blades retracted and depressed throughout.'
WHERE id = '607f9637-4ba5-48cc-8034-736b22b5d04e'; -- flat bench press

UPDATE exercises SET form_notes = 'Superset. Floor press: lie on back on floor, press dumbbells from the floor (elbows at ground) up to extension — the floor limits range and reduces shoulder strain. Follow immediately with modified push-ups from the knees. Full range throughout both movements.'
WHERE id = '99f25f33-e9a2-42ad-a230-7fab43488a11'; -- Floor Press + Mod Push-up

UPDATE exercises SET form_notes = 'Lie on back with hands flat under your glutes. Raise both legs 6 inches off the floor. Alternately kick one leg up while the other lowers in small rapid movements. Press lower back firmly into floor throughout. Breathe steadily. Do not let either foot touch the floor during the set.'
WHERE id = 'c83f6c93-4404-4b34-8956-23d07f7d0f20'; -- Flutter Kicks

UPDATE exercises SET form_notes = 'Single or double-leg hop in place. Stay on the balls of your feet. Land softly with a slight knee bend to absorb force through the hips and ankles. Maintain an upright posture and forward gaze. Excellent for ankle stability, proprioception, and coordination.'
WHERE id = 'd124b685-a77e-44c1-ae80-b39e94bf60d0'; -- Foot Hop

UPDATE exercises SET form_notes = 'Stand in an athletic stance. Load the hips into a slight squat, swing arms back. Leap as far forward as possible with full effort. Land softly with bent knees, absorbing through the hips. Stick the landing for a moment before resetting. This is a power exercise — full explosive effort every rep.'
WHERE id = 'fa1381de-be3e-44f5-a7bb-d7b12abdf552'; -- Forward Leap

UPDATE exercises SET form_notes = 'Lie on back with knees bent and feet flat, hip-width apart. Press through heels, driving hips toward the ceiling. Squeeze glutes hard at the top — avoid over-arching the lower back. Hold for 1–2 seconds. Lower slowly with control. Do not let knees cave inward.'
WHERE id = '08e94c1d-f306-4734-9610-387b5626b503'; -- Glute Bridge

UPDATE exercises SET form_notes = 'Set up the same as a Glute Bridge. Drive hips to the top and hold the elevated position. Perform small rapid pulses at the top, contracting the glutes harder with each pulse. Maintain bridge height throughout — do not let hips drop between pulses. Perform 20–30 pulses per set.'
WHERE id = '8d897c23-bfc5-45f3-ab5b-4d3792224a63'; -- Glute Bridge (Pulsing)

UPDATE exercises SET form_notes = 'Drive hips into the full Glute Bridge top position. Hold isometrically for the prescribed time. Core braced, glutes firmly squeezed, knees hip-width apart. Do not let hips sag. Breathe normally throughout the hold. Focus on maintaining glute contraction, not lower back extension.'
WHERE id = 'c7c8c551-9b6a-422c-999f-5e44afa14afe'; -- Glute Bridge Hold

UPDATE exercises SET form_notes = 'Hold a dumbbell vertically at chest height. Step out wide to one side, bending that knee and sitting into a lateral squat. Keep the trailing leg straight and both feet flat on the floor with toes pointing forward. Push off the bent leg to return to standing. Alternate sides each rep.'
WHERE id = '67c1a3ca-078a-4c75-8b65-9d53463579e6'; -- Goblet Lateral Lunge

UPDATE exercises SET form_notes = 'Stand with dumbbells at your sides, palms facing each other (neutral grip). Curl both or alternating arms keeping wrists neutral throughout — do not rotate to supinate at the top. Pin the elbow at the side. Targets the brachialis and brachioradialis muscles. Slow 3-second eccentric on the way down.'
WHERE id = '8aed8c66-0166-490d-9a1b-a18c0b50e68b'; -- Hammer Curl

UPDATE exercises SET form_notes = 'Adjust the machine so the ankle pad sits just above the heels. Lie face down (or sit, depending on machine type). Curl heels toward glutes through the full range of motion. Squeeze hamstrings at peak contraction. Slow 3–4 second eccentric. Keep hips pressed into the pad throughout.'
WHERE id = 'dd429076-07dc-48c4-8661-2971840c4090'; -- Hamstring curl (lowercase)

UPDATE exercises SET form_notes = 'Adjust the lever pad so it sits just above the heels. Press hips firmly into the pad. Curl heels toward glutes through the full range. Squeeze at peak contraction for 1 second. Lower slowly and fully — 3–4 second eccentric. Avoid lifting hips or swinging to generate momentum.'
WHERE id = '6d0fcc06-23dc-4dd1-bf76-60cfb8726416'; -- Hamstring Curl

UPDATE exercises SET form_notes = 'Hang from a pull-up bar with arms fully extended. Brace core and tilt the pelvis posteriorly (tuck). Raise straight or bent legs until parallel to the floor or higher. Lower with control — avoid swinging or using momentum. The posterior pelvic tilt is key to targeting abs over hip flexors.'
WHERE id = '143eff06-5ce2-4a69-9191-2686cc9b90b7'; -- Hanging Leg Raises

UPDATE exercises SET form_notes = 'Run in place, driving knees up to hip height as rapidly as possible. Stay on balls of feet. Pump arms in opposition to the legs. Keep torso upright and core lightly braced. Maintain the prescribed speed — typically used as a cardio or warm-up drill.'
WHERE id = '2106002e-fdc9-4285-a701-91fb8b6fa35f'; -- High Knees (s)

UPDATE exercises SET form_notes = 'Stand or sit facing a cable machine or high-pulley row. Pull handles to upper chest or clavicle level with elbows flaring wide. Squeeze upper traps and rear delts at the end position. Control the return. Upright posture throughout — do not lean back.'
WHERE id = '96d2129b-2b8b-4284-b565-146fef29e5a3'; -- high row

UPDATE exercises SET form_notes = 'Stand with hands on hips or extended for balance. Draw large circles with the hips, rotating through the full range of motion. Perform the prescribed number of rotations in each direction. Move slowly and deliberately. Excellent hip mobility warm-up drill.'
WHERE id = '18643250-2fc2-4d8a-9d5c-8d5175c18a67'; -- Hip Circles

UPDATE exercises SET form_notes = 'Athletic stance. Push off one foot to bound laterally, landing on the opposite foot in a slight squat. Reach the opposite hand down toward the landing foot for balance. Quick and rhythmic. Stay low throughout. This movement builds lateral power, agility, and single-leg stability.'
WHERE id = '248244d3-4ba6-4f58-9772-1b5c0d15472e'; -- Ice Skater Steps

UPDATE exercises SET form_notes = 'Start with feet together. Jump feet out wide then back in. Add an overhead arm raise simultaneously if prescribed. Stay on balls of feet. Rhythmic and light. Great as a warm-up or active recovery drill. Maintain upright posture throughout.'
WHERE id = 'be3a9444-ec1d-4e35-9ba3-f0dfa03d040d'; -- In-Out Jumping Jacks

UPDATE exercises SET form_notes = 'Stand tall with feet together. Hinge forward and place hands on the floor. Walk hands out to a full push-up position — keep legs as straight as possible. Perform a push-up. Walk hands back toward feet. Stand. Keep core engaged throughout and move smoothly without rushing.'
WHERE id = 'c8fca4fc-caa2-4753-9639-4ee7c8d6b945'; -- Inchworm Push-Up

UPDATE exercises SET form_notes = 'Set bench to 30–45°. Lower barbell to upper chest or clavicle level under control. Press to full extension. The incline angle targets the upper pec and anterior delt. Keep shoulder blades pinched and depressed throughout. Elbows should be at approximately 75° from the torso — not flared out 90°.'
WHERE id = 'ef3cb3d8-f697-463a-b77e-a4692e2c9c01'; -- Incline Bench Press

UPDATE exercises SET form_notes = 'Place hands on an elevated surface — bench or box. Body forms a straight diagonal line from head to heels. Lower chest to the surface under control. Press through the palm heels back to full extension. Easier than a standard push-up. Good regression for building pressing strength and chest awareness.'
WHERE id = '1b051178-b5a1-4122-8235-cad6594e81fe'; -- Incline Push-up

UPDATE exercises SET form_notes = 'Sit tall at the seated row station. Slight forward lean to start. Pull the handle to lower chest or navel, squeezing the shoulder blades together and feeling the lats engage. Slow eccentric — 3–4 seconds back to full extension. No swinging or rocking. Focus on isolating the back, not the biceps.'
WHERE id = '38d791b3-ce58-42e0-a1fb-445e0f5bd0f3'; -- isolated seated row

UPDATE exercises SET form_notes = 'Stay on the balls of your feet with small, light jumps — just enough clearance for the rope. The wrists do the work; keep elbows close to the sides. Upright posture with a slight forward gaze. Start slow and build rhythm and speed. Double-unders require a larger jump and faster wrist rotation.'
WHERE id = '2d62e96f-48b0-442a-9e47-cc402cf59e94'; -- Jump Rope

UPDATE exercises SET form_notes = 'Stand shoulder-width apart. Squat to parallel, then explode up leaving the floor. Swing arms for added momentum. Land softly with bent knees, absorbing force through the hips. Immediately load into the next rep. Lower impact than box jumps. Keep core tight on every landing.'
WHERE id = '4e62211d-c7e3-46ec-89f1-bed8b48972fe'; -- Jump Squats

UPDATE exercises SET form_notes = 'Start with feet together. Jump feet out to shoulder-width while raising arms overhead simultaneously. Jump back to start. Stay on balls of feet throughout. Keep a light, rhythmic bounce. Core lightly engaged. Used primarily as a warm-up or light cardio movement.'
WHERE id = '68c4185e-06bb-4c36-b162-bfb91d93b987'; -- Jumping Jacks (s)

UPDATE exercises SET form_notes = 'Place kettlebell between feet, hip-width stance. Hinge at hips with soft knees — do not squat the movement. Grip the handle, drive your chest tall and brace core. Push the floor away, keeping the KB close to the body. Lock out hips and knees at the top. Hinge back and lower with control.'
WHERE id = '3e1a074f-5da1-49f8-9f44-3178d9747a04'; -- KB Deadlift

UPDATE exercises SET form_notes = 'Hang from a bar or use the captain''s chair. Brace core and tilt pelvis posteriorly. Draw knees up toward the chest. Lower under control — do not swing or drop them. Posterior pelvic tilt is essential to target the abs rather than the hip flexors. Progress to straight-leg raises over time.'
WHERE id = '73392c4a-fd48-440b-94dd-22e66616b11f'; -- knee raises

UPDATE exercises SET form_notes = 'Hang from a pull-up bar. Draw knees up explosively while simultaneously driving elbows toward the knees. Achieve full compression — knees to chest — at the top. Lower under control. More demanding hip flexion than a standard knee raise. Avoid swinging for momentum.'
WHERE id = '31152657-723a-4b30-8262-38d842dcaa2d'; -- Knee to Elbows

UPDATE exercises SET form_notes = 'Hang from a bar or use the captain''s chair arm supports. Raise knees (bent) or legs (straight) to hip height or above. Apply a posterior pelvic tilt to activate the abs over the hip flexors. Lower slowly — do not drop. Progress from bent-knee to straight-leg as strength increases.'
WHERE id = '69a4bf0e-0e20-4b65-b3cc-9882a3309062'; -- Knee/Leg Raises

UPDATE exercises SET form_notes = 'Load one end of a barbell into a landmine attachment or a corner. Core is the primary stabilizer for all landmine variations. Keep back neutral and brace before each rep. Move through the prescribed pattern — press, row, or rotation — with full control. Do not let the spine flex under load.'
WHERE id = '8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8'; -- Landmine

UPDATE exercises SET form_notes = 'Load barbell into landmine. Grip the end with both hands, arms extended in front at hip or waist height. Rotate the bar in an arc side to side. Keep arms relatively straight — rotation comes from the core. Pivot the trail foot on each rotation. Control the arc on the way back in.'
WHERE id = 'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b'; -- Landmine Rotation

UPDATE exercises SET form_notes = 'Sit with thighs secured under the knee pad. Grip bar wider than shoulder-width, overhand. Lean back very slightly. Pull bar down to upper chest by driving elbows down and back. Squeeze lats at the bottom. Slow, controlled return to full arm extension. Do not lean back excessively or use momentum.'
WHERE id = '07f6c3d0-1757-4f0c-8e81-d3629fb35b9b'; -- Lat Pulldown

UPDATE exercises SET form_notes = 'Push off one foot laterally, landing on the opposite foot in a slight single-leg squat. Absorb the landing through the hip — stick it before bounding back. Stay athletic and low. Explosive movement — this builds lateral power and single-leg landing stability.'
WHERE id = '4bc16b71-dffb-4876-ad09-44b6011b9cbb'; -- Lateral Bounds

UPDATE exercises SET form_notes = 'Stand tall. Step wide to one side, bending that knee and sitting back into a lateral squat. Keep the trailing leg straight. Both feet remain flat on the floor with toes pointing forward or slightly out. Drive back through the bent leg to return. Great for adductors and hip mobility.'
WHERE id = '21203646-8186-4017-916a-258936ec8d13'; -- Lateral Lunge

UPDATE exercises SET form_notes = 'Stand with dumbbells at sides. Maintain a slight bend in the elbows throughout. Raise both arms out to shoulder height, leading with the elbows — imagine pouring a cup at the top. Pause briefly. Lower slowly over 3 seconds. Do not shrug. A slight torso lean forward better isolates the lateral delt.'
WHERE id = '15024e35-53be-4f6c-8641-ef99ef0d5783'; -- Lateral Raise

UPDATE exercises SET form_notes = 'Lie face down in the leg curl machine. Position ankle pad just above the heels. Keep hips pressed firmly into the pad throughout. Curl heels toward glutes through the full range. Squeeze hamstrings at peak contraction for 1 second. Lower with a 3-second eccentric. Keep toes in a neutral position.'
WHERE id = '544f52ca-98f1-48d9-9a8d-fa7f12e05735'; -- Leg Curl

UPDATE exercises SET form_notes = 'Sit in the leg extension machine. Position the ankle pad just above the top of the feet. Extend legs to nearly straight — avoid aggressively locking out the knee. Squeeze the quads hard at the top. Lower with a slow 3-second count. Adjust the seat pivot point to align with the knee joint.'
WHERE id = '71df72e3-8ced-4795-a005-b7a7671b04d8'; -- leg extension (lowercase)

UPDATE exercises SET form_notes = 'Sit in the leg extension machine with the shin pad just above the ankles. Extend to a soft lockout — do not hyperextend. Squeeze quads isometrically at the top for 1 second. Lower with a 3-second controlled count. Keep back against the pad throughout.'
WHERE id = 'c895caaf-b8d5-4aed-807c-4cc2b1e226e1'; -- Leg Extension

UPDATE exercises SET form_notes = 'Load the platform. Position feet hip-width apart at mid-height on the platform. Lower the platform until knees reach 90° — do not let the lower back curl off the pad. Press through the heels. Do not fully lock out knees at the top. Foot position affects emphasis: higher feet = glutes, lower feet = quads.'
WHERE id = '412295da-9c4c-4be5-9912-ec06c1a2ad5c'; -- Leg Press

UPDATE exercises SET form_notes = 'Circuit or superset combining leg press with isolation machines such as leg curl and leg extension. Perform leg press first, then move immediately to the machine with minimal rest. This comprehensively targets quads, hamstrings, and supporting leg muscles in one efficient sequence.'
WHERE id = '96cbdbec-8e99-4147-aa3a-846681eb2954'; -- Leg Press + Leg Machines

UPDATE exercises SET form_notes = 'Hold a med ball. Step into a lunge position. At the bottom of the lunge, throw the ball against a wall or to a partner — either with a rotation or an overhead press pattern. Receive the ball with soft arms. Stand, reset, and repeat. Combines lower body strength with upper body power and coordination.'
WHERE id = 'b962ea3d-5055-40f6-a951-7d1b59731133'; -- Lunge Ball Throw

UPDATE exercises SET form_notes = 'Step forward into a lunge. At the bottom position, rotate the torso toward the front leg with arms extended or holding weight. Rotation comes from the thoracic spine — do not twist from the lower back. Return to center before stepping back. Alternate legs each rep.'
WHERE id = 'ac37e8b1-2813-4760-8da8-17d07f1e3333'; -- Lunge with Twist

UPDATE exercises SET form_notes = 'Step forward, lowering the back knee toward (but not touching) the floor. Keep the front shin as vertical as possible. Drive through the front heel to return to standing. Keep torso tall throughout. Alternate legs walking or stepping in place. Do not let the front knee collapse inward.'
WHERE id = 'f80f59e5-c30d-4f0c-a897-eb02435e9592'; -- Lunges

-- ─── Migration 015: Add equipment column to exercises ────────────────────────
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment TEXT DEFAULT NULL;

UPDATE exercises SET equipment = 'Barbell' WHERE id IN (
  '0f4d1d9b-8cbb-47e3-8193-dd6b72d38707','fff3711b-38a4-487e-93d0-7c52efdbe890',
  '2fa2d1d3-4ea2-420a-a514-fd0800e0d90f','b6e39f07-c69d-4a85-8d00-114466ab6e12',
  '300ee56b-df67-4e5e-aff8-51ce6416e171','2acc0a31-fc0a-4c2b-ba5d-8a7d7f0213f3',
  '2be4ff68-fb19-42cc-afbf-beee30488728','607f9637-4ba5-48cc-8034-736b22b5d04e',
  'ef3cb3d8-f697-463a-b77e-a4692e2c9c01','8ce1f9f7-cc52-4d9d-b530-f64766ffc3e8',
  'dabea74e-389c-4fa8-bcd4-a7f9cf2c652b'
);
UPDATE exercises SET equipment = 'Dumbbell' WHERE id IN (
  '0cf918e5-18dd-448c-962c-5acba7da0151','943d0c35-70bf-4fb3-993e-69782f63aee7',
  '2da0485e-39b8-4bc6-98b5-e6965aa1d947','bcd106ef-4d81-4360-8d5d-096f8d712a25',
  '065a0722-2eb1-4a19-81f0-7d9f0cf918a4','3153bf6c-a798-47b4-87eb-92b2fb654c99',
  'e4f70e4e-b998-4289-b2ba-8fd80d1d386e','8996206f-c166-4c1a-b6b2-7c5228fc6a1f',
  'fb082ab1-e28e-4c32-bd10-c9bb21d23503','1ee110eb-9d11-442a-bacb-c06c4412dd13',
  'b664e58f-b1b8-400f-b3b0-4be5f9d7339a','45d918fa-d696-48ae-9554-89761ec98837',
  '99f25f33-e9a2-42ad-a230-7fab43488a11','8aed8c66-0166-490d-9a1b-a18c0b50e68b',
  '15024e35-53be-4f6c-8641-ef99ef0d5783'
);
UPDATE exercises SET equipment = 'Cable' WHERE id IN (
  '45de9606-18c3-4500-9a28-cdf440454d51','f6f05350-3435-48ba-af10-d377d0c08941',
  'b3cf51a0-28e6-4669-8764-384cd46702fc','e54ceba1-10c3-45a1-871f-e432d8fd1467',
  'd8f7ec36-03ff-411d-a9b4-ed64773a3845','fd61b1ba-c236-4e99-8e02-cf48b6517ba4',
  '7414faf7-5b3d-4516-b547-402aef80f6cb','b1254d46-2f3a-4be9-a649-cfbc86c40e71',
  'f13a998b-eb1a-4455-9105-33250861b7a1','bbf96dcd-7134-4afb-bd56-5ccd28737a24',
  '96d2129b-2b8b-4284-b565-146fef29e5a3','38d791b3-ce58-42e0-a1fb-445e0f5bd0f3'
);
UPDATE exercises SET equipment = 'Machine' WHERE id IN (
  'dd429076-07dc-48c4-8661-2971840c4090','6d0fcc06-23dc-4dd1-bf76-60cfb8726416',
  '07f6c3d0-1757-4f0c-8e81-d3629fb35b9b','544f52ca-98f1-48d9-9a8d-fa7f12e05735',
  '71df72e3-8ced-4795-a005-b7a7671b04d8','c895caaf-b8d5-4aed-807c-4cc2b1e226e1',
  '412295da-9c4c-4be5-9912-ec06c1a2ad5c','96cbdbec-8e99-4147-aa3a-846681eb2954'
);
UPDATE exercises SET equipment = 'Kettlebell' WHERE id IN (
  '9ff32d08-fab2-4657-a276-094f335e0b7d','18be71da-bf4e-459d-9a6c-d58432d5f1ab',
  '67c1a3ca-078a-4c75-8b65-9d53463579e6','3e1a074f-5da1-49f8-9f44-3178d9747a04'
);
UPDATE exercises SET equipment = 'Other' WHERE id IN (
  '6ca47d6e-e9fa-4595-9892-281633b47a5e','546e0d13-6653-4d60-a113-a094fc6e1c97',
  '1804af5b-0324-4a07-88d1-5d2710aaa75d','a2ccc581-cdd3-46fa-9d7b-71aee49f2aba',
  '2d62e96f-48b0-442a-9e47-cc402cf59e94','b962ea3d-5055-40f6-a951-7d1b59731133'
);
UPDATE exercises SET equipment = 'Bodyweight' WHERE id IN (
  '6766b3a5-293c-438e-bbe4-e2e946b4a16d','d8ce097b-5caf-49ae-88d6-2e80bdadafe3',
  'ad5739d0-0cf0-4850-8d38-10888a207ec2','e42fbdc9-2ae5-4813-9df9-1947777346f4',
  '85d962a1-5274-4089-a627-624e783a81c2','57854382-962e-41d6-9c02-09fe7de709fa',
  '2a6c163b-5e09-4f99-8d26-805e3dfabe8e','5af004e8-94b3-4cbb-9b0e-df6ca4b28963',
  '1864aeec-79c9-4c11-84c2-1042e3878e09','9357fd37-c9af-4342-b0d8-5bcab3f6a576',
  'e89a3b3a-1f94-45b6-b8ac-a04051d6e3fe','eb1d1628-615c-42d2-b565-922f635fa96f',
  'd28bad1f-9317-4fe5-8af9-c30d4f5a25ac','6cbdef15-f16c-43b0-b382-439659baf9dc',
  '12629028-b516-4911-ba6c-6bd9dd9f3b1a','bb8a0810-ec61-4c99-a113-d7bb8798a6a0',
  '7bc2f8b9-d78d-4b23-b155-37cc23187b10','7484fdbf-c56e-4a23-b291-efb688ed9136',
  'cf95ab21-d763-4b59-a32c-2bae48a03a1c','ecb029d5-ea2f-425a-8782-f42df8abc9fb',
  '77f163e9-432b-46d0-b862-11a98e9e9f4a','d405ed82-6a39-4013-ac8c-7a4ada1a4f5d',
  'c83f6c93-4404-4b34-8956-23d07f7d0f20','d124b685-a77e-44c1-ae80-b39e94bf60d0',
  'fa1381de-be3e-44f5-a7bb-d7b12abdf552','08e94c1d-f306-4734-9610-387b5626b503',
  '8d897c23-bfc5-45f3-ab5b-4d3792224a63','c7c8c551-9b6a-422c-999f-5e44afa14afe',
  '143eff06-5ce2-4a69-9191-2686cc9b90b7','2106002e-fdc9-4285-a701-91fb8b6fa35f',
  '18643250-2fc2-4d8a-9d5c-8d5175c18a67','248244d3-4ba6-4f58-9772-1b5c0d15472e',
  'be3a9444-ec1d-4e35-9ba3-f0dfa03d040d','c8fca4fc-caa2-4753-9639-4ee7c8d6b945',
  '1b051178-b5a1-4122-8235-cad6594e81fe','4e62211d-c7e3-46ec-89f1-bed8b48972fe',
  '68c4185e-06bb-4c36-b162-bfb91d93b987','73392c4a-fd48-440b-94dd-22e66616b11f',
  '31152657-723a-4b30-8262-38d842dcaa2d','69a4bf0e-0e20-4b65-b3cc-9882a3309062',
  '4bc16b71-dffb-4876-ad09-44b6011b9cbb','21203646-8186-4017-916a-258936ec8d13',
  'ac37e8b1-2813-4760-8da8-17d07f1e3333','f80f59e5-c30d-4f0c-a897-eb02435e9592'
);

-- ============================================================
-- Migration 015 — Muscle Group Encyclopedia
-- ============================================================

CREATE TABLE IF NOT EXISTS muscle_group_encyclopedia (
  muscle_group         text PRIMARY KEY,
  function_description text,
  warmup_and_stretches text,
  common_injuries      text,
  rehab_exercises      text,
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE muscle_group_encyclopedia ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "encyclopedia_select" ON muscle_group_encyclopedia
  FOR SELECT TO authenticated USING (true);

-- Only trainers can insert/update/delete
CREATE POLICY "encyclopedia_insert" ON muscle_group_encyclopedia
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "encyclopedia_update" ON muscle_group_encyclopedia
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "encyclopedia_delete" ON muscle_group_encyclopedia
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ============================================================
-- Migration 016 — Scheduling & Credits
-- ============================================================

-- ── trainer_availability ──────────────────────────────────────
-- Recurring weekly availability slots set by trainers.
CREATE TABLE IF NOT EXISTS trainer_availability (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id    UUID        NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  day_of_week   SMALLINT    NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun,1=Mon..6=Sat
  start_time    TIME        NOT NULL,
  end_time      TIME        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trainer_id, day_of_week, start_time)
);

-- ── scheduled_sessions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id       UUID        NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  client_id        UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  availability_id  UUID        REFERENCES trainer_availability(id) ON DELETE SET NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes SMALLINT    NOT NULL DEFAULT 60 CHECK (duration_minutes IN (30, 60)),
  status           TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled','completed')),
  notes            TEXT,
  trainer_notes    TEXT,
  cancelled_by     TEXT        CHECK (cancelled_by IN ('trainer','client')),
  confirmed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── client_credits ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_credits (
  client_id  UUID        PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  balance    INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── credit_transactions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID        NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  session_id UUID        REFERENCES scheduled_sessions(id) ON DELETE SET NULL,
  amount     INT         NOT NULL,
  reason     TEXT        NOT NULL CHECK (reason IN ('grant','session_deduct','session_refund','manual')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS scheduled_sessions_trainer_idx ON scheduled_sessions(trainer_id, scheduled_at);
CREATE INDEX IF NOT EXISTS scheduled_sessions_client_idx  ON scheduled_sessions(client_id, scheduled_at);
CREATE INDEX IF NOT EXISTS credit_transactions_client_idx ON credit_transactions(client_id, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE trainer_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions   ENABLE ROW LEVEL SECURITY;

-- trainer_availability: readable by all authenticated (clients need to browse slots)
CREATE POLICY "availability_select" ON trainer_availability
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "availability_insert" ON trainer_availability
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "availability_update" ON trainer_availability
  FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "availability_delete" ON trainer_availability
  FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- scheduled_sessions: trainers see their own; clients see their own
CREATE POLICY "sessions_trainer_select" ON scheduled_sessions
  FOR SELECT TO authenticated USING (trainer_id = auth.uid());
CREATE POLICY "sessions_client_select" ON scheduled_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()));
CREATE POLICY "sessions_trainer_insert" ON scheduled_sessions
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "sessions_client_insert" ON scheduled_sessions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()));
CREATE POLICY "sessions_trainer_update" ON scheduled_sessions
  FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "sessions_client_update" ON scheduled_sessions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()));

-- client_credits: all trainers can see any client's credits; client sees own
CREATE POLICY "credits_trainer_select" ON client_credits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));
CREATE POLICY "credits_client_select" ON client_credits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()));
CREATE POLICY "credits_trainer_upsert" ON client_credits
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));
CREATE POLICY "credits_trainer_update" ON client_credits
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- credit_transactions: all trainers can read any client's transactions; clients read own
CREATE POLICY "transactions_trainer_select" ON credit_transactions
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));
CREATE POLICY "transactions_client_select" ON credit_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE id = client_id AND auth_user_id = auth.uid()));
CREATE POLICY "transactions_trainer_insert" ON credit_transactions
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());

-- ============================================================
-- Migration 016b — trainer_availability: add specific_date
-- ============================================================

-- Make day_of_week nullable (weekly slots keep it set; specific-date slots set it NULL)
ALTER TABLE trainer_availability
  ALTER COLUMN day_of_week DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS specific_date DATE DEFAULT NULL;

-- Exactly one of day_of_week / specific_date must be set
ALTER TABLE trainer_availability
  ADD CONSTRAINT availability_type_check CHECK (
    (day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (day_of_week IS NULL     AND specific_date IS NOT NULL)
  );

-- Drop the old unique constraint and replace with partial indexes
ALTER TABLE trainer_availability
  DROP CONSTRAINT IF EXISTS trainer_availability_trainer_id_day_of_week_start_time_key;

CREATE UNIQUE INDEX IF NOT EXISTS trainer_availability_weekly_uniq
  ON trainer_availability(trainer_id, day_of_week, start_time)
  WHERE specific_date IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS trainer_availability_specific_uniq
  ON trainer_availability(trainer_id, specific_date, start_time)
  WHERE day_of_week IS NULL;

-- ============================================================
-- Migration 017 — Recipes
-- ============================================================

CREATE TABLE IF NOT EXISTS recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id  uuid NOT NULL REFERENCES trainers(id),
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id        uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_name        text NOT NULL,
  usda_food_id     text,
  weight_g         numeric NOT NULL CHECK (weight_g > 0),
  calories_per_100g numeric,
  protein_per_100g  numeric,
  carbs_per_100g    numeric,
  fat_per_100g      numeric,
  fiber_per_100g    numeric,
  sort_order       integer DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- recipes: trainers manage their clients' recipes
CREATE POLICY "recipes_trainer_all" ON recipes FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- recipes: clients read/insert/update/delete their own recipes
CREATE POLICY "recipes_client_select" ON recipes FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "recipes_client_insert" ON recipes FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "recipes_client_update" ON recipes FOR UPDATE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));
CREATE POLICY "recipes_client_delete" ON recipes FOR DELETE TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

-- recipe_ingredients: access via recipe ownership
CREATE POLICY "recipe_ingredients_trainer_all" ON recipe_ingredients FOR ALL TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE trainer_id = auth.uid()))
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE trainer_id = auth.uid()));
CREATE POLICY "recipe_ingredients_client_select" ON recipe_ingredients FOR SELECT TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())));
CREATE POLICY "recipe_ingredients_client_insert" ON recipe_ingredients FOR INSERT TO authenticated
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())));
CREATE POLICY "recipe_ingredients_client_update" ON recipe_ingredients FOR UPDATE TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())))
  WITH CHECK (recipe_id IN (SELECT id FROM recipes WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())));
CREATE POLICY "recipe_ingredients_client_delete" ON recipe_ingredients FOR DELETE TO authenticated
  USING (recipe_id IN (SELECT id FROM recipes WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())));

-- ============================================================
-- Migration 018 — Workout Guides (trainer-editable)
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_guides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic       text NOT NULL,
  section_key text NOT NULL,
  content     text NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(topic, section_key)
);

ALTER TABLE workout_guides ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read guides
CREATE POLICY "guides_select" ON workout_guides
  FOR SELECT TO authenticated USING (true);

-- Only trainers can write/edit guides
CREATE POLICY "guides_trainer_all" ON workout_guides
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ============================================================
-- Migration 019 — workout_templates: add split column
-- Restores grouping support (previously "phase"), now named
-- "split" to align with Full Body / Upper-Lower / PPL etc.
-- ============================================================

ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS split TEXT;

-- Drop the plain name unique constraint and replace with
-- (name, split) so the same template name can exist in
-- different splits (mirrors the original phase behaviour).
ALTER TABLE workout_templates DROP CONSTRAINT IF EXISTS workout_templates_name_key;
ALTER TABLE workout_templates ADD CONSTRAINT workout_templates_name_split_key
  UNIQUE (name, split);

-- ── Backfill: assign splits to existing rows ──────────────────────
UPDATE workout_templates SET split = 'Phase 1' WHERE name IN (
  'Workout A: Push Focus', 'Workout B: Pull Focus',
  'Workout C: Stability', 'Workout D: Lateral/Total'
);
UPDATE workout_templates SET split = 'Phase 2' WHERE name IN (
  'Workout A: Push Focus (P2)', 'Workout B: Pull Focus (P2)',
  'Workout C: Shoulder Focus', 'Workout D: Agility/Total'
);
UPDATE workout_templates SET split = 'Phase 3' WHERE name IN (
  'Workout A: Chest/Push', 'Workout B: Back/Pull',
  'Workout C: Shoulders', 'Workout D: Total Body'
);
UPDATE workout_templates SET split = 'Abs'
  WHERE name LIKE 'Abs: Variation %';
UPDATE workout_templates SET split = 'Abs & Core' WHERE name IN (
  'Core: Beginner', 'Core: Intermediate', 'Core: Advanced'
);
UPDATE workout_templates SET split = 'Full Body' WHERE name IN (
  'Session A: Full Body', 'Session B: Full Body', 'Session C: Full Body'
);
UPDATE workout_templates SET split = 'Upper / Lower' WHERE name IN (
  'Upper A: Strength', 'Lower A: Strength', 'Upper B: Volume', 'Lower B: Volume'
);
UPDATE workout_templates SET split = 'Push / Pull / Legs' WHERE name IN (
  'Push Day 1', 'Pull Day 1', 'Legs Day 1',
  'Push Day 2', 'Pull Day 2', 'Legs Day 2'
);

-- ============================================================
-- Migration 020 — workout_templates: add subgroup column
-- Introduces a second grouping level within each split.
-- Phases are re-homed into Full Body with subgroup labels;
-- old Abs split is merged into Abs & Core.
-- ============================================================

ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS subgroup TEXT;

UPDATE workout_templates SET split = 'Full Body', subgroup = 'Phase 1' WHERE split = 'Phase 1';
UPDATE workout_templates SET split = 'Full Body', subgroup = 'Phase 2' WHERE split = 'Phase 2';
UPDATE workout_templates SET split = 'Full Body', subgroup = 'Phase 3' WHERE split = 'Phase 3';
UPDATE workout_templates SET split = 'Abs & Core', subgroup = 'Ab Circuits' WHERE split = 'Abs';
UPDATE workout_templates SET subgroup = 'Standard'         WHERE split = 'Full Body'          AND subgroup IS NULL;
UPDATE workout_templates SET subgroup = 'Upper'            WHERE split = 'Upper / Lower'      AND name LIKE 'Upper%';
UPDATE workout_templates SET subgroup = 'Lower'            WHERE split = 'Upper / Lower'      AND name LIKE 'Lower%';
UPDATE workout_templates SET subgroup = 'Push'             WHERE split = 'Push / Pull / Legs' AND name LIKE 'Push%';
UPDATE workout_templates SET subgroup = 'Pull'             WHERE split = 'Push / Pull / Legs' AND name LIKE 'Pull%';
UPDATE workout_templates SET subgroup = 'Legs'             WHERE split = 'Push / Pull / Legs' AND name LIKE 'Legs%';
UPDATE workout_templates SET subgroup = 'Core Fundamentals'WHERE split = 'Abs & Core'         AND name LIKE 'Core:%';

-- ============================================================
-- Migration 021 — workout_templates: clean up naming
-- Removes "Workout A/B/C/D:" letter prefixes; names now reflect
-- only the target area / emphasis.
-- Upgrades unique constraint from (name, split) to
-- (name, split, subgroup) so the same focus name can appear in
-- different subgroups within the same split.
-- ============================================================

ALTER TABLE workout_templates
  DROP CONSTRAINT IF EXISTS workout_templates_name_split_key;

ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_name_split_subgroup_key
  UNIQUE (name, split, subgroup);

-- Full Body / Standard
UPDATE workout_templates SET name = 'Full Body 1' WHERE name = 'Session A: Full Body'    AND split = 'Full Body' AND subgroup = 'Standard';
UPDATE workout_templates SET name = 'Full Body 2' WHERE name = 'Session B: Full Body'    AND split = 'Full Body' AND subgroup = 'Standard';
UPDATE workout_templates SET name = 'Full Body 3' WHERE name = 'Session C: Full Body'    AND split = 'Full Body' AND subgroup = 'Standard';

-- Full Body / Phase 1
UPDATE workout_templates SET name = 'Push Emphasis'   WHERE name = 'Workout A: Push Focus'    AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Pull Emphasis'   WHERE name = 'Workout B: Pull Focus'    AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Stability'       WHERE name = 'Workout C: Stability'     AND split = 'Full Body' AND subgroup = 'Phase 1';
UPDATE workout_templates SET name = 'Lateral & Total' WHERE name = 'Workout D: Lateral/Total' AND split = 'Full Body' AND subgroup = 'Phase 1';

-- Full Body / Phase 2
UPDATE workout_templates SET name = 'Push Emphasis'     WHERE name = 'Workout A: Push Focus (P2)' AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Pull Emphasis'     WHERE name = 'Workout B: Pull Focus (P2)' AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Shoulder Emphasis' WHERE name = 'Workout C: Shoulder Focus'  AND split = 'Full Body' AND subgroup = 'Phase 2';
UPDATE workout_templates SET name = 'Agility & Total'   WHERE name = 'Workout D: Agility/Total'   AND split = 'Full Body' AND subgroup = 'Phase 2';

-- Full Body / Phase 3
UPDATE workout_templates SET name = 'Chest & Push'    WHERE name = 'Workout A: Chest/Push' AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Back & Pull'     WHERE name = 'Workout B: Back/Pull'  AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Shoulders & Arms'WHERE name = 'Workout C: Shoulders'  AND split = 'Full Body' AND subgroup = 'Phase 3';
UPDATE workout_templates SET name = 'Total Body'      WHERE name = 'Workout D: Total Body' AND split = 'Full Body' AND subgroup = 'Phase 3';

-- Upper / Lower
UPDATE workout_templates SET name = 'Upper 1' WHERE name = 'Upper A: Strength' AND split = 'Upper / Lower' AND subgroup = 'Upper';
UPDATE workout_templates SET name = 'Upper 2' WHERE name = 'Upper B: Volume'   AND split = 'Upper / Lower' AND subgroup = 'Upper';
UPDATE workout_templates SET name = 'Lower 1' WHERE name = 'Lower A: Strength' AND split = 'Upper / Lower' AND subgroup = 'Lower';
UPDATE workout_templates SET name = 'Lower 2' WHERE name = 'Lower B: Volume'   AND split = 'Upper / Lower' AND subgroup = 'Lower';

-- Push / Pull / Legs
UPDATE workout_templates SET name = 'Push 1' WHERE name = 'Push Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Push';
UPDATE workout_templates SET name = 'Push 2' WHERE name = 'Push Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Push';
UPDATE workout_templates SET name = 'Pull 1' WHERE name = 'Pull Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Pull';
UPDATE workout_templates SET name = 'Pull 2' WHERE name = 'Pull Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Pull';
UPDATE workout_templates SET name = 'Legs 1' WHERE name = 'Legs Day 1' AND split = 'Push / Pull / Legs' AND subgroup = 'Legs';
UPDATE workout_templates SET name = 'Legs 2' WHERE name = 'Legs Day 2' AND split = 'Push / Pull / Legs' AND subgroup = 'Legs';

-- ============================================================
-- Migration 022 — Add stretch category + Hands/Feet exercises
-- Adds:
--   • 36 stretches across all muscle groups
--   • 8 hand/wrist stretches  (muscle_group = 'Hands')
--   • 10 hand/wrist strength  (muscle_group = 'Hands')
--   • 7 foot/ankle stretches  (muscle_group = 'Feet')
--   • 11 foot/ankle strength  (muscle_group = 'Feet')
-- ============================================================

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


-- ─── Migration 019: Direct Messaging ─────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  is_group    BOOLEAN     NOT NULL DEFAULT FALSE,
  title       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id           UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  body                TEXT        NOT NULL CHECK (length(trim(body)) > 0),
  reply_to_id         UUID        REFERENCES messages(id) ON DELETE SET NULL,
  attachment_type     TEXT        CHECK (attachment_type IN ('exercise', 'workout', 'assigned_workout', 'guide')),
  attachment_id       TEXT,
  attachment_title    TEXT,
  attachment_subtitle TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_conv_created_idx       ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conv_participants_user_id_idx   ON conversation_participants(user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- RLS
ALTER TABLE conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                  ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper: returns the current user's conversation IDs without
-- triggering RLS on conversation_participants (avoids infinite recursion).
CREATE OR REPLACE FUNCTION get_my_conversation_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid();
$$;

-- conversations: visible to participants only
CREATE POLICY "participants can view conversations"
  ON conversations FOR SELECT
  USING (id IN (SELECT get_my_conversation_ids()));

CREATE POLICY "authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- participants: use the security definer function to avoid self-referential recursion
CREATE POLICY "participants can view other participants"
  ON conversation_participants FOR SELECT
  USING (conversation_id IN (SELECT get_my_conversation_ids()));

CREATE POLICY "conversation creator can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- messages: read/write for participants
CREATE POLICY "participants can view messages"
  ON messages FOR SELECT
  USING (conversation_id IN (SELECT get_my_conversation_ids()));

CREATE POLICY "participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (SELECT get_my_conversation_ids())
  );

-- SECURITY DEFINER functions for creating conversations.
-- These run as the function owner so they can bypass RLS while still
-- correctly calling auth.uid() inside the function body.

CREATE OR REPLACE FUNCTION create_dm_conversation(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id  UUID;
  caller   UUID := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Return existing 1-to-1 conversation if one already exists
  SELECT c.id INTO conv_id
  FROM conversations c
  JOIN conversation_participants cp1
    ON cp1.conversation_id = c.id AND cp1.user_id = caller
  JOIN conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id = other_user_id
  WHERE c.is_group = FALSE
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new DM conversation
  INSERT INTO conversations (created_by, is_group)
  VALUES (caller, FALSE)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, caller), (conv_id, other_user_id);

  RETURN conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION create_group_conversation(p_title TEXT, p_participant_ids UUID[])
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  caller  UUID := auth.uid();
  uid     UUID;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO conversations (created_by, is_group, title)
  VALUES (caller, TRUE, NULLIF(trim(p_title), ''))
  RETURNING id INTO conv_id;

  -- Add creator
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, caller);

  -- Add each participant (skip duplicates and the caller if passed in)
  FOREACH uid IN ARRAY p_participant_ids LOOP
    IF uid <> caller THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (conv_id, uid)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN conv_id;
END;
$$;

-- ─── Migration 019b: Message attachments & reply threading ────
-- Run on existing databases to add the new columns.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id         UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type     TEXT CHECK (attachment_type IN ('exercise', 'workout', 'assigned_workout', 'guide'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_id       TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_title    TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_subtitle TEXT;

-- ─── Migration 020: Exercise Media ───────────────────────────
-- Trainers can attach custom images and videos to any exercise.
-- Storage bucket: exercise-media (create in Supabase Dashboard → Storage)

CREATE TABLE IF NOT EXISTS exercise_media (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id  UUID        NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  trainer_id   UUID        NOT NULL REFERENCES trainers(id)  ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  media_type   TEXT        NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exercise_media_exercise_id_idx ON exercise_media(exercise_id);

ALTER TABLE exercise_media ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view
CREATE POLICY "authenticated users can view exercise media"
  ON exercise_media FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only the uploading trainer can insert
CREATE POLICY "trainers can upload exercise media"
  ON exercise_media FOR INSERT
  WITH CHECK (trainer_id = auth.uid());

-- Only the uploading trainer can delete their own media
CREATE POLICY "trainers can delete own exercise media"
  ON exercise_media FOR DELETE
  USING (trainer_id = auth.uid());

-- ─── Migration 021: Unread message tracking ───────────────────
-- Add last_read_at to conversation_participants so each participant
-- can track when they last read a conversation.

ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- Allow participants to update their own last_read_at (drop-and-recreate to fix any stale policy)
DROP POLICY IF EXISTS "participants can update own last_read_at" ON conversation_participants;
CREATE POLICY "participants can update own last_read_at"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: mark a conversation as read using server-side NOW() to avoid client/server clock skew
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
$$;

-- ============================================================
-- Migration: tighten trainer/client data isolation
-- Migration 003 used auth.role()='authenticated' (any logged-in
-- user) which predated client auth.  Replace with EXISTS-in-trainers
-- checks so client users cannot read other clients' data.
-- ============================================================

DROP POLICY IF EXISTS "workouts: authenticated"    ON workouts;
DROP POLICY IF EXISTS "workout_sets: authenticated" ON workout_sets;
DROP POLICY IF EXISTS "clients: authenticated read" ON clients;

CREATE POLICY "workouts: trainer all" ON workouts
  FOR ALL USING     (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK        (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "workout_sets: trainer all" ON workout_sets
  FOR ALL USING     (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK        (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "clients: trainer read" ON clients
  FOR SELECT USING  (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ─── Migration 022: Clinical Workout Templates ────────────────
-- Seed condition-specific workout templates organised into five
-- clinical groups. ON CONFLICT DO NOTHING is safe to re-run.
-- split  = top-level group (e.g. 'Metabolic & Chronic Disease')
-- subgroup = condition name (e.g. 'Diabetes & Obesity')

INSERT INTO workout_templates (name, split, subgroup, exercise_names) VALUES

-- ── Metabolic & Chronic Disease ───────────────────────────────

('Strength-Based Glucose Clearance',
 'Metabolic & Chronic Disease', 'Diabetes & Obesity',
 ARRAY['Goblet Squat','Dumbbell Chest Press','Seated Cable Row',
       'Reverse Lunges','Dumbbell Overhead Press',
       'Forearm Plank','Farmers Carry']),

('Low-Impact Metabolic Circuit',
 'Metabolic & Chronic Disease', 'Diabetes & Obesity',
 ARRAY['Incline Treadmill Walk','Step-ups',
       'Battle Ropes','Wall Push-ups',
       'Medicine Ball Slams','Dead Bug',
       'Stationary Bike']),

('Aerobic Resistance Training',
 'Metabolic & Chronic Disease', 'Hypertension & High Cholesterol',
 ARRAY['Leg Press','Lat Pulldown',
       'Seated Leg Curls','Machine Chest Press',
       'Standing Calf Raises','Bicep Curls',
       'Steady-State Walking']),

('Cardiovascular Health & Flow',
 'Metabolic & Chronic Disease', 'Hypertension & High Cholesterol',
 ARRAY['Cat-Cow','Shadow Boxing',
       'Bodyweight Squats','Resistance Band Rows',
       'Bird-Dog','Wall Slides',
       'Diaphragmatic Breathing']),

('Phase II Supervised Resistance',
 'Metabolic & Chronic Disease', 'Cardiac Rehabilitation',
 ARRAY['Warm-Up Walking','Stationary Cycling',
       'Bicep Curls','Machine Shoulder Press',
       'Leg Press','Seated Cable Row',
       'Leg Extensions Machine','Machine Chest Press']),

('Home-Based Cardiac Maintenance',
 'Metabolic & Chronic Disease', 'Cardiac Rehabilitation',
 ARRAY['Walking','Resistance Band Bicep Curls',
       'Resistance Band Chest Press','Resistance Band Shoulder Press',
       'Bodyweight Squats','Resistance Band Rows',
       'Wall Push-ups','Standing Calf Raises']),

('COPD Aerobic Endurance Protocol',
 'Metabolic & Chronic Disease', 'COPD & Respiratory',
 ARRAY['Treadmill Walking','Stationary Cycling',
       'Step-ups','Resistance Band Rows',
       'Seated Leg Extensions','Pursed-Lip Breathing',
       'Cool-Down Walk']),

('COPD Interval Training Protocol',
 'Metabolic & Chronic Disease', 'COPD & Respiratory',
 ARRAY['Interval Cycling','Interval Walking',
       'Resistance Band Rows','Leg Press',
       'Seated Chest Press','Bicep Curls',
       'Cool-Down Walking']),

-- ── Musculoskeletal & Orthopedic ──────────────────────────────

('Lumbar Stabilization (The Big 3)',
 'Musculoskeletal & Orthopedic', 'Sciatica & Lower Back Pain',
 ARRAY['Cat-Cow Stretch','McGill Curl-Up',
       'Side Plank','Bird-Dog',
       'Glute Bridge','Pallof Press',
       'Child''s Pose Decompression']),

('Hip Mobility & Nerve Gliding',
 'Musculoskeletal & Orthopedic', 'Sciatica & Lower Back Pain',
 ARRAY['Seated Sciatic Nerve Glide','90/90 Hip Switches',
       'Clamshells','Single-Leg RDL Bodyweight',
       'Hip Flexor Stretch Half-Kneeling',
       'Wall Dead Bug','Figure-4 Glute Stretch']),

('Joint Lubrication & Strength',
 'Musculoskeletal & Orthopedic', 'Arthritis & Joint Replacements',
 ARRAY['Leg Extensions Machine','Seated Rows Neutral Grip',
       'Hamstring Curls Machine','Scapular Squeezes',
       'Wall Sits Partial Depth','Seated Chest Fly Machine',
       'Wrist & Ankle Circles']),

('Low-Impact Functional Movement',
 'Musculoskeletal & Orthopedic', 'Arthritis & Joint Replacements',
 ARRAY['Sit-to-Stand Chair','Incline Push-ups',
       'Resistance Band Pull-aparts','Step-ups 4-inch box',
       'Standing Side Leg Lifts','Face Pulls',
       'Static Quad Sets']),

('Weight-Bearing Bone Loading',
 'Musculoskeletal & Orthopedic', 'Osteoporosis',
 ARRAY['Bodyweight Squats','Dumbbell Floor Press',
       'Standing Dumbbell Rows','Weighted Step-ups',
       'Dumbbell Curl to Overhead Press',
       'Standing Heel Raises','Wall Push-ups']),

('Balance & Bone Density',
 'Musculoskeletal & Orthopedic', 'Osteoporosis',
 ARRAY['Single-Leg Balance','Tandem Walk',
       'Resistance Band Lat Pulldown',
       'Medicine Ball Chest Pass Light',
       'Side-to-Side Step Touches',
       'Modified Bird-Dog','Tai Chi Lunges']),

('Rotator Cuff Early-Phase Stabilization',
 'Musculoskeletal & Orthopedic', 'Shoulder Impingement & Rotator Cuff',
 ARRAY['Pendulum Swings','Crossover Arm Stretch',
       'Sleeper Stretch','Scapular Setting',
       'Isometric External Rotation','Isometric Internal Rotation',
       'Prone Horizontal Abduction']),

('Rotator Cuff Progressive Strengthening',
 'Musculoskeletal & Orthopedic', 'Shoulder Impingement & Rotator Cuff',
 ARRAY['Full-Can Scaption Thumb-Up','Standing External Rotation',
       'Standing Internal Rotation','Standing Row',
       'Prone Y Raise','Face Pulls',
       'Bent-Over Horizontal Abduction']),

('Knee Rehab Phase I Mobility & Quad Activation',
 'Musculoskeletal & Orthopedic', 'Knee Rehabilitation',
 ARRAY['Ankle Pumps','Heel Slides',
       'Quad Sets','Straight Leg Raises',
       'Hamstring Sets',
       'Double-Leg Quarter Squats','Knee Extension Stretch']),

('Knee Rehab Phase II Strength Progression',
 'Musculoskeletal & Orthopedic', 'Knee Rehabilitation',
 ARRAY['Quad Sets','Side-Lying Hip Abduction',
       'Straight Leg Raises with Resistance',
       'Double-Leg Quarter Squats',
       'Terminal Knee Extension Band','Single-Leg Heel Raises',
       'Hamstring Curls Band or Prone']),

-- ── Postural Deviations ───────────────────────────────────────

('Posterior Chain Awakening',
 'Postural Deviations', 'Upper Crossed Syndrome',
 ARRAY['Chin Tucks','Prone Y-T-W Raises',
       'Face Pulls','Seated Cable Row High Elbows',
       'Doorway Chest Stretch',
       'Resistance Band Pull-aparts']),

('Vertical Integrity',
 'Postural Deviations', 'Upper Crossed Syndrome',
 ARRAY['Wall Slides','Dead Bug Arms Overhead',
       'Farmers Carry Tall Spine','Scapular Push-ups',
       'Single-Arm Dumbbell Row','Pec Minor Release']),

('Anterior Core & Glutes',
 'Postural Deviations', 'Lower Crossed Syndrome & Scoliosis',
 ARRAY['Dead Bug','Glute Bridge with Band',
       'Plank with Knee Taps','Hip Flexor Stretch Half-Kneeling',
       'Single-Leg Bridge','Bird-Dog',
       'Goblet Squat Neutral Pelvis']),

('Scoliosis Asymmetry Focus',
 'Postural Deviations', 'Lower Crossed Syndrome & Scoliosis',
 ARRAY['Side Plank Weak Side',
       'Bird-Dog Leg Extension Focus',
       'Single-Arm Lat Pulldown',
       'Standing Single-Arm Press',
       'Pallof Press','Seated Torso Rotation Controlled',
       'Child''s Pose with Side Reach']),

-- ── Special Populations ───────────────────────────────────────

('Functional Independence',
 'Special Populations', 'Elderly (Seniors)',
 ARRAY['Chair Squats','Wall Push-ups',
       'Seated Resistance Band Rows','Standing Heel Raises',
       'Single-Leg Balance Wall Support',
       'Modified Dead Bug']),

('Fall Prevention & Mobility',
 'Special Populations', 'Elderly (Seniors)',
 ARRAY['Tandem Stance','Step-ups Low Step',
       'Resistance Band Bicep Curls','Wall Slides',
       'Hip Abduction Standing','Seated Leg Extensions']),

('Safe Core & Pelvic Stability',
 'Special Populations', 'Prenatal & Postpartum',
 ARRAY['Pelvic Tilts','Clamshells',
       'Bird-Dog','Incline Push-ups',
       'Glute Bridges','Cat-Cow']),

('Postural Re-alignment',
 'Special Populations', 'Prenatal & Postpartum',
 ARRAY['Seated Row Band or Cable','Reverse Lunges',
       'Wall Slides','Squat to Box',
       'Side-Lying Hip Abduction',
       'Hip Flexor & Chest Stretch']),

('Oncology Combined Aerobic & Resistance',
 'Special Populations', 'Cancer Survivors',
 ARRAY['Treadmill Walking',
       'Machine Chest Press','Leg Press',
       'Seated Row','Machine Shoulder Press',
       'Bicep Curls','Hamstring Curls']),

('Oncology Fatigue Management Circuit',
 'Special Populations', 'Cancer Survivors',
 ARRAY['Walking','Stationary Cycling',
       'Resistance Band Chest Fly','Resistance Band Rows',
       'Side-Lying Leg Lifts','Arm Circles & Shoulder Mobility']),

('Hypermobility Foundational Strength',
 'Special Populations', 'Hypermobility & EDS',
 ARRAY['Sit-to-Stand Controlled','Resistance Band Knee Extension',
       'Side-Lying Hip Abduction','Wall Push-ups',
       'Resistance Band Rows',
       'Bodyweight Quarter Squat','Plank Modified',
       'Bicep Curls Light']),

('Hypermobility Proprioceptive Training',
 'Special Populations', 'Hypermobility & EDS',
 ARRAY['Single-Leg Balance Eyes Open',
       'Single-Leg Balance Eyes Closed',
       'Wobble Board Balance','Seated Gym Ball Balance',
       'Slow Lateral Weight Shifts','Gentle Walking',
       'Stationary Cycling']),

-- ── Neurological & Mental Health ──────────────────────────────

('Coordination & Stability Circuit',
 'Neurological & Mental Health', 'MS / Parkinson''s / Fibromyalgia',
 ARRAY['Marching in Place High Knees',
       'Seated Medicine Ball Twists','Wall Push-ups',
       'Opposite Arm Leg Reach Seated',
       'Step-ups Slow and Controlled',
       'Resistance Band Rows']),

('Low-Impact Mobility & Fatigue Management',
 'Neurological & Mental Health', 'MS / Parkinson''s / Fibromyalgia',
 ARRAY['Cat-Cow','Bird-Dog Modified',
       'Glute Bridges','Seated Leg Extensions',
       'Doorway Chest Stretch',
       'Modified Child''s Pose','Relaxation Breathwork']),

('Aerobic-Focused Depression & Anxiety Protocol',
 'Neurological & Mental Health', 'Anxiety & Depression',
 ARRAY['Treadmill Walking',
       'Stationary Cycling','Bodyweight Squats',
       'Resistance Band Rows','Elliptical Trainer',
       'Deep Breathing Cool-Down']),

('Calming Low-Intensity Circuit',
 'Neurological & Mental Health', 'Anxiety & Depression',
 ARRAY['Gentle Stationary Cycling',
       'Resistance Band Chest Press','Resistance Band Rows',
       'Bodyweight Squats','Seated Forward Fold Stretch',
       'Diaphragmatic Breathing',
       'Progressive Muscle Relaxation']),

('Energy Envelope Protocol',
 'Neurological & Mental Health', 'Chronic Fatigue & Post-COVID',
 ARRAY['Gentle Walking','Lying Stretches','Seated Arm Circles',
       'Diaphragmatic Breathing',
       'Seated Knee Extensions',
       'Rest Periods Between Every Set']),

('Graduated Return to Exercise',
 'Neurological & Mental Health', 'Chronic Fatigue & Post-COVID',
 ARRAY['Walking','Gentle Full-Body Stretching',
       'Deep Breathing Exercises','Stationary Cycling',
       'Resistance Band Work','Single-Leg Balance',
       'Relaxation & Body Scan'])

ON CONFLICT (name, split, subgroup) DO NOTHING;

-- ─── Migration 023: User Favourites ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_favourites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL DEFAULT auth.uid(),
  item_type  TEXT NOT NULL CHECK (item_type IN ('exercise', 'template')),
  item_id    UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE user_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favourites" ON user_favourites
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Migration 024: Community Feed & AI Trends ────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL DEFAULT auth.uid(),
  author_role TEXT        NOT NULL CHECK (author_role IN ('trainer', 'client')),
  author_name TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_reactions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL DEFAULT auth.uid(),
  reaction_type TEXT        NOT NULL CHECK (reaction_type IN ('like', 'fire', 'clap')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS feed_comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID        NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL DEFAULT auth.uid(),
  author_role TEXT        NOT NULL CHECK (author_role IN ('trainer', 'client')),
  author_name TEXT        NOT NULL,
  body        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trend_summaries (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL UNIQUE,
  headline     TEXT        NOT NULL,
  trends       JSONB       NOT NULL DEFAULT '[]',
  tip_of_day   TEXT        NOT NULL,
  sources_note TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS feed_posts_created_at_idx    ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS feed_reactions_post_id_idx   ON feed_reactions(post_id);
CREATE INDEX IF NOT EXISTS feed_comments_post_id_idx    ON feed_comments(post_id);
CREATE INDEX IF NOT EXISTS trend_summaries_date_idx     ON trend_summaries(date DESC);

-- updated_at trigger for feed_posts
CREATE OR REPLACE FUNCTION update_feed_post_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_feed_posts_updated_at ON feed_posts;
CREATE TRIGGER trg_feed_posts_updated_at
  BEFORE UPDATE ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION update_feed_post_updated_at();

-- RLS
ALTER TABLE feed_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read feed posts"
  ON feed_posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users create feed posts"
  ON feed_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors delete own feed posts"
  ON feed_posts FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Authenticated users read reactions"
  ON feed_reactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users manage own reactions"
  ON feed_reactions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users read comments"
  ON feed_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users create comments"
  ON feed_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors delete own comments"
  ON feed_comments FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Authenticated users read trends"
  ON trend_summaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users insert trends"
  ON trend_summaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- Migration 025 — Add exercises missing from ALL workout templates
-- Covers standard (Full Body / UL / PPL / Abs) and all clinical
-- templates (Metabolic, Orthopedic, Postural, Special, Neuro).
-- The app's normalizeExerciseName() strips "3×12", "45 sec" etc.
-- at load time; this migration ensures the resulting base names
-- exist in the exercises table.
-- Also fixes three template names whose qualifiers can't be
-- stripped by a regex (non-numeric descriptors).
-- ============================================================

-- ── Fix non-strippable template exercise names ─────────────────
-- These have qualifiers that the normalizer cannot remove.
UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names,
    'Pursed-Lip Breathing throughout', 'Pursed-Lip Breathing')
  WHERE 'Pursed-Lip Breathing throughout' = ANY(exercise_names);

UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names,
    'Interval Walking incline', 'Interval Walking')
  WHERE 'Interval Walking incline' = ANY(exercise_names);

UPDATE workout_templates SET exercise_names =
  array_replace(exercise_names,
    'Side Plank Weak Side 2:1 ratio 3×30 sec', 'Side Plank Weak Side 3×30 sec')
  WHERE 'Side Plank Weak Side 2:1 ratio 3×30 sec' = ANY(exercise_names);

-- ── Insert all missing exercises ───────────────────────────────
INSERT INTO exercises (name, muscle_group, category) VALUES

  -- Standard: Full Body templates
  ('Back Squat',                       'Legs',      'strength'),
  ('Bent-Over Row',                    'Back',      'strength'),
  ('Goblet Squat',                     'Legs',      'strength'),
  ('Incline Dumbbell Press',           'Chest',     'strength'),
  ('Dead Bug',                         'Core',      'strength'),
  ('Front Squat',                      'Legs',      'strength'),
  ('Cable Row',                        'Back',      'strength'),

  -- Standard: Upper / Lower templates
  ('Barbell Squat',                    'Legs',      'strength'),
  ('Bulgarian Split Squat',            'Legs',      'strength'),
  ('Hip Thrust',                       'Glutes',    'strength'),
  ('Dumbbell Shoulder Press',          'Shoulders', 'strength'),
  ('Chest-Supported Row',              'Back',      'strength'),
  ('Overhead Tricep Extension',        'Arms',      'strength'),

  -- Standard: Push / Pull / Legs templates
  ('Cable Lateral Raise',              'Shoulders', 'strength'),
  ('Tricep Rope Pushdown',             'Arms',      'strength'),

  -- Standard: Abs & Core templates
  ('Ab Wheel Rollout',                 'Core',      'strength'),
  ('Hanging Leg Raise',                'Core',      'strength'),
  ('Hanging Knee Raise',               'Core',      'strength'),
  ('Side Plank',                       'Core',      'strength'),
  ('Side Plank with Hip Dip',          'Core',      'strength'),
  ('Copenhagen Plank',                 'Core',      'strength'),
  ('Dragon Flag',                      'Core',      'strength'),
  ('Weighted Cable Crunch',            'Core',      'strength'),
  ('Toes to Bar',                      'Core',      'strength'),
  ('L-Sit Hold',                       'Core',      'strength'),
  ('Bird Dog',                         'Core',      'strength'),

  -- Clinical: Metabolic & Chronic Disease
  ('Bird-Dog',                         'Core',      'strength'),
  ('Dumbbell Chest Press',             'Chest',     'strength'),
  ('Farmers Carry',                    'Full Body', 'strength'),
  ('Forearm Plank',                    'Core',      'strength'),
  ('Incline Treadmill Walk',           'Full Body', 'cardio'),
  ('Wall Push-ups',                    'Chest',     'strength'),
  ('Battle Ropes',                     'Full Body', 'cardio'),
  ('Step-ups',                         'Legs',      'strength'),
  ('Medicine Ball Slams',              'Full Body', 'cardio'),
  ('Stationary Bike',                  'Full Body', 'cardio'),
  ('Seated Leg Curls',                 'Legs',      'strength'),
  ('Machine Chest Press',              'Chest',     'strength'),
  ('Standing Calf Raises',             'Legs',      'strength'),
  ('Cat-Cow',                          'Back',      'flexibility'),
  ('Shadow Boxing',                    'Full Body', 'cardio'),
  ('Bodyweight Squats',                'Legs',      'strength'),
  ('Resistance Band Rows',             'Back',      'strength'),
  ('Wall Slides',                      'Shoulders', 'strength'),
  ('Diaphragmatic Breathing',          'Full Body', 'flexibility'),
  ('Warm-Up Walking',                  'Full Body', 'cardio'),
  ('Machine Shoulder Press',           'Shoulders', 'strength'),
  ('Walking',                          'Full Body', 'cardio'),
  ('Resistance Band Bicep Curls',      'Arms',      'strength'),
  ('Resistance Band Chest Press',      'Chest',     'strength'),
  ('Resistance Band Shoulder Press',   'Shoulders', 'strength'),
  ('Stationary Cycling',               'Full Body', 'cardio'),
  ('Steady-State Walking',             'Full Body', 'cardio'),
  ('Treadmill Walking',                'Full Body', 'cardio'),
  ('Seated Leg Extensions',            'Legs',      'strength'),
  ('Pursed-Lip Breathing',             'Full Body', 'flexibility'),
  ('Cool-Down Walk',                   'Full Body', 'cardio'),
  ('Cool-Down Walking',                'Full Body', 'cardio'),
  ('Interval Cycling',                 'Full Body', 'cardio'),
  ('Interval Walking',                 'Full Body', 'cardio'),
  ('Seated Chest Press',               'Chest',     'strength'),

  -- Clinical: Musculoskeletal & Orthopedic
  ('McGill Curl-Up',                   'Core',      'strength'),
  ('Child''s Pose Decompression',      'Back',      'flexibility'),
  ('Seated Sciatic Nerve Glide',       'Legs',      'flexibility'),
  ('90/90 Hip Switches',               'Hips',      'flexibility'),
  ('Clamshells',                       'Glutes',    'strength'),
  ('Single-Leg RDL Bodyweight',        'Legs',      'strength'),
  ('Hip Flexor Stretch Half-Kneeling', 'Hips',      'flexibility'),
  ('Wall Dead Bug',                    'Core',      'strength'),
  ('Figure-4 Glute Stretch',           'Glutes',    'flexibility'),
  ('Leg Extensions Machine',           'Legs',      'strength'),
  ('Seated Rows Neutral Grip',         'Back',      'strength'),
  ('Hamstring Curls Machine',          'Legs',      'strength'),
  ('Scapular Squeezes',                'Back',      'strength'),
  ('Wall Sits Partial Depth',          'Legs',      'strength'),
  ('Seated Chest Fly Machine',         'Chest',     'strength'),
  ('Wrist & Ankle Circles',            'Full Body', 'flexibility'),
  ('Sit-to-Stand Chair',               'Legs',      'strength'),
  ('Resistance Band Pull-aparts',      'Shoulders', 'strength'),
  ('Step-ups 4-inch box',              'Legs',      'strength'),
  ('Standing Side Leg Lifts',          'Glutes',    'strength'),
  ('Face Pulls',                       'Shoulders', 'strength'),
  ('Static Quad Sets',                 'Legs',      'strength'),
  ('Dumbbell Floor Press',             'Chest',     'strength'),
  ('Standing Dumbbell Rows',           'Back',      'strength'),
  ('Weighted Step-ups',                'Legs',      'strength'),
  ('Dumbbell Curl to Overhead Press',  'Arms',      'strength'),
  ('Dumbbell Overhead Press',          'Shoulders', 'strength'),
  ('Standing Heel Raises',             'Legs',      'strength'),
  ('Single-Leg Balance',               'Legs',      'strength'),
  ('Tandem Walk',                      'Full Body', 'strength'),
  ('Resistance Band Lat Pulldown',     'Back',      'strength'),
  ('Medicine Ball Chest Pass Light',   'Chest',     'strength'),
  ('Side-to-Side Step Touches',        'Full Body', 'cardio'),
  ('Modified Bird-Dog',                'Core',      'strength'),
  ('Tai Chi Lunges',                   'Legs',      'flexibility'),
  ('Pendulum Swings',                  'Shoulders', 'flexibility'),
  ('Crossover Arm Stretch',            'Shoulders', 'flexibility'),
  ('Sleeper Stretch',                  'Shoulders', 'flexibility'),
  ('Scapular Setting',                 'Back',      'strength'),
  ('Isometric External Rotation',      'Shoulders', 'strength'),
  ('Isometric Internal Rotation',      'Shoulders', 'strength'),
  ('Prone Horizontal Abduction',       'Shoulders', 'strength'),
  ('Full-Can Scaption Thumb-Up',       'Shoulders', 'strength'),
  ('Standing External Rotation',       'Shoulders', 'strength'),
  ('Standing Internal Rotation',       'Shoulders', 'strength'),
  ('Standing Row',                     'Back',      'strength'),
  ('Prone Y Raise',                    'Back',      'strength'),
  ('Bent-Over Horizontal Abduction',   'Shoulders', 'strength'),
  ('Ankle Pumps',                      'Feet',      'strength'),
  ('Heel Slides',                      'Legs',      'flexibility'),
  ('Quad Sets',                        'Legs',      'strength'),
  ('Straight Leg Raises',              'Legs',      'strength'),
  ('Hamstring Sets',                   'Legs',      'strength'),
  ('Double-Leg Quarter Squats',        'Legs',      'strength'),
  ('Knee Extension Stretch',           'Legs',      'flexibility'),
  ('Side-Lying Hip Abduction',         'Glutes',    'strength'),
  ('Straight Leg Raises with Resistance', 'Legs',  'strength'),
  ('Terminal Knee Extension Band',     'Legs',      'strength'),
  ('Single-Leg Heel Raises',           'Legs',      'strength'),
  ('Hamstring Curls Band or Prone',    'Legs',      'strength'),

  -- Clinical: Postural Deviations
  ('Chin Tucks',                       'Back',      'strength'),
  ('Prone Y-T-W Raises',               'Back',      'strength'),
  ('Seated Cable Row High Elbows',     'Back',      'strength'),
  ('Dead Bug Arms Overhead',           'Core',      'strength'),
  ('Farmers Carry Tall Spine',         'Full Body', 'strength'),
  ('Single-Arm Dumbbell Row',          'Back',      'strength'),
  ('Pec Minor Release',                'Chest',     'flexibility'),
  ('Glute Bridge with Band',           'Glutes',    'strength'),
  ('Plank with Knee Taps',             'Core',      'strength'),
  ('Goblet Squat Neutral Pelvis',      'Legs',      'strength'),
  ('Side Plank Weak Side',             'Core',      'strength'),
  ('Bird-Dog Leg Extension Focus',     'Core',      'strength'),
  ('Single-Arm Lat Pulldown',          'Back',      'strength'),
  ('Standing Single-Arm Press',        'Shoulders', 'strength'),
  ('Seated Torso Rotation Controlled', 'Core',      'strength'),
  ('Child''s Pose with Side Reach',    'Back',      'flexibility'),

  -- Clinical: Special Populations
  ('Chair Squats',                     'Legs',      'strength'),
  ('Seated Resistance Band Rows',      'Back',      'strength'),
  ('Single-Leg Balance Wall Support',  'Legs',      'strength'),
  ('Modified Dead Bug',                'Core',      'strength'),
  ('Tandem Stance',                    'Full Body', 'strength'),
  ('Step-ups Low Step',                'Legs',      'strength'),
  ('Hip Abduction Standing',           'Glutes',    'strength'),
  ('Pelvic Tilts',                     'Core',      'strength'),
  ('Incline Push-ups',                 'Chest',     'strength'),
  ('Glute Bridges',                    'Glutes',    'strength'),
  ('Reverse Lunges',                   'Legs',      'strength'),
  ('Seated Row Band or Cable',         'Back',      'strength'),
  ('Squat to Box',                     'Legs',      'strength'),
  ('Hip Flexor & Chest Stretch',       'Full Body', 'flexibility'),
  ('Seated Row',                       'Back',      'strength'),
  ('Hamstring Curls',                  'Legs',      'strength'),
  ('Resistance Band Chest Fly',        'Chest',     'strength'),
  ('Side-Lying Leg Lifts',             'Glutes',    'strength'),
  ('Arm Circles & Shoulder Mobility',  'Shoulders', 'flexibility'),
  ('Sit-to-Stand Controlled',          'Legs',      'strength'),
  ('Resistance Band Knee Extension',   'Legs',      'strength'),
  ('Bodyweight Quarter Squat',         'Legs',      'strength'),
  ('Plank Modified',                   'Core',      'strength'),
  ('Bicep Curls Light',                'Arms',      'strength'),
  ('Single-Leg Balance Eyes Open',     'Legs',      'strength'),
  ('Single-Leg Balance Eyes Closed',   'Legs',      'strength'),
  ('Wobble Board Balance',             'Full Body', 'strength'),
  ('Seated Gym Ball Balance',          'Core',      'strength'),
  ('Slow Lateral Weight Shifts',       'Full Body', 'strength'),
  ('Gentle Walking',                   'Full Body', 'cardio'),

  -- Clinical: Neurological & Mental Health
  ('Marching in Place High Knees',     'Full Body', 'cardio'),
  ('Seated Medicine Ball Twists',      'Core',      'strength'),
  ('Opposite Arm Leg Reach Seated',    'Core',      'strength'),
  ('Step-ups Slow and Controlled',     'Legs',      'strength'),
  ('Bird-Dog Modified',                'Core',      'strength'),
  ('Modified Child''s Pose',           'Back',      'flexibility'),
  ('Relaxation Breathwork',            'Full Body', 'flexibility'),
  ('Elliptical Trainer',               'Full Body', 'cardio'),
  ('Deep Breathing Cool-Down',         'Full Body', 'flexibility'),
  ('Gentle Stationary Cycling',        'Full Body', 'cardio'),
  ('Seated Forward Fold Stretch',      'Legs',      'flexibility'),
  ('Progressive Muscle Relaxation',    'Full Body', 'flexibility'),
  ('Lying Stretches',                  'Full Body', 'flexibility'),
  ('Seated Arm Circles',               'Shoulders', 'flexibility'),
  ('Seated Knee Extensions',           'Legs',      'strength'),
  ('Rest Periods Between Every Set',   'Full Body', 'flexibility'),
  ('Gentle Full-Body Stretching',      'Full Body', 'flexibility'),
  ('Deep Breathing Exercises',         'Full Body', 'flexibility'),
  ('Resistance Band Work',             'Full Body', 'strength'),
  ('Relaxation & Body Scan',           'Full Body', 'flexibility'),

  -- Newly exposed base names after stripping set/rep info
  ('Glute Bridge',                     'Glutes',    'strength'),
  ('Seated Cable Row',                 'Back',      'strength')

ON CONFLICT (name) DO NOTHING;

-- ── Migration 025 note ────────────────────────────────────────
-- Clinical template exercise_names are set to clean base names
-- (no set/rep prescriptions) directly in the INSERT above.
-- For existing databases, run the explicit UPDATE statements in
-- supabase/seed.sql (search for "Migration 025 cleanup").


-- ============================================================
-- Migration 026 — allow any trainer to adjust any client's credits
-- ============================================================
-- Replace the old policies that restricted credit writes to the
-- client's own trainer with policies that allow any trainer.

DROP POLICY IF EXISTS "credits_trainer_upsert" ON client_credits;
DROP POLICY IF EXISTS "credits_trainer_update" ON client_credits;

CREATE POLICY "credits_trainer_upsert" ON client_credits
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

CREATE POLICY "credits_trainer_update" ON client_credits
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ============================================================
-- Migration 027 — client account linking (family view)
-- ============================================================
-- Trainers can link client accounts together. Linked clients
-- can view and edit each other's data (profile, workouts,
-- nutrition, media, credits) just like the trainer view.

-- ── Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id       UUID NOT NULL REFERENCES trainers(id)  ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES clients(id)   ON DELETE CASCADE,
  linked_client_id UUID NOT NULL REFERENCES clients(id)   ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_links_no_self CHECK (client_id != linked_client_id)
);

-- One row per unordered pair (A↔B and B↔A are the same relationship)
CREATE UNIQUE INDEX IF NOT EXISTS client_links_pair_uniq ON client_links (
  LEAST(client_id::text,        linked_client_id::text),
  GREATEST(client_id::text,     linked_client_id::text)
);

ALTER TABLE client_links ENABLE ROW LEVEL SECURITY;

-- Trainers: full CRUD on links they created
CREATE POLICY "client_links_trainer_select" ON client_links
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));
CREATE POLICY "client_links_trainer_insert" ON client_links
  FOR INSERT TO authenticated WITH CHECK (trainer_id = auth.uid());
CREATE POLICY "client_links_trainer_delete" ON client_links
  FOR DELETE TO authenticated USING (trainer_id = auth.uid());

-- Clients: read links where they appear on either side
CREATE POLICY "client_links_client_select" ON client_links
  FOR SELECT TO authenticated
  USING (
    client_id        IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    OR linked_client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
  );

-- ── Helper function ───────────────────────────────────────────
-- Returns true if the caller (auth.uid()) is a linked client of target_client_id.
-- SECURITY DEFINER so it can read both tables without being subject to their RLS.

CREATE OR REPLACE FUNCTION is_linked_to_client(target_client_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_links cl
    JOIN clients me ON me.auth_user_id = auth.uid()
    WHERE (cl.client_id = me.id AND cl.linked_client_id = target_client_id)
       OR (cl.linked_client_id = me.id AND cl.client_id = target_client_id)
  );
$$;

-- ── Linked-client SELECT policies ─────────────────────────────

-- clients
CREATE POLICY "clients_linked_select" ON clients
  FOR SELECT TO authenticated USING (is_linked_to_client(id));

-- clients UPDATE (edit profile / body metrics of a linked client)
CREATE POLICY "clients_linked_update" ON clients
  FOR UPDATE TO authenticated
  USING (is_linked_to_client(id))
  WITH CHECK (is_linked_to_client(id));

-- workouts
CREATE POLICY "workouts_linked_select" ON workouts
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- workout_sets
CREATE POLICY "workout_sets_linked_select" ON workout_sets
  FOR SELECT TO authenticated
  USING (
    workout_id IN (
      SELECT id FROM workouts WHERE is_linked_to_client(client_id)
    )
  );

-- client_media
CREATE POLICY "client_media_linked_select" ON client_media
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- assigned_workouts
CREATE POLICY "assigned_workouts_linked_select" ON assigned_workouts
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- assigned_workout_exercises
CREATE POLICY "awe_linked_select" ON assigned_workout_exercises
  FOR SELECT TO authenticated
  USING (
    assigned_workout_id IN (
      SELECT id FROM assigned_workouts WHERE is_linked_to_client(client_id)
    )
  );

-- assigned_workout_sets
CREATE POLICY "aws_linked_select" ON assigned_workout_sets
  FOR SELECT TO authenticated
  USING (
    assigned_workout_exercise_id IN (
      SELECT awe.id FROM assigned_workout_exercises awe
      JOIN assigned_workouts aw ON aw.id = awe.assigned_workout_id
      WHERE is_linked_to_client(aw.client_id)
    )
  );

-- client_credits
CREATE POLICY "credits_linked_select" ON client_credits
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- credit_transactions
CREATE POLICY "transactions_linked_select" ON credit_transactions
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- recipes
CREATE POLICY "recipes_linked_select" ON recipes
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- recipe_ingredients
CREATE POLICY "recipe_ingredients_linked_select" ON recipe_ingredients
  FOR SELECT TO authenticated
  USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE is_linked_to_client(client_id)
    )
  );

-- nutrition_logs
CREATE POLICY "nutrition_logs_linked_select" ON nutrition_logs
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));
CREATE POLICY "nutrition_logs_linked_insert" ON nutrition_logs
  FOR INSERT TO authenticated WITH CHECK (is_linked_to_client(client_id));
CREATE POLICY "nutrition_logs_linked_delete" ON nutrition_logs
  FOR DELETE TO authenticated USING (is_linked_to_client(client_id));

-- nutrition_goals
CREATE POLICY "nutrition_goals_linked_select" ON nutrition_goals
  FOR SELECT TO authenticated USING (is_linked_to_client(client_id));

-- ============================================================
-- Migration 027b — linked-client write access
-- ============================================================
-- Extends M027 with full write policies so linked clients can
-- log workouts, manage nutrition, and manage recipes for each
-- other's accounts — just like a trainer can.

-- workouts: linked clients can log/edit/delete for each other
CREATE POLICY "workouts_linked_insert" ON workouts
  FOR INSERT TO authenticated
  WITH CHECK (is_linked_to_client(client_id) AND logged_by_user_id = auth.uid());

CREATE POLICY "workouts_linked_update" ON workouts
  FOR UPDATE TO authenticated
  USING (is_linked_to_client(client_id) AND logged_by_user_id = auth.uid());

CREATE POLICY "workouts_linked_delete" ON workouts
  FOR DELETE TO authenticated
  USING (is_linked_to_client(client_id) AND logged_by_user_id = auth.uid());

-- workout_sets: linked clients can write sets for workouts they logged
CREATE POLICY "workout_sets_linked_write" ON workout_sets
  FOR ALL TO authenticated
  USING (
    workout_id IN (
      SELECT id FROM workouts
      WHERE logged_by_user_id = auth.uid() AND is_linked_to_client(client_id)
    )
  );

-- recipes: linked clients have full CRUD on each other's recipes
CREATE POLICY "recipes_linked_all" ON recipes
  FOR ALL TO authenticated
  USING (is_linked_to_client(client_id))
  WITH CHECK (is_linked_to_client(client_id));

CREATE POLICY "recipe_ingredients_linked_all" ON recipe_ingredients
  FOR ALL TO authenticated
  USING (
    recipe_id IN (SELECT id FROM recipes WHERE is_linked_to_client(client_id))
  )
  WITH CHECK (
    recipe_id IN (SELECT id FROM recipes WHERE is_linked_to_client(client_id))
  );

-- nutrition_goals: linked clients can read and update each other's goals
CREATE POLICY "nutrition_goals_linked_all" ON nutrition_goals
  FOR ALL TO authenticated
  USING (is_linked_to_client(client_id))
  WITH CHECK (is_linked_to_client(client_id));

-- ============================================================
-- Migration 027c — allow any trainer to delete any family link
-- ============================================================
-- Auto-generated mesh links carry the creating trainer's ID.
-- Any trainer must be able to remove them during unlink/regroup.

DROP POLICY IF EXISTS "client_links_trainer_delete" ON client_links;

CREATE POLICY "client_links_trainer_delete" ON client_links
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));

-- ============================================================
-- Migration 028 — Recurring Workout Plans
-- ============================================================
-- Trainers can schedule a workout template to repeat on chosen
-- days of the week. Each occurrence is stored as an
-- assigned_workout row (with recurring_plan_id set). Individual
-- instances can be edited or cancelled without affecting others.

-- ── Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recurring_plans (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID        NOT NULL REFERENCES trainers(id)  ON DELETE CASCADE,
  client_id    UUID        NOT NULL REFERENCES clients(id)   ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  notes        TEXT,
  days_of_week INT[]       NOT NULL,   -- 0=Sun 1=Mon … 6=Sat
  frequency    TEXT        NOT NULL DEFAULT 'weekly'
                           CHECK (frequency IN ('weekly', 'biweekly')),
  start_date   DATE        NOT NULL,
  end_date     DATE        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Extend assigned_workouts ───────────────────────────────────

-- Link each generated instance back to its plan (SET NULL on plan delete)
ALTER TABLE assigned_workouts
  ADD COLUMN IF NOT EXISTS recurring_plan_id UUID
    REFERENCES recurring_plans(id) ON DELETE SET NULL;

-- Allow 'cancelled' status on individual instances
ALTER TABLE assigned_workouts
  DROP CONSTRAINT IF EXISTS assigned_workouts_status_check;
ALTER TABLE assigned_workouts
  ADD CONSTRAINT assigned_workouts_status_check
  CHECK (status IN ('assigned', 'completed', 'cancelled'));

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE recurring_plans ENABLE ROW LEVEL SECURITY;

-- Trainers have full CRUD on their own plans
CREATE POLICY "rp_trainer_all" ON recurring_plans
  FOR ALL TO authenticated
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Clients can view their own plans (read-only)
CREATE POLICY "rp_client_select" ON recurring_plans
  FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()));

-- Linked family members can view
CREATE POLICY "rp_linked_select" ON recurring_plans
  FOR SELECT TO authenticated
  USING (is_linked_to_client(client_id));

-- ============================================================
-- Migration 030 — Client Check-ins
-- ============================================================
-- QR-code-based gym check-in log.
-- Client shows their QR code; trainer scans it to record the visit.

CREATE TABLE IF NOT EXISTS client_checkins (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID        NOT NULL REFERENCES clients(id)  ON DELETE CASCADE,
  trainer_id     UUID        NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  checked_in_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note           TEXT
);

CREATE INDEX IF NOT EXISTS client_checkins_client_idx  ON client_checkins (client_id, checked_in_at DESC);
CREATE INDEX IF NOT EXISTS client_checkins_trainer_idx ON client_checkins (trainer_id, checked_in_at DESC);

ALTER TABLE client_checkins ENABLE ROW LEVEL SECURITY;

-- Trainer who performed the scan: full access
CREATE POLICY "checkins_trainer_all" ON client_checkins
  FOR ALL TO authenticated
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Client can read their own check-ins
CREATE POLICY "checkins_client_select" ON client_checkins
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );
