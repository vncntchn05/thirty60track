import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Direct-DB clients for E2E setup / assertions.
 *
 * The Playwright runner uses these to (a) reset rows between tests and
 * (b) verify post-conditions that the UI doesn't display (e.g. that an
 * RLS write *was actually blocked at the DB level*, not just hidden by UI).
 *
 * Two client variants:
 *   - anon: subject to RLS, mirrors what the browser uses
 *   - service: bypasses RLS, used for fixture setup/teardown only
 */

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!ANON) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required for E2E helpers');
if (!SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for E2E helpers');

export function anonClient(): SupabaseClient {
  return createClient(URL, ANON, { auth: { persistSession: false } });
}

export function serviceClient(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

export const TEST_CLIENT_ID = process.env.TEST_CLIENT_ID
  ?? 'cccccccc-0000-4000-c000-000000000003';

export const TEST_TRAINER_EMAIL = process.env.TEST_TRAINER_EMAIL ?? 'trainer@thirty60test.dev';
export const TEST_CLIENT_EMAIL  = process.env.TEST_CLIENT_EMAIL  ?? 'client@thirty60test.dev';
export const TEST_TRAINER_PW    = process.env.TEST_TRAINER_PASSWORD!;
export const TEST_CLIENT_PW     = process.env.TEST_CLIENT_PASSWORD!;

/** Reset PRs + workouts for a client between test runs. */
export async function resetClientWorkoutState(clientId: string) {
  const svc = serviceClient();
  await svc.from('personal_records').delete().eq('client_id', clientId);
  await svc.from('workout_sets')
    .delete()
    .in('workout_id', (await svc.from('workouts').select('id').eq('client_id', clientId)).data?.map(r => r.id) ?? []);
  await svc.from('workouts').delete().eq('client_id', clientId);
}
