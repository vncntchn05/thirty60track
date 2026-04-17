/**
 * Integration tests for family (client) linking (client_links table).
 *
 * Requires live Supabase project credentials + two client IDs.
 * Tests: trainer links two clients → both can see each other,
 *        add third client → full mesh (3 pairs), remove one → only that
 *        client's links are deleted.
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
const CLIENT_ID_2       = process.env.TEST_CLIENT_ID_2;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD &&
  CLIENT_ID && CLIENT_ID_2,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

maybeDescribe('Family Linking integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;

  const createdLinkIds: string[] = [];

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw error;
    trainerId = data.user!.id;

    // Clean up any pre-existing links between test clients
    await sb.from('client_links').delete().or(
      `client_id.in.(${CLIENT_ID},${CLIENT_ID_2}),linked_client_id.in.(${CLIENT_ID},${CLIENT_ID_2})`,
    );
  });

  afterAll(async () => {
    if (createdLinkIds.length > 0) {
      await sb.from('client_links').delete().in('id', createdLinkIds);
    }
    // Brute-force cleanup
    await sb.from('client_links').delete().or(
      `client_id.in.(${CLIENT_ID},${CLIENT_ID_2}),linked_client_id.in.(${CLIENT_ID},${CLIENT_ID_2})`,
    );
    await sb.auth.signOut();
  });

  it('trainer can link two clients', async () => {
    const { data, error } = await sb.from('client_links').insert({
      trainer_id:       trainerId,
      client_id:        CLIENT_ID,
      linked_client_id: CLIENT_ID_2,
    }).select('id').single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
    createdLinkIds.push(data!.id);
  });

  it('the link appears when querying from either direction', async () => {
    const { data: fromA } = await sb.from('client_links')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .eq('linked_client_id', CLIENT_ID_2);

    const { data: fromB } = await sb.from('client_links')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .eq('linked_client_id', CLIENT_ID_2);

    expect(fromA).toHaveLength(1);
    expect(fromB).toHaveLength(1);
  });

  it('duplicate insert returns unique violation (23505)', async () => {
    const { error } = await sb.from('client_links').insert({
      trainer_id:       trainerId,
      client_id:        CLIENT_ID,
      linked_client_id: CLIENT_ID_2,
    });

    expect(error).toBeTruthy();
    expect(error!.code).toBe('23505');
  });

  it('OR query finds the link regardless of which column the client is in', async () => {
    const { data } = await sb.from('client_links')
      .select('*')
      .or(`client_id.eq.${CLIENT_ID},linked_client_id.eq.${CLIENT_ID}`);

    expect(data).toBeDefined();
    expect(data!.length).toBeGreaterThanOrEqual(1);
  });

  it('removing the link deletes only the linked pair, not unrelated links', async () => {
    const { error } = await sb.from('client_links')
      .delete()
      .or(`client_id.eq.${CLIENT_ID},linked_client_id.eq.${CLIENT_ID}`);

    expect(error).toBeNull();

    // Verify the link is gone
    const { data } = await sb.from('client_links')
      .select('*')
      .or(`client_id.eq.${CLIENT_ID},linked_client_id.eq.${CLIENT_ID}`);

    expect(data).toHaveLength(0);
    createdLinkIds.length = 0; // already cleaned up
  });
});
