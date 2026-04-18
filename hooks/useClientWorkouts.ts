import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutWithTrainer } from '@/types';

type UseClientWorkoutsResult = {
  workouts: WorkoutWithTrainer[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/** Returns workouts for a specific client, newest first.
 *  Includes logged_by_role and logged_by_user_id on each workout. */
export function useClientWorkouts(clientId: string): UseClientWorkoutsResult {
  const [workouts, setWorkouts] = useState<WorkoutWithTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('workouts')
      .select(
        'id, client_id, trainer_id, performed_at, notes, body_weight_kg, body_fat_percent, workout_group_id, logged_by_role, logged_by_user_id, created_at, updated_at, trainer:trainers(full_name)'
      )
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false });

    if (err) setError(err.message);
    else setWorkouts((data ?? []) as unknown as WorkoutWithTrainer[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { workouts, loading, error, refresh: fetch };
}
