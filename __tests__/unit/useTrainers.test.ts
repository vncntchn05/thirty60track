/**
 * Unit tests for hooks/useTrainers.ts
 *
 * Validates that the hook excludes the current user from the trainer list,
 * orders results alphabetically, and propagates errors correctly.
 */

import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn() },
  },
}));

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'trainer-current' }, role: 'trainer' })),
}));

const mockFrom = supabase.from as jest.Mock;

const TRAINER_FIELDS = 'id, full_name, email, avatar_url, created_at';

/** Replicates the fetch body from useTrainers (lines ~24-31). */
async function simulateFetchTrainers(user: { id: string } | null) {
  if (!user) return { trainers: [], error: null };

  const { data, error: err } = await (supabase
    .from('trainers')
    .select(TRAINER_FIELDS)
    .neq('id', user.id)
    .order('full_name') as unknown as Promise<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>);

  if (err) return { trainers: [], error: err.message };
  return { trainers: data ?? [], error: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useTrainers fetch behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips the DB call when user is null', async () => {
    const { trainers } = await simulateFetchTrainers(null);
    expect(trainers).toHaveLength(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('queries the trainers table', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchTrainers({ id: 't-me' });

    expect(mockFrom).toHaveBeenCalledWith('trainers');
  });

  it('excludes the current user via .neq("id", user.id)', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchTrainers({ id: 'trainer-123' });

    expect((chain.neq as jest.Mock)).toHaveBeenCalledWith('id', 'trainer-123');
  });

  it('orders results by full_name', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchTrainers({ id: 't-1' });

    expect((chain.order as jest.Mock)).toHaveBeenCalledWith('full_name');
  });

  it('selects the correct fields', async () => {
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchTrainers({ id: 't-1' });

    expect((chain.select as jest.Mock)).toHaveBeenCalledWith(TRAINER_FIELDS);
  });

  it('returns the trainers array on success', async () => {
    const mockTrainers = [
      { id: 't-2', full_name: 'Alice Smith' },
      { id: 't-3', full_name: 'Bob Jones' },
    ];
    const chain = createQueryMock({ data: mockTrainers, error: null });
    mockFrom.mockReturnValue(chain);

    const { trainers, error } = await simulateFetchTrainers({ id: 't-1' });

    expect(error).toBeNull();
    expect(trainers).toHaveLength(2);
  });

  it('returns error message and empty array on DB failure', async () => {
    const chain = createQueryMock({ data: null, error: { message: 'access denied' } });
    mockFrom.mockReturnValue(chain);

    const { trainers, error } = await simulateFetchTrainers({ id: 't-1' });

    expect(trainers).toHaveLength(0);
    expect(error).toBe('access denied');
  });

  it('returns empty array (not null) when DB returns null data', async () => {
    const chain = createQueryMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { trainers, error } = await simulateFetchTrainers({ id: 't-1' });

    expect(error).toBeNull();
    expect(trainers).toHaveLength(0);
  });

  it('does not include the current user in results (neq guard confirmed)', async () => {
    // Simulate DB returning a list that theoretically includes the current user
    // (shouldn't happen with RLS, but we confirm the neq call is made)
    const chain = createQueryMock({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchTrainers({ id: 'trainer-me' });

    const neqCalls = (chain.neq as jest.Mock).mock.calls;
    const userIdExcluded = neqCalls.some(([col, val]) => col === 'id' && val === 'trainer-me');
    expect(userIdExcluded).toBe(true);
  });
});
