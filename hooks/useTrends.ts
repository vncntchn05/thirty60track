import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchOrGenerateTrend } from '@/lib/anthropic';
import type { TrendItem, TrendSummary } from '@/types';

// ─── Hooks ────────────────────────────────────────────────────

/** Fetches (or generates) the trend summary for today, caching in Supabase. */
export function useTodayTrend() {
  const [summary, setSummary] = useState<TrendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const { summary: s, error: e } = await fetchOrGenerateTrend(today);
    setSummary(s);
    setError(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, error, refetch: load };
}

/** Fetches the last `days` trend summaries from the cache (read-only). */
export function useRecentTrends(days = 7) {
  const [summaries, setSummaries] = useState<TrendSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const { data, error: err } = await supabase
      .from('trend_summaries')
      .select('*')
      .gte('date', cutoff.toISOString().slice(0, 10))
      .order('date', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setSummaries(
        ((data as TrendSummary[]) ?? []).map((s) => ({
          ...s,
          trends: s.trends as TrendItem[],
        })),
      );
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return { summaries, loading, error };
}
