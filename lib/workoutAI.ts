/**
 * Workout AI utility.
 *
 * Follows the same Edge Function delegation pattern as lib/nutritionAI.ts.
 * Set WORKOUT_AI_ENABLED = true and deploy the `workout-ai` Edge Function
 * with ANTHROPIC_API_KEY to activate live generation.
 *
 * While disabled, all functions return deterministic mock data so the UI is
 * fully testable without API costs.
 */

import { supabase } from '@/lib/supabase';
import type { WorkoutHistorySummary, PersonalRecordSummary, WorkoutStatsContext } from '@/lib/nutritionAI';

// ─── Feature flag ─────────────────────────────────────────────

/**
 * Master toggle for AI workout generation.
 * Set to `true` to enable; requires the `workout-ai` Edge Function to be
 * deployed and ANTHROPIC_API_KEY set via `supabase secrets set`.
 */
export const WORKOUT_AI_ENABLED = false;

// ─── Types ────────────────────────────────────────────────────

export type WorkoutAIContext = {
  client_name: string;
  goals: string | null;
  goal_timeframe: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  current_injuries: string | null;
  past_injuries: string | null;
  chronic_conditions: string | null;
  training_frequency_per_week: number | null;
  typical_session_length_minutes: number | null;
  activity_level: string | null;
  recent_workouts?: WorkoutHistorySummary[] | null;
  personal_records?: PersonalRecordSummary[] | null;
  workout_stats?: WorkoutStatsContext | null;
};

export type GeneratedWorkout = {
  /** Display name for the workout (e.g. "Alex's Upper Hypertrophy A") */
  name: string;
  /** Template split category (e.g. "Full Body", "Upper / Lower") */
  split: string;
  /** Template subgroup (e.g. "Upper", "Push", "Standard") */
  subgroup: string;
  /** Human-readable rationale explaining why this workout was generated */
  rationale: string;
  /** Ordered list of exercise names matching the exercises table */
  exerciseNames: string[];
};

// ─── Mock exercise library ────────────────────────────────────

const LIB = {
  chest:           ['Bench Press', 'Incline Dumbbell Press', 'Cable Chest Fly', 'Dumbbell Chest Press', 'Push-Up'],
  shoulders:       ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Arnold Press'],
  triceps:         ['Tricep Pushdown', 'Skull Crusher', 'Close-Grip Bench Press', 'Overhead Tricep Extension'],
  back:            ['Lat Pulldown', 'Seated Cable Row', 'Barbell Row', 'Single-Arm Dumbbell Row', 'Straight-Arm Pulldown'],
  biceps:          ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Incline Curl', 'Cable Curl'],
  legs_quads:      ['Barbell Back Squat', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension', 'Goblet Squat'],
  legs_hamstrings: ['Romanian Deadlift', 'Lying Leg Curl', 'Nordic Curl', 'Good Morning', 'Seated Leg Curl'],
  glutes:          ['Hip Thrust', 'Glute Bridge', 'Cable Kickback', 'Sumo Deadlift', 'Step-Up'],
  calves:          ['Standing Calf Raise', 'Seated Calf Raise', 'Calf Press on Leg Press'],
  core:            ['Plank', 'Ab Rollout', 'Cable Crunch', 'Hanging Leg Raise', 'Dead Bug'],
  hiit:            ['Burpee', 'Jump Squat', 'Mountain Climber', 'Kettlebell Swing', 'Box Jump'],
};

// ─── Mock helpers ─────────────────────────────────────────────

type Goal = 'muscle' | 'fat_loss' | 'strength' | 'general';

function detectGoal(goals: string | null): Goal {
  if (!goals) return 'general';
  const g = goals.toLowerCase();
  if (/build muscle|hypertrophy|mass|bulk/i.test(g)) return 'muscle';
  if (/lose weight|fat loss|cut|slim|tone/i.test(g)) return 'fat_loss';
  if (/strength|stronger|powerlifting/i.test(g)) return 'strength';
  return 'general';
}

function detectInjuries(raw: string | null): string[] {
  if (!raw) return [];
  const injuries: string[] = [];
  if (/shoulder|rotator/i.test(raw)) injuries.push('shoulder');
  if (/knee|patella/i.test(raw)) injuries.push('knee');
  if (/back|lumbar|spine|disc/i.test(raw)) injuries.push('back');
  if (/wrist|elbow/i.test(raw)) injuries.push('wrist');
  return injuries;
}

function safe(exercises: string[], injuries: string[]): string[] {
  if (!injuries.length) return exercises;
  return exercises.filter((ex) => {
    if (injuries.includes('shoulder') && /overhead|push-up|bench/i.test(ex)) return false;
    if (injuries.includes('knee')    && /squat|lunge|split squat|step-up|jump/i.test(ex)) return false;
    if (injuries.includes('back')    && /deadlift|barbell row|good morning/i.test(ex)) return false;
    if (injuries.includes('wrist')   && /barbell curl|skull crusher/i.test(ex)) return false;
    return true;
  });
}

/** Derive the least-trained muscle buckets from recent workout history. */
function leastTrainedMuscles(recent: WorkoutHistorySummary[]): string[] {
  const counts: Record<string, number> = {};
  for (const w of recent) {
    for (const m of w.muscle_groups) counts[m] = (counts[m] ?? 0) + 1;
  }
  const all = ['Chest', 'Back', 'Legs', 'Shoulders', 'Core', 'Arms'];
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 2);
  return all.filter((m) => !top.includes(m));
}

// ─── Mock workout generation ──────────────────────────────────

export function getMockGeneratedWorkouts(ctx: WorkoutAIContext): GeneratedWorkout[] {
  const goal    = detectGoal(ctx.goals);
  const injuries = detectInjuries([ctx.current_injuries, ctx.past_injuries].filter(Boolean).join(' '));
  const freq    = ctx.training_frequency_per_week ?? 3;
  const first   = ctx.client_name.split(' ')[0];
  const least   = leastTrainedMuscles(ctx.recent_workouts ?? []);

  // ── Muscle / general → split based on training frequency ─────
  if (goal === 'muscle' || goal === 'general') {
    if (freq >= 4) {
      const upper = safe([
        ...LIB.chest.slice(0, 2),
        ...LIB.back.slice(0, 2),
        ...LIB.shoulders.slice(0, 1),
        ...LIB.triceps.slice(0, 1),
        ...LIB.biceps.slice(0, 1),
      ], injuries).slice(0, 6);

      const lower = safe([
        ...LIB.legs_quads.slice(0, 2),
        ...LIB.legs_hamstrings.slice(0, 2),
        ...LIB.glutes.slice(0, 1),
        ...LIB.core.slice(0, 1),
      ], injuries).slice(0, 6);

      return [
        {
          name: `${first}'s Upper Hypertrophy A`,
          split: 'Upper / Lower',
          subgroup: 'Upper',
          rationale:
            `With ${freq} training days/week, an Upper/Lower split gives each muscle group 2× weekly stimulus. ` +
            `This session targets chest, back, shoulders, and arms with balanced push/pull volume to protect shoulder health.`,
          exerciseNames: upper,
        },
        {
          name: `${first}'s Lower Hypertrophy A`,
          split: 'Upper / Lower',
          subgroup: 'Lower',
          rationale:
            `Complementary lower body session targeting quads, hamstrings, and glutes. ` +
            `Romanian Deadlift builds posterior chain strength critical for overall force output and injury prevention. Core included for stability.`,
          exerciseNames: lower,
        },
      ];
    }

    // 3 days/week → full body
    const fb1 = safe([
      LIB.legs_quads[0], LIB.chest[0], LIB.back[0],
      LIB.shoulders[0], LIB.legs_hamstrings[0], LIB.core[0],
    ], injuries);

    const fb2 = safe([
      LIB.legs_quads[1], LIB.chest[1], LIB.back[1],
      LIB.biceps[0], LIB.glutes[0], LIB.core[1],
    ], injuries);

    const leastNote =
      least.length > 0
        ? ` Based on recent history, extra attention on ${least.slice(0, 2).join(' and ')}.`
        : '';

    return [
      {
        name: `${first}'s Full Body A`,
        split: 'Full Body',
        subgroup: 'Standard',
        rationale:
          `Full body training 3×/week maximises muscle protein synthesis frequency for ${first}.` +
          ` Session A covers squat, horizontal push/pull, vertical press, and hip hinge patterns.${leastNote}`,
        exerciseNames: fb1,
      },
      {
        name: `${first}'s Full Body B`,
        split: 'Full Body',
        subgroup: 'Standard',
        rationale:
          `Alternate session with exercise variation to hit the same muscle groups via different movement patterns, ` +
          `reducing overuse risk while maintaining training stimulus.`,
        exerciseNames: fb2,
      },
    ];
  }

  // ── Fat loss ──────────────────────────────────────────────────
  if (goal === 'fat_loss') {
    const hiit = safe([
      ...LIB.hiit.slice(0, 3),
      LIB.legs_quads[1],
      ...LIB.core.slice(0, 2),
    ], injuries).slice(0, 5);

    const metStr = safe([
      LIB.legs_quads[0], LIB.chest[0],
      LIB.back[0], LIB.legs_hamstrings[0],
      ...LIB.core.slice(0, 2),
    ], injuries).slice(0, 6);

    return [
      {
        name: `${first}'s HIIT Circuit A`,
        split: 'Fat Loss',
        subgroup: 'HIIT Circuits',
        rationale:
          `High-intensity interval training maximises EPOC (post-exercise calorie burn) and improves cardiovascular fitness. ` +
          `Perform as 3–4 rounds with 20–30s rest between exercises. Aligned with ${first}'s fat loss goal.`,
        exerciseNames: hiit,
      },
      {
        name: `${first}'s Metabolic Strength A`,
        split: 'Fat Loss',
        subgroup: 'Metabolic Strength',
        rationale:
          `Compound strength movements preserve lean muscle during a calorie deficit and create a high metabolic demand. ` +
          `Pair with HIIT sessions for optimal fat loss results.`,
        exerciseNames: metStr,
      },
    ];
  }

  // ── Strength ──────────────────────────────────────────────────
  if (goal === 'strength') {
    const push = safe([
      ...LIB.chest.slice(0, 2),
      ...LIB.shoulders.slice(0, 2),
      ...LIB.triceps.slice(0, 1),
    ], injuries).slice(0, 5);

    const pull = safe([
      ...LIB.back.slice(0, 3),
      ...LIB.biceps.slice(0, 1),
      LIB.core[0],
    ], injuries).slice(0, 5);

    return [
      {
        name: `${first}'s Strength Push A`,
        split: 'Push / Pull / Legs',
        subgroup: 'Push',
        rationale:
          `Strength-focused push day for ${first}. Heavy compound presses (3–5 reps, 80–85% 1RM) followed by accessory work. ` +
          `Rest 3–5 min between compound sets to maximise strength adaptation.`,
        exerciseNames: push,
      },
      {
        name: `${first}'s Strength Pull A`,
        split: 'Push / Pull / Legs',
        subgroup: 'Pull',
        rationale:
          `Complementary pull session for back thickness and width. Rowing movements build the posterior chain ` +
          `critical for posture and injury prevention. Balanced with bicep accessory.`,
        exerciseNames: pull,
      },
    ];
  }

  // ── Fallback ──────────────────────────────────────────────────
  const gen1 = safe([
    LIB.legs_quads[0], LIB.chest[0], LIB.back[0],
    LIB.shoulders[0], LIB.core[0], LIB.glutes[0],
  ], injuries);

  const gen2 = safe([
    LIB.legs_hamstrings[0], LIB.chest[1], LIB.back[1],
    LIB.biceps[0], LIB.core[1], LIB.calves[0],
  ], injuries);

  return [
    {
      name: `${first}'s Workout A`,
      split: 'Full Body',
      subgroup: 'Standard',
      rationale: `Balanced full-body session covering all major movement patterns.`,
      exerciseNames: gen1,
    },
    {
      name: `${first}'s Workout B`,
      split: 'Full Body',
      subgroup: 'Standard',
      rationale: `Alternate session with exercise variation for muscle balance and to prevent adaptation.`,
      exerciseNames: gen2,
    },
  ];
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Generate 2 personalised workout templates for a client.
 *
 * Uses mock data when WORKOUT_AI_ENABLED = false.
 * When enabled, delegates to the `workout-ai` Supabase Edge Function.
 */
export async function generateWorkouts(context: WorkoutAIContext): Promise<GeneratedWorkout[]> {
  if (!WORKOUT_AI_ENABLED) {
    await new Promise<void>((r) => setTimeout(r, 1200));
    return getMockGeneratedWorkouts(context);
  }

  const { data, error } = await supabase.functions.invoke('workout-ai', {
    body: { action: 'generate_workouts', context },
  });

  if (error || !data?.workouts) {
    throw new Error(error?.message ?? 'Failed to generate workouts');
  }

  return data.workouts as GeneratedWorkout[];
}
