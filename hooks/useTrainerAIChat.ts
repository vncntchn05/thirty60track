import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TrainerAIMessage } from '@/types';

type UseTrainerAIChatResult = {
  messages: TrainerAIMessage[];
  loading: boolean;
  error: string | null;
  addMessage: (role: 'user' | 'assistant', content: string) => Promise<{ error: string | null }>;
  clearHistory: () => Promise<{ error: string | null }>;
  refetch: () => void;
};

export function useTrainerAIChat(trainerId: string): UseTrainerAIChatResult {
  const [messages, setMessages] = useState<TrainerAIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!trainerId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('trainer_ai_messages')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (err) setError(err.message);
    else setMessages((data ?? []) as TrainerAIMessage[]);
    setLoading(false);
  }, [trainerId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!trainerId) return { error: 'No trainer ID' };
    const { data, error: err } = await supabase
      .from('trainer_ai_messages')
      .insert({ trainer_id: trainerId, role, content })
      .select()
      .single();
    if (err) return { error: err.message };
    setMessages((prev) => [...prev, data as TrainerAIMessage]);
    return { error: null };
  }, [trainerId]);

  const clearHistory = useCallback(async () => {
    if (!trainerId) return { error: 'No trainer ID' };
    const { error: err } = await supabase
      .from('trainer_ai_messages')
      .delete()
      .eq('trainer_id', trainerId);
    if (err) return { error: err.message };
    setMessages([]);
    return { error: null };
  }, [trainerId]);

  return { messages, loading, error, addMessage, clearHistory, refetch: fetch };
}
