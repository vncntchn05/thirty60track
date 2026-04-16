import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { NutritionGuide, NutritionGuideContent } from '@/types';

type UseNutritionGuideResult = {
  guide: NutritionGuide | null;
  loading: boolean;
  error: string | null;
  saveGuide: (
    content: NutritionGuideContent,
    trainerId: string,
    isCustom?: boolean,
  ) => Promise<{ error: string | null }>;
  refetch: () => void;
};

export function useNutritionGuide(clientId: string): UseNutritionGuideResult {
  const [guide, setGuide] = useState<NutritionGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('nutrition_guides')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    if (err) setError(err.message);
    else setGuide(data ? { ...data, content: data.content as NutritionGuideContent } : null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveGuide = useCallback(async (
    content: NutritionGuideContent,
    trainerId: string,
    isCustom = false,
  ) => {
    if (!clientId) return { error: 'No client ID' };
    const payload = {
      client_id: clientId,
      trainer_id: trainerId,
      content,
      is_custom: isCustom,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data, error: err } = await supabase
      .from('nutrition_guides')
      .upsert(payload, { onConflict: 'client_id' })
      .select()
      .single();
    if (err) return { error: err.message };
    setGuide({ ...data, content: data.content as NutritionGuideContent });
    return { error: null };
  }, [clientId]);

  return { guide, loading, error, saveGuide, refetch: fetch };
}
