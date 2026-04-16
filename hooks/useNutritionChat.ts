import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { NutritionChatMessage, ClientNutritionSettings } from '@/types';

// ─── Chat messages ────────────────────────────────────────────

type UseNutritionChatResult = {
  messages: NutritionChatMessage[];
  loading: boolean;
  error: string | null;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<{ error: string | null }>;
  clearHistory: () => Promise<{ error: string | null }>;
  refetch: () => void;
};

export function useNutritionChat(clientId: string): UseNutritionChatResult {
  const [messages, setMessages] = useState<NutritionChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('nutrition_chat_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (err) setError(err.message);
    else setMessages((data ?? []) as NutritionChatMessage[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!clientId) return { error: 'No client ID' };
    const { data, error: err } = await supabase
      .from('nutrition_chat_messages')
      .insert({ client_id: clientId, role, content })
      .select()
      .single();
    if (err) return { error: err.message };
    setMessages((prev) => [...prev, data as NutritionChatMessage]);
    return { error: null };
  }, [clientId]);

  const clearHistory = useCallback(async () => {
    if (!clientId) return { error: 'No client ID' };
    const { error: err } = await supabase
      .from('nutrition_chat_messages')
      .delete()
      .eq('client_id', clientId);
    if (err) return { error: err.message };
    setMessages([]);
    return { error: null };
  }, [clientId]);

  return { messages, loading, error, addMessage, clearHistory, refetch: fetch };
}

// ─── Nutrition settings (cheat meal cadence) ──────────────────

type UseNutritionSettingsResult = {
  settings: ClientNutritionSettings | null;
  loading: boolean;
  saveSettings: (
    cheatMealEveryNDays: number,
    cheatMealLastDate?: string | null,
  ) => Promise<{ error: string | null }>;
  markCheatMealUsed: () => Promise<{ error: string | null }>;
};

export function useNutritionSettings(clientId: string): UseNutritionSettingsResult {
  const [settings, setSettings] = useState<ClientNutritionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    supabase
      .from('client_nutrition_settings')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data as ClientNutritionSettings | null);
        setLoading(false);
      });
  }, [clientId]);

  const saveSettings = useCallback(async (
    cheatMealEveryNDays: number,
    cheatMealLastDate?: string | null,
  ) => {
    if (!clientId) return { error: 'No client ID' };
    const payload: Partial<ClientNutritionSettings> & { client_id: string } = {
      client_id: clientId,
      cheat_meal_every_n_days: cheatMealEveryNDays,
      updated_at: new Date().toISOString(),
    };
    if (cheatMealLastDate !== undefined) payload.cheat_meal_last_date = cheatMealLastDate;

    const { data, error: err } = await supabase
      .from('client_nutrition_settings')
      .upsert(payload, { onConflict: 'client_id' })
      .select()
      .single();
    if (err) return { error: err.message };
    setSettings(data as ClientNutritionSettings);
    return { error: null };
  }, [clientId]);

  const markCheatMealUsed = useCallback(async () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return saveSettings(settings?.cheat_meal_every_n_days ?? 4, iso);
  }, [settings, saveSettings]);

  return { settings, loading, saveSettings, markCheatMealUsed };
}
