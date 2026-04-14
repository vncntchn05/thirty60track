-- ============================================================
-- Migration 031 — Personal Records
-- ============================================================
-- Tracks all-time best weight and best reps per client per exercise.
-- Updated automatically when a workout is logged via the app hook.

CREATE TABLE IF NOT EXISTS personal_records (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               UUID        NOT NULL REFERENCES clients(id)   ON DELETE CASCADE,
  exercise_id             UUID        NOT NULL REFERENCES exercises(id)  ON DELETE CASCADE,
  max_weight_kg           NUMERIC(8,3),
  max_reps                INTEGER,
  max_weight_achieved_at  DATE,
  max_reps_achieved_at    DATE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS personal_records_client_idx
  ON personal_records (client_id, exercise_id);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Trainer: full access to records for their clients
CREATE POLICY "pr_trainer_all" ON personal_records
  FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id = auth.uid()
    )
  );

-- Client: read + upsert their own records
CREATE POLICY "pr_client_select" ON personal_records
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "pr_client_insert" ON personal_records
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "pr_client_update" ON personal_records
  FOR UPDATE TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  );
