-- ============================================================
-- Migration 012: Client intake form + client self-update RLS
-- Run in Supabase SQL Editor against your existing database.
-- ============================================================

-- Add intake_completed flag to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Create client_intake table
CREATE TABLE IF NOT EXISTS client_intake (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID        NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  address             TEXT,
  emergency_name      TEXT,
  emergency_phone     TEXT,
  emergency_relation  TEXT,
  occupation          TEXT,
  current_injuries    TEXT,
  past_injuries       TEXT,
  chronic_conditions  TEXT,
  medications         TEXT,
  activity_level      TEXT,
  goals               TEXT,
  goal_timeframe      TEXT,
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS client_intake_updated_at ON client_intake;
CREATE TRIGGER client_intake_updated_at
  BEFORE UPDATE ON client_intake
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE client_intake ENABLE ROW LEVEL SECURITY;

-- Trainers: full access
DO $$ BEGIN
  CREATE POLICY "client_intake: authenticated" ON client_intake
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients: read their own intake row
DO $$ BEGIN
  CREATE POLICY "clients_read_own_intake" ON client_intake
    FOR SELECT USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients: write their own intake row
DO $$ BEGIN
  CREATE POLICY "clients_write_own_intake" ON client_intake
    FOR ALL USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow clients to update their own client row (intake_completed + name/DOB/phone sync)
DO $$ BEGIN
  CREATE POLICY "clients: client update own" ON clients
    FOR UPDATE USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients: read and manage their own media
DO $$ BEGIN
  CREATE POLICY "clients_read_own_media" ON client_media
    FOR SELECT USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_insert_own_media" ON client_media
    FOR INSERT WITH CHECK (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "clients_delete_own_media" ON client_media
    FOR DELETE USING (
      client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
