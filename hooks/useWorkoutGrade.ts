import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { gradeWorkout } from '@/lib/workoutGrading';
import type { WorkoutGradeResult, HistoricalWorkout } from '@/lib/workoutGrading';
import type { WorkoutSet, Exercise } from '@/types';

type SetWithExercise = WorkoutSet & { exercise: Exercise };

/**
 * Fetches the client's workout history (excluding the current workout) and
 * returns a computed letter grade for the given workout's sets.
 */
export function useWorkoutGrade(
  workoutId: string,
  clientId: string,
  performedAt: string,
  currentSets: SetWithExercise[],
) {
  const [grade, setGrade] = useState<WorkoutGradeResult | null>(null);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!clientId || currentSets.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all past workouts for this client up to (not including) this date
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        id,
        performed_at,
        workout_sets (
          exercise_id,
          reps,
          weight_kg,
          duration_seconds,
          exercise:exercises ( id, name )
        )
      `)
      .eq('client_id', clientId)
      .neq('id', workoutId)
      .lte('performed_at', performedAt)
      .order('performed_at', { ascending: true });

    if (error) {
      setLoading(false);
      return;
    }

    const pastWorkouts: HistoricalWorkout[] = (data ?? []).map((w: unknown) => {
      const workout = w as {
        id: string;
        performed_at: string;
        workout_sets: Array<{
          exercise_id: string;
          reps: number | null;
          weight_kg: number | null;
          duration_seconds: number | null;
          exercise: { id: string; name: string } | null;
        }>;
      };
      return {
        id: workout.id,
        performed_at: workout.performed_at,
        sets: workout.workout_sets.map((s) => ({
          exercise_id: s.exercise_id,
          exercise_name: s.exercise?.name ?? '',
          weight_kg: s.weight_kg,
          reps: s.reps,
        })),
      };
    });

    const mappedCurrentSets = currentSets.map((s) => ({
      exercise_id: s.exercise_id,
      exercise_name: s.exercise.name,
      weight_kg: s.weight_kg,
      reps: s.reps,
      duration_seconds: s.duration_seconds,
    }));

    setGrade(gradeWorkout(mappedCurrentSets, pastWorkouts));
    setLoading(false);
  }, [workoutId, clientId, performedAt, currentSets]);

  useEffect(() => { compute(); }, [compute]);

  return { grade, loading };
}
