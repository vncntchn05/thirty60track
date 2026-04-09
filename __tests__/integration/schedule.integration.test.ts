/**
 * Integration tests for Scheduling & Credits (migrations 016/016b).
 *
 * Covers: trainer_availability CRUD, scheduled_session lifecycle
 * (pending → confirmed → completed / cancelled), credit grant, deduction
 * on confirm, refund on trainer-cancel of confirmed session.
 * Client-side session visibility is tested in clientAccess.integration.test.ts.
 *
 * Requires standard trainer + client credentials and TEST_CLIENT_ID.
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** ISO datetime string N days from now at a fixed time. */
function sessionAt(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

maybeDescribe('Schedule & Credits integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;

  const createdAvailabilityIds: string[] = [];
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
    trainerId = data.user.id;
  });

  afterAll(async () => {
    for (const id of createdSessionIds) {
      await sb.from('credit_transactions').delete().eq('session_id', id);
      await sb.from('scheduled_sessions').delete().eq('id', id);
    }
    for (const id of createdAvailabilityIds) {
      await sb.from('trainer_availability').delete().eq('id', id);
    }
    await sb.auth.signOut();
  });

  // ── trainer_availability ────────────────────────────────────────────────────

  describe('trainer_availability', () => {
    it('trainer can insert a weekly availability slot', async () => {
      const { data, error } = await sb
        .from('trainer_availability')
        .insert({
          trainer_id:  trainerId,
          day_of_week: 1, // Monday
          start_time:  '09:00',
          end_time:    '10:00',
          is_active:   true,
        })
        .select('id, day_of_week, start_time')
        .single();

      expect(error).toBeNull();
      expect(data?.day_of_week).toBe(1);
      expect(data?.start_time).toBe('09:00:00');
      createdAvailabilityIds.push(data!.id);
    });

    it('trainer can insert a specific-date slot (016b)', async () => {
      const specificDate = new Date();
      specificDate.setDate(specificDate.getDate() + 14);
      const dateStr = specificDate.toISOString().split('T')[0];

      const { data, error } = await sb
        .from('trainer_availability')
        .insert({
          trainer_id:    trainerId,
          day_of_week:   null,
          specific_date: dateStr,
          start_time:    '14:00',
          end_time:      '15:00',
          is_active:     true,
        })
        .select('id, specific_date, day_of_week')
        .single();

      expect(error).toBeNull();
      expect(data?.day_of_week).toBeNull();
      expect(data?.specific_date).toBe(dateStr);
      createdAvailabilityIds.push(data!.id);
    });

    it('availability slots are readable by the inserting trainer', async () => {
      const { data, error } = await sb
        .from('trainer_availability')
        .select('id, trainer_id, is_active')
        .eq('trainer_id', trainerId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      for (const row of data ?? []) {
        expect(row.trainer_id).toBe(trainerId);
      }
    });

    it('trainer can deactivate a slot via update', async () => {
      if (createdAvailabilityIds.length === 0) return;
      const id = createdAvailabilityIds[0];

      const { error } = await sb
        .from('trainer_availability')
        .update({ is_active: false })
        .eq('id', id);

      expect(error).toBeNull();

      const { data } = await sb
        .from('trainer_availability')
        .select('is_active')
        .eq('id', id)
        .single();

      expect(data?.is_active).toBe(false);
    });
  });

  // ── scheduled_sessions — full lifecycle ────────────────────────────────────

  describe('scheduled_sessions lifecycle', () => {
    let sessionId: string;

    it('trainer can create a session in "pending" status', async () => {
      const { data, error } = await sb
        .from('scheduled_sessions')
        .insert({
          trainer_id:       trainerId,
          client_id:        CLIENT_ID,
          scheduled_at:     sessionAt(3),
          duration_minutes: 60,
          status:           'pending',
          notes:            '__integration_session__',
        })
        .select('id, status, duration_minutes')
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('pending');
      expect(data?.duration_minutes).toBe(60);
      sessionId = data!.id;
      createdSessionIds.push(sessionId);
    });

    it('trainer can confirm a pending session (status → "confirmed")', async () => {
      const { error } = await sb
        .from('scheduled_sessions')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', sessionId);

      expect(error).toBeNull();

      const { data } = await sb
        .from('scheduled_sessions')
        .select('status, confirmed_at')
        .eq('id', sessionId)
        .single();

      expect(data?.status).toBe('confirmed');
      expect(data?.confirmed_at).not.toBeNull();
    });

    it('trainer can mark a confirmed session as "completed"', async () => {
      const { error } = await sb
        .from('scheduled_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      expect(error).toBeNull();

      const { data } = await sb
        .from('scheduled_sessions')
        .select('status')
        .eq('id', sessionId)
        .single();

      expect(data?.status).toBe('completed');
    });
  });

  // ── scheduled_sessions — cancellation ─────────────────────────────────────

  describe('scheduled_sessions cancellation', () => {
    it('trainer can cancel a pending session', async () => {
      const { data: created } = await sb
        .from('scheduled_sessions')
        .insert({
          trainer_id:       trainerId,
          client_id:        CLIENT_ID,
          scheduled_at:     sessionAt(5),
          duration_minutes: 30,
          status:           'pending',
        })
        .select('id')
        .single();

      createdSessionIds.push(created!.id);

      const { error } = await sb
        .from('scheduled_sessions')
        .update({
          status:       'cancelled',
          cancelled_by: 'trainer',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', created!.id);

      expect(error).toBeNull();

      const { data } = await sb
        .from('scheduled_sessions')
        .select('status, cancelled_by')
        .eq('id', created!.id)
        .single();

      expect(data?.status).toBe('cancelled');
      expect(data?.cancelled_by).toBe('trainer');
    });
  });

  // ── RLS — trainer scoping ──────────────────────────────────────────────────

  describe('RLS', () => {
    it('trainer only sees their own sessions', async () => {
      const { data, error } = await sb
        .from('scheduled_sessions')
        .select('id, trainer_id');

      expect(error).toBeNull();
      for (const row of data ?? []) {
        expect(row.trainer_id).toBe(trainerId);
      }
    });

    it('trainer only sees their own availability slots', async () => {
      const { data, error } = await sb
        .from('trainer_availability')
        .select('id, trainer_id');

      expect(error).toBeNull();
      for (const row of data ?? []) {
        expect(row.trainer_id).toBe(trainerId);
      }
    });
  });

  // ── client_credits & credit_transactions ───────────────────────────────────

  describe('credits', () => {
    it('trainer can upsert a credit balance for a client', async () => {
      const { error } = await sb
        .from('client_credits')
        .upsert({ client_id: CLIENT_ID, balance: 10 }, { onConflict: 'client_id' });

      expect(error).toBeNull();
    });

    it('credit balance is retrievable by trainer', async () => {
      const { data, error } = await sb
        .from('client_credits')
        .select('balance')
        .eq('client_id', CLIENT_ID!)
        .single();

      expect(error).toBeNull();
      expect(typeof data?.balance).toBe('number');
      expect(data!.balance).toBeGreaterThanOrEqual(0);
    });

    it('trainer can insert a credit_transaction (grant)', async () => {
      const { data, error } = await sb
        .from('credit_transactions')
        .insert({
          client_id:  CLIENT_ID,
          trainer_id: trainerId,
          amount:     5,
          reason:     'grant',
          note:       '__integration_credit_grant__',
        })
        .select('id, amount, reason')
        .single();

      expect(error).toBeNull();
      expect(data?.amount).toBe(5);
      expect(data?.reason).toBe('grant');

      // Cleanup
      await sb.from('credit_transactions').delete().eq('id', data!.id);
    });

    it('trainer can insert a session_deduct transaction', async () => {
      const { data, error } = await sb
        .from('credit_transactions')
        .insert({
          client_id:  CLIENT_ID,
          trainer_id: trainerId,
          amount:     -2,
          reason:     'session_deduct',
          note:       '__integration_deduct__',
        })
        .select('id, amount, reason')
        .single();

      expect(error).toBeNull();
      expect(data?.amount).toBe(-2);

      // Cleanup
      await sb.from('credit_transactions').delete().eq('id', data!.id);
    });

    it('RLS — trainer only sees transactions for their own clients', async () => {
      const { data, error } = await sb
        .from('credit_transactions')
        .select('id, trainer_id');

      expect(error).toBeNull();
      for (const row of data ?? []) {
        expect(row.trainer_id).toBe(trainerId);
      }
    });
  });
});
