import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  NutritionLog, NutritionGoal,
  InsertNutritionLog, UpsertNutritionGoal,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────

type UseNutritionResult = {
  logs: NutritionLog[];
  goal: NutritionGoal | null;
  trainerId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addLog: (entry: InsertNutritionLog) => Promise<{ error: string | null }>;
  deleteLog: (id: string) => Promise<{ error: string | null }>;
  saveGoal: (payload: UpsertNutritionGoal) => Promise<{ error: string | null }>;
};

const LOG_COLUMNS = 'id, client_id, trainer_id, logged_date, meal_type, food_name, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, usda_food_id, logged_by_role, logged_by_user_id, created_at';
const GOAL_COLUMNS = 'id, client_id, trainer_id, calories, protein_pct, carbs_pct, fat_pct, created_at, updated_at';

/**
 * Fetches nutrition logs for a client on a given date, plus the client's nutrition goal.
 * Works for both trainer and client roles — RLS handles access control.
 */
export function useNutrition(clientId: string, date: string): UseNutritionResult {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [goal, setGoal] = useState<NutritionGoal | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId || !date) return;
    setLoading(true);
    setError(null);

    const [logsRes, goalRes, clientRes] = await Promise.all([
      supabase
        .from('nutrition_logs')
        .select(LOG_COLUMNS)
        .eq('client_id', clientId)
        .eq('logged_date', date)
        .order('created_at', { ascending: true }),
      supabase
        .from('nutrition_goals')
        .select(GOAL_COLUMNS)
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('clients')
        .select('trainer_id')
        .eq('id', clientId)
        .single(),
    ]);

    if (logsRes.error) setError(logsRes.error.message);
    else setLogs((logsRes.data ?? []) as NutritionLog[]);

    setGoal((goalRes.data as NutritionGoal | null) ?? null);
    setTrainerId(clientRes.data?.trainer_id ?? null);
    setLoading(false);
  }, [clientId, date]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLog = useCallback(async (entry: InsertNutritionLog): Promise<{ error: string | null }> => {
    const { error: err } = await supabase.from('nutrition_logs').insert(entry);
    if (!err) await fetch();
    return { error: err?.message ?? null };
  }, [fetch]);

  const deleteLog = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const { error: err } = await supabase.from('nutrition_logs').delete().eq('id', id);
    if (!err) setLogs((prev) => prev.filter((l) => l.id !== id));
    return { error: err?.message ?? null };
  }, []);

  const saveGoal = useCallback(async (payload: UpsertNutritionGoal): Promise<{ error: string | null }> => {
    const { error: err } = await supabase
      .from('nutrition_goals')
      .upsert(payload, { onConflict: 'client_id' });
    if (!err) await fetch();
    return { error: err?.message ?? null };
  }, [fetch]);

  return { logs, goal, trainerId, loading, error, refetch: fetch, addLog, deleteLog, saveGoal };
}
