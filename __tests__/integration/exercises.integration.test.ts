/**
 * Integration tests for the exercise library against a real Supabase project.
 *
 * Verifies: read access, create, name-uniqueness constraint, muscle-group
 * filtering, and form_notes update — the full trainer exercise workflow.
 *
 * Requires the same env vars as the other integration tests.
 * Test rows are identified by a __test__ prefix and cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;

const hasCreds = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildTestClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Exercises integration', () => {
  let sb: SupabaseClient;
  const createdNames: string[] = [];

  beforeAll(async () => {
    sb = buildTestClient();
    const { error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw new Error(`Sign-in failed: ${error.message}`);
  });

  afterAll(async () => {
    for (const name of createdNames) {
      await sb.from('exercises').delete().eq('name', name);
    }
    await sb.auth.signOut();
  });

  // ── Read ────────────────────────────────────────────────────────────────────

  it('authenticated user can read the shared exercise library', async () => {
    const { data, error } = await sb
      .from('exercises')
      .select('id, name, muscle_group, category')
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('exercise list is ordered by name alphabetically when requested', async () => {
    const { data, error } = await sb
      .from('exercises')
      .select('name')
      .order('name')
      .limit(10);

    expect(error).toBeNull();
    const names = (data ?? []).map((e) => e.name);
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
    }
  });

  // ── Create ──────────────────────────────────────────────────────────────────

  it('createExercise — inserts a row and it is retrievable', async () => {
    const name = `__test_ex_create_${Date.now()}__`;
    createdNames.push(name);

    const { data, error } = await sb
      .from('exercises')
      .insert({ name, muscle_group: 'Arms', category: 'strength' })
      .select('id, name, muscle_group, category')
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe(name);
    expect(data?.muscle_group).toBe('Arms');
    expect(data?.category).toBe('strength');

    // Verify it is reachable via a fresh SELECT
    const { data: found } = await sb
      .from('exercises')
      .select('id')
      .eq('name', name)
      .single();
    expect(found?.id).toBe(data?.id);
  });

  it('createExercise — accepts null muscle_group', async () => {
    const name = `__test_ex_nomuscle_${Date.now()}__`;
    createdNames.push(name);

    const { data, error } = await sb
      .from('exercises')
      .insert({ name, muscle_group: null, category: 'cardio' })
      .select('id, muscle_group')
      .single();

    expect(error).toBeNull();
    expect(data?.muscle_group).toBeNull();
  });

  // ── Uniqueness ──────────────────────────────────────────────────────────────

  it('duplicate exercise name returns a Postgres unique-violation error', async () => {
    const name = `__test_ex_dup_${Date.now()}__`;
    createdNames.push(name);

    await sb.from('exercises').insert({ name, muscle_group: null, category: 'other' });
    const { error } = await sb
      .from('exercises')
      .insert({ name, muscle_group: null, category: 'other' });

    expect(error).not.toBeNull();
    // Postgres unique-violation code is 23505
    expect(error!.code).toBe('23505');
  });

  // ── Filter by muscle_group ──────────────────────────────────────────────────

  it('can filter exercises by muscle_group (supports muscle-synonym search pattern)', async () => {
    const name = `__test_ex_filter_${Date.now()}__`;
    const muscle = `TestMuscle_${Date.now()}`;
    createdNames.push(name);

    await sb.from('exercises').insert({ name, muscle_group: muscle, category: 'strength' });

    const { data, error } = await sb
      .from('exercises')
      .select('id, name, muscle_group')
      .eq('muscle_group', muscle);

    expect(error).toBeNull();
    expect(data?.some((e) => e.name === name)).toBe(true);
  });

  // ── Update form_notes ───────────────────────────────────────────────────────

  it('trainer can update form_notes on an exercise', async () => {
    const name = `__test_ex_notes_${Date.now()}__`;
    createdNames.push(name);

    const { data: created } = await sb
      .from('exercises')
      .insert({ name, muscle_group: 'Core', category: 'strength' })
      .select('id')
      .single();

    const { error: updateErr } = await sb
      .from('exercises')
      .update({ form_notes: 'Keep back straight throughout the movement.' })
      .eq('id', created!.id);

    expect(updateErr).toBeNull();

    const { data: updated } = await sb
      .from('exercises')
      .select('form_notes')
      .eq('id', created!.id)
      .single();

    expect(updated?.form_notes).toBe('Keep back straight throughout the movement.');
  });

  it('trainer can update help_url on an exercise', async () => {
    const name = `__test_ex_url_${Date.now()}__`;
    createdNames.push(name);

    const { data: created } = await sb
      .from('exercises')
      .insert({ name, muscle_group: null, category: 'strength' })
      .select('id')
      .single();

    const { error } = await sb
      .from('exercises')
      .update({ help_url: 'https://youtube.com/watch?v=test' })
      .eq('id', created!.id);

    expect(error).toBeNull();
  });
});
