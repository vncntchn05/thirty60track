/**
 * Anthropic trend-summary utility.
 *
 * The Anthropic API does not allow direct browser calls (CORS), so generation
 * is delegated to the `generate-trend` Supabase Edge Function which runs
 * server-side and holds the ANTHROPIC_API_KEY secret.
 *
 * Deploy the function once:
 *   supabase functions deploy generate-trend
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *
 * The EXPO_PUBLIC_ANTHROPIC_API_KEY env var is no longer used by the client.
 * Keep ANTHROPIC_API_KEY only in the Supabase secrets dashboard and in
 * .env.local for Jest (where the Edge Function is mocked).
 */

import { supabase } from '@/lib/supabase';
import type { TrendItem, TrendSummary } from '@/types';

// ─── Types ────────────────────────────────────────────────────

type TrendPayload = {
  headline: string;
  trends: TrendItem[];
  tip_of_day: string;
  sources_note: string;
};

// ─── Parsing (kept for unit tests) ───────────────────────────

/** Strips markdown fences and extracts the JSON object from a text blob. */
export function parseJsonFromText(text: string): TrendPayload {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced
    ? fenced[1]
    : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(raw.trim()) as TrendPayload;
}

/**
 * Exposed so tests can spy/stub without fighting Babel's EXPO_PUBLIC_ inlining.
 * In production this always returns '' — the key lives in the Edge Function.
 */
export function getApiKey(): string {
  return process.env['ANTHROPIC_API_KEY'] ?? '';
}

// ─── Edge Function call ───────────────────────────────────────

/**
 * Calls the `generate-trend` Edge Function and returns a structured payload.
 * Does NOT write to the DB — the caller is responsible for caching.
 */
export async function generateTrendSummary(date: string): Promise<{
  summary: Omit<TrendSummary, 'id' | 'created_at'> | null;
  error: string | null;
}> {
  // In Jest, getApiKey() is spied on; a non-empty value means we're in a test
  // environment that stubs supabase.functions.invoke separately — proceed normally.
  // In the real app the key is empty on the client (it lives in the Edge Function).

  try {
    const { data, error } = await supabase.functions.invoke('generate-trend', {
      body: { date },
    });

    if (error) return { summary: null, error: error.message };

    const payload = data as TrendPayload & { date?: string };
    return {
      summary: {
        date,
        headline: payload.headline,
        trends: payload.trends,
        tip_of_day: payload.tip_of_day,
        sources_note: payload.sources_note,
      },
      error: null,
    };
  } catch (err) {
    return { summary: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Cache-or-generate ────────────────────────────────────────

/**
 * Returns today's trend summary from Supabase cache, or invokes the Edge
 * Function to generate and cache a new one.
 */
export async function fetchOrGenerateTrend(date: string): Promise<{
  summary: TrendSummary | null;
  error: string | null;
}> {
  // 1. Cache hit
  const { data: cached } = await supabase
    .from('trend_summaries')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  if (cached) {
    return {
      summary: { ...cached, trends: cached.trends as TrendItem[] } as TrendSummary,
      error: null,
    };
  }

  // 2. Generate via Edge Function
  const { summary: generated, error: genErr } = await generateTrendSummary(date);
  if (genErr || !generated) return { summary: null, error: genErr ?? 'Generation failed' };

  // 3. Persist — UNIQUE(date) handles race conditions
  const { data: saved, error: insertErr } = await supabase
    .from('trend_summaries')
    .insert(generated)
    .select()
    .single();

  if (insertErr) {
    // Likely a duplicate insert — try re-fetching the row that won the race
    const { data: refetched } = await supabase
      .from('trend_summaries')
      .select('*')
      .eq('date', date)
      .maybeSingle();
    if (refetched) {
      return {
        summary: { ...refetched, trends: refetched.trends as TrendItem[] } as TrendSummary,
        error: null,
      };
    }
    return {
      summary: { ...generated, id: 'local', created_at: new Date().toISOString() } as TrendSummary,
      error: null,
    };
  }

  return {
    summary: { ...saved, trends: saved.trends as TrendItem[] } as TrendSummary,
    error: null,
  };
}
