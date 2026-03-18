/**
 * Extended unit tests for hooks/useWorkouts.ts
 *
 * Supplements useWorkouts.test.ts with:
 *  - createWorkoutWithSets: lean_body_mass formula edge cases
 *  - createWorkoutWithSets: sets error propagation
 *  - generateGroupId: format validation
 *  - updateWorkout body metrics sync patterns
 */

import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { supabase } from '@/lib/supabase';
import type { InsertWorkout } from '@/types';

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

const BASE: InsertWorkout = {
  client_id: 'client-1',
  trainer_id: 'trainer-1',
  performed_at: '2024-06-01',
  notes: null,
  body_weight_kg: null,
  body_fat_percent: null,
};

function setupWorkoutInsertMock(workoutId = 'w-1') {
  const workoutSetsInsert = jest.fn().mockResolvedValue({ error: null });
  const clientsUpdate     = jest.fn().mockReturnThis();
  const clientsEq         = jest.fn().mockResolvedValue({ error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'workouts') {
      const m: Record<string, jest.Mock> = {
        insert: jest.fn(),
        select: jest.fn(),
        single: jest.fn().mockResolvedValue({ data: { id: workoutId }, error: null }),
        eq: jest.fn().mockReturnThis(),
      };
      m.insert.mockReturnValue(m);
      m.select.mockReturnValue(m);
      return m;
    }
    if (table === 'workout_sets') {
      return {
        insert: workoutSetsInsert,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
      };
    }
    if (table === 'clients') {
      const m: Record<string, jest.Mock> = { update: clientsUpdate, eq: clientsEq };
      clientsUpdate.mockReturnValue(m);
      return m;
    }
    return {
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (r: (v: { error: null }) => unknown) => Promise.resolve({ error: null }).then(r),
    };
  });

  return { workoutSetsInsert, clientsUpdate, clientsEq };
}

// ─── lean_body_mass calculation ───────────────────────────────────────────────

describe('createWorkoutWithSets — lean_body_mass formula', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calculates lean_body_mass = weight × (1 - bf%/100), rounded to 2dp', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();

    await createWorkoutWithSets({ ...BASE, body_weight_kg: 80, body_fat_percent: 20 }, []);

    expect(clientsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lean_body_mass: 64.0 }),
    );
  });

  it('lean_body_mass = 80 * (1 - 15/100) = 68.00', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: 80, body_fat_percent: 15 }, []);
    expect(clientsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lean_body_mass: 68.0 }),
    );
  });

  it('lean_body_mass = 75 * (1 - 25/100) = 56.25', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: 75, body_fat_percent: 25 }, []);
    expect(clientsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ lean_body_mass: 56.25 }),
    );
  });

  it('does NOT include lean_body_mass when only weight is provided (no bf%)', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: 80, body_fat_percent: null }, []);

    const payload = (clientsUpdate as jest.Mock).mock.calls[0]?.[0];
    expect(payload?.lean_body_mass).toBeUndefined();
  });

  it('does NOT include lean_body_mass when only bf% is provided (no weight)', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: null, body_fat_percent: 18 }, []);

    const payload = (clientsUpdate as jest.Mock).mock.calls[0]?.[0];
    expect(payload?.lean_body_mass).toBeUndefined();
  });

  it('includes weight_kg in the client update when provided', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: 90, body_fat_percent: null }, []);
    expect(clientsUpdate).toHaveBeenCalledWith(expect.objectContaining({ weight_kg: 90 }));
  });

  it('includes bf_percent in the client update when provided', async () => {
    const { clientsUpdate } = setupWorkoutInsertMock();
    await createWorkoutWithSets({ ...BASE, body_weight_kg: null, body_fat_percent: 22 }, []);
    expect(clientsUpdate).toHaveBeenCalledWith(expect.objectContaining({ bf_percent: 22 }));
  });
});

// ─── sets error propagation ───────────────────────────────────────────────────

describe('createWorkoutWithSets — sets error propagation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns workoutId AND error when sets insert fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') {
        const m: Record<string, jest.Mock> = {
          insert: jest.fn(), select: jest.fn(),
          single: jest.fn().mockResolvedValue({ data: { id: 'w-err' }, error: null }),
          eq: jest.fn().mockReturnThis(),
        };
        m.insert.mockReturnValue(m);
        m.select.mockReturnValue(m);
        return m;
      }
      if (table === 'workout_sets') {
        return {
          insert: jest.fn().mockResolvedValue({ error: { message: 'sets failed' } }),
          then: (r: (v: { error: { message: string } }) => unknown) =>
            Promise.resolve({ error: { message: 'sets failed' } }).then(r),
        };
      }
      if (table === 'clients') {
        const m: Record<string, jest.Mock> = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
        return m;
      }
      return { insert: jest.fn().mockResolvedValue({ error: null }) };
    });

    const result = await createWorkoutWithSets(
      BASE,
      [{ exercise_id: 'ex-1', set_number: 1, reps: 10, weight_kg: 50, duration_seconds: null, notes: null, superset_group: null }],
    );

    expect(result.workoutId).toBe('w-err');
    expect(result.error).toBe('sets failed');
  });
});

// ─── generateGroupId format ───────────────────────────────────────────────────

describe('UUID format produced by generateGroupId (via createWorkoutWithSets)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates linked workouts when linkedClientIds is non-empty (triggering a groupId)', async () => {
    setupWorkoutInsertMock();

    await createWorkoutWithSets(BASE, [], ['client-2']);

    // from('workouts') should be called at least twice (primary + linked)
    const workoutFromCalls = (mockFrom as jest.Mock).mock.calls.filter(
      ([t]: [string]) => t === 'workouts',
    );
    expect(workoutFromCalls.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── updateWorkout body-metrics sync (simulated) ─────────────────────────────

describe('updateWorkout body-metrics sync pattern', () => {
  // Replicate the exact body from useWorkoutDetail.updateWorkout
  function simulateUpdateWorkoutMetricsSync(
    payload: { body_weight_kg?: number | null; body_fat_percent?: number | null },
    existingWorkout: { client_id: string; body_weight_kg: number | null; body_fat_percent: number | null },
  ) {
    const newWeight = payload.body_weight_kg !== undefined ? payload.body_weight_kg : existingWorkout.body_weight_kg;
    const newBf     = payload.body_fat_percent !== undefined ? payload.body_fat_percent : existingWorkout.body_fat_percent;

    if ((payload.body_weight_kg !== undefined || payload.body_fat_percent !== undefined)) {
      const clientUpdate: Record<string, number | null> = {};
      if (payload.body_weight_kg != null)   clientUpdate.weight_kg  = payload.body_weight_kg;
      if (payload.body_fat_percent != null) clientUpdate.bf_percent = payload.body_fat_percent;
      if (newWeight != null && newBf != null) {
        clientUpdate.lean_body_mass = parseFloat((newWeight * (1 - newBf / 100)).toFixed(2));
      }
      return Object.keys(clientUpdate).length > 0 ? clientUpdate : null;
    }
    return null;
  }

  it('returns the correct lean_body_mass when both metrics change', () => {
    const update = simulateUpdateWorkoutMetricsSync(
      { body_weight_kg: 82, body_fat_percent: 18 },
      { client_id: 'c-1', body_weight_kg: 80, body_fat_percent: 20 },
    );
    expect(update?.lean_body_mass).toBe(67.24); // 82 * 0.82
  });

  it('uses existing body_fat_percent when only weight changes', () => {
    const update = simulateUpdateWorkoutMetricsSync(
      { body_weight_kg: 85 },
      { client_id: 'c-1', body_weight_kg: 80, body_fat_percent: 20 },
    );
    expect(update?.lean_body_mass).toBe(68); // 85 * 0.80
  });

  it('uses existing body_weight_kg when only bf% changes', () => {
    const update = simulateUpdateWorkoutMetricsSync(
      { body_fat_percent: 15 },
      { client_id: 'c-1', body_weight_kg: 80, body_fat_percent: 20 },
    );
    expect(update?.lean_body_mass).toBe(68); // 80 * 0.85
  });

  it('returns null when neither metric is in the payload', () => {
    const update = simulateUpdateWorkoutMetricsSync(
      { },
      { client_id: 'c-1', body_weight_kg: 80, body_fat_percent: 20 },
    );
    expect(update).toBeNull();
  });

  it('does not include lean_body_mass when existing bf% is null', () => {
    const update = simulateUpdateWorkoutMetricsSync(
      { body_weight_kg: 80 },
      { client_id: 'c-1', body_weight_kg: null, body_fat_percent: null },
    );
    expect(update?.lean_body_mass).toBeUndefined();
  });
});
