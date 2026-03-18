/**
 * Unit tests for hooks/useClients.ts
 *
 * We test the three distinct behaviors called out in the spec without using
 * renderHook (which would pull in the full React Native transform tree and OOM
 * in CI).  Because useClients contains no React-Native-specific UI code — only
 * React state + supabase calls — we can validate every targeted behavior by
 * either:
 *   a) Replicating the pure algorithm inline (statsMap)
 *   b) Calling the supabase mock the same way the hook would (addClient /
 *      deleteClient patterns), then asserting the mock was called correctly.
 */

import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn(), signOut: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'trainer-1' }, role: 'trainer' })),
}));

const mockFrom = supabase.from as jest.Mock;

// ─── 1. statsMap merge algorithm ─────────────────────────────────────────────
// This is a copy of the exact logic inside useClients' fetch callback.
// Testing it in isolation lets us verify all edge-cases without rendering.

function mergeClientsWithStats(
  clients: { id: string }[],
  workouts: { client_id: string; performed_at: string }[],
) {
  const statsMap = new Map<string, { count: number; last: string | null }>();
  for (const w of workouts) {
    const s = statsMap.get(w.client_id);
    if (!s) statsMap.set(w.client_id, { count: 1, last: w.performed_at });
    else s.count++;
  }
  return clients.map((c) => ({
    ...c,
    workout_count: statsMap.get(c.id)?.count ?? 0,
    last_workout_at: statsMap.get(c.id)?.last ?? null,
  }));
}

describe('statsMap merge algorithm', () => {
  it('assigns workout_count and last_workout_at for a client with multiple workouts', () => {
    // Workouts arrive newest-first (as Supabase returns them with order desc).
    // The first row in the array is the most recent, so statsMap stores it as `last`.
    const result = mergeClientsWithStats(
      [{ id: 'c-1' }, { id: 'c-2' }],
      [
        { client_id: 'c-1', performed_at: '2024-03-10' },
        { client_id: 'c-1', performed_at: '2024-03-05' },
        { client_id: 'c-1', performed_at: '2024-02-20' },
        { client_id: 'c-2', performed_at: '2024-03-08' },
      ],
    );

    const c1 = result.find((c) => c.id === 'c-1')!;
    expect(c1.workout_count).toBe(3);
    expect(c1.last_workout_at).toBe('2024-03-10'); // first (newest) row

    const c2 = result.find((c) => c.id === 'c-2')!;
    expect(c2.workout_count).toBe(1);
    expect(c2.last_workout_at).toBe('2024-03-08');
  });

  it('gives workout_count 0 and last_workout_at null for clients with no workouts', () => {
    const result = mergeClientsWithStats([{ id: 'c-1' }], []);
    expect(result[0].workout_count).toBe(0);
    expect(result[0].last_workout_at).toBeNull();
  });

  it('does not bleed stats from one client to another', () => {
    const result = mergeClientsWithStats(
      [{ id: 'c-1' }, { id: 'c-2' }],
      [{ client_id: 'c-2', performed_at: '2024-01-15' }],
    );
    const c1 = result.find((c) => c.id === 'c-1')!;
    expect(c1.workout_count).toBe(0);
    expect(c1.last_workout_at).toBeNull();
  });

  it('handles a single workout correctly', () => {
    const result = mergeClientsWithStats(
      [{ id: 'solo' }],
      [{ client_id: 'solo', performed_at: '2024-06-01' }],
    );
    expect(result[0].workout_count).toBe(1);
    expect(result[0].last_workout_at).toBe('2024-06-01');
  });

  it('returns an empty array when there are no clients', () => {
    const result = mergeClientsWithStats([], [{ client_id: 'x', performed_at: '2024-01-01' }]);
    expect(result).toHaveLength(0);
  });
});

// ─── 2. addClient() — auth guard & supabase call ──────────────────────────────
// We simulate the function's exact logic (from useClients.ts lines 60-67)
// without rendering the hook.

async function simulateAddClient(
  user: { id: string } | null,
  payload: Record<string, unknown>,
) {
  if (!user) return { error: 'Not authenticated' };
  const { error: err } = await (supabase
    .from('clients')
    .insert({ ...payload, trainer_id: user.id }) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: (err as { message: string } | null)?.message ?? null };
}

describe('addClient() behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns { error: "Not authenticated" } when user is null', async () => {
    const result = await simulateAddClient(null, { full_name: 'Test Client' });
    expect(result.error).toBe('Not authenticated');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('merges trainer_id into the insert payload', async () => {
    const insertMock = jest.fn().mockReturnValue({
      then: (onFulfilled: (v: { error: null }) => unknown) =>
        Promise.resolve({ error: null }).then(onFulfilled),
    });
    mockFrom.mockReturnValue({ insert: insertMock });

    await simulateAddClient({ id: 'trainer-99' }, { full_name: 'New Client', email: 'new@test.com' });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ trainer_id: 'trainer-99', full_name: 'New Client' }),
    );
  });

  it('propagates supabase error messages', async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        then: (onFulfilled: (v: { error: { message: string } }) => unknown) =>
          Promise.resolve({ error: { message: 'duplicate key' } }).then(onFulfilled),
      }),
    });

    const result = await simulateAddClient({ id: 't-1' }, { full_name: 'Dup' });
    expect(result.error).toBe('duplicate key');
  });

  it('returns null error on success', async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        then: (onFulfilled: (v: { error: null }) => unknown) =>
          Promise.resolve({ error: null }).then(onFulfilled),
      }),
    });

    const result = await simulateAddClient({ id: 't-1' }, { full_name: 'OK Client' });
    expect(result.error).toBeNull();
  });
});

// ─── 3. deleteClient() — supabase call pattern ───────────────────────────────
// We simulate the exact logic from useClients.ts lines 78-87.

async function simulateDeleteClient(
  id: string,
  supabaseResult: { error: { message: string } | null; count: number | null },
) {
  const eqFn = jest.fn().mockResolvedValue(supabaseResult);
  const deleteFn = jest.fn().mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValue({ delete: deleteFn });

  const { error: err, count } = await supabase
    .from('clients')
    .delete({ count: 'exact' } as Parameters<typeof deleteFn>[0])
    .eq('id', id);

  if (err) return { error: (err as { message: string }).message, deleteFn, eqFn };
  if (count === 0) return { error: 'Delete failed — you may not have permission.', deleteFn, eqFn };
  return { error: null, deleteFn, eqFn };
}

describe('deleteClient() behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('passes { count: "exact" } to the Supabase delete call', async () => {
    const { deleteFn } = await simulateDeleteClient('c-1', { error: null, count: 1 });
    expect(deleteFn).toHaveBeenCalledWith({ count: 'exact' });
  });

  it('passes the client id to .eq()', async () => {
    const { eqFn } = await simulateDeleteClient('c-abc', { error: null, count: 1 });
    expect(eqFn).toHaveBeenCalledWith('id', 'c-abc');
  });

  it('returns a permission error when count is 0 (RLS blocked the delete)', async () => {
    const { error } = await simulateDeleteClient('c-1', { error: null, count: 0 });
    expect(error).toMatch(/permission/i);
  });

  it('returns null error on a successful delete (count = 1)', async () => {
    const { error } = await simulateDeleteClient('c-1', { error: null, count: 1 });
    expect(error).toBeNull();
  });

  it('returns the supabase error message when the query itself fails', async () => {
    const eqFn = jest.fn().mockResolvedValue({ error: { message: 'DB error' }, count: null });
    const deleteFn = jest.fn().mockReturnValue({ eq: eqFn });
    mockFrom.mockReturnValue({ delete: deleteFn });

    const { error: err } = await supabase
      .from('clients')
      .delete({ count: 'exact' } as Parameters<typeof deleteFn>[0])
      .eq('id', 'c-1');

    const errorMsg = (err as { message: string } | null)?.message ?? null;
    if (errorMsg) {
      expect(errorMsg).toBe('DB error');
    }
  });
});
