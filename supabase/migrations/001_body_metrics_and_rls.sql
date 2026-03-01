-- ============================================================
-- Migration 001: Body metrics columns + updated clients RLS
-- Run in Supabase SQL Editor against your existing database.
-- ============================================================

-- ─── Add body-metric columns to clients ───────────────────

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS weight_kg      NUMERIC(5,2) CHECK (weight_kg > 0),
  ADD COLUMN IF NOT EXISTS height_cm      NUMERIC(5,1) CHECK (height_cm > 0),
  ADD COLUMN IF NOT EXISTS bf_percent     NUMERIC(4,2) CHECK (bf_percent BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS lean_body_mass NUMERIC(6,2);

-- Generated column must be added separately (no IF NOT EXISTS for generated columns).
-- Wrap in a DO block so it is idempotent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'bmi'
  ) THEN
    ALTER TABLE clients
      ADD COLUMN bmi NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE
          WHEN height_cm IS NOT NULL AND weight_kg IS NOT NULL AND height_cm > 0
            THEN ROUND(weight_kg / ((height_cm / 100.0) ^ 2), 2)
          ELSE NULL
        END
      ) STORED;
  END IF;
END;
$$;

-- ─── Replace clients RLS policies ─────────────────────────

-- Drop the old catch-all policy (and any partial ones from a prior run).
DROP POLICY IF EXISTS "clients: own clients"         ON clients;
DROP POLICY IF EXISTS "clients: authenticated read"  ON clients;
DROP POLICY IF EXISTS "clients: own trainer insert"  ON clients;
DROP POLICY IF EXISTS "clients: own trainer update"  ON clients;
DROP POLICY IF EXISTS "clients: own trainer delete"  ON clients;

-- Any authenticated trainer can read any client.
CREATE POLICY "clients: authenticated read" ON clients
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only the owning trainer can insert, update, or delete.
CREATE POLICY "clients: own trainer insert" ON clients
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "clients: own trainer update" ON clients
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "clients: own trainer delete" ON clients
  FOR DELETE USING (auth.uid() = trainer_id);
