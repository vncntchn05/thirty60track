import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, ExerciseCategory } from '@/types';

/** Load the shared exercise library and expose a mutation to add new entries. */
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

  async function createExercise(payload: {
    name: string;
    muscle_group: string | null;
    category: ExerciseCategory;
  }): Promise<{ exercise: Exercise | null; error: string | null }> {
    const { data, error: err } = await supabase
      .from('exercises')
      .insert(payload)
      .select('id, name, muscle_group, category, created_at')
      .single();
    if (!err && data) {
      setExercises((prev) =>
        [...prev, data as Exercise].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    return { exercise: (data as Exercise) ?? null, error: err?.message ?? null };
  }

  return { exercises, loading, error, createExercise };
}
