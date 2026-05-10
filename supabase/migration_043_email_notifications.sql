-- ============================================================
-- Migration 043 — Email Notifications
-- ============================================================
-- Adds infrastructure for:
--   1. Booking confirmation emails (called from edge function)
--   2. Unread message reminder emails (daily cron job)
--
-- Required Supabase secrets (set via: supabase secrets set KEY=value):
--   RESEND_API_KEY   — re_... from resend.com
--   FROM_EMAIL       — verified sender address (e.g. noreply@thirty60fitness.com)
--
-- Required Supabase extensions (enable in dashboard if not already):
--   pg_net    — for HTTP calls from pg_cron
--   pg_cron   — for scheduling the unread reminder
--
-- After running this migration, set the DB settings used by pg_cron:
--   ALTER DATABASE postgres SET app.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
--   ALTER DATABASE postgres SET app.supabase_service_key = 'YOUR_SERVICE_ROLE_KEY';
-- ============================================================


-- ── 1. Track whether a reminder email has been sent per participant ──

ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMPTZ;


-- ── 2. Reset reminder flag when conversation is marked as read ────────

CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE conversation_participants
  SET last_read_at           = NOW(),
      email_reminder_sent_at = NULL
  WHERE conversation_id = p_conversation_id AND user_id = auth.uid();
$$;


-- ── 3. Helper function: find participants with stale unread messages ──
-- Called by the notify-unread edge function via RPC.
-- Returns rows where:
--   - email_reminder_sent_at IS NULL (no reminder sent yet)
--   - There is at least one message from another user that is:
--       * newer than last_read_at (unread), AND
--       * older than the cutoff timestamp (>24h)

CREATE OR REPLACE FUNCTION get_stale_unread_participants(p_cutoff TIMESTAMPTZ)
RETURNS TABLE(user_id UUID, conversation_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cp.user_id, cp.conversation_id
  FROM   conversation_participants cp
  WHERE  cp.email_reminder_sent_at IS NULL
  AND    EXISTS (
    SELECT 1
    FROM   messages m
    WHERE  m.conversation_id = cp.conversation_id
    AND    m.sender_id        != cp.user_id
    AND    m.created_at        > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
    AND    m.created_at        < p_cutoff
  );
$$;


-- ── 4. Schedule the notify-unread cron job (runs every hour) ────────────
-- Requires pg_cron and pg_net extensions to be enabled.
-- The URL is constructed from the app.supabase_url GUC setting.
-- Set it with: ALTER DATABASE postgres SET app.supabase_url = 'https://...';
--              ALTER DATABASE postgres SET app.supabase_service_key = '...';

-- ── 4. Schedule the notify-unread cron job ───────────────────────────
-- Run this block MANUALLY in the SQL editor after:
--   a) enabling pg_cron + pg_net in Dashboard → Database → Extensions
--   b) replacing the two placeholder values below with your real values
--      (Project Settings → API for the URL and service_role key)
--
-- SELECT cron.unschedule('notify-unread-messages');  -- re-run safety
-- SELECT cron.schedule(
--   'notify-unread-messages',
--   '0 * * * *',
--   $cmd$
--   SELECT net.http_post(
--     url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-unread',
--     headers := jsonb_build_object(
--       'Content-Type',  'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body    := '{}'::jsonb
--   );
--   $cmd$
-- );
