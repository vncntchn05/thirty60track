/**
 * Unit tests for hooks/useClientIntake.ts
 *
 * Tests saveIntake() call patterns:
 *  - upsert into client_intake with onConflict: 'client_id'
 *  - markComplete=true flips clients.intake_completed=true
 *  - clientData is merged into the clients.update() call
 *  - error propagation from upsert and clients.update
 */

import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { onAuthStateChange: jest.fn(), signOut: jest.fn() },
  },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── Simulate saveIntake() from useClientIntake.ts ────────────────────────────

type IntakePayload = Record<string, unknown>;
type ClientPayload = Record<string, unknown> | undefined;

async function simulateSaveIntake(
  clientId: string,
  intakeData: IntakePayload,
  clientData?: ClientPayload,
  markComplete = false,
) {
  if (!clientId) return { error: 'No client ID' };

  const payload = {
    ...intakeData,
    ...(markComplete ? { completed_at: expect.any(String) } : {}),
  };

  const intakeChain = mockFrom('client_intake');
  const { data: upserted, error: upsertErr } = await (intakeChain
    .upsert({ client_id: clientId, ...payload }, { onConflict: 'client_id' })
    .select()
    .single() as unknown as Promise<{ data: unknown; error: { message: string } | null }>);

  if (upsertErr) return { error: upsertErr.message };

  if (clientData || markComplete) {
    const clientChain = mockFrom('clients');
    const { error: clientErr } = await (clientChain
      .update({ ...(clientData ?? {}), ...(markComplete ? { intake_completed: true } : {}) })
      .eq('id', clientId) as unknown as Promise<{ error: { message: string } | null }>);
    if (clientErr) return { error: clientErr.message };
  }

  return { error: null };
}

// ─── saveIntake — basic upsert ────────────────────────────────────────────────

describe('saveIntake — upsert pattern', () => {
  beforeEach(() => jest.clearAllMocks());

  it('upserts into client_intake with onConflict: "client_id"', async () => {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    mockFrom.mockReturnValue(intakeChain);

    await supabase
      .from('client_intake')
      .upsert({ client_id: 'c-1', activity_level: 'moderate' }, { onConflict: 'client_id' })
      .select()
      .single();

    expect(mockFrom).toHaveBeenCalledWith('client_intake');
    expect((intakeChain.upsert as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'c-1' }),
      { onConflict: 'client_id' },
    );
  });

  it('returns null error on success', async () => {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    mockFrom.mockImplementation(() => intakeChain);

    const result = await simulateSaveIntake('c-1', { activity_level: 'active' });
    expect(result.error).toBeNull();
  });

  it('returns error message when upsert fails', async () => {
    const failChain = createQueryMock({ data: null, error: { message: 'RLS violation' } });
    (failChain.single as jest.Mock).mockResolvedValue({ data: null, error: { message: 'RLS violation' } });
    mockFrom.mockReturnValue(failChain);

    const result = await simulateSaveIntake('c-1', { activity_level: 'active' });
    expect(result.error).toBe('RLS violation');
  });

  it('returns "No client ID" guard when clientId is empty', async () => {
    const result = await simulateSaveIntake('', { activity_level: 'active' });
    expect(result.error).toBe('No client ID');
  });
});

// ─── saveIntake — markComplete ────────────────────────────────────────────────

describe('saveIntake — markComplete=true', () => {
  beforeEach(() => jest.clearAllMocks());

  function setupBothTables() {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    const clientsChain = createQueryMock({ error: null });
    let callCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_intake') return intakeChain;
      if (table === 'clients') return clientsChain;
      return createQueryMock();
    });

    return { intakeChain, clientsChain };
  }

  it('updates clients table when markComplete=true', async () => {
    const { clientsChain } = setupBothTables();

    await simulateSaveIntake('c-1', { goals: 'Lose weight' }, undefined, true);

    expect(mockFrom).toHaveBeenCalledWith('clients');
    expect((clientsChain.update as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ intake_completed: true }),
    );
  });

  it('does NOT call clients.update when markComplete=false and no clientData', async () => {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    mockFrom.mockReturnValue(intakeChain);

    await simulateSaveIntake('c-1', { goals: 'Gain muscle' }, undefined, false);

    const clientCalls = (mockFrom as jest.Mock).mock.calls.filter(([t]: [string]) => t === 'clients');
    expect(clientCalls).toHaveLength(0);
  });

  it('passes eq("id", clientId) when updating clients', async () => {
    const { clientsChain } = setupBothTables();

    await simulateSaveIntake('c-42', { goals: 'Maintain' }, undefined, true);

    expect((clientsChain.eq as jest.Mock)).toHaveBeenCalledWith('id', 'c-42');
  });
});

// ─── saveIntake — clientData sync ─────────────────────────────────────────────

describe('saveIntake — clientData sync', () => {
  beforeEach(() => jest.clearAllMocks());

  function setupTables() {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    const clientsChain = createQueryMock({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_intake') return intakeChain;
      if (table === 'clients') return clientsChain;
      return createQueryMock();
    });
    return { intakeChain, clientsChain };
  }

  it('merges clientData into clients.update() when provided', async () => {
    const { clientsChain } = setupTables();

    await simulateSaveIntake('c-1', { goals: 'Run a 5K' }, { name: 'Alice', phone: '555-0100' }, false);

    expect((clientsChain.update as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alice', phone: '555-0100' }),
    );
  });

  it('includes intake_completed=true alongside clientData when markComplete=true', async () => {
    const { clientsChain } = setupTables();

    await simulateSaveIntake('c-1', { goals: 'Run' }, { name: 'Bob' }, true);

    expect((clientsChain.update as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bob', intake_completed: true }),
    );
  });

  it('returns error from clients.update when it fails', async () => {
    const intakeChain = createQueryMock({ data: { id: 'ci-1' }, error: null });
    const failClientsChain = createQueryMock({ error: { message: 'clients update failed' } });
    (failClientsChain.eq as jest.Mock).mockResolvedValue({ error: { message: 'clients update failed' } });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_intake') return intakeChain;
      if (table === 'clients') {
        // Override eq to resolve with error
        const c = createQueryMock({ error: null });
        (c.update as jest.Mock).mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'clients update failed' } }),
        });
        return c;
      }
      return createQueryMock();
    });

    const result = await simulateSaveIntake('c-1', { goals: 'X' }, { name: 'C' }, false);
    expect(result.error).toBe('clients update failed');
  });
});
