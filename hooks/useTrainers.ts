import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Trainer } from '@/types';

type UseTrainersResult = {
  trainers: Trainer[];
  loading: boolean;
  error: string | null;
};

/** Fetches all trainers except the currently signed-in trainer. */
export function useTrainers(): UseTrainersResult {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('trainers')
      .select('id, full_name, email, avatar_url, created_at')
      .neq('id', user.id)
      .order('full_name');

    if (err) setError(err.message);
    else setTrainers(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { trainers, loading, error };
}
