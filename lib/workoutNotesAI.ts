/**
 * Workout notes parser — converts free-form text into structured exercise blocks.
 *
 * When WORKOUT_NOTES_AI_ENABLED is false (default), a regex-based mock parser
 * handles the most common shorthand formats so the feature is usable before
 * the Edge Function is deployed.
 *
 * To enable the real AI:
 *   1. Deploy the function:  supabase functions deploy parse-workout-notes
 *   2. Ensure ANTHROPIC_API_KEY is set in Supabase secrets
 *   3. Set WORKOUT_NOTES_AI_ENABLED = true below
 */

import { supabase } from '@/lib/supabase';

export const WORKOUT_NOTES_AI_ENABLED = false;

export type ParsedSet = {
  reps: number | null;
  amount: string;
  unit: 'lbs' | 'kg' | 'secs';
  notes: string;
};

export type ParsedExercise = {
  exercise_name: string;
  sets: ParsedSet[];
};

// ─── Mock parser ──────────────────────────────────────────────────────────────
// Handles common shorthand on a per-line basis:
//   "Bench Press 3x8 @ 185lbs"
//   "Squat 4 sets of 5 reps 225kg"
//   "Plank 3x60sec"
//   "Deadlift 315 x 1"

function resolveUnit(raw: string): 'lbs' | 'kg' | 'secs' {
  const s = raw.toLowerCase();
  if (s.startsWith('kg')) return 'kg';
  if (s.startsWith('sec') || s === 's') return 'secs';
  return 'lbs';
}

function mockParse(text: string): ParsedExercise[] {
  const lines = text.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedExercise[] = [];

  for (const line of lines) {
    // Patterns:
    //  "Name NxM [@ amount[unit]]"    e.g. "Bench Press 3x8 @ 185lbs"
    //  "Name N sets of M reps [@ amount[unit]]"
    //  "Name amount x N"              e.g. "Deadlift 315 x 1"
    const m =
      line.match(
        /^(.+?)\s+(?:(\d+)\s*[×x]\s*(\d+)|(\d+)\s+sets?\s+(?:of\s+)?(\d+)\s+reps?)(?:\s*@?\s*([\d.]+)\s*(lbs?|kgs?|kg|lb|secs?|min(?:utes?)?|s\b))?/i,
      ) ??
      line.match(
        /^(.+?)\s+([\d.]+)\s*(?:lbs?|kgs?|kg|lb)?\s*[×x]\s*(\d+)/i,
      );

    if (!m) continue;

    // First pattern (NxM)
    if (m[2] != null) {
      const setCount = parseInt(m[2], 10);
      const reps = parseInt(m[3], 10);
      const rawUnit = (m[7] ?? '').trim();
      const unit = rawUnit.toLowerCase().startsWith('min')
        ? 'secs'
        : resolveUnit(rawUnit);
      const amount = rawUnit.toLowerCase().startsWith('min') && m[6]
        ? String(Math.round(parseFloat(m[6]) * 60))
        : (m[6] ?? '');

      results.push({
        exercise_name: m[1].trim(),
        sets: Array.from({ length: setCount }, () => ({ reps, amount, unit, notes: '' })),
      });
    }
    // "N sets of M reps"
    else if (m[4] != null) {
      const setCount = parseInt(m[4], 10);
      const reps = parseInt(m[5], 10);
      const rawUnit = (m[7] ?? '').trim();
      const unit = resolveUnit(rawUnit);
      const amount = m[6] ?? '';

      results.push({
        exercise_name: m[1].trim(),
        sets: Array.from({ length: setCount }, () => ({ reps, amount, unit, notes: '' })),
      });
    }
    // "weight x reps" pattern
    else if (m[2] == null && m[3] != null) {
      const reps = parseInt(m[3], 10);
      const amount = m[2] ?? '';
      results.push({
        exercise_name: m[1].trim(),
        sets: [{ reps, amount, unit: 'lbs', notes: '' }],
      });
    }
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function parseWorkoutNotes(notes: string): Promise<{
  exercises: ParsedExercise[];
  error: string | null;
}> {
  if (!WORKOUT_NOTES_AI_ENABLED) {
    return { exercises: mockParse(notes), error: null };
  }

  try {
    const { data, error } = await supabase.functions.invoke('parse-workout-notes', {
      body: { notes },
    });

    if (error) return { exercises: [], error: error.message };

    const payload = data as { exercises?: ParsedExercise[]; error?: string };
    if (payload.error) return { exercises: [], error: payload.error };

    return { exercises: payload.exercises ?? [], error: null };
  } catch (e) {
    return { exercises: [], error: e instanceof Error ? e.message : String(e) };
  }
}
