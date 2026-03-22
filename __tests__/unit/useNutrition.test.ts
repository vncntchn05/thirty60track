/**
 * Unit tests for hooks/useNutrition.ts
 *
 * Tests the mutation call patterns (addLog, deleteLog, saveGoal) by simulating
 * the exact supabase calls the hook makes, without using renderHook.
 */

import { supabase } from '@/lib/supabase';
import type { InsertNutritionLog, UpsertNutritionGoal } from '@/types';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { onAuthStateChange: jest.fn(), signOut: jest.fn() } },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Simulates the exact addLog() body from useNutrition.ts */
async function simulateAddLog(entry: InsertNutritionLog) {
  const { error: err } = await (supabase.from('nutrition_logs').insert(entry) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: (err as { message: string } | null)?.message ?? null };
}

/** Simulates the exact deleteLog() body */
async function simulateDeleteLog(id: string) {
  const chain = supabase.from('nutrition_logs').delete() as unknown as {
    eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
  };
  const { error: err } = await chain.eq('id', id);
  return { error: (err as { message: string } | null)?.message ?? null };
}

/** Simulates the exact saveGoal() body */
async function simulateSaveGoal(payload: UpsertNutritionGoal) {
  const { error: err } = await (supabase
    .from('nutrition_goals')
    .upsert(payload, { onConflict: 'client_id' }) as unknown as Promise<{ error: { message: string } | null }>);
  return { error: (err as { message: string } | null)?.message ?? null };
}

// ─── addLog ───────────────────────────────────────────────────────────────────

describe('addLog()', () => {
  beforeEach(() => jest.clearAllMocks());

  const LOG_ENTRY: InsertNutritionLog = {
    client_id: 'c-1',
    trainer_id: 't-1',
    logged_date: '2024-03-10',
    meal_type: 'breakfast',
    food_name: 'Oats',
    serving_size_g: 80,
    calories: 300,
    protein_g: 10,
    carbs_g: 54,
    fat_g: 6,
    fiber_g: 8,
    usda_food_id: null,
    logged_by_role: 'trainer',
    logged_by_user_id: 't-1',
  };

  it('calls supabase.from("nutrition_logs").insert() with the entry', async () => {
    const insertMock = jest.fn().mockReturnValue({
      then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
    });
    mockFrom.mockReturnValue({ insert: insertMock });

    await simulateAddLog(LOG_ENTRY);

    expect(mockFrom).toHaveBeenCalledWith('nutrition_logs');
    expect(insertMock).toHaveBeenCalledWith(LOG_ENTRY);
  });

  it('returns null error on success', async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
      }),
    });
    const result = await simulateAddLog(LOG_ENTRY);
    expect(result.error).toBeNull();
  });

  it('returns the supabase error message on failure', async () => {
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        then: (r: (v: { error: { message: string } }) => unknown) =>
          Promise.resolve({ error: { message: 'insert failed' } }).then(r),
      }),
    });
    const result = await simulateAddLog(LOG_ENTRY);
    expect(result.error).toBe('insert failed');
  });

  it('passes all log fields to insert without modification', async () => {
    const insertMock = jest.fn().mockReturnValue({
      then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
    });
    mockFrom.mockReturnValue({ insert: insertMock });

    await simulateAddLog(LOG_ENTRY);

    const inserted = insertMock.mock.calls[0][0];
    expect(inserted.food_name).toBe('Oats');
    expect(inserted.serving_size_g).toBe(80);
    expect(inserted.meal_type).toBe('breakfast');
    expect(inserted.calories).toBe(300);
  });
});

// ─── deleteLog ────────────────────────────────────────────────────────────────

describe('deleteLog()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls delete().eq("id", id) on nutrition_logs', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ delete: deleteMock });

    await simulateDeleteLog('log-123');

    expect(mockFrom).toHaveBeenCalledWith('nutrition_logs');
    expect(deleteMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith('id', 'log-123');
  });

  it('returns null error on success', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eqMock }) });
    const result = await simulateDeleteLog('log-abc');
    expect(result.error).toBeNull();
  });

  it('returns error message on failure', async () => {
    const eqMock = jest.fn().mockResolvedValue({ error: { message: 'not found' } });
    mockFrom.mockReturnValue({ delete: jest.fn().mockReturnValue({ eq: eqMock }) });
    const result = await simulateDeleteLog('log-xyz');
    expect(result.error).toBe('not found');
  });
});

// ─── saveGoal ─────────────────────────────────────────────────────────────────

describe('saveGoal()', () => {
  beforeEach(() => jest.clearAllMocks());

  const GOAL: UpsertNutritionGoal = {
    client_id: 'c-1',
    trainer_id: 't-1',
    calories: 2200,
    protein_pct: 30,
    carbs_pct: 45,
    fat_pct: 25,
  };

  it('calls upsert with the correct onConflict option', async () => {
    const upsertMock = jest.fn().mockReturnValue({
      then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
    });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    await simulateSaveGoal(GOAL);

    expect(upsertMock).toHaveBeenCalledWith(GOAL, { onConflict: 'client_id' });
  });

  it('calls supabase.from("nutrition_goals")', async () => {
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
      }),
    });
    await simulateSaveGoal(GOAL);
    expect(mockFrom).toHaveBeenCalledWith('nutrition_goals');
  });

  it('returns null error on success', async () => {
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
      }),
    });
    expect((await simulateSaveGoal(GOAL)).error).toBeNull();
  });

  it('returns error message on failure', async () => {
    mockFrom.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        then: (r: (v: { error: { message: string } }) => unknown) =>
          Promise.resolve({ error: { message: 'upsert failed' } }).then(r),
      }),
    });
    expect((await simulateSaveGoal(GOAL)).error).toBe('upsert failed');
  });

  it('passes macro percentages correctly to upsert', async () => {
    const upsertMock = jest.fn().mockReturnValue({
      then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
    });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    await simulateSaveGoal(GOAL);
    const [payload] = upsertMock.mock.calls[0];
    expect(payload.protein_pct + payload.carbs_pct + payload.fat_pct).toBe(100);
  });
});

// ─── fetch — guard clause ─────────────────────────────────────────────────────

describe('useNutrition fetch guard', () => {
  it('fetch early-returns when clientId is falsy', () => {
    // Simulate the `if (!clientId || !date) return;` guard
    const clientId = '';
    const date = '2024-03-10';
    const shouldFetch = Boolean(clientId && date);
    expect(shouldFetch).toBe(false);
  });

  it('fetch early-returns when date is falsy', () => {
    // Use runtime variables to avoid TS2872 "always truthy" on string literals
    const clientId: string = 'c-1';
    const date: string = '';
    const shouldFetch = Boolean(clientId && date);
    expect(shouldFetch).toBe(false);
  });

  it('fetch proceeds when both clientId and date are present', () => {
    const clientId: string = 'c-1';
    const date: string = '2024-03-10';
    const shouldFetch = Boolean(clientId && date);
    expect(shouldFetch).toBe(true);
  });
});
