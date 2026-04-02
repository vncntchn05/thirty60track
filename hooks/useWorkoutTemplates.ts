import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

type DbRow = {
  id: string;
  name: string;
  exercise_names: string[];
  split: string | null;
  subgroup: string | null;
  created_at: string;
  updated_at: string;
};

function toTemplate(row: DbRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    exerciseNames: row.exercise_names,
    split: row.split ?? undefined,
    subgroup: row.subgroup ?? undefined,
  };
}

export type TemplatePayload = {
  name: string;
  exerciseNames: string[];
  split?: string;
  subgroup?: string;
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
      .order('split', { nullsFirst: false })
      .order('subgroup', { nullsFirst: false })
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
        split: payload.split || null,
        subgroup: payload.subgroup || null,
      })
      .select()
      .single();
    if (!err && data) {
      setTemplates((prev) =>
        [...prev, toTemplate(data as DbRow)].sort((a, b) => {
          const s = (a.split ?? '').localeCompare(b.split ?? '');
          if (s !== 0) return s;
          const g = (a.subgroup ?? '').localeCompare(b.subgroup ?? '');
          return g !== 0 ? g : a.name.localeCompare(b.name);
        }),
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
        split: payload.split || null,
        subgroup: payload.subgroup || null,
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
