import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

type DbRow = {
  id: string;
  name: string;
  exercise_names: string[];
  created_at: string;
  updated_at: string;
};

function toTemplate(row: DbRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    exerciseNames: row.exercise_names,
  };
}

type TemplatePayload = {
  name: string;
  exerciseNames: string[];
};

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('workout_templates')
      .select('*')
      .order('name');
    if (err) setError(err.message);
    else setTemplates((data ?? []).map((r) => toTemplate(r as DbRow)));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  async function createTemplate(payload: TemplatePayload): Promise<{ error: string | null }> {
    const { data, error: err } = await supabase
      .from('workout_templates')
      .insert({
        name: payload.name,
        exercise_names: payload.exerciseNames,
      })
      .select()
      .single();
    if (!err && data) {
      setTemplates((prev) =>
        [...prev, toTemplate(data as DbRow)].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
    return { error: err?.message ?? null };
  }

  async function updateTemplate(id: string, payload: TemplatePayload): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('workout_templates')
      .update({
        name: payload.name,
        exercise_names: payload.exerciseNames,
      })
      .eq('id', id);
    if (!err) await refetch();
    return { error: err?.message ?? null };
  }

  async function deleteTemplate(id: string): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id);
    if (!err) await refetch();
    return { error: err?.message ?? null };
  }

  return { templates, loading, error, refetch, createTemplate, updateTemplate, deleteTemplate };
}
