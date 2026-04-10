/**
 * Unit tests for lib/anthropic.ts
 *
 * Covers:
 *  - parseJsonFromText: strips markdown fences, extracts JSON
 *  - generateTrendSummary: delegates to Edge Function via supabase.functions.invoke
 *  - fetchOrGenerateTrend: cache hit, cache miss → generate → persist, race condition fallback
 */

import { parseJsonFromText, generateTrendSummary, fetchOrGenerateTrend } from '@/lib/anthropic';
import { supabase } from '@/lib/supabase';

// ─── Module mocks ─────────────────────────────────────────────

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const mockFrom    = supabase.from as jest.Mock;
const mockInvoke  = supabase.functions.invoke as jest.Mock;

// ─── Test data ────────────────────────────────────────────────

const VALID_PAYLOAD = {
  headline: 'Zone 2 Training Takes Centre Stage',
  trends: [
    { title: 'Zone 2 Cardio', description: 'Low-intensity steady-state training improves mitochondrial health.' },
    { title: 'Sleep Optimisation', description: 'New research links 8+ hours to better recovery metrics.' },
  ],
  tip_of_day: 'Add a 30-minute easy walk to your morning routine.',
  sources_note: 'Sources: PubMed, Healthline',
};

// ─── Helpers ──────────────────────────────────────────────────

function makeSupabaseMock(result: { data?: unknown; error?: unknown } = {}) {
  const { data = null, error = null } = result;
  const m: Record<string, jest.Mock | ((cb: (v: { data: unknown; error: unknown }) => unknown) => Promise<unknown>)> = {};
  for (const method of ['select', 'eq', 'insert', 'gte', 'order', 'limit']) {
    m[method] = jest.fn().mockReturnValue(m);
  }
  (m as Record<string, jest.Mock>)['maybeSingle'] = jest.fn().mockResolvedValue({ data, error });
  (m as Record<string, jest.Mock>)['single']      = jest.fn().mockResolvedValue({ data, error });
  m['then'] = (cb: (v: { data: unknown; error: unknown }) => unknown) =>
    Promise.resolve({ data, error }).then(cb);
  return m;
}

// ─── Setup ────────────────────────────────────────────────────

beforeEach(() => {
  jest.resetAllMocks();
});

// ─── parseJsonFromText ────────────────────────────────────────

describe('parseJsonFromText', () => {
  it('parses a plain JSON string', () => {
    const result = parseJsonFromText(JSON.stringify(VALID_PAYLOAD));
    expect(result.headline).toBe(VALID_PAYLOAD.headline);
    expect(result.trends).toHaveLength(2);
  });

  it('strips ```json ... ``` fences before parsing', () => {
    const fenced = `\`\`\`json\n${JSON.stringify(VALID_PAYLOAD)}\n\`\`\``;
    expect(parseJsonFromText(fenced).tip_of_day).toBe(VALID_PAYLOAD.tip_of_day);
  });

  it('strips bare ``` fences before parsing', () => {
    const fenced = `\`\`\`\n${JSON.stringify(VALID_PAYLOAD)}\n\`\`\``;
    expect(parseJsonFromText(fenced).sources_note).toBe(VALID_PAYLOAD.sources_note);
  });

  it('handles preamble text before the JSON object', () => {
    const withPreamble = `Here is the JSON:\n${JSON.stringify(VALID_PAYLOAD)}`;
    expect(parseJsonFromText(withPreamble).headline).toBe(VALID_PAYLOAD.headline);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonFromText('not json at all')).toThrow();
  });
});

// ─── generateTrendSummary ─────────────────────────────────────

describe('generateTrendSummary', () => {
  it('returns a structured summary when the Edge Function succeeds', async () => {
    mockInvoke.mockResolvedValue({ data: { ...VALID_PAYLOAD, date: '2025-04-10' }, error: null });

    const { summary, error } = await generateTrendSummary('2025-04-10');
    expect(error).toBeNull();
    expect(summary!.headline).toBe(VALID_PAYLOAD.headline);
    expect(summary!.trends).toHaveLength(2);
    expect(summary!.date).toBe('2025-04-10');
    expect(mockInvoke).toHaveBeenCalledWith('generate-trend', { body: { date: '2025-04-10' } });
  });

  it('returns an error when the Edge Function returns an error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Function error' } });

    const { summary, error } = await generateTrendSummary('2025-04-10');
    expect(summary).toBeNull();
    expect(error).toBe('Function error');
  });

  it('returns an error when invoke throws', async () => {
    mockInvoke.mockRejectedValue(new Error('Network failure'));

    const { summary, error } = await generateTrendSummary('2025-04-10');
    expect(summary).toBeNull();
    expect(error).toMatch(/Network failure/);
  });
});

// ─── fetchOrGenerateTrend ─────────────────────────────────────

describe('fetchOrGenerateTrend', () => {
  const CACHED = {
    id: 'cached-id',
    date: '2025-04-10',
    ...VALID_PAYLOAD,
    headline: 'Cached Headline',
    tip_of_day: 'Cached tip',
    sources_note: 'Cached sources',
    created_at: '2025-04-10T00:00:00Z',
  };

  it('returns the cached summary without calling the Edge Function', async () => {
    mockFrom.mockReturnValue(makeSupabaseMock({ data: CACHED }));

    const { summary, error } = await fetchOrGenerateTrend('2025-04-10');
    expect(error).toBeNull();
    expect(summary!.headline).toBe('Cached Headline');
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('generates and caches a new summary when the cache is empty', async () => {
    const savedRow = { ...VALID_PAYLOAD, id: 'new-id', date: '2025-04-10', created_at: '2025-04-10T00:00:00Z' };
    mockFrom
      .mockReturnValueOnce(makeSupabaseMock({ data: null }))    // cache miss
      .mockReturnValueOnce(makeSupabaseMock({ data: savedRow })); // insert success

    mockInvoke.mockResolvedValue({ data: { ...VALID_PAYLOAD, date: '2025-04-10' }, error: null });

    const { summary, error } = await fetchOrGenerateTrend('2025-04-10');
    expect(error).toBeNull();
    expect(summary!.id).toBe('new-id');
    expect(mockInvoke).toHaveBeenCalledWith('generate-trend', { body: { date: '2025-04-10' } });
  });

  it('returns generated data when the cache insert fails (race condition fallback)', async () => {
    mockFrom
      .mockReturnValueOnce(makeSupabaseMock({ data: null }))
      .mockReturnValueOnce(makeSupabaseMock({ data: null, error: { message: 'unique_violation' } }))
      .mockReturnValueOnce(makeSupabaseMock({ data: null })); // re-fetch also misses

    mockInvoke.mockResolvedValue({ data: { ...VALID_PAYLOAD, date: '2025-04-10' }, error: null });

    const { summary, error } = await fetchOrGenerateTrend('2025-04-10');
    expect(error).toBeNull();
    expect(summary!.id).toBe('local');
  });

  it('re-uses a row inserted by a concurrent request', async () => {
    const racedRow = { ...VALID_PAYLOAD, id: 'raced-id', date: '2025-04-10', created_at: '2025-04-10T00:00:00Z' };
    mockFrom
      .mockReturnValueOnce(makeSupabaseMock({ data: null }))
      .mockReturnValueOnce(makeSupabaseMock({ data: null, error: { message: 'unique_violation' } }))
      .mockReturnValueOnce(makeSupabaseMock({ data: racedRow }));

    mockInvoke.mockResolvedValue({ data: { ...VALID_PAYLOAD, date: '2025-04-10' }, error: null });

    const { summary, error } = await fetchOrGenerateTrend('2025-04-10');
    expect(error).toBeNull();
    expect(summary!.id).toBe('raced-id');
  });

  it('propagates the Edge Function error when generation fails', async () => {
    mockFrom.mockReturnValue(makeSupabaseMock({ data: null }));
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'ANTHROPIC_API_KEY not set' } });

    const { summary, error } = await fetchOrGenerateTrend('2025-04-10');
    expect(summary).toBeNull();
    expect(error).toMatch(/ANTHROPIC_API_KEY/);
  });
});
