/**
 * Integration tests for workout CRUD against a real Supabase test project.
 *
 * Requires the same env vars as auth.integration.test.ts plus:
 *   TEST_CLIENT_ID — UUID of an existing client owned by the test trainer
 *                    (create one via the app UI or Supabase SQL editor and paste the id)
 */
import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const TEST_CLIENT_ID    = process.env.TEST_CLIENT_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && TEST_CLIENT_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildTestClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Workouts integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;
  let createdWorkoutId: string | null = null;

  beforeAll(async () => {
    sb = buildTestClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
    trainerId = data.user.id;
  });

  afterAll(async () => {
    if (createdWorkoutId) {
      await sb.from('workout_sets').delete().eq('workout_id', createdWorkoutId);
      await sb.from('workouts').delete().eq('id', createdWorkoutId);
    }
    await sb.auth.signOut();
  });

  it('creates a workout with sets for a client', async () => {
    const { data: workout, error: wErr } = await sb
      .from('workouts')
      .insert({
        client_id: TEST_CLIENT_ID!,
        trainer_id: trainerId,
        performed_at: '2024-01-15',
        notes: 'Integration test workout',
      })
      .select('id, client_id, performed_at')
      .single();

    expect(wErr).toBeNull();
    expect(workout?.client_id).toBe(TEST_CLIENT_ID);
    createdWorkoutId = workout?.id ?? null;

    // Insert two sets
    const { error: sErr } = await sb.from('workout_sets').insert([
      { workout_id: createdWorkoutId!, exercise_id: null, set_number: 1, reps: 10, weight_kg: 60, duration_seconds: null, notes: null },
      { workout_id: createdWorkoutId!, exercise_id: null, set_number: 2, reps: 8,  weight_kg: 65, duration_seconds: null, notes: null },
    ]);

    expect(sErr).toBeNull();
  });

  it('fetches workouts for a client sorted by performed_at descending', async () => {
    const { data, error } = await sb
      .from('workouts')
      .select('id, performed_at')
      .eq('client_id', TEST_CLIENT_ID!)
      .order('performed_at', { ascending: false });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);

    // Verify descending order
    for (let i = 1; i < (data?.length ?? 0); i++) {
      expect(data![i - 1].performed_at >= data![i].performed_at).toBe(true);
    }
  });

  it('updating a workout reflects changes on refetch', async () => {
    if (!createdWorkoutId) return;

    const { error: updateErr } = await sb
      .from('workouts')
      .update({ notes: 'Updated in integration test' })
      .eq('id', createdWorkoutId);

    expect(updateErr).toBeNull();

    const { data, error: fetchErr } = await sb
      .from('workouts')
      .select('notes')
      .eq('id', createdWorkoutId)
      .single();

    expect(fetchErr).toBeNull();
    expect(data?.notes).toBe('Updated in integration test');
  });

  it('workout sets are accessible via a nested select', async () => {
    if (!createdWorkoutId) return;

    const { data, error } = await sb
      .from('workouts')
      .select(`id, workout_sets(id, set_number, reps, weight_kg)`)
      .eq('id', createdWorkoutId)
      .single();

    expect(error).toBeNull();
    expect(Array.isArray(data?.workout_sets)).toBe(true);
    expect((data?.workout_sets as unknown[]).length).toBeGreaterThan(0);
  });
});
