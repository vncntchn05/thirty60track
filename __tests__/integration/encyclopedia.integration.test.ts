/**
 * Integration tests for the Exercise Encyclopedia and Workout Guides
 * (migrations 015 and 018).
 *
 * muscle_group_encyclopedia: all authenticated users read; only trainers write.
 * workout_guides: all authenticated users read; only trainers write.
 *
 * Tests cover trainer upsert, read, and verify clients (non-trainers) can
 * read but not write (client write attempts should be blocked by RLS).
 *
 * Requires full trainer + client credentials.
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_EMAIL      = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD   = process.env.TEST_CLIENT_PASSWORD;

const hasTrainerCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD,
);
const hasAllCreds = hasTrainerCreds && Boolean(CLIENT_EMAIL && CLIENT_PASSWORD);

const maybeDescribe    = hasTrainerCreds ? describe : describe.skip;
const maybeDescribeAll = hasAllCreds     ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Encyclopedia ─────────────────────────────────────────────────────────────

maybeDescribe('Encyclopedia integration — trainer write', () => {
  let sb: SupabaseClient;
  const TEST_MUSCLE = '__integration_test_muscle__';

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
  });

  afterAll(async () => {
    await sb.from('muscle_group_encyclopedia').delete().eq('muscle_group', TEST_MUSCLE);
    await sb.auth.signOut();
  });

  it('trainer can insert a muscle group encyclopedia entry', async () => {
    const { data, error } = await sb
      .from('muscle_group_encyclopedia')
      .insert({
        muscle_group:         TEST_MUSCLE,
        function_description: 'Integration test muscle',
        warmup_and_stretches: 'Test warm-up',
        common_injuries:      'Test injuries',
        rehab_exercises:      'Test rehab',
      })
      .select('muscle_group, function_description')
      .single();

    expect(error).toBeNull();
    expect(data?.muscle_group).toBe(TEST_MUSCLE);
    expect(data?.function_description).toBe('Integration test muscle');
  });

  it('trainer can update an encyclopedia entry', async () => {
    const { error } = await sb
      .from('muscle_group_encyclopedia')
      .update({ function_description: 'Updated integration test muscle' })
      .eq('muscle_group', TEST_MUSCLE);

    expect(error).toBeNull();

    const { data } = await sb
      .from('muscle_group_encyclopedia')
      .select('function_description')
      .eq('muscle_group', TEST_MUSCLE)
      .single();

    expect(data?.function_description).toBe('Updated integration test muscle');
  });

  it('trainer can read all encyclopedia entries', async () => {
    const { data, error } = await sb
      .from('muscle_group_encyclopedia')
      .select('muscle_group')
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});

maybeDescribeAll('Encyclopedia integration — client read-only', () => {
  let trainerSb: SupabaseClient;
  let clientSb:  SupabaseClient;
  const TEST_MUSCLE = '__integration_test_muscle_client__';

  beforeAll(async () => {
    trainerSb = buildClient();
    await trainerSb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    // Seed an entry for client to read
    await trainerSb.from('muscle_group_encyclopedia').insert({
      muscle_group:         TEST_MUSCLE,
      function_description: 'Client read test entry',
    });

    clientSb = buildClient();
    const { data, error } = await clientSb.auth.signInWithPassword({
      email: CLIENT_EMAIL!,
      password: CLIENT_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Client sign-in failed: ${error?.message}`);
  });

  afterAll(async () => {
    await trainerSb.from('muscle_group_encyclopedia').delete().eq('muscle_group', TEST_MUSCLE);
    await trainerSb.auth.signOut();
    await clientSb.auth.signOut();
  });

  it('client can read encyclopedia entries', async () => {
    const { data, error } = await clientSb
      .from('muscle_group_encyclopedia')
      .select('muscle_group, function_description')
      .eq('muscle_group', TEST_MUSCLE)
      .single();

    expect(error).toBeNull();
    expect(data?.muscle_group).toBe(TEST_MUSCLE);
  });

  it('client cannot insert encyclopedia entries (RLS blocks)', async () => {
    const { error } = await clientSb
      .from('muscle_group_encyclopedia')
      .insert({
        muscle_group:         '__client_should_not_insert__',
        function_description: 'Should fail',
      });

    // RLS should reject the insert
    expect(error).not.toBeNull();
  });

  it('client cannot update encyclopedia entries (RLS blocks — 0 rows affected)', async () => {
    const { error, count } = await clientSb
      .from('muscle_group_encyclopedia')
      .update({ function_description: 'Client tampering' }, { count: 'exact' })
      .eq('muscle_group', TEST_MUSCLE);

    // Supabase RLS USING-blocked updates return no error, just 0 affected rows
    expect(error).toBeNull();
    expect(count).toBe(0);
  });
});

// ── Workout Guides ────────────────────────────────────────────────────────────

maybeDescribe('Workout Guides integration — trainer write', () => {
  let sb: SupabaseClient;
  const TEST_TOPIC   = '__integration_test_topic__';
  const TEST_SECTION = '__integration_test_section__';

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
  });

  afterAll(async () => {
    await sb
      .from('workout_guides')
      .delete()
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION);
    await sb.auth.signOut();
  });

  it('trainer can insert a workout guide entry', async () => {
    const { data, error } = await sb
      .from('workout_guides')
      .insert({
        topic:       TEST_TOPIC,
        section_key: TEST_SECTION,
        content:     'Integration test guide content',
      })
      .select('topic, section_key, content')
      .single();

    expect(error).toBeNull();
    expect(data?.topic).toBe(TEST_TOPIC);
    expect(data?.section_key).toBe(TEST_SECTION);
    expect(data?.content).toBe('Integration test guide content');
  });

  it('trainer can upsert (update) an existing guide entry', async () => {
    const { error } = await sb
      .from('workout_guides')
      .upsert(
        { topic: TEST_TOPIC, section_key: TEST_SECTION, content: 'Updated guide content' },
        { onConflict: 'topic,section_key' },
      );

    expect(error).toBeNull();

    const { data } = await sb
      .from('workout_guides')
      .select('content')
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION)
      .single();

    expect(data?.content).toBe('Updated guide content');
  });

  it('upsert does not create a duplicate row', async () => {
    const { data } = await sb
      .from('workout_guides')
      .select('id')
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION);

    expect(data).toHaveLength(1);
  });
});

maybeDescribeAll('Workout Guides integration — client read-only', () => {
  let trainerSb: SupabaseClient;
  let clientSb:  SupabaseClient;
  const TEST_TOPIC   = '__integration_guide_client__';
  const TEST_SECTION = 'overview';

  beforeAll(async () => {
    trainerSb = buildClient();
    await trainerSb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    await trainerSb.from('workout_guides').insert({
      topic:       TEST_TOPIC,
      section_key: TEST_SECTION,
      content:     'Client-readable guide content',
    });

    clientSb = buildClient();
    const { data, error } = await clientSb.auth.signInWithPassword({
      email: CLIENT_EMAIL!,
      password: CLIENT_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Client sign-in failed: ${error?.message}`);
  });

  afterAll(async () => {
    await trainerSb
      .from('workout_guides')
      .delete()
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION);
    await trainerSb.auth.signOut();
    await clientSb.auth.signOut();
  });

  it('client can read workout guide entries', async () => {
    const { data, error } = await clientSb
      .from('workout_guides')
      .select('topic, section_key, content')
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION)
      .single();

    expect(error).toBeNull();
    expect(data?.content).toBe('Client-readable guide content');
  });

  it('client cannot insert workout guide entries (RLS blocks)', async () => {
    const { error } = await clientSb
      .from('workout_guides')
      .insert({
        topic:       '__client_inject__',
        section_key: 'overview',
        content:     'Should fail',
      });

    expect(error).not.toBeNull();
  });

  it('client cannot update workout guide entries (RLS blocks — 0 rows affected)', async () => {
    const { error, count } = await clientSb
      .from('workout_guides')
      .update({ content: 'Client tampered' }, { count: 'exact' })
      .eq('topic', TEST_TOPIC)
      .eq('section_key', TEST_SECTION);

    // Supabase RLS USING-blocked updates return no error, just 0 affected rows
    expect(error).toBeNull();
    expect(count).toBe(0);
  });
});
