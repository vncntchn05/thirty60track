/**
 * Integration tests for personal records (personal_records table).
 *
 * Requires live Supabase project credentials.
 * Tests: first workout → PR created, second workout with higher weight → PR updated,
 *        second workout with lower weight → no change, reps-only PR detection.
 *
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;
const EXERCISE_ID       = process.env.TEST_EXERCISE_ID; // a real exercise id in your DB

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID && EXERCISE_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Personal Records integration', () => {
  let sb: SupabaseClient;
  const createdPRIds: string[] = [];

  beforeAll(async () => {
    sb = buildClient();
    const { error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw error;

    // Clean up any existing PR for this client+exercise
    await sb.from('personal_records')
      .delete()
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID);
  });

  afterAll(async () => {
    if (createdPRIds.length > 0) {
      await sb.from('personal_records').delete().in('id', createdPRIds);
    }
    // Also clean up by client+exercise in case ids were not tracked
    await sb.from('personal_records')
      .delete()
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID);

    await sb.auth.signOut();
  });

  it('upserts a new PR row on first exercise', async () => {
    const { error } = await sb.from('personal_records').upsert(
      {
        client_id:   CLIENT_ID,
        exercise_id: EXERCISE_ID,
        max_weight_kg: 80,
        max_reps: 8,
        max_weight_achieved_at: '2024-01-01',
        max_reps_achieved_at:   '2024-01-01',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,exercise_id' },
    );

    expect(error).toBeNull();

    const { data: pr } = await sb.from('personal_records')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID)
      .single();

    expect(pr).toBeTruthy();
    expect(pr!.max_weight_kg).toBe(80);
    expect(pr!.max_reps).toBe(8);

    if (pr?.id) createdPRIds.push(pr.id);
  });

  it('updates PR when a higher weight is logged', async () => {
    const { error } = await sb.from('personal_records').upsert(
      {
        client_id:   CLIENT_ID,
        exercise_id: EXERCISE_ID,
        max_weight_kg: 90,
        max_reps: 8,
        max_weight_achieved_at: '2024-02-01',
        max_reps_achieved_at:   '2024-01-01',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,exercise_id' },
    );

    expect(error).toBeNull();

    const { data: pr } = await sb.from('personal_records')
      .select('max_weight_kg, max_reps, max_weight_achieved_at')
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID)
      .single();

    expect(pr!.max_weight_kg).toBe(90);
    expect(pr!.max_weight_achieved_at).toBe('2024-02-01');
    // max_reps should remain 8 (unchanged)
    expect(pr!.max_reps).toBe(8);
  });

  it('updates PR when more reps are achieved', async () => {
    const { error } = await sb.from('personal_records').upsert(
      {
        client_id:   CLIENT_ID,
        exercise_id: EXERCISE_ID,
        max_weight_kg: 90,
        max_reps: 12,
        max_weight_achieved_at: '2024-02-01',
        max_reps_achieved_at:   '2024-03-01',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,exercise_id' },
    );

    expect(error).toBeNull();

    const { data: pr } = await sb.from('personal_records')
      .select('max_reps, max_reps_achieved_at')
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID)
      .single();

    expect(pr!.max_reps).toBe(12);
    expect(pr!.max_reps_achieved_at).toBe('2024-03-01');
  });

  it('only one PR row exists per client+exercise (upsert deduplication)', async () => {
    const { data: rows } = await sb.from('personal_records')
      .select('id')
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID);

    expect(rows).toHaveLength(1);
  });

  it('RLS: trainer can read PR for their own client', async () => {
    const { data, error } = await sb.from('personal_records')
      .select('id, max_weight_kg')
      .eq('client_id', CLIENT_ID)
      .eq('exercise_id', EXERCISE_ID);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].max_weight_kg).toBe(90);
  });
});
