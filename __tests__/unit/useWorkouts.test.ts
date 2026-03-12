/**
 * Unit tests for hooks/useWorkouts.ts
 *
 * Covers:
 *  - insertSetsOrdered (via createWorkoutWithSets): groups sets by exercise_id
 *    and calls supabase.from('workout_sets').insert once per exercise group
 *  - createWorkoutWithSets: creates workout, inserts sets, syncs body metrics
 *  - createWorkoutWithSets: handles linked clients (group session)
 */
import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { supabase } from '@/lib/supabase';
import type { InsertWorkout, InsertWorkoutSet } from '@/types';

// ─── Module mocks ─────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_WORKOUT: InsertWorkout = {
  client_id: 'client-1',
  trainer_id: 'trainer-1',
  performed_at: '2024-03-10',
  notes: null,
  body_weight_kg: null,
  body_fat_percent: null,
};

function makeSet(exerciseId: string, setNumber: number): Omit<InsertWorkoutSet, 'workout_id'> {
  return {
    exercise_id: exerciseId,
    set_number: setNumber,
    reps: 10,
    weight_kg: 50,
    duration_seconds: null,
    notes: null,
  };
}

/**
 * Builds mocks for createWorkoutWithSets and returns the workout_sets insert spy.
 * `linkedWorkoutId` is used when linked client workouts are being created.
 */
function setupWorkoutMocks(workoutId = 'w-1', linkedWorkoutId = 'w-linked') {
  const workoutSetsInsertSpy = jest.fn().mockResolvedValue({ error: null });
  const clientsUpdateMock = jest.fn().mockReturnThis();
  const clientsEqMock = jest.fn().mockResolvedValue({ error: null });

  let workoutsInsertCallCount = 0;

  mockFrom.mockImplementation((table: string) => {
    if (table === 'workouts') {
      workoutsInsertCallCount++;
      const id = workoutsInsertCallCount === 1 ? workoutId : linkedWorkoutId;
      const inner: Record<string, jest.Mock> = {
        insert: jest.fn(),
        select: jest.fn(),
        single: jest.fn().mockResolvedValue({ data: { id }, error: null }),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
      inner.insert.mockReturnValue(inner);
      inner.select.mockReturnValue(inner);
      return inner;
    }

    if (table === 'workout_sets') {
      return {
        insert: workoutSetsInsertSpy,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: (onFulfilled: (v: { error: null }) => unknown) =>
          Promise.resolve({ error: null }).then(onFulfilled),
      };
    }

    if (table === 'clients') {
      const m: Record<string, jest.Mock> = {
        update: clientsUpdateMock,
        eq: clientsEqMock,
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      clientsUpdateMock.mockReturnValue(m);
      return m;
    }

    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: (onFulfilled: (v: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(onFulfilled),
    };
  });

  return { workoutSetsInsertSpy, clientsUpdateMock, clientsEqMock };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('insertSetsOrdered (via createWorkoutWithSets)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls workout_sets.insert once per unique exercise_id', async () => {
    const { workoutSetsInsertSpy } = setupWorkoutMocks();

    const sets = [
      makeSet('ex-1', 1),
      makeSet('ex-1', 2),
      makeSet('ex-1', 3),
      makeSet('ex-2', 1),
      makeSet('ex-2', 2),
    ];

    const { error } = await createWorkoutWithSets(BASE_WORKOUT, sets);

    expect(error).toBeNull();
    // 2 unique exercise_ids → 2 insert calls
    expect(workoutSetsInsertSpy).toHaveBeenCalledTimes(2);
  });

  it('passes workout_id to every set row in the insert', async () => {
    const { workoutSetsInsertSpy } = setupWorkoutMocks('w-test');

    const sets = [makeSet('ex-1', 1), makeSet('ex-1', 2)];

    await createWorkoutWithSets(BASE_WORKOUT, sets);

    const insertedRows = workoutSetsInsertSpy.mock.calls[0][0] as Array<{ workout_id: string }>;
    expect(insertedRows.every((r) => r.workout_id === 'w-test')).toBe(true);
  });

  it('groups sets correctly — each insert call contains only one exercise_id', async () => {
    const { workoutSetsInsertSpy } = setupWorkoutMocks();

    const sets = [
      makeSet('ex-A', 1),
      makeSet('ex-B', 1),
      makeSet('ex-A', 2),
    ];

    await createWorkoutWithSets(BASE_WORKOUT, sets);

    expect(workoutSetsInsertSpy).toHaveBeenCalledTimes(2);

    const call1Ids = (workoutSetsInsertSpy.mock.calls[0][0] as Array<{ exercise_id: string }>)
      .map((r) => r.exercise_id);
    const call2Ids = (workoutSetsInsertSpy.mock.calls[1][0] as Array<{ exercise_id: string }>)
      .map((r) => r.exercise_id);

    // Each call should contain only one unique exercise_id
    expect(new Set(call1Ids).size).toBe(1);
    expect(new Set(call2Ids).size).toBe(1);
    // Both exercises should be covered
    expect(new Set([...call1Ids, ...call2Ids])).toEqual(new Set(['ex-A', 'ex-B']));
  });

  it('makes no workout_sets insert calls when sets array is empty', async () => {
    const { workoutSetsInsertSpy } = setupWorkoutMocks();

    await createWorkoutWithSets(BASE_WORKOUT, []);

    expect(workoutSetsInsertSpy).not.toHaveBeenCalled();
  });
});

describe('createWorkoutWithSets — body metrics sync', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates client weight_kg when body_weight_kg is provided', async () => {
    const { clientsUpdateMock, clientsEqMock } = setupWorkoutMocks();

    const workoutWithMetrics: InsertWorkout = {
      ...BASE_WORKOUT,
      body_weight_kg: 80.5,
      body_fat_percent: null,
    };

    await createWorkoutWithSets(workoutWithMetrics, []);

    expect(clientsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ weight_kg: 80.5 }),
    );
    expect(clientsEqMock).toHaveBeenCalledWith('id', 'client-1');
  });

  it('computes lean_body_mass when both weight and bf% are present', async () => {
    const { clientsUpdateMock } = setupWorkoutMocks();

    const workoutWithMetrics: InsertWorkout = {
      ...BASE_WORKOUT,
      body_weight_kg: 80,
      body_fat_percent: 20,
    };

    await createWorkoutWithSets(workoutWithMetrics, []);

    // lean_body_mass = 80 * (1 - 20/100) = 64.00
    expect(clientsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ lean_body_mass: 64 }),
    );
  });

  it('does not update client when no body metrics are provided', async () => {
    const { clientsUpdateMock } = setupWorkoutMocks();

    await createWorkoutWithSets(BASE_WORKOUT, []);

    expect(clientsUpdateMock).not.toHaveBeenCalled();
  });
});

describe('createWorkoutWithSets — group/linked clients', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a separate workout for each linked client', async () => {
    setupWorkoutMocks();

    const { error } = await createWorkoutWithSets(BASE_WORKOUT, [], ['client-2', 'client-3']);

    expect(error).toBeNull();

    // The from('workouts') mock should have been called multiple times:
    // 1 for the primary, 1 per linked client
    const workoutsFromCalls = (mockFrom as jest.Mock).mock.calls
      .filter(([t]: [string]) => t === 'workouts');
    // Primary + 2 linked = 3 total workouts.from() calls
    expect(workoutsFromCalls.length).toBeGreaterThanOrEqual(3);
  });

  it('returns a valid workoutId on success', async () => {
    setupWorkoutMocks('w-primary');

    const { workoutId, error } = await createWorkoutWithSets(BASE_WORKOUT, []);

    expect(error).toBeNull();
    expect(workoutId).toBe('w-primary');
  });

  it('returns error when workout insert fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'workouts') {
        const inner: Record<string, jest.Mock> = {
          insert: jest.fn(),
          select: jest.fn(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        };
        inner.insert.mockReturnValue(inner);
        inner.select.mockReturnValue(inner);
        return inner;
      }
      return {
        insert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { workoutId, error } = await createWorkoutWithSets(BASE_WORKOUT, []);

    expect(workoutId).toBeNull();
    expect(error).toBe('DB error');
  });
});
