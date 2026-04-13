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

// ─── Alternatives hook ─────────────────────────────────────────

export function useExerciseAlternatives(exerciseId: string | null | undefined) {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exerciseId) { setAlternatives([]); return; }
    setLoading(true);
    supabase
      .from('exercise_alternatives')
      .select(`alternative:exercises!exercise_alternatives_alternative_id_fkey(${EXERCISE_FIELDS})`)
      .eq('exercise_id', exerciseId)
      .then(({ data, error: err }) => {
        if (!err && data) {
          setAlternatives(
            (data as unknown as { alternative: Exercise }[])
              .map((row) => row.alternative)
              .filter(Boolean)
          );
        }
        setLoading(false);
      });
  }, [exerciseId]);

  async function addAlternative(alternativeId: string): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('exercise_alternatives')
      .insert([
        { exercise_id: exerciseId, alternative_id: alternativeId },
        { exercise_id: alternativeId, alternative_id: exerciseId },
      ]);
    if (!err) {
      // re-fetch
      const { data } = await supabase
        .from('exercise_alternatives')
        .select(`alternative:exercises!exercise_alternatives_alternative_id_fkey(${EXERCISE_FIELDS})`)
        .eq('exercise_id', exerciseId!);
      if (data) {
        setAlternatives(
          (data as unknown as { alternative: Exercise }[])
            .map((row) => row.alternative)
            .filter(Boolean)
        );
      }
    }
    return { error: err?.message ?? null };
  }

  async function removeAlternative(alternativeId: string): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('exercise_alternatives')
      .delete()
      .or(
        `and(exercise_id.eq.${exerciseId},alternative_id.eq.${alternativeId}),and(exercise_id.eq.${alternativeId},alternative_id.eq.${exerciseId})`
      );
    if (!err) {
      setAlternatives((prev) => prev.filter((e) => e.id !== alternativeId));
    }
    return { error: err?.message ?? null };
  }

  return { alternatives, loading, addAlternative, removeAlternative };
}
