import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Workout, WorkoutWithSets, InsertWorkout, InsertWorkoutSet } from '@/types';

type UseWorkoutsResult = {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/** List workouts for a single client, newest first. */
export function useWorkouts(clientId: string): UseWorkoutsResult {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('workouts')
      .select('id, client_id, trainer_id, performed_at, notes, created_at, updated_at')
      .eq('client_id', clientId)
      .eq('trainer_id', user.id)
      .order('performed_at', { ascending: false });

    if (err) setError(err.message);
    else setWorkouts(data ?? []);
    setLoading(false);
  }, [user, clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { workouts, loading, error, refetch: fetch };
}

/** Fetch a single workout with all its sets and exercise details. */
export function useWorkoutDetail(workoutId: string) {
  const [workout, setWorkout] = useState<WorkoutWithSets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('workouts')
      .select(`
        id, client_id, trainer_id, performed_at, notes, created_at, updated_at,
        workout_sets (
          id, workout_id, exercise_id, set_number, reps, weight_kg, duration_seconds, notes, created_at,
          exercise:exercises ( id, name, muscle_group, category, created_at )
        )
      `)
      .eq('id', workoutId)
      .single();

    if (err) setError(err.message);
    else setWorkout(data as WorkoutWithSets);
    setLoading(false);
  }, [workoutId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateWorkout(payload: import('@/types').UpdateWorkout) {
    const { error: err } = await supabase
      .from('workouts')
      .update(payload)
      .eq('id', workoutId);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function deleteWorkout() {
    const { error: err } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);
    return { error: err?.message ?? null };
  }

  async function deleteSet(setId: string) {
    const { error: err } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', setId);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function updateSet(setId: string, payload: import('@/types').UpdateWorkoutSet) {
    const { error: err } = await supabase
      .from('workout_sets')
      .update(payload)
      .eq('id', setId);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function addSet(
    exerciseId: string,
    payload: { reps: number | null; weight_kg: number | null; duration_seconds: number | null; notes: string | null },
  ) {
    const existingCount = (workout?.workout_sets ?? []).filter((s) => s.exercise_id === exerciseId).length;
    const { error: err } = await supabase
      .from('workout_sets')
      .insert({ workout_id: workoutId, exercise_id: exerciseId, set_number: existingCount + 1, ...payload });
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  return { workout, loading, error, refetch: fetch, updateWorkout, deleteWorkout, deleteSet, updateSet, addSet };
}

/** Create a workout with sets in a single operation. */
export async function createWorkoutWithSets(
  workout: InsertWorkout,
  sets: Omit<InsertWorkoutSet, 'workout_id'>[]
): Promise<{ workoutId: string | null; error: string | null }> {
  const { data: newWorkout, error: workoutErr } = await supabase
    .from('workouts')
    .insert(workout)
    .select('id')
    .single();

  if (workoutErr || !newWorkout) {
    return { workoutId: null, error: workoutErr?.message ?? 'Failed to create workout' };
  }

  if (sets.length > 0) {
    const { error: setsErr } = await supabase
      .from('workout_sets')
      .insert(sets.map((s) => ({ ...s, workout_id: newWorkout.id })));

    if (setsErr) {
      return { workoutId: newWorkout.id, error: setsErr.message };
    }
  }

  return { workoutId: newWorkout.id, error: null };
}
