-- Migration 001b: Restore narrow clients SELECT policy.
--
-- Migration 001 recreated "clients: authenticated read" (any authenticated
-- user can read all clients). Schema.sql later replaces it with the narrower
-- "clients: trainer read" (trainers only). This migration ensures that
-- narrower policy is in effect regardless of run order.

DROP POLICY IF EXISTS "clients: authenticated read" ON clients;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'clients: trainer read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "clients: trainer read" ON clients
        FOR SELECT USING (EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid()));
    $p$;
  END IF;
END;
$$;
