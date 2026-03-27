import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MuscleGroupEntry, UpsertMuscleGroupEntry } from '@/types';

export function useEncyclopedia() {
  const [entries, setEntries] = useState<MuscleGroupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('muscle_group_encyclopedia')
      .select('*');
    if (err) setError(err.message);
    else setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upsertEntry(muscleGroup: string, updates: UpsertMuscleGroupEntry): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('muscle_group_encyclopedia')
      .upsert({ muscle_group: muscleGroup, ...updates, updated_at: new Date().toISOString() });
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }

  function getEntry(muscleGroup: string): MuscleGroupEntry | null {
    return entries.find((e) => e.muscle_group === muscleGroup) ?? null;
  }

  return { entries, loading, error, upsertEntry, getEntry };
}
