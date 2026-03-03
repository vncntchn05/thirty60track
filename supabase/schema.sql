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

-- Trainers: each trainer sees and edits only their own profile.
CREATE POLICY "trainers: own row" ON trainers
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

-- Workouts: trainer sees workouts they logged for their clients.
CREATE POLICY "workouts: own trainer" ON workouts
  FOR ALL USING (auth.uid() = trainer_id);

-- Workout sets: accessible via workout ownership (join check).
CREATE POLICY "workout_sets: via workout trainer" ON workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_sets.workout_id
        AND w.trainer_id = auth.uid()
    )
  );
