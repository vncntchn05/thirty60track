import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/types';

/** Load the shared exercise library. Results are stable so no refetch is exposed. */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('exercises')
      .select('id, name, muscle_group, category, created_at')
      .order('name')
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setExercises(data ?? []);
        setLoading(false);
      });
  }, []);

  return { exercises, loading, error };
}
