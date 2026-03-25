import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise, ExerciseCategory, EquipmentType, UpdateExercise } from '@/types';

const EXERCISE_FIELDS = 'id, name, muscle_group, category, equipment, form_notes, help_url, created_at';

/** Load the shared exercise library and expose a mutation to add new entries. */
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('exercises')
      .select(EXERCISE_FIELDS)
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
    equipment: EquipmentType | null;
    form_notes: string | null;
    help_url: string | null;
  }): Promise<{ exercise: Exercise | null; error: string | null }> {
    const { data, error: err } = await supabase
      .from('exercises')
      .insert(payload)
      .select(EXERCISE_FIELDS)
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

// ─── Single-exercise hook ──────────────────────────────────────

export function useExercise(id: string) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('exercises')
      .select(EXERCISE_FIELDS)
      .eq('id', id)
      .single();
    if (err) setError(err.message);
    else setExercise(data as Exercise);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateExercise(payload: UpdateExercise) {
    const { error: err } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', id);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  return { exercise, loading, error, updateExercise };
}
