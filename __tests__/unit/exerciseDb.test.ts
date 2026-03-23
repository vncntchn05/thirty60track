/**
 * Unit tests for lib/exerciseDb.ts
 *
 * mapDbExercise and searchDbExercises are pure functions — tested directly.
 * fetchExerciseDb uses a module-level cache; each test resets modules to get a
 * clean slate so caching behaviour can be verified in isolation.
 */

import type { DbExercise } from '@/lib/exerciseDb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEx(overrides: Partial<DbExercise> = {}): DbExercise {
  return {
    id: 'test-1',
    name: 'Test Exercise',
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: [],
    instructions: [],
    ...overrides,
  };
}

// ─── mapDbExercise ────────────────────────────────────────────────────────────

describe('mapDbExercise', () => {
  // Import fresh (no cache concerns — pure function)
  let mapDbExercise: typeof import('@/lib/exerciseDb').mapDbExercise;

  beforeAll(() => {
    ({ mapDbExercise } = require('@/lib/exerciseDb'));
  });

  // Muscle group mapping
  it.each([
    ['abdominals', 'Core'],
    ['biceps',     'Arms'],
    ['triceps',    'Arms'],
    ['forearms',   'Arms'],
    ['chest',      'Chest'],
    ['lats',       'Back'],
    ['traps',      'Back'],
    ['middle back','Back'],
    ['lower back', 'Back'],
    ['shoulders',  'Shoulders'],
    ['quadriceps', 'Legs'],
    ['hamstrings', 'Legs'],
    ['calves',     'Legs'],
    ['glutes',     'Glutes'],
    ['abductors',  'Legs'],
    ['adductors',  'Legs'],
  ])('maps primaryMuscles[0] "%s" → muscle_group "%s"', (muscle, expected) => {
    const result = mapDbExercise(makeEx({ primaryMuscles: [muscle] }));
    expect(result.muscle_group).toBe(expected);
  });

  it('returns null muscle_group for an unknown primary muscle', () => {
    const result = mapDbExercise(makeEx({ primaryMuscles: ['neck'] }));
    expect(result.muscle_group).toBeNull();
  });

  it('returns null muscle_group when primaryMuscles is empty', () => {
    const result = mapDbExercise(makeEx({ primaryMuscles: [] }));
    expect(result.muscle_group).toBeNull();
  });

  // Category mapping
  it.each([
    ['strength',               'strength'],
    ['stretching',             'flexibility'],
    ['plyometrics',            'strength'],
    ['cardio',                 'cardio'],
    ['powerlifting',           'strength'],
    ['strongman',              'strength'],
    ['olympic weightlifting',  'strength'],
  ])('maps category "%s" → ExerciseCategory "%s"', (input, expected) => {
    const result = mapDbExercise(makeEx({ category: input }));
    expect(result.category).toBe(expected);
  });

  it('maps unknown category to "other"', () => {
    const result = mapDbExercise(makeEx({ category: 'unknown_type' }));
    expect(result.category).toBe('other');
  });

  it('preserves the exercise name', () => {
    const result = mapDbExercise(makeEx({ name: 'Barbell Curl' }));
    expect(result.name).toBe('Barbell Curl');
  });
});

// ─── searchDbExercises ────────────────────────────────────────────────────────

describe('searchDbExercises', () => {
  let searchDbExercises: typeof import('@/lib/exerciseDb').searchDbExercises;

  beforeAll(() => {
    ({ searchDbExercises } = require('@/lib/exerciseDb'));
  });

  const DB: DbExercise[] = [
    makeEx({ id: '1', name: 'Barbell Curl',  primaryMuscles: ['biceps'],      secondaryMuscles: ['forearms'] }),
    makeEx({ id: '2', name: 'Bench Press',   primaryMuscles: ['chest'],       secondaryMuscles: ['triceps'] }),
    makeEx({ id: '3', name: 'Squat',         primaryMuscles: ['quadriceps'],  secondaryMuscles: ['glutes'] }),
    makeEx({ id: '4', name: 'Deadlift',      primaryMuscles: ['lower back'],  secondaryMuscles: ['hamstrings'] }),
    makeEx({ id: '5', name: 'Overhead Press',primaryMuscles: ['shoulders'],   secondaryMuscles: ['triceps'] }),
  ];

  const none = new Set<string>();

  it('returns [] for empty query', () => {
    expect(searchDbExercises(DB, '', none)).toHaveLength(0);
  });

  it('returns [] for whitespace-only query', () => {
    expect(searchDbExercises(DB, '   ', none)).toHaveLength(0);
  });

  it('returns [] when db is empty', () => {
    expect(searchDbExercises([], 'curl', none)).toHaveLength(0);
  });

  it('matches by exercise name (case-insensitive substring)', () => {
    const results = searchDbExercises(DB, 'curl', none);
    expect(results.some((e) => e.name === 'Barbell Curl')).toBe(true);
  });

  it('matches by primaryMuscles', () => {
    const results = searchDbExercises(DB, 'biceps', none);
    expect(results.some((e) => e.name === 'Barbell Curl')).toBe(true);
  });

  it('matches by secondaryMuscles', () => {
    const results = searchDbExercises(DB, 'triceps', none);
    expect(results.some((e) => e.name === 'Bench Press')).toBe(true);
    expect(results.some((e) => e.name === 'Overhead Press')).toBe(true);
  });

  it('excludes exercises whose name is in existingNames (case-insensitive)', () => {
    const existing = new Set(['barbell curl']);
    const results = searchDbExercises(DB, 'curl', existing);
    expect(results.some((e) => e.name === 'Barbell Curl')).toBe(false);
  });

  it('existingNames lookup normalises the exercise name to lowercase (Set must contain lowercase)', () => {
    // searchDbExercises does existingNames.has(e.name.toLowerCase()), so the
    // caller is responsible for lowercasing Set entries (matches real usage).
    const existing = new Set(['bench press']);
    const results = searchDbExercises(DB, 'bench', existing);
    expect(results.some((e) => e.name === 'Bench Press')).toBe(false);
  });

  it('limits results to 20 even if more match', () => {
    const large = Array.from({ length: 30 }, (_, i) =>
      makeEx({ id: `ex-${i}`, name: `Exercise ${i}`, primaryMuscles: ['chest'] }),
    );
    const results = searchDbExercises(large, 'exercise', none);
    expect(results).toHaveLength(20);
  });

  it('returns all matches when fewer than 20 qualify', () => {
    const results = searchDbExercises(DB, 'press', none);
    // Bench Press + Overhead Press
    expect(results).toHaveLength(2);
  });
});

// ─── fetchExerciseDb ──────────────────────────────────────────────────────────
// Each test resets modules to get a fresh cache state.

describe('fetchExerciseDb', () => {
  const DB_URL =
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  it('fetches from the correct GitHub raw URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue([]),
    });

    const { fetchExerciseDb } = require('@/lib/exerciseDb') as typeof import('@/lib/exerciseDb');
    await fetchExerciseDb();

    expect(global.fetch).toHaveBeenCalledWith(DB_URL);
  });

  it('returns the parsed JSON array', async () => {
    const mockData = [makeEx({ id: 'db-1', name: 'Pull-Up' })];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const { fetchExerciseDb } = require('@/lib/exerciseDb') as typeof import('@/lib/exerciseDb');
    const result = await fetchExerciseDb();

    expect(result).toEqual(mockData);
  });

  it('caches the result — fetch is called only once across multiple invocations', async () => {
    const mockData = [makeEx({ id: 'cache-1' })];
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const { fetchExerciseDb } = require('@/lib/exerciseDb') as typeof import('@/lib/exerciseDb');
    const r1 = await fetchExerciseDb();
    const r2 = await fetchExerciseDb();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(r1).toBe(r2); // same array reference from cache
  });

  it('concurrent calls share the in-flight promise — fetch called once', async () => {
    let resolve!: (v: unknown) => void;
    const pending = new Promise((r) => { resolve = r; });

    (global.fetch as jest.Mock).mockReturnValueOnce(
      pending.then(() => ({ json: jest.fn().mockResolvedValue([]) })),
    );

    const { fetchExerciseDb } = require('@/lib/exerciseDb') as typeof import('@/lib/exerciseDb');
    const [p1, p2, p3] = [fetchExerciseDb(), fetchExerciseDb(), fetchExerciseDb()];
    resolve(undefined);
    await Promise.all([p1, p2, p3]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
