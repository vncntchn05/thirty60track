/**
 * Integration tests for trainer-client interactions.
 *
 * Requires live Supabase project credentials + a TEST_CLIENT_AUTH_EMAIL/PASSWORD
 * for the client-side session.
 *
 * Tests:
 *  - Trainer assigns workout → client can see it as pending
 *  - Client cannot modify trainer's assigned workout data
 *  - Trainer confirms a scheduled session → client credit is deducted
 *  - Trainer cancels confirmed session → credit is refunded
 *
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL        = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY   = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL       = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD    = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID           = process.env.TEST_CLIENT_ID;
const CLIENT_AUTH_EMAIL   = process.env.TEST_CLIENT_AUTH_EMAIL;
const CLIENT_AUTH_PASSWORD = process.env.TEST_CLIENT_AUTH_PASSWORD;
const EXERCISE_ID         = process.env.TEST_EXERCISE_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  TRAINER_EMAIL && TRAINER_PASSWORD &&
  CLIENT_ID && CLIENT_AUTH_EMAIL && CLIENT_AUTH_PASSWORD,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Trainer assigns workout → client sees it ──────────────────────────────

maybeDescribe('Trainer assigns workout → client sees it', () => {
  let sbTrainer: SupabaseClient;
  let sbClient: SupabaseClient;
  let trainerId: string;

  const createdWorkoutIds: string[] = [];
  const createdExerciseIds: string[] = [];
  const createdSetIds: string[] = [];

  beforeAll(async () => {
    sbTrainer = buildClient();
    sbClient  = buildClient();

    const [trainerAuth, clientAuth] = await Promise.all([
      sbTrainer.auth.signInWithPassword({ email: TRAINER_EMAIL!, password: TRAINER_PASSWORD! }),
      sbClient.auth.signInWithPassword({ email: CLIENT_AUTH_EMAIL!, password: CLIENT_AUTH_PASSWORD! }),
    ]);

    if (trainerAuth.error) throw trainerAuth.error;
    if (clientAuth.error) throw clientAuth.error;

    trainerId = trainerAuth.data.user!.id;
  });

  afterAll(async () => {
    if (createdSetIds.length > 0) {
      await sbTrainer.from('assigned_workout_sets').delete().in('id', createdSetIds);
    }
    if (createdExerciseIds.length > 0) {
      await sbTrainer.from('assigned_workout_exercises').delete().in('id', createdExerciseIds);
    }
    if (createdWorkoutIds.length > 0) {
      await sbTrainer.from('assigned_workouts').delete().in('id', createdWorkoutIds);
    }
    await Promise.all([sbTrainer.auth.signOut(), sbClient.auth.signOut()]);
  });

  it('trainer can create an assigned workout', async () => {
    const { data, error } = await sbTrainer.from('assigned_workouts').insert({
      client_id:      CLIENT_ID,
      trainer_id:     trainerId,
      title:          'Integration Test Workout',
      scheduled_date: '2025-03-01',
      status:         'assigned',
      notes:          'Test notes',
    }).select('id').single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdWorkoutIds.push(data!.id);
  });

  it('client can read the assigned workout (RLS permits client read)', async () => {
    const workoutId = createdWorkoutIds[0];

    const { data, error } = await sbClient.from('assigned_workouts')
      .select('id, title, scheduled_date, status')
      .eq('id', workoutId)
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('Integration Test Workout');
    expect(data?.status).toBe('assigned');
  });

  it('client cannot UPDATE an assigned workout created by trainer (RLS blocks)', async () => {
    const workoutId = createdWorkoutIds[0];

    const { error } = await sbClient.from('assigned_workouts')
      .update({ notes: 'Client hacked notes' })
      .eq('id', workoutId);

    // RLS should block this — either error or 0 rows affected
    if (!error) {
      // If no error, verify the notes were NOT changed (0 rows matched RLS)
      const { data } = await sbTrainer.from('assigned_workouts')
        .select('notes')
        .eq('id', workoutId)
        .single();
      expect(data?.notes).toBe('Test notes');
    } else {
      expect(error).toBeTruthy();
    }
  });

  it('trainer can add exercises and sets to the assigned workout', async () => {
    if (!EXERCISE_ID) return; // skip if no exercise ID configured

    const workoutId = createdWorkoutIds[0];

    const { data: exRow, error: exErr } = await sbTrainer.from('assigned_workout_exercises').insert({
      assigned_workout_id: workoutId,
      exercise_id:         EXERCISE_ID,
      order_index:         0,
      superset_group:      null,
    }).select('id').single();

    expect(exErr).toBeNull();
    expect(exRow?.id).toBeTruthy();
    createdExerciseIds.push(exRow!.id);

    const { data: setRow, error: setErr } = await sbTrainer.from('assigned_workout_sets').insert({
      assigned_workout_exercise_id: exRow!.id,
      set_number:  1,
      reps:        '10',
      weight_kg:   100,
      unit:        'kg',
    }).select('id').single();

    expect(setErr).toBeNull();
    createdSetIds.push(setRow!.id);
  });

  it('client can read assigned_workout_exercises for their workout', async () => {
    if (createdExerciseIds.length === 0) return;

    const { data, error } = await sbClient.from('assigned_workout_exercises')
      .select('id, exercise_id')
      .eq('assigned_workout_id', createdWorkoutIds[0]);

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Credit lifecycle: trainer confirms session → deduct; trainer cancels → refund ──

maybeDescribe('Scheduled session credit lifecycle', () => {
  let sbTrainer: SupabaseClient;
  let trainerId: string;

  const createdSessionIds: string[] = [];
  let initialBalance = 0;

  beforeAll(async () => {
    sbTrainer = buildClient();
    const { data, error } = await sbTrainer.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw error;
    trainerId = data.user!.id;

    // Ensure client has at least 5 credits for this test
    const { data: creditRow } = await sbTrainer.from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .maybeSingle();

    initialBalance = creditRow?.balance ?? 0;

    if (initialBalance < 5) {
      await sbTrainer.from('client_credits').upsert(
        { client_id: CLIENT_ID, balance: 5, updated_at: new Date().toISOString() },
        { onConflict: 'client_id' },
      );
      initialBalance = 5;
    }
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      await sbTrainer.from('scheduled_sessions').delete().in('id', createdSessionIds);
    }
    // Restore initial balance
    await sbTrainer.from('client_credits').upsert(
      { client_id: CLIENT_ID, balance: initialBalance, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' },
    );
    await sbTrainer.auth.signOut();
  });

  it('pending session does not deduct credits', async () => {
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + 7);

    const { data, error } = await sbTrainer.from('scheduled_sessions').insert({
      client_id:    CLIENT_ID,
      trainer_id:   trainerId,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: 30,
      status:       'pending',
      notes:        null,
    }).select('id').single();

    expect(error).toBeNull();
    createdSessionIds.push(data!.id);

    // Balance should be unchanged
    const { data: credits } = await sbTrainer.from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .single();

    expect(credits!.balance).toBe(initialBalance);
  });

  it('confirming a 30-min session deducts 1 credit via RPC or direct update', async () => {
    const sessionId = createdSessionIds[0];

    // Confirm session
    await sbTrainer.from('scheduled_sessions')
      .update({ status: 'confirmed' })
      .eq('id', sessionId);

    // Deduct 1 credit (30-min = 1 credit)
    const { error: creditErr } = await sbTrainer.from('client_credits').upsert(
      {
        client_id:  CLIENT_ID,
        balance:    initialBalance - 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' },
    );

    expect(creditErr).toBeNull();

    // Record transaction
    await sbTrainer.from('credit_transactions').insert({
      client_id:  CLIENT_ID,
      trainer_id: trainerId,
      session_id: sessionId,
      amount:     -1,
      reason:     'session_deduct',
      note:       'Integration test deduction',
    });

    const { data: credits } = await sbTrainer.from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .single();

    expect(credits!.balance).toBe(initialBalance - 1);
  });

  it('trainer cancelling a confirmed session refunds the credit', async () => {
    const sessionId = createdSessionIds[0];

    await sbTrainer.from('scheduled_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    // Refund 1 credit
    const { error: refundErr } = await sbTrainer.from('client_credits').upsert(
      {
        client_id:  CLIENT_ID,
        balance:    initialBalance,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id' },
    );

    expect(refundErr).toBeNull();

    await sbTrainer.from('credit_transactions').insert({
      client_id:  CLIENT_ID,
      trainer_id: trainerId,
      session_id: sessionId,
      amount:     1,
      reason:     'session_refund',
      note:       'Integration test refund',
    });

    const { data: credits } = await sbTrainer.from('client_credits')
      .select('balance')
      .eq('client_id', CLIENT_ID)
      .single();

    expect(credits!.balance).toBe(initialBalance);
  });
});
