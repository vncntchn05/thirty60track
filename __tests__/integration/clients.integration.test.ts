/**
 * Integration tests for client CRUD against a real Supabase test project.
 *
 * Requires the same env vars as auth.integration.test.ts.
 * Uses the trainer credentials to test RLS-gated client operations.
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

maybeDescribe('Clients integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;
  let createdClientId: string | null = null;

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
    // Clean up any client rows created during the test run
    if (createdClientId) {
      await sb.from('clients').delete().eq('id', createdClientId);
    }
    await sb.auth.signOut();
  });

  it('authenticated trainer can fetch their client list (RLS scoped)', async () => {
    const { data, error } = await sb
      .from('clients')
      .select('id, trainer_id, full_name')
      .order('full_name');

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    // Every returned row should belong to this trainer (RLS enforcement)
    for (const row of data ?? []) {
      expect(row.trainer_id).toBe(trainerId);
    }
  });

  it('addClient — inserts a row and it appears in the subsequent list fetch', async () => {
    const newClient = {
      trainer_id: trainerId,
      full_name: '__integration_test_client__',
      email: `integration-test-${Date.now()}@example.com`,
    };

    const { data: inserted, error: insertErr } = await sb
      .from('clients')
      .insert(newClient)
      .select('id, full_name, trainer_id')
      .single();

    expect(insertErr).toBeNull();
    expect(inserted?.full_name).toBe(newClient.full_name);
    createdClientId = inserted?.id ?? null;

    // Verify it appears in the list
    const { data: list } = await sb
      .from('clients')
      .select('id')
      .eq('id', createdClientId!);

    expect(list).toHaveLength(1);
  });

  it('deleteClient — removes the row and it no longer appears in the list', async () => {
    if (!createdClientId) {
      console.warn('Skipping delete test — no client was created');
      return;
    }

    const { error: deleteErr, count } = await sb
      .from('clients')
      .delete({ count: 'exact' })
      .eq('id', createdClientId);

    expect(deleteErr).toBeNull();
    expect(count).toBe(1);

    // Verify it's gone
    const { data } = await sb
      .from('clients')
      .select('id')
      .eq('id', createdClientId);

    expect(data).toHaveLength(0);
    createdClientId = null;
  });
});
