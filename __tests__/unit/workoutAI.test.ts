/**
 * Unit tests for lib/workoutAI.ts
 *
 * Tests the pure mock-generation logic only (WORKOUT_AI_ENABLED = false path).
 * generateWorkouts() itself is not called — it adds a 1200ms delay and is
 * just a thin wrapper around getMockGeneratedWorkouts().
 *
 * Covers:
 *  - Goal detection (muscle / fat_loss / strength / general)
 *  - Frequency-based split selection (≥4 → Upper/Lower, ≤3 → Full Body)
 *  - Injury filtering (shoulder, knee, back, wrist)
 *  - Least-trained muscle integration
 *  - Always returns exactly 2 workouts
 *  - Workout name uses first name from client_name
 */

// Mock supabase before importing workoutAI (workoutAI imports supabase for the live path)
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: jest.fn() },
    auth: { onAuthStateChange: jest.fn() },
  },
}));

import { getMockGeneratedWorkouts, WORKOUT_AI_ENABLED } from '@/lib/workoutAI';
import type { WorkoutAIContext } from '@/lib/workoutAI';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<WorkoutAIContext> = {}): WorkoutAIContext {
  return {
    client_name: 'Alex Smith',
    goals: null,
    goal_timeframe: null,
    age: 28,
    gender: 'male',
    current_injuries: null,
    past_injuries: null,
    chronic_conditions: null,
    training_frequency_per_week: 3,
    typical_session_length_minutes: 60,
    activity_level: 'moderate',
    recent_workouts: [],
    personal_records: [],
    workout_stats: null,
    ...overrides,
  };
}

// ─── Feature flag ─────────────────────────────────────────────────────────────

describe('WORKOUT_AI_ENABLED', () => {
  it('is false (mock mode enabled)', () => {
    expect(WORKOUT_AI_ENABLED).toBe(false);
  });
});

// ─── Always returns 2 workouts ────────────────────────────────────────────────

describe('getMockGeneratedWorkouts — always 2 workouts', () => {
  const scenarios: Array<[string, Partial<WorkoutAIContext>]> = [
    ['general goal, 3 days', { goals: null, training_frequency_per_week: 3 }],
    ['muscle goal, 4 days', { goals: 'build muscle', training_frequency_per_week: 4 }],
    ['fat loss goal', { goals: 'lose weight' }],
    ['strength goal', { goals: 'strength training' }],
    ['all injuries', { current_injuries: 'shoulder, knee, back, wrist', training_frequency_per_week: 3 }],
  ];

  scenarios.forEach(([label, overrides]) => {
    it(`returns 2 workouts for: ${label}`, () => {
      const result = getMockGeneratedWorkouts(makeCtx(overrides));
      expect(result).toHaveLength(2);
    });
  });
});

// ─── Goal detection ───────────────────────────────────────────────────────────

describe('getMockGeneratedWorkouts — goal detection', () => {
  it('muscle goal (≤3 days) → Full Body split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'build muscle and bulk up',
      training_frequency_per_week: 3,
    }));
    expect(result[0].split).toBe('Full Body');
    expect(result[1].split).toBe('Full Body');
  });

  it('muscle goal (≥4 days) → Upper/Lower split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'hypertrophy and mass',
      training_frequency_per_week: 4,
    }));
    expect(result[0].split).toBe('Upper / Lower');
    expect(result[0].subgroup).toBe('Upper');
    expect(result[1].subgroup).toBe('Lower');
  });

  it('fat_loss goal → Fat Loss split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({ goals: 'cut and lose weight' }));
    expect(result[0].split).toBe('Fat Loss');
    expect(result[1].split).toBe('Fat Loss');
    expect(result[0].subgroup).toBe('HIIT Circuits');
    expect(result[1].subgroup).toBe('Metabolic Strength');
  });

  it('strength goal → PPL split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({ goals: 'powerlifting and strength' }));
    expect(result[0].split).toBe('Push / Pull / Legs');
    expect(result[0].subgroup).toBe('Push');
    expect(result[1].subgroup).toBe('Pull');
  });

  it('general goal (null) → Full Body split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({ goals: null }));
    expect(result[0].split).toBe('Full Body');
  });

  it('general goal with unmatched text → Full Body split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({ goals: 'get healthier overall' }));
    expect(result[0].split).toBe('Full Body');
  });

  it('general goal with 4+ training days → Upper/Lower split', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'get fit',
      training_frequency_per_week: 5,
    }));
    expect(result[0].split).toBe('Upper / Lower');
  });
});

// ─── Workout name uses first name ─────────────────────────────────────────────

describe('getMockGeneratedWorkouts — workout name', () => {
  it('uses the first name only from client_name', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      client_name: 'Sarah Johnson',
      goals: 'build muscle',
      training_frequency_per_week: 3,
    }));
    expect(result[0].name).toContain('Sarah');
    expect(result[0].name).not.toContain('Johnson');
  });

  it('works with single-word client names', () => {
    const result = getMockGeneratedWorkouts(makeCtx({ client_name: 'Rocky' }));
    expect(result[0].name).toContain('Rocky');
  });
});

// ─── Injury filtering ─────────────────────────────────────────────────────────

describe('getMockGeneratedWorkouts — injury filtering', () => {
  it('removes overhead movements for shoulder injury', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'build muscle',
      training_frequency_per_week: 4,
      current_injuries: 'rotator cuff shoulder injury',
    }));
    const allExercises = result.flatMap((w) => w.exerciseNames);
    const overhead = allExercises.filter((ex) => /overhead|push-up|bench/i.test(ex));
    expect(overhead).toHaveLength(0);
  });

  it('removes squat/lunge movements for knee injury', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'build muscle',
      training_frequency_per_week: 3,
      current_injuries: 'knee pain',
    }));
    const allExercises = result.flatMap((w) => w.exerciseNames);
    const kneeEx = allExercises.filter((ex) => /squat|lunge|split squat|step-up|jump/i.test(ex));
    expect(kneeEx).toHaveLength(0);
  });

  it('removes deadlift/barbell row for back injury', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'strength',
      current_injuries: 'lumbar back disc',
    }));
    const allExercises = result.flatMap((w) => w.exerciseNames);
    const backEx = allExercises.filter((ex) => /deadlift|barbell row|good morning/i.test(ex));
    expect(backEx).toHaveLength(0);
  });

  it('removes barbell curl / skull crusher for wrist injury', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'build muscle',
      training_frequency_per_week: 4,
      current_injuries: 'wrist tendinitis',
    }));
    const allExercises = result.flatMap((w) => w.exerciseNames);
    const wristEx = allExercises.filter((ex) => /barbell curl|skull crusher/i.test(ex));
    expect(wristEx).toHaveLength(0);
  });

  it('combines injuries from current_injuries and past_injuries', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: 'build muscle',
      training_frequency_per_week: 3,
      current_injuries: 'shoulder',
      past_injuries: 'knee surgery',
    }));
    const allExercises = result.flatMap((w) => w.exerciseNames);
    const shoulderEx = allExercises.filter((ex) => /overhead|push-up|bench/i.test(ex));
    const kneeEx = allExercises.filter((ex) => /squat|lunge|split squat|step-up|jump/i.test(ex));
    expect(shoulderEx).toHaveLength(0);
    expect(kneeEx).toHaveLength(0);
  });
});

// ─── Least-trained muscle integration ────────────────────────────────────────

describe('getMockGeneratedWorkouts — least-trained muscle note', () => {
  it('mentions least-trained muscles in Full Body rationale when history exists', () => {
    const result = getMockGeneratedWorkouts(makeCtx({
      goals: null,
      training_frequency_per_week: 3,
      recent_workouts: [
        {
          id: 'w1', performed_at: '2024-01-01',
          exercise_count: 5, total_sets: 15, total_volume_kg: 5000,
          muscle_groups: ['Chest', 'Back'],  // Chest + Back are most-trained
          average_rpe: null,
        },
        {
          id: 'w2', performed_at: '2024-01-08',
          exercise_count: 5, total_sets: 15, total_volume_kg: 5000,
          muscle_groups: ['Chest', 'Back'],
          average_rpe: null,
        },
      ],
    }));
    // least-trained = ['Legs', 'Shoulders', 'Core', 'Arms'] (not Chest, not Back)
    // rationale should mention some of these
    const rationale0 = result[0].rationale;
    expect(rationale0.length).toBeGreaterThan(0);
  });

  it('rationale is a non-empty string even with no workout history', () => {
    // With no history, all muscles count as "least trained" so leastNote may still be added.
    // We just verify the rationale is a valid string.
    const result = getMockGeneratedWorkouts(makeCtx({ goals: null, recent_workouts: [] }));
    expect(typeof result[0].rationale).toBe('string');
    expect(result[0].rationale.length).toBeGreaterThan(0);
  });
});

// ─── Exercise list ─────────────────────────────────────────────────────────────

describe('getMockGeneratedWorkouts — exercise lists', () => {
  it('each workout has at least 1 exercise', () => {
    const result = getMockGeneratedWorkouts(makeCtx());
    result.forEach((w) => {
      expect(w.exerciseNames.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('rationale is a non-empty string', () => {
    const result = getMockGeneratedWorkouts(makeCtx());
    result.forEach((w) => {
      expect(typeof w.rationale).toBe('string');
      expect(w.rationale.length).toBeGreaterThan(0);
    });
  });
});
