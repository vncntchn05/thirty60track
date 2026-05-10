/**
 * send-booking-email — Supabase Edge Function
 *
 * Sends an email to a client when a workout is booked on their behalf.
 * Called fire-and-forget from client-side hooks after booking mutations.
 *
 * Required Supabase secrets (supabase secrets set):
 *   RESEND_API_KEY   — re_... from resend.com
 *   FROM_EMAIL       — e.g. noreply@thirty60fitness.com (must be verified in Resend)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL        = Deno.env.get('FROM_EMAIL') ?? 'noreply@thirty60fitness.com';
const APP_NAME          = 'thirty60 fitness';

function adminDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE);
}

// ─── Email templates ──────────────────────────────────────────

function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#000; color:#eee; margin:0; padding:20px; }
    .card { max-width:520px; margin:0 auto; background:#111; border:1px solid #333; border-radius:12px; overflow:hidden; }
    .header { background:#B88C32; padding:20px 24px; }
    .header h1 { margin:0; color:#000; font-size:20px; font-weight:700; letter-spacing:.5px; }
    .body { padding:24px; }
    .row { display:flex; gap:8px; margin-bottom:12px; align-items:flex-start; }
    .label { color:#999; font-size:13px; min-width:80px; padding-top:2px; }
    .value { color:#eee; font-size:14px; font-weight:600; }
    .footer { padding:16px 24px; border-top:1px solid #333; color:#666; font-size:12px; }
  </style>
</head>
<body>
  <div class="card">${body}</div>
</body>
</html>`;
}

type Payload =
  | { type: 'session_confirmed'; clientId: string; scheduledAt: string; durationMinutes: number; trainerName: string }
  | { type: 'assigned_workout'; clientId: string; title: string | null; scheduledDate: string; scheduledTime: string | null }
  | { type: 'recurring_plan'; clientId: string; title: string; occurrenceCount: number; startDate: string; scheduledTime: string | null };

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtTime24(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function fmtSessionAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function buildSubjectAndHtml(p: Payload): { subject: string; html: string } {
  if (p.type === 'session_confirmed') {
    const when = fmtSessionAt(p.scheduledAt);
    return {
      subject: `Session confirmed — ${when}`,
      html: baseHtml(`
        <div class="header"><h1>Session Confirmed</h1></div>
        <div class="body">
          <p style="color:#ccc;margin-top:0">Your training session has been confirmed.</p>
          <div class="row"><span class="label">When</span><span class="value">${when}</span></div>
          <div class="row"><span class="label">Duration</span><span class="value">${p.durationMinutes} minutes</span></div>
          <div class="row"><span class="label">Trainer</span><span class="value">${p.trainerName}</span></div>
        </div>
        <div class="footer">${APP_NAME} · You're receiving this because a session was confirmed for your account.</div>
      `),
    };
  }

  if (p.type === 'assigned_workout') {
    const timeStr = p.scheduledTime ? ` at ${fmtTime24(p.scheduledTime)}` : '';
    return {
      subject: `New workout assigned — ${fmtDate(p.scheduledDate)}`,
      html: baseHtml(`
        <div class="header"><h1>Workout Assigned</h1></div>
        <div class="body">
          <p style="color:#ccc;margin-top:0">Your trainer has assigned a workout for you.</p>
          ${p.title ? `<div class="row"><span class="label">Title</span><span class="value">${p.title}</span></div>` : ''}
          <div class="row"><span class="label">Date</span><span class="value">${fmtDate(p.scheduledDate)}${timeStr}</span></div>
        </div>
        <div class="footer">${APP_NAME} · Open the app to view your workout.</div>
      `),
    };
  }

  // recurring_plan
  const timeStr = p.scheduledTime ? ` at ${fmtTime24(p.scheduledTime)}` : '';
  return {
    subject: `Recurring workouts scheduled — ${p.title}`,
    html: baseHtml(`
      <div class="header"><h1>Recurring Series Scheduled</h1></div>
      <div class="body">
        <p style="color:#ccc;margin-top:0">Your trainer has set up a recurring workout series for you.</p>
        <div class="row"><span class="label">Series</span><span class="value">${p.title}</span></div>
        <div class="row"><span class="label">Starts</span><span class="value">${fmtDate(p.startDate)}${timeStr}</span></div>
        <div class="row"><span class="label">Sessions</span><span class="value">${p.occurrenceCount} workouts scheduled</span></div>
      </div>
      <div class="footer">${APP_NAME} · Open the app to view your upcoming workouts.</div>
    `),
  };
}

// ─── Send via Resend ──────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[send-booking-email] RESEND_API_KEY not set — skipping email');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[send-booking-email] Resend error', res.status, body);
  }
}

// ─── Resolve client email ─────────────────────────────────────

async function getClientEmail(clientId: string): Promise<string | null> {
  const db = adminDb();
  const { data: client } = await db
    .from('clients')
    .select('auth_user_id')
    .eq('id', clientId)
    .single();
  if (!client?.auth_user_id) return null;

  const { data: { user }, error } = await db.auth.admin.getUserById(client.auth_user_id);
  if (error || !user?.email) return null;
  return user.email;
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: Payload = await req.json();

    const email = await getClientEmail(payload.clientId);
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: 'client email not found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, html } = buildSubjectAndHtml(payload);
    await sendEmail(email, subject, html);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-booking-email]', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, // always 200 so fire-and-forget callers don't retry
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
