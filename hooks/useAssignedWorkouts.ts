import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  AssignedWorkoutWithDetails,
  AssignedExercisePayload,
  InsertAssignedWorkout,
  UpdateAssignedWorkout,
  InsertWorkoutSet,
} from '@/types';
import { createWorkoutWithSets } from '@/hooks/useWorkouts';

const ASSIGNED_WORKOUT_SELECT = `
  id, trainer_id, client_id, title, scheduled_date, notes, status,
  completed_at, completed_workout_id, created_at, updated_at,
  exercises:assigned_workout_exercises (
    id, assigned_workout_id, exercise_id, order_index, superset_group, rest_seconds,
    exercise:exercises ( id, name, muscle_group, category, form_notes, help_url, created_at ),
    sets:assigned_workout_sets (
      id, assigned_workout_exercise_id, set_number, reps, weight_kg, duration_seconds, notes
    )
  )
`;

function sortExercises(data: unknown): AssignedWorkoutWithDetails {
  const aw = data as AssignedWorkoutWithDetails;
  return {
    ...aw,
    exercises: [...(aw.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
  };
}

/** List all assigned workouts for a client with full detail, sorted by scheduled_date ASC. */
export function useAssignedWorkoutsForClient(clientId: string) {
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('assigned_workouts')
      .select(ASSIGNED_WORKOUT_SELECT)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: true });

    if (err) setError(err.message);
    else setAssignedWorkouts((data ?? []).map(sortExercises));
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignedWorkouts, loading, error, refetch: fetch };
}

/** List only pending (status='assigned') workouts for a client, sorted by scheduled_date ASC. */
export function usePendingAssignedWorkoutsForClient(clientId: string) {
  const [assignedWorkouts, setAssignedWorkouts] = useState<AssignedWorkoutWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('assigned_workouts')
      .select(ASSIGNED_WORKOUT_SELECT)
      .eq('client_id', clientId)
      .eq('status', 'assigned')
      .order('scheduled_date', { ascending: true });

    if (err) setError(err.message);
    else setAssignedWorkouts((data ?? []).map(sortExercises));
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignedWorkouts, loading, error, refetch: fetch };
}

/** Fetch a single assigned workout by id with full exercise+set detail. */
export function useAssignedWorkoutDetail(id: string) {
  const [assignedWorkout, setAssignedWorkout] = useState<AssignedWorkoutWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('assigned_workouts')
      .select(ASSIGNED_WORKOUT_SELECT)
      .eq('id', id)
      .single();

    if (err) setError(err.message);
    else if (data) setAssignedWorkout(sortExercises(data));
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignedWorkout, loading, error, refetch: fetch };
}

// ─── Standalone mutation helpers ─────────────────────────────────

/** Create an assigned workout with exercises and sets. Does NOT touch the workouts table. */
export async function createAssignedWorkout(
  clientId: string,
  trainerId: string,
  payload: InsertAssignedWorkout,
): Promise<{ id: string | null; error: string | null }> {
  const { data: aw, error: awErr } = await supabase
    .from('assigned_workouts')
    .insert({
      client_id: clientId,
      trainer_id: trainerId,
      title: payload.title,
      scheduled_date: payload.scheduled_date,
      notes: payload.notes,
      status: 'assigned',
    })
    .select('id')
    .single();

  if (awErr || !aw) return { id: null, error: awErr?.message ?? 'Failed to create assigned workout' };

  for (const ex of payload.exercises) {
    const insertErr = await _insertExerciseWithSets(aw.id, ex);
    if (insertErr) return { id: aw.id, error: insertErr };
  }

  return { id: aw.id, error: null };
}

/** Update an assigned workout's top-level fields. If exercises is provided, replaces all exercises+sets. */
export async function updateAssignedWorkout(
  id: string,
  payload: UpdateAssignedWorkout,
): Promise<{ error: string | null }> {
  const { exercises, ...topLevel } = payload;

  if (Object.keys(topLevel).length > 0) {
    const { error: upErr } = await supabase
      .from('assigned_workouts')
      .update(topLevel)
      .eq('id', id);
    if (upErr) return { error: upErr.message };
  }

  if (exercises !== undefined) {
    // Cascade delete via FK — deletes assigned_workout_sets too
    const { error: delErr } = await supabase
      .from('assigned_workout_exercises')
      .delete()
      .eq('assigned_workout_id', id);
    if (delErr) return { error: delErr.message };

    for (const ex of exercises) {
      const insertErr = await _insertExerciseWithSets(id, ex);
      if (insertErr) return { error: insertErr };
    }
  }

  return { error: null };
}

/** Delete an assigned workout; cascade FK deletes exercises + sets. */
export async function deleteAssignedWorkout(id: string): Promise<{ error: string | null }> {
  // Explicitly delete children before the parent so RLS sub-selects on child
  // tables can still find the parent row (cascade would delete it first, breaking them).
  const { data: exercises } = await supabase
    .from('assigned_workout_exercises')
    .select('id')
    .eq('assigned_workout_id', id);

  if (exercises && exercises.length > 0) {
    const exIds = exercises.map((e) => e.id);
    const { error: setsErr } = await supabase
      .from('assigned_workout_sets')
      .delete()
      .in('assigned_workout_exercise_id', exIds);
    if (setsErr) return { error: setsErr.message };

    const { error: exErr } = await supabase
      .from('assigned_workout_exercises')
      .delete()
      .eq('assigned_workout_id', id);
    if (exErr) return { error: exErr.message };
  }

  const { error: err, count } = await supabase
    .from('assigned_workouts')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (err) return { error: err.message };
  if (!count) return { error: 'Delete failed — you may not have permission.' };
  return { error: null };
}

/**
 * Complete an assigned workout:
 *   1. Creates a real workouts + workout_sets entry from clientActualSets.
 *   2. Marks assigned_workout as completed.
 * The assigned_workout_sets template is never modified.
 *
 * @param loggedByRole  'client' when the client completes their own workout;
 *                      'trainer' when a trainer logs it on the client's behalf.
 */
export async function completeAssignedWorkout(
  assignedWorkoutId: string,
  clientActualSets: Omit<InsertWorkoutSet, 'workout_id'>[],
  loggedByRole: 'trainer' | 'client' = 'client',
): Promise<{ workoutId: string | null; error: string | null }> {
  // Fetch the assigned workout to get client_id and trainer_id
  const { data: aw, error: fetchErr } = await supabase
    .from('assigned_workouts')
    .select('client_id, trainer_id')
    .eq('id', assignedWorkoutId)
    .single();

  if (fetchErr || !aw) return { workoutId: null, error: fetchErr?.message ?? 'Assigned workout not found' };

  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split('T')[0];

  const { workoutId, error: createErr } = await createWorkoutWithSets(
    {
      client_id: aw.client_id,
      trainer_id: aw.trainer_id,
      performed_at: today,
      notes: null,
      body_weight_kg: null,
      body_fat_percent: null,
      logged_by_role: loggedByRole,
      logged_by_user_id: user?.id ?? null,
    },
    clientActualSets,
  );

  if (createErr || !workoutId) return { workoutId: null, error: createErr ?? 'Failed to create workout' };

  const { error: updateErr } = await supabase
    .from('assigned_workouts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_workout_id: workoutId,
    })
    .eq('id', assignedWorkoutId);

  if (updateErr) return { workoutId, error: updateErr.message };

  return { workoutId, error: null };
}

// ─── Internal helpers ─────────────────────────────────────────────

async function _insertExerciseWithSets(
  assignedWorkoutId: string,
  ex: AssignedExercisePayload,
): Promise<string | null> {
  const { data: awe, error: aweErr } = await supabase
    .from('assigned_workout_exercises')
    .insert({
      assigned_workout_id: assignedWorkoutId,
      exercise_id: ex.exercise_id,
      order_index: ex.order_index,
      superset_group: ex.superset_group,
    })
    .select('id')
    .single();

  if (aweErr || !awe) return aweErr?.message ?? 'Failed to insert exercise';

  if (ex.sets.length > 0) {
    const { error: setsErr } = await supabase
      .from('assigned_workout_sets')
      .insert(ex.sets.map((s) => ({ ...s, assigned_workout_exercise_id: awe.id })));
    if (setsErr) return setsErr.message;
  }

  return null;
}
