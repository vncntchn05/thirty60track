/**
 * Integration tests for auth flow against a real Supabase test project.
 *
 * Prerequisites (set as env vars or in .env.test.local):
 *   EXPO_PUBLIC_SUPABASE_URL      — your test project URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY — your test project anon key
 *   TEST_TRAINER_EMAIL            — a seeded trainer user email
 *   TEST_TRAINER_PASSWORD         — that trainer's password
 *   TEST_CLIENT_EMAIL             — a seeded client user email
 *   TEST_CLIENT_PASSWORD          — that client's password
 *
 * These tests are skipped automatically when the credentials are absent
 * so that CI unit-test jobs don't fail.
 */

// Load .env.test.local for local runs (no-op in CI where vars come from Secrets)
import 'dotenv/config';

const SUPABASE_URL       = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL      = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD   = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_EMAIL       = process.env.TEST_CLIENT_EMAIL;
const CLIENT_PASSWORD    = process.env.TEST_CLIENT_PASSWORD;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD,
);
const hasClientCreds = Boolean(CLIENT_EMAIL && CLIENT_PASSWORD);

const maybeDescribe        = hasCreds       ? describe : describe.skip;
const maybeDescribeClient  = hasClientCreds ? describe : describe.skip;

// Build a fresh Supabase client using the test project credentials.
// We do this here (not via @/lib/supabase) so the module mock in other test
// files cannot interfere.
import { createClient } from '@supabase/supabase-js';

function buildTestClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Trainer sign-in ──────────────────────────────────────────────────────────
maybeDescribe('Auth integration — trainer sign-in', () => {
  let client: ReturnType<typeof buildTestClient>;

  beforeAll(() => { client = buildTestClient(); });
  afterAll(async () => { await client.auth.signOut(); });

  it('signs in successfully with valid trainer credentials', async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.email).toBe(TRAINER_EMAIL);
  });

  it('resolves role to "trainer" — a row exists in the trainers table', async () => {
    await client.auth.signInWithPassword({ email: TRAINER_EMAIL!, password: TRAINER_PASSWORD! });

    const userId = (await client.auth.getUser()).data.user?.id;
    expect(userId).toBeTruthy();

    const { data, error } = await client
      .from('trainers')
      .select('id, email')
      .eq('id', userId!)
      .single();

    expect(error).toBeNull();
    expect(data?.email).toBe(TRAINER_EMAIL);
  });

  it('returns an error for bad trainer credentials', async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: 'definitely-wrong-password-12345',
    });

    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});

// ─── Client sign-in ───────────────────────────────────────────────────────────
maybeDescribeClient('Auth integration — client sign-in', () => {
  let client: ReturnType<typeof buildTestClient>;

  beforeAll(() => { client = buildTestClient(); });
  afterAll(async () => { await client.auth.signOut(); });

  it('signs in successfully with valid client credentials', async () => {
    const { data, error } = await client.auth.signInWithPassword({
      email: CLIENT_EMAIL!,
      password: CLIENT_PASSWORD!,
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
  });

  it('resolves role to "client" — a row exists in the clients table linked by auth_user_id', async () => {
    await client.auth.signInWithPassword({ email: CLIENT_EMAIL!, password: CLIENT_PASSWORD! });

    const userId = (await client.auth.getUser()).data.user?.id;
    expect(userId).toBeTruthy();

    const { data, error } = await client
      .from('clients')
      .select('id, email, auth_user_id')
      .eq('auth_user_id', userId!)
      .single();

    expect(error).toBeNull();
    expect(data?.auth_user_id).toBe(userId);
  });
});
