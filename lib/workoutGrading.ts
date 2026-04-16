// Pure grading logic — no React, no Supabase.
// All inputs are plain data; call from a hook or test harness.

export type GradeLetter =
  | 'A+' | 'A' | 'A-'
  | 'B+' | 'B' | 'B-'
  | 'C+' | 'C' | 'C-'
  | 'D+' | 'D'
  | 'F';

export type WorkoutGradeResult = {
  letter: GradeLetter;
  score: number;             // 0–100 composite
  volumeVsBestScore: number; // 0–100
  prScore: number;           // 0–100
  trendScore: number;        // 0–100 (volume vs recent avg)
  prsHit: string[];          // exercise names that broke their all-time weight PR
  currentVolume: number;     // kg × reps sum for this workout
  bestHistoricalVolume: number;
  recentAvgVolume: number;
  hasSufficientHistory: boolean;
};

export type HistoricalSet = {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
};

export type HistoricalWorkout = {
  id: string;
  performed_at: string;
  sets: HistoricalSet[];
};

export type CurrentSet = {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
};

// ─── Grade thresholds ────────────────────────────────────────────────
const GRADE_MAP: { min: number; letter: GradeLetter }[] = [
  { min: 97, letter: 'A+' },
  { min: 93, letter: 'A'  },
  { min: 90, letter: 'A-' },
  { min: 87, letter: 'B+' },
  { min: 83, letter: 'B'  },
  { min: 80, letter: 'B-' },
  { min: 77, letter: 'C+' },
  { min: 73, letter: 'C'  },
  { min: 70, letter: 'C-' },
  { min: 67, letter: 'D+' },
  { min: 60, letter: 'D'  },
  { min:  0, letter: 'F'  },
];

function scoreToLetter(score: number): GradeLetter {
  for (const { min, letter } of GRADE_MAP) {
    if (score >= min) return letter;
  }
  return 'F';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Main grading function ───────────────────────────────────────────

export function gradeWorkout(
  currentSets: CurrentSet[],
  pastWorkouts: HistoricalWorkout[],
): WorkoutGradeResult {
  // ── Volume of current workout ──────────────────────────────────────
  const currentVolume = currentSets.reduce(
    (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
    0,
  );

  // ── Historical volumes ────────────────────────────────────────────
  const historicalVolumes = pastWorkouts.map((w) =>
    w.sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0),
  );

  const bestHistoricalVolume = historicalVolumes.length > 0
    ? Math.max(...historicalVolumes)
    : 0;

  // Rolling average over the most recent 4 past workouts
  const recent = historicalVolumes.slice(-4);
  const recentAvgVolume = recent.length > 0
    ? recent.reduce((a, b) => a + b, 0) / recent.length
    : 0;

  const hasSufficientHistory = pastWorkouts.length >= 2;

  // ── A. Volume vs all-time best (0–100) ───────────────────────────
  let volumeVsBestScore: number;
  if (bestHistoricalVolume > 0 && currentVolume > 0) {
    volumeVsBestScore = clamp(currentVolume / bestHistoricalVolume, 0, 1) * 100;
  } else if (currentVolume > 0) {
    // First workout ever — start at a generous baseline
    volumeVsBestScore = 75;
  } else {
    // No weight-based sets (duration/reps-only) — neutral
    volumeVsBestScore = 65;
  }

  // ── B. PR score (0–100) ─────────────────────────────────────────
  // Build all-time best weight per exercise from past workouts
  const allTimeBest = new Map<string, number>(); // exercise_id → max weight_kg
  for (const w of pastWorkouts) {
    for (const s of w.sets) {
      if (s.weight_kg != null) {
        const prev = allTimeBest.get(s.exercise_id) ?? 0;
        if (s.weight_kg > prev) allTimeBest.set(s.exercise_id, s.weight_kg);
      }
    }
  }

  // Current workout max weight per exercise
  const currentMax = new Map<string, { weight: number; name: string }>();
  for (const s of currentSets) {
    if (s.weight_kg != null) {
      const prev = currentMax.get(s.exercise_id);
      if (!prev || s.weight_kg > prev.weight) {
        currentMax.set(s.exercise_id, { weight: s.weight_kg, name: s.exercise_name });
      }
    }
  }

  const prsHit: string[] = [];
  let exercisesWithHistory = 0;
  let prCount = 0;

  for (const [exId, { weight, name }] of currentMax.entries()) {
    const best = allTimeBest.get(exId);
    if (best !== undefined) {
      exercisesWithHistory++;
      if (weight > best) {
        prCount++;
        prsHit.push(name);
      }
    } else {
      // First time ever doing this exercise — counts as a PR
      prsHit.push(name);
    }
  }

  let prScore: number;
  if (exercisesWithHistory > 0) {
    prScore = (prCount / exercisesWithHistory) * 100;
  } else if (currentMax.size > 0) {
    // All exercises are brand-new — treat as solid but not perfect
    prScore = 78;
  } else {
    // No weight data at all (cardio/duration workout)
    prScore = 65;
  }

  // ── C. Volume vs recent trend (0–100) ───────────────────────────
  let trendScore: number;
  if (recentAvgVolume > 0 && currentVolume > 0) {
    // Cap at 120% to reward exceeding average without overshooting
    trendScore = clamp(currentVolume / recentAvgVolume, 0, 1.2) / 1.2 * 100;
  } else {
    trendScore = 70;
  }

  // ── Composite score ──────────────────────────────────────────────
  let score: number;
  if (!hasSufficientHistory) {
    // Not enough history — weight completeness more heavily
    score = volumeVsBestScore * 0.30 + prScore * 0.40 + trendScore * 0.30;
  } else {
    score = volumeVsBestScore * 0.40 + prScore * 0.30 + trendScore * 0.30;
  }

  score = Math.round(clamp(score, 0, 100));

  return {
    letter: scoreToLetter(score),
    score,
    volumeVsBestScore: Math.round(volumeVsBestScore),
    prScore: Math.round(prScore),
    trendScore: Math.round(trendScore),
    prsHit,
    currentVolume: Math.round(currentVolume),
    bestHistoricalVolume: Math.round(bestHistoricalVolume),
    recentAvgVolume: Math.round(recentAvgVolume),
    hasSufficientHistory,
  };
}
