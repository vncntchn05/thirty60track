-- ============================================================
-- Migration 041 — Master QR Check-In
-- ============================================================
-- Clients now self-check-in by scanning a shared master QR code
-- printed at the gym. trainer_id is nullable (NULL = self check-in).

ALTER TABLE client_checkins ALTER COLUMN trainer_id DROP NOT NULL;
ALTER TABLE client_checkins ADD COLUMN IF NOT EXISTS is_self_checkin BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: only index rows where trainer_id is set
DROP INDEX IF EXISTS client_checkins_trainer_idx;
CREATE INDEX IF NOT EXISTS client_checkins_trainer_idx
  ON client_checkins (trainer_id, checked_in_at DESC)
  WHERE trainer_id IS NOT NULL;

-- Trainers can view ALL check-ins for their own clients (including self-check-ins)
CREATE POLICY "checkins_trainer_select_clients" ON client_checkins
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE trainer_id = auth.uid())
  );

-- Clients can self-insert a check-in (no trainer involved)
CREATE POLICY "checkins_client_self_insert" ON client_checkins
  FOR INSERT TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())
    AND is_self_checkin = TRUE
    AND trainer_id IS NULL
  );
