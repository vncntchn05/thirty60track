import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export type ChartPoint = { x: number; y: number; label: string };
export type ProgressExercise = { id: string; name: string };

export type FrequencyStats = {
  totalWorkouts: number;
  avgPerWeek: number;    // avg over entire span
  thisWeek: number;      // workouts in the current Mon–Sun week
  currentStreak: number; // consecutive weeks (ending at latest workout) with ≥ 1 session
  bestStreak: number;
  activeWeeks: number;   // weeks that had ≥ 1 workout
};

// Raw shape returned by the Supabase join query
type RawSet = {
  exercise_id: string;
  reps: number | null;
  weight_kg: number | null;
  exercise: { id: string; name: string } | null;
};

type RawWorkout = {
  id: string;
  performed_at: string;
  workout_sets: RawSet[];
};

type UseClientProgressResult = {
  frequencyData: ChartPoint[];
  frequencyStats: FrequencyStats;
  volumeData: ChartPoint[];
  exercises: ProgressExercise[];
  getExerciseProgress: (exerciseId: string) => ChartPoint[];
  getExerciseRepsProgress: (exerciseId: string) => ChartPoint[];
  loading: boolean;
  error: string | null;
};

function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useClientProgress(clientId: string, daysBack?: number): UseClientProgressResult {
  const [rawWorkouts, setRawWorkouts] = useState<RawWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('workouts')
      .select(`
        id,
        performed_at,
        workout_sets (
          exercise_id,
          reps,
          weight_kg,
          exercise:exercises ( id, name )
        )
      `)
      .eq('client_id', clientId)
      .order('performed_at', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setRawWorkouts((data ?? []) as unknown as RawWorkout[]);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Apply optional date-range filter before all derivations (no refetch)
  const workouts = useMemo(() => {
    if (!daysBack) return rawWorkouts;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    return rawWorkouts.filter((w) => new Date(w.performed_at) >= cutoff);
  }, [rawWorkouts, daysBack]);

  // ── Derived: workouts per week + consistency stats ─────────────────
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  let frequencyData: ChartPoint[] = [];
  let frequencyStats: FrequencyStats = {
    totalWorkouts: 0, avgPerWeek: 0, thisWeek: 0,
    currentStreak: 0, bestStreak: 0, activeWeeks: 0,
  };

  if (workouts.length > 0) {
    const firstMs = new Date(workouts[0].performed_at).getTime();
    const lastMs  = new Date(workouts[workouts.length - 1].performed_at).getTime();
    const totalWeeks = Math.max(1, Math.floor((lastMs - firstMs) / WEEK_MS) + 1);

    const counts = new Array<number>(totalWeeks).fill(0);
    workouts.forEach((w) => {
      const idx = Math.min(
        Math.floor((new Date(w.performed_at).getTime() - firstMs) / WEEK_MS),
        totalWeeks - 1,
      );
      counts[idx]++;
    });

    frequencyData = counts.map((count, i) => {
      const d = new Date(firstMs + i * WEEK_MS);
      return {
        x: i,
        y: count,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    // Streaks
    let currentStreak = 0, bestStreak = 0, run = 0;
    for (const c of counts) {
      if (c > 0) { run++; if (run > bestStreak) bestStreak = run; }
      else run = 0;
    }
    for (let i = counts.length - 1; i >= 0; i--) {
      if (counts[i] > 0) currentStreak++;
      else break;
    }

    // Workouts in the current Mon–Sun calendar week
    const now = new Date();
    const dow = now.getDay() || 7; // Mon=1..Sun=7
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dow - 1));
    const thisWeek = workouts.filter(
      (w) => new Date(w.performed_at) >= startOfWeek,
    ).length;

    frequencyStats = {
      totalWorkouts: workouts.length,
      avgPerWeek: Math.round((workouts.length / totalWeeks) * 10) / 10,
      thisWeek,
      currentStreak,
      bestStreak,
      activeWeeks: counts.filter((c) => c > 0).length,
    };
  }

  // ── Derived: volume per workout ────────────────────────────────────
  const volumeData: ChartPoint[] = workouts.map((w, i) => ({
    x: i,
    y: w.workout_sets.reduce(
      (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
      0
    ),
    label: shortDate(w.performed_at),
  }));

  // ── Derived: unique exercises this client has done ─────────────────
  const exerciseMap = new Map<string, string>();
  workouts.forEach((w) => {
    w.workout_sets.forEach((s) => {
      if (s.exercise && !exerciseMap.has(s.exercise_id)) {
        exerciseMap.set(s.exercise_id, s.exercise.name);
      }
    });
  });
  const exercises: ProgressExercise[] = Array.from(exerciseMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Derived: max weight per session for one exercise ───────────────
  function getExerciseProgress(exerciseId: string): ChartPoint[] {
    const points: ChartPoint[] = [];
    workouts.forEach((w) => {
      const relevant = w.workout_sets.filter(
        (s) => s.exercise_id === exerciseId && s.weight_kg != null
      );
      if (relevant.length > 0) {
        const maxWeight = Math.max(...relevant.map((s) => s.weight_kg as number));
        points.push({ x: points.length, y: maxWeight, label: shortDate(w.performed_at) });
      }
    });
    return points;
  }

  // ── Derived: max reps per session for one exercise ─────────────────
  function getExerciseRepsProgress(exerciseId: string): ChartPoint[] {
    const points: ChartPoint[] = [];
    workouts.forEach((w) => {
      const relevant = w.workout_sets.filter(
        (s) => s.exercise_id === exerciseId && s.reps != null
      );
      if (relevant.length > 0) {
        const maxReps = Math.max(...relevant.map((s) => s.reps as number));
        points.push({ x: points.length, y: maxReps, label: shortDate(w.performed_at) });
      }
    });
    return points;
  }

  return { frequencyData, frequencyStats, volumeData, exercises, getExerciseProgress, getExerciseRepsProgress, loading, error };
}
