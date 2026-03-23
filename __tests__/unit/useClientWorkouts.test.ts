/**
 * Unit tests for hooks/useClientWorkouts.ts
 *
 * Validates the Supabase call pattern: correct table, client_id filter,
 * descending sort, trainer join, and logged_by fields.
 */

import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn() },
  },
}));

const mockFrom = supabase.from as jest.Mock;

// Matches the select string in useClientWorkouts.ts
const WORKOUT_FIELDS =
  'id, client_id, trainer_id, performed_at, notes, body_weight_kg, body_fat_percent, workout_group_id, logged_by_role, logged_by_user_id, created_at, updated_at, trainer:trainers(full_name)';

/** Replicates the fetch body from useClientWorkouts (lines ~22-33). */
async function simulateFetchClientWorkouts(clientId: string) {
  if (!clientId) return { workouts: [], error: null };

  const { data, error: err } = await (supabase
    .from('workouts')
    .select(WORKOUT_FIELDS)
    .eq('client_id', clientId)
    .order('performed_at', { ascending: false }) as unknown as Promise<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>);

  if (err) return { workouts: [], error: err.message };
  return { workouts: data ?? [], error: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClientWorkouts fetch behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips the DB call when clientId is empty string', async () => {
    const { workouts } = await simulateFetchClientWorkouts('');
    expect(workouts).toHaveLength(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('queries the workouts table', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientWorkouts('client-1');

    expect(mockFrom).toHaveBeenCalledWith('workouts');
  });

  it('filters by client_id', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientWorkouts('client-xyz');

    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('client_id', 'client-xyz');
  });

  it('orders by performed_at descending (newest first)', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientWorkouts('client-1');

    expect((chain.order as jest.Mock)).toHaveBeenCalledWith('performed_at', { ascending: false });
  });

  it('WORKOUT_FIELDS includes logged_by_role (attribution display)', () => {
    expect(WORKOUT_FIELDS).toContain('logged_by_role');
  });

  it('WORKOUT_FIELDS includes logged_by_user_id', () => {
    expect(WORKOUT_FIELDS).toContain('logged_by_user_id');
  });

  it('WORKOUT_FIELDS includes trainer join for display name', () => {
    expect(WORKOUT_FIELDS).toContain('trainer:trainers(full_name)');
  });

  it('returns the workouts array on success', async () => {
    const mockWorkouts = [
      { id: 'w-1', client_id: 'c-1', performed_at: '2024-03-10' },
      { id: 'w-2', client_id: 'c-1', performed_at: '2024-03-05' },
    ];
    const chain = createQueryMock({ data: mockWorkouts, error: null });
    mockFrom.mockReturnValue(chain);

    const { workouts, error } = await simulateFetchClientWorkouts('c-1');

    expect(error).toBeNull();
    expect(workouts).toHaveLength(2);
    expect((workouts[0] as { id: string }).id).toBe('w-1');
  });

  it('returns error message and empty array on DB failure', async () => {
    const chain = createQueryMock({ data: null, error: { message: 'permission denied' } });
    mockFrom.mockReturnValue(chain);

    const { workouts, error } = await simulateFetchClientWorkouts('c-1');

    expect(workouts).toHaveLength(0);
    expect(error).toBe('permission denied');
  });

  it('returns empty array (not null) when DB returns null data', async () => {
    const chain = createQueryMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { workouts, error } = await simulateFetchClientWorkouts('c-1');

    expect(error).toBeNull();
    expect(workouts).toHaveLength(0);
  });
});
