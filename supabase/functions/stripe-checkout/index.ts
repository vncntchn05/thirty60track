/**
 * stripe-checkout — Supabase Edge Function
 *
 * Handles three actions:
 *   create_session — creates a Stripe Checkout Session, persists a pending row
 *   check_session  — polls session status (client calls after returning from Stripe)
 *   (webhook)      — fulfils the purchase on checkout.session.completed
 *
 * Required Supabase secrets (supabase secrets set):
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET  — whsec_... from Stripe Dashboard → Webhooks
 *   APP_URL                — e.g. https://thirty60track.onrender.com
 *
 * Webhook URL to register in Stripe Dashboard:
 *   https://<project-ref>.supabase.co/functions/v1/stripe-checkout
 *   Events: checkout.session.completed
 */

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

// ─── Env ──────────────────────────────────────────────────────

const STRIPE_SECRET_KEY     = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_URL               = Deno.env.get('APP_URL') ?? 'https://thirty60track.onrender.com';

// ─── Clients ──────────────────────────────────────────────────

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as never });

function adminDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ─── Handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Stripe webhook: identified by the Stripe-Signature header ──
    const sig = req.headers.get('stripe-signature');
    if (sig) {
      return await handleWebhook(req, sig);
    }

    // ── JSON API calls from the app ────────────────────────────
    const body = await req.json() as Record<string, unknown>;
    const action = body.action as string;

    if (action === 'create_session') {
      return await handleCreateSession(body);
    }
    if (action === 'check_session') {
      return await handleCheckSession(body);
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('stripe-checkout error:', msg);
    return jsonResponse({ error: msg }, 500);
  }
});

// ─── create_session ───────────────────────────────────────────

async function handleCreateSession(body: Record<string, unknown>) {
  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'STRIPE_SECRET_KEY is not configured.' }, 500);
  }

  const clientId    = body.client_id   as string;
  const credits     = body.credits     as number;
  const amountCents = body.amount_cents as number;
  const packageId   = body.package_id  as string;

  if (!clientId || !credits || !amountCents) {
    return jsonResponse({ error: 'client_id, credits, and amount_cents are required.' }, 400);
  }

  const db = adminDb();

  // Verify client exists
  const { data: client, error: clientErr } = await db
    .from('clients')
    .select('id, full_name, email')
    .eq('id', clientId)
    .single();

  if (clientErr || !client) {
    return jsonResponse({ error: 'Client not found.' }, 404);
  }

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode:             'payment',
    payment_method_types: ['card'],
    customer_email:   client.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency:     'usd',
          unit_amount:  amountCents,
          product_data: {
            name:        `${credits} Training Credit${credits !== 1 ? 's' : ''}`,
            description: `30-min session = 1 credit · 60-min session = 2 credits`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      client_id:  clientId,
      credits:    String(credits),
      package_id: packageId ?? '',
    },
    success_url: `${APP_URL}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${APP_URL}?payment_status=cancelled`,
  });

  // Persist a pending payment session row
  await db.from('stripe_payment_sessions').insert({
    client_id:         clientId,
    stripe_session_id: session.id,
    credits,
    amount_cents:      amountCents,
    status:            'pending',
  });

  return jsonResponse({ checkout_url: session.url, session_id: session.id });
}

// ─── check_session ────────────────────────────────────────────

async function handleCheckSession(body: Record<string, unknown>) {
  const sessionId = body.session_id as string;
  if (!sessionId) return jsonResponse({ error: 'session_id is required.' }, 400);

  const db = adminDb();

  const { data: row } = await db
    .from('stripe_payment_sessions')
    .select('status, credits')
    .eq('stripe_session_id', sessionId)
    .single();

  if (!row) return jsonResponse({ status: 'pending' });

  return jsonResponse({ status: row.status, credits: row.credits });
}

// ─── webhook ──────────────────────────────────────────────────

async function handleWebhook(req: Request, sig: string) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured.');
    return jsonResponse({ error: 'Webhook secret not configured.' }, 500);
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', msg);
    return jsonResponse({ error: `Signature verification failed: ${msg}` }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillPurchase(session);
  }

  return jsonResponse({ received: true });
}

// ─── fulfillPurchase ──────────────────────────────────────────

async function fulfillPurchase(session: Stripe.Checkout.Session) {
  const clientId = session.metadata?.client_id;
  const credits  = parseInt(session.metadata?.credits ?? '0', 10);

  if (!clientId || !credits) {
    console.error('fulfillPurchase: missing metadata', session.metadata);
    return;
  }

  const db = adminDb();

  // Idempotency check: skip if already completed
  const { data: existing } = await db
    .from('stripe_payment_sessions')
    .select('status')
    .eq('stripe_session_id', session.id)
    .single();

  if (existing?.status === 'completed') {
    console.log('fulfillPurchase: already fulfilled', session.id);
    return;
  }

  // Read current balance (default 0 if no row yet)
  const { data: creditRow } = await db
    .from('client_credits')
    .select('balance')
    .eq('client_id', clientId)
    .single();

  const currentBalance = creditRow?.balance ?? 0;

  // Upsert balance
  const { error: creditErr } = await db
    .from('client_credits')
    .upsert({
      client_id:  clientId,
      balance:    currentBalance + credits,
      updated_at: new Date().toISOString(),
    });

  if (creditErr) {
    console.error('fulfillPurchase: credit upsert failed', creditErr);
    return;
  }

  // Record the transaction (trainer_id is NULL for client purchases)
  const { error: txErr } = await db
    .from('credit_transactions')
    .insert({
      client_id:  clientId,
      trainer_id: null,
      amount:     credits,
      reason:     'purchase',
      note:       `Stripe payment — ${credits} credit${credits !== 1 ? 's' : ''} · $${(credits).toFixed(2)}`,
    });

  if (txErr) {
    console.error('fulfillPurchase: transaction insert failed', txErr);
    return;
  }

  // Mark payment session as completed
  await db
    .from('stripe_payment_sessions')
    .update({ status: 'completed', fulfilled_at: new Date().toISOString() })
    .eq('stripe_session_id', session.id);

  console.log(`fulfillPurchase: credited ${credits} to client ${clientId}`);
}

// ─── Helpers ──────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
