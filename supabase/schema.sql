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
                            -- 'strength' | 'cardio' | 'flexibility' | 'other'
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
  -- Resolve the caller's email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Find an unlinked client row for this email
  SELECT id INTO v_id
  FROM clients
  WHERE email = v_email
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
