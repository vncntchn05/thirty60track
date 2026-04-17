/**
 * Unit tests for hooks/useRecurringPlans.ts
 *
 * Covers:
 *  - generateOccurrenceDates() — weekly/biweekly, multiple days-of-week,
 *    empty date ranges, single-day windows
 *  - createRecurringPlan() — Supabase call sequence
 *  - cancelRecurringPlan() — filters (recurring_plan_id + status + gte date)
 *  - cancelRecurringInstance() — single row update
 *  - deleteRecurringPlan() — delete by id
 */

import {
  generateOccurrenceDates,
  createRecurringPlan,
  cancelRecurringPlan,
  cancelRecurringInstance,
  deleteRecurringPlan,
} from '@/hooks/useRecurringPlans';
import { supabase } from '@/lib/supabase';
import { createQueryMock } from '@/__tests__/helpers/supabase-mock';

// ─── Module mock ──────────────────────────────────────────────────────────────

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── generateOccurrenceDates ──────────────────────────────────────────────────

describe('generateOccurrenceDates', () => {
  it('weekly: returns every Monday between start and end', () => {
    // 2024-01-01 (Monday) to 2024-01-29 (Monday)
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-29', [1], 'weekly');
    expect(dates).toEqual([
      '2024-01-01',
      '2024-01-08',
      '2024-01-15',
      '2024-01-22',
      '2024-01-29',
    ]);
  });

  it('weekly: multiple days of week', () => {
    // Mon + Wed for 2 weeks
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-12', [1, 3], 'weekly');
    expect(dates).toEqual(['2024-01-01', '2024-01-03', '2024-01-08', '2024-01-10']);
  });

  it('biweekly: returns every other Monday', () => {
    // 2024-01-01 (Monday) — biweekly should hit jan 1, 15, 29
    const dates = generateOccurrenceDates('2024-01-01', '2024-02-05', [1], 'biweekly');
    expect(dates).toEqual(['2024-01-01', '2024-01-15', '2024-01-29']);
  });

  it('biweekly: skips odd weeks (jan 8, 22)', () => {
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-29', [1], 'biweekly');
    expect(dates).not.toContain('2024-01-08');
    expect(dates).not.toContain('2024-01-22');
  });

  it('returns empty array when start > end', () => {
    const dates = generateOccurrenceDates('2024-02-01', '2024-01-01', [1], 'weekly');
    expect(dates).toHaveLength(0);
  });

  it('includes start date if it matches days_of_week', () => {
    // 2024-01-01 is a Monday (day 1)
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-01', [1], 'weekly');
    expect(dates).toEqual(['2024-01-01']);
  });

  it('returns empty when start date does not match any days_of_week in a single-day window', () => {
    // 2024-01-01 is Monday (1); asking for Wednesday (3)
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-01', [3], 'weekly');
    expect(dates).toHaveLength(0);
  });

  it('returns dates in ascending order', () => {
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-31', [1, 3, 5], 'weekly');
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true);
    }
  });

  it('handles empty daysOfWeek gracefully', () => {
    const dates = generateOccurrenceDates('2024-01-01', '2024-01-31', [], 'weekly');
    expect(dates).toHaveLength(0);
  });
});

// ─── createRecurringPlan ──────────────────────────────────────────────────────

describe('createRecurringPlan', () => {
  const clientId = 'client-1';
  const trainerId = 'trainer-1';
  const payload = {
    title: 'Weekly Push',
    notes: null,
    days_of_week: [1], // Monday
    frequency: 'weekly' as const,
    start_date: '2024-01-01', // Monday
    end_date: '2024-01-08',   // Next Monday — 2 occurrences
    exercises: [
      {
        exercise_id: 'ex-1',
        order_index: 0,
        superset_group: null,
        sets: [{ set_number: 1, reps: 10, weight_kg: 100, duration_seconds: null, notes: null }],
      },
    ],
  };

  it('inserts plan, then generates assigned_workout instances', async () => {
    const planMock = createQueryMock({ data: { id: 'plan-1' }, error: null });
    const awMock   = createQueryMock({ data: { id: 'aw-1' }, error: null });
    const aweMock  = createQueryMock({ data: { id: 'awe-1' }, error: null });
    const setsMock = createQueryMock({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'recurring_plans') return planMock;
      if (table === 'assigned_workouts') return awMock;
      if (table === 'assigned_workout_exercises') return aweMock;
      if (table === 'assigned_workout_sets') return setsMock;
      return createQueryMock({ data: null, error: null });
    });

    const result = await createRecurringPlan(clientId, trainerId, payload);

    expect(result.planId).toBe('plan-1');
    expect(result.error).toBeNull();
    expect(result.count).toBe(2); // 2 mondays
  });

  it('returns error when plan insert fails', async () => {
    const failMock = createQueryMock({ data: null, error: { message: 'DB error' } });
    mockFrom.mockImplementation(() => failMock);

    const result = await createRecurringPlan(clientId, trainerId, payload);

    expect(result.planId).toBeNull();
    expect(result.error).toBe('DB error');
    expect(result.count).toBe(0);
  });

  it('returns count 0 and no error when no dates are generated', async () => {
    const emptyPayload = { ...payload, start_date: '2024-01-02', end_date: '2024-01-02' }; // Tuesday
    const planMock = createQueryMock({ data: { id: 'plan-1' }, error: null });
    mockFrom.mockImplementation(() => planMock);

    const result = await createRecurringPlan(clientId, trainerId, emptyPayload);

    expect(result.planId).toBe('plan-1');
    expect(result.count).toBe(0);
    expect(result.error).toBeNull();
  });
});

// ─── cancelRecurringPlan ──────────────────────────────────────────────────────

describe('cancelRecurringPlan', () => {
  it('updates status to cancelled filtering by plan_id, status=assigned, gte today', async () => {
    // createQueryMock doesn't include gte — build a custom mock that does
    const chainable: Record<string, jest.Mock> = {};
    const chainMethods = ['select', 'eq', 'neq', 'is', 'in', 'order', 'insert',
      'update', 'delete', 'upsert', 'limit', 'range', 'match', 'filter',
      'not', 'or', 'contains', 'containedBy', 'gte', 'lte', 'gt', 'lt'];
    for (const m of chainMethods) chainable[m] = jest.fn().mockReturnValue(chainable);
    chainable.single     = jest.fn().mockResolvedValue({ data: null, error: null });
    chainable.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    (chainable as Record<string, unknown>).then = (resolve: (v: { data: null; error: null; count: number }) => unknown) =>
      Promise.resolve({ data: null, error: null, count: 3 }).then(resolve);

    const mock = chainable;
    mockFrom.mockReturnValue(mock);

    const result = await cancelRecurringPlan('plan-1');

    expect(result.cancelled).toBe(3);
    expect(result.error).toBeNull();

    // Verify the call chain reached assigned_workouts
    expect(mockFrom).toHaveBeenCalledWith('assigned_workouts');
    expect((mock.update as jest.Mock)).toHaveBeenCalledWith({ status: 'cancelled' });
    expect((mock.eq as jest.Mock)).toHaveBeenCalledWith('recurring_plan_id', 'plan-1');
    expect((mock.eq as jest.Mock)).toHaveBeenCalledWith('status', 'assigned');
  });

  it('returns error on DB failure', async () => {
    // Custom mock with gte support and error
    const chainable: Record<string, jest.Mock> = {};
    const chainMethods = ['select', 'eq', 'neq', 'is', 'in', 'order', 'insert',
      'update', 'delete', 'upsert', 'limit', 'range', 'match', 'filter',
      'not', 'or', 'contains', 'containedBy', 'gte', 'lte', 'gt', 'lt'];
    for (const m of chainMethods) chainable[m] = jest.fn().mockReturnValue(chainable);
    chainable.single      = jest.fn().mockResolvedValue({ data: null, error: { message: 'Cancel failed' } });
    chainable.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Cancel failed' } });
    (chainable as Record<string, unknown>).then = (resolve: (v: { data: null; error: { message: string }; count: null }) => unknown) =>
      Promise.resolve({ data: null, error: { message: 'Cancel failed' }, count: null }).then(resolve);
    mockFrom.mockReturnValue(chainable);

    const result = await cancelRecurringPlan('plan-x');

    expect(result.error).toBe('Cancel failed');
    expect(result.cancelled).toBe(0);
  });
});

// ─── cancelRecurringInstance ──────────────────────────────────────────────────

describe('cancelRecurringInstance', () => {
  it('sets status to cancelled for the given assigned_workout id', async () => {
    const mock = createQueryMock({ data: null, error: null });
    mockFrom.mockReturnValue(mock);

    const result = await cancelRecurringInstance('aw-99');

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('assigned_workouts');
    expect((mock.update as jest.Mock)).toHaveBeenCalledWith({ status: 'cancelled' });
    expect((mock.eq as jest.Mock)).toHaveBeenCalledWith('id', 'aw-99');
  });

  it('returns error on DB failure', async () => {
    const mock = createQueryMock({ data: null, error: { message: 'Update error' } });
    mockFrom.mockReturnValue(mock);

    const result = await cancelRecurringInstance('aw-bad');
    expect(result.error).toBe('Update error');
  });
});

// ─── deleteRecurringPlan ──────────────────────────────────────────────────────

describe('deleteRecurringPlan', () => {
  it('deletes from recurring_plans by id', async () => {
    const mock = createQueryMock({ data: null, error: null });
    mockFrom.mockReturnValue(mock);

    const result = await deleteRecurringPlan('plan-abc');

    expect(result.error).toBeNull();
    expect(mockFrom).toHaveBeenCalledWith('recurring_plans');
    expect((mock.eq as jest.Mock)).toHaveBeenCalledWith('id', 'plan-abc');
  });

  it('returns error on DB failure', async () => {
    const mock = createQueryMock({ data: null, error: { message: 'Delete failed' } });
    mockFrom.mockReturnValue(mock);

    const result = await deleteRecurringPlan('plan-bad');
    expect(result.error).toBe('Delete failed');
  });
});
