/**
 * Security integration tests — cross-trainer and cross-client RLS enforcement.
 *
 * These tests verify that Supabase RLS policies correctly prevent:
 *   - Trainer A reading/editing Trainer B's clients
 *   - Trainer A editing workout_sets logged by Trainer B
 *   - A client logging workouts for another client
 *   - A guest (anonymous) session calling any mutation
 *   - Cross-trainer credit grants
 *
 * Each test creates the minimal rows needed, asserts the blocked/allowed
 * behaviour, and cleans up via the privileged trainer session.
 *
 * Requires: TEST_TRAINER_EMAIL/PASSWORD, TEST_TRAINER2_EMAIL/PASSWORD,
 *           TEST_CLIENT_EMAIL/PASSWORD, TEST_CLIENT_ID env vars.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const TRAINER2_EMAIL    = process.env.TEST_TRAINER2_EMAIL;
const TRAINER2_PASSWORD = process.env.TEST_TRAINER2_PASSWORD;
const CLIENT_EMAIL      = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD   = process.env.TEST_CLIENT_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;

const hasPrimary = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  TRAINER_EMAIL && TRAINER_PASSWORD &&
  CLIENT_EMAIL  && CLIENT_PASSWORD  &&
  CLIENT_ID,
);
const hasSecondTrainer = Boolean(TRAINER2_EMAIL && TRAINER2_PASSWORD);

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

(hasPrimary ? describe : describe.skip)('Security — cross-trainer RLS', () => {
  let trainerASb: SupabaseClient;
  let trainerBSb: SupabaseClient;
  let trainerAId: string;
  let trainerBId: string;

  // Rows created by Trainer A for cleanup
  const cleanupClientIds: string[] = [];
  const cleanupWorkoutIds: string[] = [];

  beforeAll(async () => {
    trainerASb = buildClient();
    const { data: ta, error: tae } = await trainerASb.auth.signInWithPassword({
      email: TRAINER_EMAIL!, password: TRAINER_PASSWORD!,
    });
    if (tae || !ta.user) throw new Error(`Trainer A sign-in failed: ${tae?.message}`);
    trainerAId = ta.user.id;

    if (hasSecondTrainer) {
      trainerBSb = buildClient();
      const { data: tb, error: tbe } = await trainerBSb.auth.signInWithPassword({
        email: TRAINER2_EMAIL!, password: TRAINER2_PASSWORD!,
      });
      if (tbe || !tb.user) throw new Error(`Trainer B sign-in failed: ${tbe?.message}`);
      trainerBId = tb.user.id;
    }
  });

  afterAll(async () => {
    for (const wid of cleanupWorkoutIds) {
      await trainerASb.from('workout_sets').delete().eq('workout_id', wid);
      await trainerASb.from('workouts').delete().eq('id', wid);
    }
    for (const cid of cleanupClientIds) {
      await trainerASb.from('clients').delete().eq('id', cid);
    }
    await trainerASb.auth.signOut();
    if (hasSecondTrainer) await trainerBSb.auth.signOut();
  });

  // ── Trainer A cannot read Trainer B's clients ───��──────────────────

  (hasSecondTrainer ? it : it.skip)('Trainer A cannot read Trainer B\'s clients', async () => {
    // Trainer B creates a client
    const { data: bClient } = await trainerBSb
      .from('clients')
      .insert({ trainer_id: trainerBId, full_name: '__security_b_client__' })
      .select('id')
      .single();

    // Trainer A tries to read it
    const { data, error } = await trainerASb
      .from('clients')
      .select('id, trainer_id')
      .eq('id', bClient!.id);

    expect(error).toBeNull();
    expect(data).toHaveLength(0); // RLS hides it

    // Cleanup via Trainer B
    await trainerBSb.from('clients').delete().eq('id', bClient!.id);
  });

  // ── Trainer A cannot update Trainer B's client ─────────────────────

  (hasSecondTrainer ? it : it.skip)('Trainer A cannot update Trainer B\'s client', async () => {
    const { data: bClient } = await trainerBSb
      .from('clients')
      .insert({ trainer_id: trainerBId, full_name: '__security_b_client_update__' })
      .select('id')
      .single();

    const { error, count } = await trainerASb
      .from('clients')
      .update({ notes: 'injected by Trainer A' }, { count: 'exact' })
      .eq('id', bClient!.id);

    // RLS blocks the update silently (0 rows affected, no error)
    expect(error).toBeNull();
    expect(count).toBe(0);

    await trainerBSb.from('clients').delete().eq('id', bClient!.id);
  });

  // ── Trainer A cannot update workout_sets logged by Trainer B ────────

  (hasSecondTrainer ? it : it.skip)('Trainer A cannot update workout_sets logged by Trainer B', async () => {
    // Trainer B creates a client + workout + set
    const { data: bClient } = await trainerBSb
      .from('clients')
      .insert({ trainer_id: trainerBId, full_name: '__security_b_workout_client__' })
      .select('id').single();

    const { data: bWorkout } = await trainerBSb
      .from('workouts')
      .insert({
        client_id: bClient!.id, trainer_id: trainerBId, performed_at: '2025-01-01',
        logged_by_role: 'trainer', logged_by_user_id: trainerBId,
      })
      .select('id').single();

    // Find an exercise to use
    const { data: exercises } = await trainerBSb.from('exercises').select('id').limit(1);
    const exerciseId = exercises?.[0]?.id;
    if (!exerciseId) { await trainerBSb.from('clients').delete().eq('id', bClient!.id); return; }

    const { data: bSet } = await trainerBSb
      .from('workout_sets')
      .insert({ workout_id: bWorkout!.id, exercise_id: exerciseId, set_number: 1, reps: 10, weight_kg: 50 })
      .select('id').single();

    // Trainer A tries to update the set
    const { error, count } = await trainerASb
      .from('workout_sets')
      .update({ reps: 999 }, { count: 'exact' })
      .eq('id', bSet!.id);

    expect(error).toBeNull();
    expect(count).toBe(0); // RLS blocks it

    // Cleanup
    await trainerBSb.from('workout_sets').delete().eq('id', bSet!.id);
    await trainerBSb.from('workouts').delete().eq('id', bWorkout!.id);
    await trainerBSb.from('clients').delete().eq('id', bClient!.id);
  });

  // ── Trainer A cannot grant credits to Trainer B's client ───────────

  (hasSecondTrainer ? it : it.skip)('Trainer A cannot grant credits to Trainer B\'s client', async () => {
    const { data: bClient } = await trainerBSb
      .from('clients')
      .insert({ trainer_id: trainerBId, full_name: '__security_b_credits_client__' })
      .select('id').single();

    const { error } = await trainerASb
      .from('credit_transactions')
      .insert({
        client_id: bClient!.id,
        trainer_id: trainerBId,
        amount: 10,
        reason: 'grant',
        note: 'cross-trainer inject',
      });

    // RLS should block this — either via error or 0-row insert
    expect(error).not.toBeNull();

    await trainerBSb.from('clients').delete().eq('id', bClient!.id);
  });
});

// ── Client isolation ────────────────────────────────────────────��─────

(hasPrimary ? describe : describe.skip)('Security — client cannot log workouts for another client', () => {
  let trainerSb: SupabaseClient;
  let clientSb:  SupabaseClient;
  let trainerId: string;

  beforeAll(async () => {
    trainerSb = buildClient();
    const { data: td } = await trainerSb.auth.signInWithPassword({
      email: TRAINER_EMAIL!, password: TRAINER_PASSWORD!,
    });
    trainerId = td!.user!.id;

    clientSb = buildClient();
    await clientSb.auth.signInWithPassword({
      email: CLIENT_EMAIL!, password: CLIENT_PASSWORD!,
    });
  });

  afterAll(async () => {
    await trainerSb.auth.signOut();
    await clientSb.auth.signOut();
  });

  it('client cannot insert a workout for a different client_id', async () => {
    // Create a second client (trainer-owned, no auth user)
    const { data: otherClient } = await trainerSb
      .from('clients')
      .insert({ trainer_id: trainerId, full_name: '__security_other_client__' })
      .select('id').single();

    const { error, data } = await clientSb
      .from('workouts')
      .insert({
        client_id: otherClient!.id,
        trainer_id: trainerId,
        performed_at: '2025-01-01',
        logged_by_role: 'client',
      })
      .select('id');

    // Should either error or return 0 rows due to RLS
    const blocked = error !== null || (data?.length ?? 0) === 0;
    expect(blocked).toBe(true);

    // Cleanup
    if (data && data.length > 0) {
      await trainerSb.from('workouts').delete().eq('id', data[0].id);
    }
    await trainerSb.from('clients').delete().eq('id', otherClient!.id);
  });
});

// ── Guest (anonymous) mutation guard ──────────────────────────────────

(hasPrimary ? describe : describe.skip)('Security — guest session cannot call mutations', () => {
  let guestSb: SupabaseClient;
  let trainerSb: SupabaseClient;
  let trainerId: string;

  beforeAll(async () => {
    trainerSb = buildClient();
    const { data: td } = await trainerSb.auth.signInWithPassword({
      email: TRAINER_EMAIL!, password: TRAINER_PASSWORD!,
    });
    trainerId = td!.user!.id;

    guestSb = buildClient();
    const { error } = await guestSb.auth.signInAnonymously();
    // If anonymous auth is disabled, skip these tests
    if (error) {
      console.warn('Anonymous auth not enabled — skipping guest mutation tests');
    }
  });

  afterAll(async () => {
    await guestSb.auth.signOut();
    await trainerSb.auth.signOut();
  });

  it('guest cannot insert a workout', async () => {
    const { error, data } = await guestSb
      .from('workouts')
      .insert({ client_id: CLIENT_ID, trainer_id: trainerId, performed_at: '2025-01-01' })
      .select('id');
    const blocked = error !== null || (data?.length ?? 0) === 0;
    expect(blocked).toBe(true);
    if (data && data.length > 0) {
      await trainerSb.from('workouts').delete().eq('id', data[0].id);
    }
  });

  it('guest cannot grant credits', async () => {
    const { error } = await guestSb
      .from('credit_transactions')
      .insert({ client_id: CLIENT_ID, trainer_id: trainerId, amount: 100, reason: 'grant' });
    expect(error).not.toBeNull();
  });

  it('guest cannot request a session', async () => {
    const { error, data } = await guestSb
      .from('scheduled_sessions')
      .insert({
        trainer_id: trainerId,
        client_id: CLIENT_ID,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        status: 'pending',
      })
      .select('id');
    const blocked = error !== null || (data?.length ?? 0) === 0;
    expect(blocked).toBe(true);
    if (data && data.length > 0) {
      await trainerSb.from('scheduled_sessions').delete().eq('id', data[0].id);
    }
  });
});
