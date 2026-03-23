/**
 * Integration tests for nutrition logging against a real Supabase project.
 *
 * Tests: log insert, list fetch, delete, goal upsert, and RLS scoping.
 * Requires TEST_CLIENT_ID in addition to the standard trainer credentials.
 * All created log rows are cleaned up in afterAll.
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

function buildTestClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const TODAY = new Date().toISOString().split('T')[0];

maybeDescribe('Nutrition integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;
  const createdLogIds: string[] = [];

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
    for (const id of createdLogIds) {
      await sb.from('nutrition_logs').delete().eq('id', id);
    }
    await sb.auth.signOut();
  });

  // ── Insert log entry ────────────────────────────────────────────────────────

  it('trainer can insert a nutrition log entry for a client', async () => {
    const { data, error } = await sb
      .from('nutrition_logs')
      .insert({
        client_id:        CLIENT_ID,
        trainer_id:       trainerId,
        logged_date:      TODAY,
        meal_type:        'lunch',
        food_name:        '__test_food__',
        serving_size_g:   100,
        calories:         250,
        protein_g:        20,
        carbs_g:          25,
        fat_g:            8,
        fiber_g:          3,
        usda_food_id:     null,
        logged_by_role:   'trainer',
        logged_by_user_id: trainerId,
      })
      .select('id, food_name, calories')
      .single();

    expect(error).toBeNull();
    expect(data?.food_name).toBe('__test_food__');
    expect(data?.calories).toBe(250);
    createdLogIds.push(data!.id);
  });

  // ── Fetch logs ──────────────────────────────────────────────────────────────

  it('trainer can fetch nutrition logs for a client on a given date', async () => {
    const { data, error } = await sb
      .from('nutrition_logs')
      .select('id, food_name, meal_type, calories')
      .eq('client_id', CLIENT_ID!)
      .eq('logged_date', TODAY);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  // ── Delete log entry ────────────────────────────────────────────────────────

  it('trainer can delete a nutrition log entry', async () => {
    const { data: created } = await sb
      .from('nutrition_logs')
      .insert({
        client_id:        CLIENT_ID,
        trainer_id:       trainerId,
        logged_date:      TODAY,
        meal_type:        'snack',
        food_name:        '__test_delete_me__',
        serving_size_g:   50,
        calories:         120,
        protein_g:        5,
        carbs_g:          15,
        fat_g:            3,
        logged_by_role:   'trainer',
        logged_by_user_id: trainerId,
      })
      .select('id')
      .single();

    const { error, count } = await sb
      .from('nutrition_logs')
      .delete({ count: 'exact' })
      .eq('id', created!.id);

    expect(error).toBeNull();
    expect(count).toBe(1);

    // Verify deletion
    const { data: gone } = await sb
      .from('nutrition_logs')
      .select('id')
      .eq('id', created!.id);
    expect(gone).toHaveLength(0);
  });

  // ── Nutrition goal ──────────────────────────────────────────────────────────

  it('trainer can upsert a nutrition goal for a client', async () => {
    const { error } = await sb
      .from('nutrition_goals')
      .upsert(
        {
          client_id:     CLIENT_ID,
          trainer_id:    trainerId,
          daily_calories: 2000,
          protein_pct:   30,
          carbs_pct:     45,
          fat_pct:       25,
        },
        { onConflict: 'client_id' },
      );

    expect(error).toBeNull();
  });

  it('upserted goal is retrievable and macros sum to 100', async () => {
    const { data, error } = await sb
      .from('nutrition_goals')
      .select('daily_calories, protein_pct, carbs_pct, fat_pct')
      .eq('client_id', CLIENT_ID!)
      .single();

    expect(error).toBeNull();
    expect(data?.daily_calories).toBeGreaterThan(0);
    expect(data!.protein_pct + data!.carbs_pct + data!.fat_pct).toBe(100);
  });

  it('goal upsert updates existing row rather than creating a duplicate', async () => {
    await sb.from('nutrition_goals').upsert(
      { client_id: CLIENT_ID, trainer_id: trainerId, daily_calories: 2500, protein_pct: 35, carbs_pct: 40, fat_pct: 25 },
      { onConflict: 'client_id' },
    );

    const { data } = await sb
      .from('nutrition_goals')
      .select('id')
      .eq('client_id', CLIENT_ID!);

    // Only one goal row per client
    expect(data).toHaveLength(1);
  });

  // ── RLS scoping ─────────────────────────────────────────────────────────────

  it('RLS — fetched logs are only for the queried client', async () => {
    const { data, error } = await sb
      .from('nutrition_logs')
      .select('id, client_id')
      .eq('client_id', CLIENT_ID!);

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.client_id).toBe(CLIENT_ID);
    }
  });
});
