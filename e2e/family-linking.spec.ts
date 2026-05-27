import { test, expect } from '@playwright/test';
import { anonClient, serviceClient } from './helpers/supabase';

/**
 * Family Account Linking
 *
 * Validates that is_linked_to_client(target_id UUID) — a SECURITY DEFINER
 * function — actually grants cross-account read/write to linked clients,
 * and denies it to unlinked ones.
 *
 * The test creates two ephemeral client accounts via service role, links
 * them, signs in as client A, and verifies:
 *   - A can SELECT B's workouts (linked-client SELECT policy hits)
 *   - A can INSERT a workout for B (linked-client write policy hits)
 *   - An UNLINKED third party C cannot SELECT B's workouts
 *
 * All fixtures are torn down in afterAll.
 */

type Pair = { authId: string; clientId: string; email: string; password: string };

const PW = 'family-link-e2e-pw-1234';
async function provisionClient(email: string): Promise<Pair> {
  const svc = serviceClient();
  const auth = await svc.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (auth.error) throw auth.error;
  const authId = auth.data.user!.id;

  // Find or create a trainer who owns this client.
  const tr = await svc.from('trainers').select('id').limit(1).single();
  if (tr.error || !tr.data) throw new Error('No trainer exists — run seed_cicd.sql first');

  const c = await svc.from('clients').insert({
    trainer_id: tr.data.id,
    auth_user_id: authId,
    full_name: email,
    email,
  }).select('id').single();
  if (c.error) throw c.error;

  return { authId, clientId: c.data.id, email, password: PW };
}

async function teardown(pairs: Pair[]) {
  const svc = serviceClient();
  for (const p of pairs) {
    await svc.from('client_links').delete().eq('client_a', p.clientId);
    await svc.from('client_links').delete().eq('client_b', p.clientId);
    await svc.from('workouts').delete().eq('client_id', p.clientId);
    await svc.from('clients').delete().eq('id', p.clientId);
    await svc.auth.admin.deleteUser(p.authId);
  }
}

test.describe('Family account linking RLS', () => {
  let A: Pair, B: Pair, C: Pair;

  test.beforeAll(async () => {
    const stamp = Date.now();
    A = await provisionClient(`family-a-${stamp}@thirty60test.dev`);
    B = await provisionClient(`family-b-${stamp}@thirty60test.dev`);
    C = await provisionClient(`family-c-${stamp}@thirty60test.dev`);

    // Link A ↔ B via service role (mesh insert mirrors the app's addToFamilyGroup).
    const svc = serviceClient();
    await svc.from('client_links').insert([
      { client_a: A.clientId, client_b: B.clientId },
      { client_a: B.clientId, client_b: A.clientId },
    ]);
  });

  test.afterAll(async () => {
    await teardown([A, B, C]);
  });

  test('linked client A can SELECT linked client B workouts', async () => {
    // Seed a workout for B via service role.
    const svc = serviceClient();
    const wk = await svc.from('workouts').insert({
      client_id: B.clientId,
      performed_at: new Date().toISOString(),
    }).select().single();
    expect(wk.error).toBeNull();

    // Sign in as A and read B's row through the anon client (RLS applied).
    const aClient = anonClient();
    const signIn = await aClient.auth.signInWithPassword({ email: A.email, password: A.password });
    expect(signIn.error).toBeNull();

    const read = await aClient.from('workouts').select('id').eq('client_id', B.clientId);
    expect(read.error).toBeNull();
    expect(read.data?.length).toBeGreaterThan(0);
  });

  test('linked client A can INSERT a workout on behalf of B', async () => {
    const aClient = anonClient();
    await aClient.auth.signInWithPassword({ email: A.email, password: A.password });

    const insert = await aClient.from('workouts').insert({
      client_id: B.clientId,
      performed_at: new Date().toISOString(),
      notes: 'logged by linked family member A',
    }).select().single();

    expect(insert.error).toBeNull();
    expect(insert.data?.client_id).toBe(B.clientId);
  });

  test('unlinked client C CANNOT SELECT or INSERT for B', async () => {
    const cClient = anonClient();
    await cClient.auth.signInWithPassword({ email: C.email, password: C.password });

    const read = await cClient.from('workouts').select('id').eq('client_id', B.clientId);
    // RLS returns an empty set rather than an error on SELECT — both are fine,
    // the key invariant is that C cannot see B's rows.
    expect(read.error).toBeNull();
    expect(read.data ?? []).toHaveLength(0);

    const insert = await cClient.from('workouts').insert({
      client_id: B.clientId,
      performed_at: new Date().toISOString(),
    });
    expect(insert.error).not.toBeNull();
  });
});
