/**
 * notify-unread — Supabase Edge Function (cron job)
 *
 * Sends one reminder email per user for unread messages older than 24 hours.
 * Runs on a schedule via pg_cron. See migration_043 for the cron setup.
 *
 * Logic:
 *   - Find conversation_participants where email_reminder_sent_at IS NULL
 *     AND the latest message in that conversation is from someone else,
 *     is unread (created_at > last_read_at), and is older than 24 hours.
 *   - Group by user_id so each user gets at most one combined email.
 *   - Mark email_reminder_sent_at = now() for all processed rows.
 *
 * Required Supabase secrets:
 *   RESEND_API_KEY   — re_...
 *   FROM_EMAIL       — verified sender address
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL') ?? 'noreply@thirty60fitness.com';
const APP_NAME         = 'thirty60 fitness';

function adminDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[notify-unread] Resend error', res.status, body);
  }
}

function buildReminderHtml(unreadCount: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#000; color:#eee; margin:0; padding:20px; }
    .card { max-width:520px; margin:0 auto; background:#111; border:1px solid #333; border-radius:12px; overflow:hidden; }
    .header { background:#B88C32; padding:20px 24px; }
    .header h1 { margin:0; color:#000; font-size:20px; font-weight:700; }
    .body { padding:24px; color:#ccc; line-height:1.6; }
    .count { font-size:32px; font-weight:700; color:#B88C32; }
    .footer { padding:16px 24px; border-top:1px solid #333; color:#666; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h1>You have unread messages</h1></div>
    <div class="body">
      <div class="count">${unreadCount}</div>
      <p>unread conversation${unreadCount !== 1 ? 's' : ''} waiting for you.</p>
      <p>Open the ${APP_NAME} app to catch up with your trainer.</p>
    </div>
    <div class="footer">${APP_NAME} · This is a one-time reminder. We won't send another until you check your messages.</div>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const db = adminDb();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find participants with stale unread messages, no reminder sent yet.
    // Uses a raw query so we can join efficiently.
    const { data: rows, error } = await db.rpc('get_stale_unread_participants', { p_cutoff: cutoff });

    if (error) {
      console.error('[notify-unread] query error', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by user_id: { userId → Set<conversationId> }
    const byUser = new Map<string, Set<string>>();
    for (const row of (rows ?? []) as Array<{ user_id: string; conversation_id: string }>) {
      if (!byUser.has(row.user_id)) byUser.set(row.user_id, new Set());
      byUser.get(row.user_id)!.add(row.conversation_id);
    }

    let sent = 0;

    for (const [userId, convIds] of byUser) {
      // Get email from auth.users
      const { data: { user }, error: userErr } = await db.auth.admin.getUserById(userId);
      if (userErr || !user?.email) continue;

      const html = buildReminderHtml(convIds.size);
      const subject = convIds.size === 1
        ? 'You have an unread message'
        : `You have ${convIds.size} unread conversations`;

      await sendEmail(user.email, subject, html);
      sent++;

      // Mark reminder sent for all matching participation rows
      await db
        .from('conversation_participants')
        .update({ email_reminder_sent_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('conversation_id', [...convIds])
        .is('email_reminder_sent_at', null);
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[notify-unread]', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
