/**
 * Integration tests for credit system (client_credits + credit_transactions).
 *
 * Requires live Supabase project credentials.
 * Tests: trainer grants credits, client balance increases, transaction is recorded,
 *        stripe_payment_sessions schema (INSERT + SELECT), trainer_id nullable.
 *
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL        = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRAINER_EMAIL       = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD    = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID           = process.env.TEST_CLIENT_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

// Has service key for stripe_payment_sessions insert (service-role only)
const hasServiceKey = hasCreds && Boolean(SUPABASE_SERVICE_KEY);
const maybeDescribeService = hasServiceKey ? describe : describe.skip;

function buildClient(key?: string) {
  return createClient(SUPABASE_URL!, key ?? SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Credits — trainer grant integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;

  const createdTxIds: string[] = [];
  let initialBalance = 0;

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw error;
    trainerId = data.user!.id;

    // Read initial balance
    const { data: creditRow } = await sb
      .from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .maybeSingle();

    initialBalance = creditRow?.balance ?? 0;
  });

  afterAll(async () => {
    // Revert balance and remove test transactions
    if (createdTxIds.length > 0) {
      await sb.from('credit_transactions').delete().in('id', createdTxIds);
    }
    // Restore balance to initial
    await sb.from('client_credits').upsert(
      { client_id: CLIENT_ID, balance: initialBalance, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    );
    await sb.auth.signOut();
  });

  it('trainer can upsert client_credits and read the updated balance', async () => {
    const newBalance = initialBalance + 5;

    const { error } = await sb.from('client_credits').upsert(
      { client_id: CLIENT_ID, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    );
    expect(error).toBeNull();

    const { data, error: readErr } = await sb.from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .single();

    expect(readErr).toBeNull();
    expect(data!.balance).toBe(newBalance);
  });

  it('trainer can insert a credit_transaction with reason=grant', async () => {
    const { data, error } = await sb.from('credit_transactions').insert({
      client_id:  CLIENT_ID,
      trainer_id: trainerId,
      amount:     5,
      reason:     'grant',
      note:       'Integration test grant',
    }).select('id').single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdTxIds.push(data!.id);
  });

  it('credit_transaction with reason=purchase allows NULL trainer_id', async () => {
    const { data, error } = await sb.from('credit_transactions').insert({
      client_id:  CLIENT_ID,
      trainer_id: null,
      amount:     10,
      reason:     'purchase',
      note:       'Integration test purchase (trainer_id null)',
    }).select('id').single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdTxIds.push(data!.id);
  });

  it('transactions list includes both grant and purchase entries', async () => {
    const { data, error } = await sb.from('credit_transactions')
      .select('id, reason, amount, trainer_id')
      .eq('client_id', CLIENT_ID)
      .in('id', createdTxIds);

    expect(error).toBeNull();
    const reasons = data!.map((t) => t.reason);
    expect(reasons).toContain('grant');
    expect(reasons).toContain('purchase');

    const purchaseTx = data!.find((t) => t.reason === 'purchase');
    expect(purchaseTx?.trainer_id).toBeNull();
  });
});

maybeDescribeService('stripe_payment_sessions — service role', () => {
  let sbService: SupabaseClient;
  const createdSessionIds: string[] = [];

  beforeAll(() => {
    sbService = buildClient(SUPABASE_SERVICE_KEY);
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      await sbService.from('stripe_payment_sessions').delete().in('id', createdSessionIds);
    }
  });

  it('service role can insert a stripe_payment_session (pending)', async () => {
    const { data, error } = await sbService.from('stripe_payment_sessions').insert({
      client_id:         CLIENT_ID,
      stripe_session_id: `sess_test_${Date.now()}`,
      credits:           10,
      amount_cents:      1000,
      status:            'pending',
    }).select('id').single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdSessionIds.push(data!.id);
  });

  it('service role can update session status to completed', async () => {
    const sessionId = createdSessionIds[0];
    const { error } = await sbService.from('stripe_payment_sessions')
      .update({ status: 'completed', fulfilled_at: new Date().toISOString() })
      .eq('id', sessionId);

    expect(error).toBeNull();

    const { data } = await sbService.from('stripe_payment_sessions')
      .select('status, fulfilled_at')
      .eq('id', sessionId)
      .single();

    expect(data!.status).toBe('completed');
    expect(data!.fulfilled_at).toBeTruthy();
  });

  it('trainer can SELECT their own client sessions', async () => {
    const sbTrainer = buildClient();
    await sbTrainer.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });

    const { data, error } = await sbTrainer.from('stripe_payment_sessions')
      .select('id, status, credits')
      .eq('client_id', CLIENT_ID);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    await sbTrainer.auth.signOut();
  });
});
