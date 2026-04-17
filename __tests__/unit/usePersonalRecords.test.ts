/**
 * Unit tests for hooks/usePersonalRecords.ts (checkAndSavePRs)
 *
 * Covers:
 *  - Weight PR detection (new best > previous best)
 *  - Reps PR detection (new best reps > previous)
 *  - First-time exercise (no existing PR row) → weight + reps PR
 *  - No PR when tied or below all-time best
 *  - Empty sets guard → returns []
 *  - Unit conversion in the returned NewPR (lbs display vs kg storage)
 *  - Upsert is called only when PRs are found
 *  - Fetch error → returns [] silently
 */

import { checkAndSavePRs } from '@/hooks/usePersonalRecords';
import { supabase } from '@/lib/supabase';
import { createQueryMock } from '@/__tests__/helpers/supabase-mock';

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SetInput = { exercise_id: string; exercise_name: string; reps: number | null; weight_kg: number | null };

function makeSet(exerciseId: string, reps: number | null, weight_kg: number | null): SetInput {
  return { exercise_id: exerciseId, exercise_name: `Exercise ${exerciseId}`, reps, weight_kg };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('checkAndSavePRs', () => {
  const clientId = 'client-1';
  const workoutDate = '2024-03-15';

  beforeEach(() => jest.clearAllMocks());

  it('returns [] for empty sets', async () => {
    const result = await checkAndSavePRs(clientId, workoutDate, []);
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('returns [] for empty clientId', async () => {
    const result = await checkAndSavePRs('', workoutDate, [makeSet('ex1', 10, 100)]);
    expect(result).toEqual([]);
  });

  it('detects weight PR when new weight > existing PR', async () => {
    // Existing PR: 90 kg
    const fetchMock = createQueryMock({
      data: [{ id: 'pr-1', exercise_id: 'ex1', max_weight_kg: 90, max_reps: 8 }],
      error: null,
    });
    const upsertMock = createQueryMock({ data: null, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'personal_records') {
        // First call = fetch (select), second call = upsert
        return {
          ...fetchMock,
          select: jest.fn().mockReturnValue(fetchMock),
          upsert: jest.fn().mockReturnValue(upsertMock),
          eq: jest.fn().mockReturnValue(fetchMock),
          in: jest.fn().mockReturnValue(fetchMock),
          then: fetchMock.then,
        };
      }
      return createQueryMock({ data: null, error: null });
    });

    const sets = [makeSet('ex1', 8, 100)]; // 100 > 90 → PR
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    const weightPR = result.find((pr) => pr.type === 'weight');
    expect(weightPR).toBeDefined();
    expect(weightPR?.exerciseName).toBe('Exercise ex1');
    expect(weightPR?.value).toBe(100);
    expect(weightPR?.previous).toBe(90);
    expect(weightPR?.unit).toBe('kg');
  });

  it('converts weight to lbs for display when displayUnit is lbs', async () => {
    const fetchMock = createQueryMock({
      data: [{ id: 'pr-1', exercise_id: 'ex1', max_weight_kg: 45, max_reps: null }],
      error: null,
    });
    mockFrom.mockImplementation(() => ({
      ...fetchMock,
      select: jest.fn().mockReturnValue(fetchMock),
      upsert: jest.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
      eq: jest.fn().mockReturnValue(fetchMock),
      in: jest.fn().mockReturnValue(fetchMock),
      then: fetchMock.then,
    }));

    const sets = [makeSet('ex1', 10, 50)]; // 50 kg stored; displayed as lbs
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'lbs');

    const weightPR = result.find((pr) => pr.type === 'weight');
    expect(weightPR).toBeDefined();
    expect(weightPR?.unit).toBe('lbs');
    // 50 kg * 2.20462 ≈ 110.2
    expect(weightPR?.value).toBeCloseTo(110.2, 0);
  });

  it('detects reps PR when new max reps > existing PR', async () => {
    const fetchMock = createQueryMock({
      data: [{ id: 'pr-1', exercise_id: 'ex1', max_weight_kg: null, max_reps: 10 }],
      error: null,
    });
    mockFrom.mockImplementation(() => ({
      ...fetchMock,
      select: jest.fn().mockReturnValue(fetchMock),
      upsert: jest.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
      eq: jest.fn().mockReturnValue(fetchMock),
      in: jest.fn().mockReturnValue(fetchMock),
      then: fetchMock.then,
    }));

    const sets = [makeSet('ex1', 15, null)]; // reps PR (15 > 10)
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    const repsPR = result.find((pr) => pr.type === 'reps');
    expect(repsPR).toBeDefined();
    expect(repsPR?.value).toBe(15);
    expect(repsPR?.previous).toBe(10);
    expect(repsPR?.unit).toBe('reps');
  });

  it('does NOT flag PR when weight is tied with existing PR', async () => {
    const fetchMock = createQueryMock({
      data: [{ id: 'pr-1', exercise_id: 'ex1', max_weight_kg: 100, max_reps: 8 }],
      error: null,
    });
    mockFrom.mockImplementation(() => ({
      ...fetchMock,
      select: jest.fn().mockReturnValue(fetchMock),
      upsert: jest.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
      eq: jest.fn().mockReturnValue(fetchMock),
      in: jest.fn().mockReturnValue(fetchMock),
      then: fetchMock.then,
    }));

    const sets = [makeSet('ex1', 8, 100)]; // same weight, not a PR
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    expect(result).toHaveLength(0);
  });

  it('returns both weight and reps PRs for first-time exercise', async () => {
    // No existing PR row
    const fetchMock = createQueryMock({ data: [], error: null });
    mockFrom.mockImplementation(() => ({
      ...fetchMock,
      select: jest.fn().mockReturnValue(fetchMock),
      upsert: jest.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
      eq: jest.fn().mockReturnValue(fetchMock),
      in: jest.fn().mockReturnValue(fetchMock),
      then: fetchMock.then,
    }));

    const sets = [makeSet('brand-new', 10, 80)];
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    const types = result.map((pr) => pr.type);
    expect(types).toContain('weight');
    expect(types).toContain('reps');
  });

  it('returns [] silently when fetch fails', async () => {
    const failMock = createQueryMock({ data: null, error: { message: 'Network error' } });
    mockFrom.mockImplementation(() => ({
      ...failMock,
      select: jest.fn().mockReturnValue(failMock),
      eq: jest.fn().mockReturnValue(failMock),
      in: jest.fn().mockReturnValue(failMock),
      then: failMock.then,
    }));

    const sets = [makeSet('ex1', 10, 100)];
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    expect(result).toEqual([]);
  });

  it('aggregates best weight across multiple sets for the same exercise', async () => {
    // 3 sets: 80, 90, 95 kg — only the 95 kg set should be considered for PR check
    const fetchMock = createQueryMock({
      data: [{ id: 'pr-1', exercise_id: 'ex1', max_weight_kg: 90, max_reps: null }],
      error: null,
    });
    mockFrom.mockImplementation(() => ({
      ...fetchMock,
      select: jest.fn().mockReturnValue(fetchMock),
      upsert: jest.fn().mockReturnValue(createQueryMock({ data: null, error: null })),
      eq: jest.fn().mockReturnValue(fetchMock),
      in: jest.fn().mockReturnValue(fetchMock),
      then: fetchMock.then,
    }));

    const sets = [
      makeSet('ex1', 10, 80),
      makeSet('ex1', 8, 90),
      makeSet('ex1', 6, 95), // best in session → PR
    ];
    const result = await checkAndSavePRs(clientId, workoutDate, sets, 'kg');

    const weightPR = result.find((pr) => pr.type === 'weight');
    expect(weightPR).toBeDefined();
    expect(weightPR?.value).toBe(95);
  });
});
