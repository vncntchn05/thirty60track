import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MealPlan, MealPlanData } from '@/types';

type UseMealPlanResult = {
  plan: MealPlan | null;
  allPlans: MealPlan[];
  loading: boolean;
  error: string | null;
  savePlan: (
    trainerId: string,
    title: string,
    planType: 'daily' | 'weekly',
    data: MealPlanData,
  ) => Promise<{ error: string | null }>;
  deactivatePlan: (planId: string) => Promise<{ error: string | null }>;
  refetch: () => void;
};

export function useMealPlan(clientId: string): UseMealPlanResult {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [allPlans, setAllPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const plans = (data ?? []).map((row) => ({ ...row, data: row.data as MealPlanData }));
    setAllPlans(plans);
    setPlan(plans.find((p) => p.is_active) ?? null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const savePlan = useCallback(async (
    trainerId: string,
    title: string,
    planType: 'daily' | 'weekly',
    data: MealPlanData,
  ) => {
    if (!clientId) return { error: 'No client ID' };

    // Deactivate existing active plans first
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('is_active', true);

    const { data: saved, error: err } = await supabase
      .from('meal_plans')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        title,
        plan_type: planType,
        data,
        is_active: true,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (err) return { error: err.message };
    const newPlan = { ...saved, data: saved.data as MealPlanData };
    setPlan(newPlan);
    setAllPlans((prev) => [newPlan, ...prev.map((p) => ({ ...p, is_active: false }))]);
    return { error: null };
  }, [clientId]);

  const deactivatePlan = useCallback(async (planId: string) => {
    const { error: err } = await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('id', planId);
    if (err) return { error: err.message };
    setAllPlans((prev) => prev.map((p) => p.id === planId ? { ...p, is_active: false } : p));
    if (plan?.id === planId) setPlan(null);
    return { error: null };
  }, [plan]);

  return { plan, allPlans, loading, error, savePlan, deactivatePlan, refetch: fetch };
}
