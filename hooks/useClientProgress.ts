import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type ChartPoint = { x: number; y: number; label: string };
export type ProgressExercise = { id: string; name: string };

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
  volumeData: ChartPoint[];
  exercises: ProgressExercise[];
  getExerciseProgress: (exerciseId: string) => ChartPoint[];
  loading: boolean;
  error: string | null;
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useClientProgress(clientId: string): UseClientProgressResult {
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

  // ── Derived: volume per workout ────────────────────────────────────
  const volumeData: ChartPoint[] = rawWorkouts.map((w, i) => ({
    x: i,
    y: w.workout_sets.reduce(
      (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
      0
    ),
    label: shortDate(w.performed_at),
  }));

  // ── Derived: unique exercises this client has done ─────────────────
  const exerciseMap = new Map<string, string>();
  rawWorkouts.forEach((w) => {
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
    rawWorkouts.forEach((w) => {
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

  return { volumeData, exercises, getExerciseProgress, loading, error };
}
