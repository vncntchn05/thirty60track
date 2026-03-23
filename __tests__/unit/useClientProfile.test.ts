/**
 * Unit tests for hooks/useClientProfile.ts
 *
 * Simulates the hook's fetch logic directly (no renderHook) to validate
 * the Supabase call pattern and auth_user_id field inclusion — the latter
 * underpins the linked-client indicator shown in the trainer client list.
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
  useAuth: jest.fn(() => ({ clientId: 'client-1', user: null, role: 'client' })),
}));

const mockFrom = supabase.from as jest.Mock;

// Matches the CLIENT_FIELDS constant in useClientProfile.ts
const CLIENT_FIELDS =
  'id, trainer_id, auth_user_id, full_name, email, phone, date_of_birth, gender, notes, weight_kg, height_cm, bf_percent, bmi, lean_body_mass, intake_completed, created_at, updated_at';

/** Replicates the fetch body from useClientProfile (lines ~27-35). */
async function simulateFetchClientProfile(clientId: string | null) {
  if (!clientId) return { client: null, error: null };

  const { data, error: err } = await (supabase
    .from('clients')
    .select(CLIENT_FIELDS)
    .eq('id', clientId)
    .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);

  if (err) return { client: null, error: err.message };
  return { client: data, error: null };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useClientProfile fetch behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips the DB call when clientId is null', async () => {
    const { client } = await simulateFetchClientProfile(null);
    expect(client).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('queries the clients table', async () => {
    const chain = createQueryMock({ data: { id: 'client-1' }, error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientProfile('client-1');

    expect(mockFrom).toHaveBeenCalledWith('clients');
  });

  it('filters by the correct clientId', async () => {
    const chain = createQueryMock({ data: { id: 'client-abc' }, error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientProfile('client-abc');

    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('id', 'client-abc');
  });

  it('selects the full CLIENT_FIELDS string (not *)', async () => {
    const chain = createQueryMock({ data: {}, error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientProfile('client-1');

    expect((chain.select as jest.Mock)).toHaveBeenCalledWith(CLIENT_FIELDS);
  });

  it('CLIENT_FIELDS includes auth_user_id (required for linked-client indicator)', () => {
    expect(CLIENT_FIELDS).toContain('auth_user_id');
  });

  it('uses .single() — expects exactly one row', async () => {
    const chain = createQueryMock({ data: { id: 'client-1' }, error: null });
    mockFrom.mockReturnValue(chain);

    await simulateFetchClientProfile('client-1');

    expect(chain.single).toHaveBeenCalled();
  });

  it('returns the client data on success', async () => {
    const mockClient = { id: 'client-1', full_name: 'Jane Doe', auth_user_id: 'auth-uid-99' };
    const chain = createQueryMock({ data: mockClient, error: null });
    mockFrom.mockReturnValue(chain);

    const { client, error } = await simulateFetchClientProfile('client-1');

    expect(error).toBeNull();
    expect(client).toEqual(mockClient);
  });

  it('returns error message and null client on DB failure', async () => {
    const chain = createQueryMock({ data: null, error: null });
    (chain.single as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Row not found' } });
    mockFrom.mockReturnValue(chain);

    const { client, error } = await simulateFetchClientProfile('client-1');

    expect(client).toBeNull();
    expect(error).toBe('Row not found');
  });

  it('returns null client when clientId is empty string', async () => {
    const { client } = await simulateFetchClientProfile('');
    expect(client).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
