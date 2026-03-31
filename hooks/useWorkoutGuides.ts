import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkoutGuideEntry } from '@/types';

export function useWorkoutGuides() {
  const [entries, setEntries] = useState<WorkoutGuideEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('workout_guides').select('*');
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function getEntry(topic: string, sectionKey: string): WorkoutGuideEntry | null {
    return entries.find((e) => e.topic === topic && e.section_key === sectionKey) ?? null;
  }

  async function upsertEntry(
    topic: string,
    sectionKey: string,
    content: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from('workout_guides').upsert(
      { topic, section_key: sectionKey, content, updated_at: new Date().toISOString() },
      { onConflict: 'topic,section_key' },
    );
    if (error) return { error: error.message };
    await load();
    return { error: null };
  }

  return { entries, loading, getEntry, upsertEntry };
}
