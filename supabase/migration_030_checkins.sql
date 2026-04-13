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
