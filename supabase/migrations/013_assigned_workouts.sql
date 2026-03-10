-- ============================================================
-- Migration 013: Trainer-assigned future workouts
-- Run in Supabase SQL Editor against your existing database.
-- ============================================================

CREATE TABLE IF NOT EXISTS assigned_workouts (
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

CREATE TABLE IF NOT EXISTS assigned_workout_exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_id   UUID NOT NULL REFERENCES assigned_workouts(id) ON DELETE CASCADE,
  exercise_id           UUID NOT NULL REFERENCES exercises(id),
  order_index           INTEGER NOT NULL DEFAULT 0,
  superset_group        INTEGER
);

CREATE TABLE IF NOT EXISTS assigned_workout_sets (
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
DO $$ BEGIN
  CREATE POLICY "trainer_all_assigned_workouts" ON assigned_workouts
    FOR ALL USING (trainer_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trainer_all_assigned_exercises" ON assigned_workout_exercises
    FOR ALL USING (
      assigned_workout_id IN (
        SELECT id FROM assigned_workouts WHERE trainer_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "trainer_all_assigned_sets" ON assigned_workout_sets
    FOR ALL USING (
      assigned_workout_exercise_id IN (
        SELECT awe.id FROM assigned_workout_exercises awe
        JOIN assigned_workouts aw ON aw.id = awe.assigned_workout_id
        WHERE aw.trainer_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients: read their own assigned workouts
DO $$ BEGIN
  CREATE POLICY "clients_read_assigned_workouts" ON assigned_workouts
    FOR SELECT USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_read_assigned_exercises" ON assigned_workout_exercises
    FOR SELECT USING (
      assigned_workout_id IN (
        SELECT aw.id FROM assigned_workouts aw
        JOIN clients c ON c.id = aw.client_id
        WHERE c.auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_read_assigned_sets" ON assigned_workout_sets
    FOR SELECT USING (
      assigned_workout_exercise_id IN (
        SELECT awe.id FROM assigned_workout_exercises awe
        JOIN assigned_workouts aw ON aw.id = awe.assigned_workout_id
        JOIN clients c ON c.id = aw.client_id
        WHERE c.auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients: update assigned_workouts (to mark as completed)
DO $$ BEGIN
  CREATE POLICY "clients_update_assigned_workouts" ON assigned_workouts
    FOR UPDATE USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
