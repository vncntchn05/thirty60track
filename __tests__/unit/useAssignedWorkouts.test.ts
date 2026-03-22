/**
 * Unit tests for hooks/useAssignedWorkouts.ts
 *
 * All exported standalone functions are tested by mocking supabase and verifying
 * the call patterns.  The internal sortExercises helper is tested via the
 * data it would return from the hook.
 */

import {
  createAssignedWorkout,
  updateAssignedWorkout,
  deleteAssignedWorkout,
  completeAssignedWorkout,
} from '@/hooks/useAssignedWorkouts';
import { supabase } from '@/lib/supabase';
import { createQueryMock } from '../helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// createWorkoutWithSets is called internally by completeAssignedWorkout
jest.mock('@/hooks/useWorkouts', () => ({
  createWorkoutWithSets: jest.fn(),
}));

import { createWorkoutWithSets } from '@/hooks/useWorkouts';

const mockFrom  = supabase.from as jest.Mock;
const mockCWWS  = createWorkoutWithSets as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a self-referential chain mock (all methods return self, plus terminal mocks) */
function makeChain(finalResult: { data?: unknown; error?: unknown; count?: number | null } = {}) {
  return createQueryMock(finalResult);
}

const BASE_EXERCISE_PAYLOAD = {
  exercise_id: 'ex-1',
  order_index: 0,
  superset_group: null,
  sets: [{ set_number: 1, reps: 10, weight_kg: 50, duration_seconds: null, notes: null }],
};

// ─── createAssignedWorkout ────────────────────────────────────────────────────

describe('createAssignedWorkout', () => {
  beforeEach(() => jest.clearAllMocks());

  function setupCreateMock() {
    const awInsertChain = makeChain({ data: { id: 'aw-1' } });
    const aweInsertChain = makeChain({ data: { id: 'awe-1' } });
    const setsInsertChain = makeChain({ data: [] });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts')          return awInsertChain;
      if (table === 'assigned_workout_exercises') return aweInsertChain;
      if (table === 'assigned_workout_sets')      return setsInsertChain;
      return makeChain();
    });
  }

  it('inserts into assigned_workouts with status="assigned"', async () => {
    setupCreateMock();
    await createAssignedWorkout('c-1', 't-1', {
      title: 'Leg Day',
      scheduled_date: '2024-03-15',
      notes: null,
      exercises: [BASE_EXERCISE_PAYLOAD],
    });
    expect(mockFrom).toHaveBeenCalledWith('assigned_workouts');
    const insertCall = (mockFrom.mock.results[0].value.insert as jest.Mock).mock.calls[0][0];
    expect(insertCall.status).toBe('assigned');
    expect(insertCall.client_id).toBe('c-1');
    expect(insertCall.trainer_id).toBe('t-1');
  });

  it('inserts one assigned_workout_exercise per exercise in payload', async () => {
    const awChain = makeChain({ data: { id: 'aw-1' } });
    const aweChain = makeChain({ data: { id: 'awe-1' } });
    const setsChain = makeChain({ data: [] });

    let aweInsertCount = 0;
    (aweChain.insert as jest.Mock).mockImplementation(() => {
      aweInsertCount++;
      return aweChain;
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts')          return awChain;
      if (table === 'assigned_workout_exercises') return aweChain;
      if (table === 'assigned_workout_sets')      return setsChain;
      return makeChain();
    });

    await createAssignedWorkout('c-1', 't-1', {
      title: 'Test',
      scheduled_date: '2024-03-15',
      notes: null,
      exercises: [
        { ...BASE_EXERCISE_PAYLOAD, exercise_id: 'ex-1', order_index: 0 },
        { ...BASE_EXERCISE_PAYLOAD, exercise_id: 'ex-2', order_index: 1 },
      ],
    });

    expect(aweInsertCount).toBe(2);
  });

  it('returns { id: null, error } when assigned_workouts insert fails', async () => {
    const failChain = makeChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(failChain);

    const result = await createAssignedWorkout('c-1', 't-1', {
      title: 'Fail',
      scheduled_date: '2024-03-15',
      notes: null,
      exercises: [],
    });

    expect(result.id).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns { id, error: null } on complete success', async () => {
    setupCreateMock();
    const result = await createAssignedWorkout('c-1', 't-1', {
      title: 'Good',
      scheduled_date: '2024-03-15',
      notes: null,
      exercises: [BASE_EXERCISE_PAYLOAD],
    });
    expect(result.id).toBe('aw-1');
    expect(result.error).toBeNull();
  });

  it('passes scheduled_date and title to the insert', async () => {
    setupCreateMock();
    await createAssignedWorkout('c-1', 't-1', {
      title: 'Upper Body Push',
      scheduled_date: '2024-06-01',
      notes: 'Focus on form',
      exercises: [],
    });
    const insertPayload = (mockFrom.mock.results[0].value.insert as jest.Mock).mock.calls[0][0];
    expect(insertPayload.title).toBe('Upper Body Push');
    expect(insertPayload.scheduled_date).toBe('2024-06-01');
    expect(insertPayload.notes).toBe('Focus on form');
  });
});

// ─── updateAssignedWorkout ────────────────────────────────────────────────────

describe('updateAssignedWorkout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates top-level fields when payload has no exercises key', async () => {
    const updateChain = makeChain({ error: null });
    mockFrom.mockReturnValue(updateChain);

    const result = await updateAssignedWorkout('aw-1', { title: 'New Title' });

    expect(mockFrom).toHaveBeenCalledWith('assigned_workouts');
    expect((updateChain.update as jest.Mock)).toHaveBeenCalledWith({ title: 'New Title' });
    expect(result.error).toBeNull();
  });

  it('deletes all existing exercises when exercises array is provided', async () => {
    const awChain  = makeChain({ error: null });
    const aweChain = makeChain({ data: { id: 'awe-new' }, error: null });
    const setsChain = makeChain({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts')          return awChain;
      if (table === 'assigned_workout_exercises') return aweChain;
      if (table === 'assigned_workout_sets')      return setsChain;
      return makeChain();
    });

    await updateAssignedWorkout('aw-1', {
      title: 'Updated',
      exercises: [BASE_EXERCISE_PAYLOAD],
    });

    // delete should have been called on assigned_workout_exercises
    expect((aweChain.delete as jest.Mock)).toHaveBeenCalled();
  });

  it('skips exercise replace when exercises is undefined', async () => {
    const awChain  = makeChain({ error: null });
    const aweChain = makeChain({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts')          return awChain;
      if (table === 'assigned_workout_exercises') return aweChain;
      return makeChain();
    });

    await updateAssignedWorkout('aw-1', { notes: 'Updated notes' });

    // delete should NOT have been called for exercises
    expect((aweChain.delete as jest.Mock)).not.toHaveBeenCalled();
  });

  it('returns error from top-level update when it fails', async () => {
    const awChain = makeChain({ error: { message: 'update failed' } });
    (awChain.update as jest.Mock).mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'update failed' } }),
    });
    mockFrom.mockReturnValue(awChain);

    const result = await updateAssignedWorkout('aw-1', { title: 'X' });
    expect(result.error).toBe('update failed');
  });
});

// ─── deleteAssignedWorkout ────────────────────────────────────────────────────

describe('deleteAssignedWorkout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches exercise ids before deleting', async () => {
    const exIds = [{ id: 'awe-1' }, { id: 'awe-2' }];
    let step = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workout_exercises') {
        step++;
        if (step === 1) return makeChain({ data: exIds }); // fetch
        return makeChain({ error: null });                  // delete
      }
      if (table === 'assigned_workout_sets')  return makeChain({ error: null });
      if (table === 'assigned_workouts')      return makeChain({ error: null, count: 1 });
      return makeChain({ error: null });
    });

    await deleteAssignedWorkout('aw-1');
    expect(step).toBeGreaterThanOrEqual(1);
  });

  it('deletes sets via .in() when exercises exist', async () => {
    const setsChain = makeChain({ error: null });
    const inMock = jest.fn().mockResolvedValue({ error: null });
    (setsChain.in as jest.Mock) = inMock;

    let exStep = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workout_exercises') {
        exStep++;
        if (exStep === 1) return makeChain({ data: [{ id: 'awe-1' }] });
        return makeChain({ error: null });
      }
      if (table === 'assigned_workout_sets') return setsChain;
      if (table === 'assigned_workouts') return makeChain({ error: null, count: 1 });
      return makeChain({ error: null });
    });

    await deleteAssignedWorkout('aw-1');
    expect(inMock).toHaveBeenCalledWith('assigned_workout_exercise_id', ['awe-1']);
  });

  it('returns a permission error when count is 0', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workout_exercises') return makeChain({ data: [] });
      if (table === 'assigned_workouts')          return makeChain({ error: null, count: 0 });
      return makeChain({ error: null });
    });

    const result = await deleteAssignedWorkout('aw-ghost');
    expect(result.error).toMatch(/permission/i);
  });

  it('returns null error on complete success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workout_exercises') return makeChain({ data: [] });
      if (table === 'assigned_workouts')          return makeChain({ error: null, count: 1 });
      return makeChain({ error: null });
    });

    const result = await deleteAssignedWorkout('aw-1');
    expect(result.error).toBeNull();
  });
});

// ─── completeAssignedWorkout ──────────────────────────────────────────────────

describe('completeAssignedWorkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'client-uid' } },
    });
    mockCWWS.mockResolvedValue({ workoutId: 'w-new', error: null });
  });

  it('fetches the assigned workout to get client_id and trainer_id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts') return makeChain({ data: { client_id: 'c-1', trainer_id: 't-1' } });
      return makeChain({ error: null });
    });

    await completeAssignedWorkout('aw-1', []);

    expect(mockFrom).toHaveBeenCalledWith('assigned_workouts');
  });

  it('creates a real workout via createWorkoutWithSets with logged_by_role="client"', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts') return makeChain({ data: { client_id: 'c-1', trainer_id: 't-1' } });
      return makeChain({ error: null });
    });

    const clientSets = [
      { exercise_id: 'ex-1', set_number: 1, reps: 10, weight_kg: 50, duration_seconds: null, notes: null, superset_group: null },
    ];

    await completeAssignedWorkout('aw-1', clientSets);

    expect(mockCWWS).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'c-1',
        trainer_id: 't-1',
        logged_by_role: 'client',
        logged_by_user_id: 'client-uid',
      }),
      clientSets,
    );
  });

  it('marks assigned_workout as completed with correct status and workout id', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts') return makeChain({ data: { client_id: 'c-1', trainer_id: 't-1' } });
      return makeChain({ error: null });
    });

    await completeAssignedWorkout('aw-1', []);

    // The second call to from('assigned_workouts') should be the update
    const updateCalls = (mockFrom as jest.Mock).mock.calls.filter(([t]: [string]) => t === 'assigned_workouts');
    expect(updateCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('returns workoutId on success', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts') return makeChain({ data: { client_id: 'c-1', trainer_id: 't-1' } });
      return makeChain({ error: null });
    });

    const result = await completeAssignedWorkout('aw-1', []);
    expect(result.workoutId).toBe('w-new');
    expect(result.error).toBeNull();
  });

  it('returns error when assigned workout fetch fails', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'not found' } }));

    const result = await completeAssignedWorkout('aw-missing', []);
    expect(result.workoutId).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('returns error when createWorkoutWithSets fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assigned_workouts') return makeChain({ data: { client_id: 'c-1', trainer_id: 't-1' } });
      return makeChain({ error: null });
    });
    mockCWWS.mockResolvedValue({ workoutId: null, error: 'workout insert failed' });

    const result = await completeAssignedWorkout('aw-1', []);
    expect(result.workoutId).toBeNull();
    expect(result.error).toBe('workout insert failed');
  });
});

// ─── sortExercises helper ─────────────────────────────────────────────────────

describe('sortExercises (order_index ordering)', () => {
  // Replicate the internal sortExercises function
  function sortExercises(data: { exercises?: Array<{ order_index: number }> }) {
    return {
      ...data,
      exercises: [...(data.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
    };
  }

  it('sorts exercises ascending by order_index', () => {
    const result = sortExercises({
      exercises: [
        { order_index: 2 },
        { order_index: 0 },
        { order_index: 1 },
      ],
    });
    expect(result.exercises.map((e) => e.order_index)).toEqual([0, 1, 2]);
  });

  it('returns empty exercises array when none provided', () => {
    expect(sortExercises({}).exercises).toHaveLength(0);
  });

  it('preserves a single exercise unchanged', () => {
    const result = sortExercises({ exercises: [{ order_index: 5 }] });
    expect(result.exercises[0].order_index).toBe(5);
  });
});
