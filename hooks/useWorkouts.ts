import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { WorkoutWithTrainer, WorkoutWithSets, WorkoutGroupPeer, InsertWorkout, InsertWorkoutSet, UpdateWorkout, UpdateClient } from '@/types';

function generateGroupId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Insert sets one exercise at a time so each exercise group gets a distinct
 * created_at timestamp. This makes created_at a reliable sort key for
 * preserving exercise display order (earliest = first exercise added).
 */
async function insertSetsOrdered<T extends { exercise_id: string }>(
  sets: T[],
  workoutId: string,
): Promise<string | null> {
  const byExercise = new Map<string, T[]>();
  for (const s of sets) {
    if (!byExercise.has(s.exercise_id)) byExercise.set(s.exercise_id, []);
    byExercise.get(s.exercise_id)!.push(s);
  }
  for (const group of byExercise.values()) {
    const { error } = await supabase
      .from('workout_sets')
      .insert(group.map((s) => ({ ...s, workout_id: workoutId })));
    if (error) return error.message;
  }
  return null;
}

/** Copy the primary workout's sets to all other workouts in the same group. */
async function syncGroupWorkouts(primaryWorkoutId: string, groupId: string): Promise<void> {
  const [{ data: peers }, { data: primarySets }] = await Promise.all([
    supabase.from('workouts').select('id').eq('workout_group_id', groupId).neq('id', primaryWorkoutId),
    supabase.from('workout_sets')
      .select('exercise_id, set_number, reps, weight_kg, duration_seconds, notes, superset_group')
      .eq('workout_id', primaryWorkoutId)
      .order('created_at'),
  ]);
  if (!peers || peers.length === 0) return;
  for (const peer of peers) {
    await supabase.from('workout_sets').delete().eq('workout_id', peer.id);
    if (primarySets && primarySets.length > 0) {
      await insertSetsOrdered(primarySets, peer.id);
    }
  }
}

const WORKOUTS_PAGE_SIZE = 50;

type UseWorkoutsResult = {
  workouts: WorkoutWithTrainer[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
};

const WORKOUT_COLS = 'id, client_id, trainer_id, performed_at, notes, body_weight_kg, body_fat_percent, workout_group_id, logged_by_role, logged_by_user_id, created_at, updated_at, trainer:trainers(full_name)';

/** List workouts for a single client, newest first. Paginates at 50 rows. */
export function useWorkouts(clientId: string): UseWorkoutsResult {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutWithTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  const fetch = useCallback(async () => {
    if (!user || !clientId) return;
    setLoading(true);
    setError(null);
    pageRef.current = 0;
    const { data, error: err } = await supabase
      .from('workouts')
      .select(WORKOUT_COLS)
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false })
      .range(0, WORKOUTS_PAGE_SIZE - 1);

    if (err) setError(err.message);
    else {
      setWorkouts((data ?? []) as unknown as WorkoutWithTrainer[]);
      setHasMore((data?.length ?? 0) === WORKOUTS_PAGE_SIZE);
    }
    setLoading(false);
  }, [user, clientId]);

  const loadMore = useCallback(async () => {
    if (!user || !clientId || !hasMore || loadingMore) return;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    const { data } = await supabase
      .from('workouts')
      .select(WORKOUT_COLS)
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false })
      .range(next * WORKOUTS_PAGE_SIZE, (next + 1) * WORKOUTS_PAGE_SIZE - 1);
    if (data && data.length > 0) {
      pageRef.current = next;
      setWorkouts((prev) => [...prev, ...(data as unknown as WorkoutWithTrainer[])]);
      setHasMore(data.length === WORKOUTS_PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [user, clientId, hasMore, loadingMore]);

  useEffect(() => { fetch(); }, [fetch]);

  return { workouts, loading, loadingMore, hasMore, error, refetch: fetch, loadMore };
}

/** Fetch a single workout with all its sets and exercise details. */
export function useWorkoutDetail(workoutId: string) {
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutWithSets | null>(null);
  const [groupPeers, setGroupPeers] = useState<WorkoutGroupPeer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('workouts')
      .select(`
        id, client_id, trainer_id, performed_at, notes, body_weight_kg, body_fat_percent, workout_group_id, logged_by_role, logged_by_user_id, created_at, updated_at,
        trainer:trainers(full_name),
        client:clients!client_id(full_name),
        workout_sets (
          id, workout_id, exercise_id, set_number, reps, weight_kg, duration_seconds, notes, superset_group, created_at,
          exercise:exercises ( id, name, muscle_group, category, form_notes, help_url, created_at )
        )
      `)
      .eq('id', workoutId)
      .single();

    if (err) { setError(err.message); setLoading(false); return; }
    const typedData = data as unknown as WorkoutWithSets;
    const sorted = typedData.workout_sets.slice().sort(
      (a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0)
    );
    setWorkout({ ...typedData, workout_sets: sorted });

    // Fetch group peers if this workout belongs to a group
    if (data?.workout_group_id) {
      const { data: peers } = await supabase
        .from('workouts')
        .select('id, client_id, client:clients!client_id(full_name)')
        .eq('workout_group_id', data.workout_group_id)
        .neq('id', workoutId);
      setGroupPeers((peers ?? []) as unknown as WorkoutGroupPeer[]);
    } else {
      setGroupPeers([]);
    }

    setLoading(false);
  }, [workoutId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addToGroup(clientId: string, trainerId: string) {
    let groupId = workout?.workout_group_id;
    if (!groupId) {
      groupId = generateGroupId();
      const { error: groupErr } = await supabase
        .from('workouts').update({ workout_group_id: groupId }).eq('id', workoutId);
      if (groupErr) return { error: groupErr.message };
    }
    const { data: newWorkout, error: createErr } = await supabase
      .from('workouts')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        performed_at: workout!.performed_at,
        notes: workout!.notes,
        body_weight_kg: workout!.body_weight_kg,
        body_fat_percent: workout!.body_fat_percent,
        workout_group_id: groupId,
      })
      .select('id')
      .single();
    if (createErr || !newWorkout) return { error: createErr?.message ?? 'Failed to create workout' };
    const { data: currentSets } = await supabase
      .from('workout_sets')
      .select('exercise_id, set_number, reps, weight_kg, duration_seconds, notes, superset_group')
      .eq('workout_id', workoutId);
    if (currentSets && currentSets.length > 0) {
      await supabase.from('workout_sets').insert(currentSets.map((s) => ({ ...s, workout_id: newWorkout.id })));
    }
    fetch();
    return { error: null };
  }

  async function removeFromGroup(peerWorkoutId: string) {
    const { error: err } = await supabase
      .from('workouts').update({ workout_group_id: null }).eq('id', peerWorkoutId);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function updateWorkout(payload: UpdateWorkout) {
    if (!user) return { error: 'Not authenticated' };
    if (workout && workout.trainer_id !== user.id) {
      return { error: 'You do not have permission to edit this workout.' };
    }
    const { error: err } = await supabase
      .from('workouts')
      .update(payload)
      .eq('id', workoutId);
    if (err) return { error: err.message };

    // Sync client body metrics (best-effort) when either metric changes
    const newWeight = payload.body_weight_kg !== undefined ? payload.body_weight_kg : workout?.body_weight_kg;
    const newBf = payload.body_fat_percent !== undefined ? payload.body_fat_percent : workout?.body_fat_percent;
    if ((payload.body_weight_kg !== undefined || payload.body_fat_percent !== undefined) && workout) {
      const clientUpdate: UpdateClient = {};
      if (payload.body_weight_kg != null) clientUpdate.weight_kg = payload.body_weight_kg;
      if (payload.body_fat_percent != null) clientUpdate.bf_percent = payload.body_fat_percent;
      if (newWeight != null && newBf != null) {
        clientUpdate.lean_body_mass = parseFloat((newWeight * (1 - newBf / 100)).toFixed(2));
      }
      if (Object.keys(clientUpdate).length > 0) {
        await supabase.from('clients').update(clientUpdate).eq('id', workout.client_id);
      }
    }

    fetch();
    return { error: null };
  }

  async function deleteWorkout() {
    const { error: err, count } = await supabase
      .from('workouts')
      .delete({ count: 'exact' })
      .eq('id', workoutId);
    if (err) return { error: err.message };
    if (count === 0) return { error: 'Delete failed — you may not have permission.' };
    return { error: null };
  }

  async function deleteSet(setId: string) {
    const { error: err, count } = await supabase
      .from('workout_sets')
      .delete({ count: 'exact' })
      .eq('id', setId);
    if (err) return { error: err.message };
    if (count === 0) return { error: 'Delete failed — you may not have permission.' };
    const groupId = workout?.workout_group_id;
    await fetch();
    if (groupId) syncGroupWorkouts(workoutId, groupId);
    return { error: null };
  }

  async function updateSet(setId: string, payload: import('@/types').UpdateWorkoutSet) {
    const { error: err } = await supabase
      .from('workout_sets')
      .update(payload)
      .eq('id', setId);
    const groupId = workout?.workout_group_id;
    await fetch();
    if (!err && groupId) syncGroupWorkouts(workoutId, groupId);
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
    const groupId = workout?.workout_group_id;
    await fetch();
    if (!err && groupId) syncGroupWorkouts(workoutId, groupId);
    return { error: err?.message ?? null };
  }

  async function updateExerciseSupersetGroup(exerciseId: string, group: number | null) {
    const { error: err } = await supabase
      .from('workout_sets')
      .update({ superset_group: group })
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId);
    const groupId = workout?.workout_group_id;
    await fetch();
    if (!err && groupId) syncGroupWorkouts(workoutId, groupId);
    return { error: err?.message ?? null };
  }

  return { workout, groupPeers, loading, error, refetch: fetch, updateWorkout, deleteWorkout, deleteSet, updateSet, addSet, updateExerciseSupersetGroup, addToGroup, removeFromGroup };
}

/** Create a workout with sets in a single operation.
 *  Pass linkedClientIds to create the same workout for other clients in the same group session. */
export async function createWorkoutWithSets(
  workout: InsertWorkout,
  sets: Omit<InsertWorkoutSet, 'workout_id'>[],
  linkedClientIds: string[] = [],
): Promise<{ workoutId: string | null; error: string | null }> {
  const groupId = linkedClientIds.length > 0 ? generateGroupId() : null;

  const { data: newWorkout, error: workoutErr } = await supabase
    .from('workouts')
    .insert({ ...workout, workout_group_id: groupId })
    .select('id')
    .single();

  if (workoutErr || !newWorkout) {
    return { workoutId: null, error: workoutErr?.message ?? 'Failed to create workout' };
  }

  if (sets.length > 0) {
    const setsErr = await insertSetsOrdered(sets, newWorkout.id);
    if (setsErr) return { workoutId: newWorkout.id, error: setsErr };
  }

  // Sync client body metrics (best-effort)
  const { body_weight_kg, body_fat_percent } = workout;
  if (body_weight_kg != null || body_fat_percent != null) {
    const clientUpdate: UpdateClient = {};
    if (body_weight_kg != null) clientUpdate.weight_kg = body_weight_kg;
    if (body_fat_percent != null) clientUpdate.bf_percent = body_fat_percent;
    if (body_weight_kg != null && body_fat_percent != null) {
      clientUpdate.lean_body_mass = parseFloat((body_weight_kg * (1 - body_fat_percent / 100)).toFixed(2));
    }
    await supabase.from('clients').update(clientUpdate).eq('id', workout.client_id);
  }

  // Create the same workout for all linked clients (worked out with)
  if (groupId && linkedClientIds.length > 0) {
    for (const clientId of linkedClientIds) {
      const { data: linkedWorkout } = await supabase
        .from('workouts')
        .insert({ ...workout, client_id: clientId, workout_group_id: groupId })
        .select('id')
        .single();
      if (linkedWorkout && sets.length > 0) {
        await insertSetsOrdered(sets, linkedWorkout.id);
      }
    }
  }

  return { workoutId: newWorkout.id, error: null };
}
