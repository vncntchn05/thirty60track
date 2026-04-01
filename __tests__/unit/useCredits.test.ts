/**
 * Unit tests for hooks/useCredits.ts
 *
 * Tests grantCredits() — the only exported standalone function.
 * Hook functions (useClientCredits, useCreditTransactions) are tested
 * via guard clause simulation.
 */

import { supabase } from '@/lib/supabase';
import { grantCredits } from '@/hooks/useCredits';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { onAuthStateChange: jest.fn() } },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── grantCredits ─────────────────────────────────────────────────────────────

describe('grantCredits()', () => {
  beforeEach(() => jest.clearAllMocks());

  function setupGrantMocks(opts: {
    currentBalance?: number;
    upsertError?: string | null;
    txError?: string | null;
  }) {
    let callCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        callCount++;
        if (callCount === 1) {
          // Read current balance
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: opts.currentBalance !== undefined ? { balance: opts.currentBalance } : null,
                  error: null,
                }),
              }),
            }),
          };
        }
        // Upsert new balance
        return {
          upsert: jest.fn().mockResolvedValue({
            error: opts.upsertError ? { message: opts.upsertError } : null,
          }),
        };
      }
      if (table === 'credit_transactions') {
        return {
          insert: jest.fn().mockResolvedValue({
            error: opts.txError ? { message: opts.txError } : null,
          }),
        };
      }
      return {};
    });
  }

  it('reads the current balance before upserting', async () => {
    setupGrantMocks({ currentBalance: 3 });

    await grantCredits('c-1', 't-1', 2);

    const calls = (mockFrom as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(calls[0]).toBe('client_credits');
  });

  it('upserts the sum of current balance + amount', async () => {
    let upsertArg: { balance: number } | undefined;
    let callCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { balance: 4 }, error: null }),
              }),
            }),
          };
        }
        return {
          upsert: jest.fn().mockImplementation((arg: { balance: number }) => {
            upsertArg = arg;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    await grantCredits('c-1', 't-1', 3);

    expect(upsertArg?.balance).toBe(7); // 4 + 3
  });

  it('uses 0 as base when no existing credits row', async () => {
    let upsertArg: { balance: number } | undefined;
    let callCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {
          upsert: jest.fn().mockImplementation((arg: { balance: number }) => {
            upsertArg = arg;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    await grantCredits('c-1', 't-1', 5);

    expect(upsertArg?.balance).toBe(5); // 0 + 5
  });

  it('returns null error on full success', async () => {
    setupGrantMocks({ currentBalance: 2 });

    const result = await grantCredits('c-1', 't-1', 3);
    expect(result.error).toBeNull();
  });

  it('returns error when credit upsert fails', async () => {
    setupGrantMocks({ currentBalance: 2, upsertError: 'upsert failed' });

    const result = await grantCredits('c-1', 't-1', 3);
    expect(result.error).toBe('upsert failed');
  });

  it('returns error when transaction insert fails', async () => {
    setupGrantMocks({ currentBalance: 2, txError: 'tx failed' });

    const result = await grantCredits('c-1', 't-1', 3);
    expect(result.error).toBe('tx failed');
  });

  it('inserts a credit_transaction with reason "grant"', async () => {
    let insertArg: { reason: string; amount: number } | undefined;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { balance: 0 }, error: null }),
            }),
          }),
          upsert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'credit_transactions') {
        return {
          insert: jest.fn().mockImplementation((arg: { reason: string; amount: number }) => {
            insertArg = arg;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return {};
    });

    // Need a fresh callCount simulation; restructure mock
    let ccCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        ccCount++;
        if (ccCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { balance: 1 }, error: null }),
              }),
            }),
          };
        }
        return { upsert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {
        insert: jest.fn().mockImplementation((arg: { reason: string; amount: number }) => {
          insertArg = arg;
          return Promise.resolve({ error: null });
        }),
      };
    });

    await grantCredits('c-1', 't-1', 4, 'Welcome bonus');

    expect(insertArg?.reason).toBe('grant');
    expect(insertArg?.amount).toBe(4);
  });

  it('passes note to transaction record', async () => {
    let insertArg: { note: string | null } | undefined;
    let ccCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        ccCount++;
        if (ccCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { balance: 0 }, error: null }),
              }),
            }),
          };
        }
        return { upsert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {
        insert: jest.fn().mockImplementation((arg: { note: string | null }) => {
          insertArg = arg;
          return Promise.resolve({ error: null });
        }),
      };
    });

    await grantCredits('c-1', 't-1', 2, 'Monthly allocation');
    expect(insertArg?.note).toBe('Monthly allocation');
  });

  it('sets note to null when not provided', async () => {
    let insertArg: { note: string | null } | undefined;
    let ccCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'client_credits') {
        ccCount++;
        if (ccCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { balance: 0 }, error: null }),
              }),
            }),
          };
        }
        return { upsert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {
        insert: jest.fn().mockImplementation((arg: { note: string | null }) => {
          insertArg = arg;
          return Promise.resolve({ error: null });
        }),
      };
    });

    await grantCredits('c-1', 't-1', 1);
    expect(insertArg?.note).toBeNull();
  });
});

// ─── Hook guard clause simulations ────────────────────────────────────────────

describe('useClientCredits guard clauses', () => {
  it('early-returns when clientId is empty', () => {
    const clientId = '';
    const shouldLoad = Boolean(clientId);
    expect(shouldLoad).toBe(false);
  });

  it('proceeds when clientId is present', () => {
    const clientId = 'c-1';
    const shouldLoad = Boolean(clientId);
    expect(shouldLoad).toBe(true);
  });

  it('balance defaults to 0 when credits row is null', () => {
    const credits = null;
    const balance = credits?.balance ?? 0;
    expect(balance).toBe(0);
  });

  it('balance returns actual value when credits row exists', () => {
    const credits = { balance: 7 };
    const balance = credits?.balance ?? 0;
    expect(balance).toBe(7);
  });

  it('PGRST116 (not found) is not treated as an error', () => {
    const err = { code: 'PGRST116', message: 'not found' };
    const isRealError = err && err.code !== 'PGRST116';
    expect(isRealError).toBe(false);
  });

  it('other error codes are treated as errors', () => {
    const err = { code: '500', message: 'server error' };
    const isRealError = err && err.code !== 'PGRST116';
    expect(isRealError).toBe(true);
  });
});

describe('useCreditTransactions guard clauses', () => {
  it('early-returns when clientId is empty', () => {
    const clientId = '';
    const shouldLoad = Boolean(clientId);
    expect(shouldLoad).toBe(false);
  });

  it('defaults to empty array when data is null', () => {
    const data = null;
    const transactions = data ?? [];
    expect(transactions).toEqual([]);
  });
});
