import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PersonalRecord, PersonalRecordWithExercise, NewPR } from '@/types';

// ─── Read hook ────────────────────────────────────────────────

type UsePersonalRecordsResult = {
  records: PersonalRecordWithExercise[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function usePersonalRecords(clientId: string): UsePersonalRecordsResult {
  const [records, setRecords] = useState<PersonalRecordWithExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('personal_records')
      .select(`
        id, client_id, exercise_id,
        max_weight_kg, max_reps,
        max_weight_achieved_at, max_reps_achieved_at,
        created_at, updated_at,
        exercise:exercises ( name, muscle_group, category )
      `)
      .eq('client_id', clientId)
      .not('exercise', 'is', null)
      .order('exercise(name)', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setRecords((data ?? []) as unknown as PersonalRecordWithExercise[]);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { records, loading, error, refetch: fetch };
}

// ─── PR check + upsert (called after a workout is saved) ─────

type SetInput = {
  exercise_id: string;
  exercise_name: string;
  reps: number | null;
  weight_kg: number | null;
};

/**
 * After logging a workout, call this to compare the new sets against existing
 * personal records.  Updates the DB for every PR that was broken and returns
 * a `NewPR[]` array describing each one so the UI can show a congratulations
 * popup.  Uses the display unit preference passed in (lbs / kg) for `NewPR`.
 */
export async function checkAndSavePRs(
  clientId: string,
  workoutDate: string,
  sets: SetInput[],
  displayUnit: 'lbs' | 'kg' = 'lbs',
): Promise<NewPR[]> {
  if (!clientId || sets.length === 0) return [];

  // Aggregate best weight + best reps per exercise in this workout
  const bestByExercise = new Map<string, {
    name: string;
    bestWeightKg: number | null;
    bestReps: number | null;
  }>();

  for (const s of sets) {
    const prev = bestByExercise.get(s.exercise_id) ?? {
      name: s.exercise_name,
      bestWeightKg: null,
      bestReps: null,
    };
    if (s.weight_kg != null && (prev.bestWeightKg == null || s.weight_kg > prev.bestWeightKg)) {
      prev.bestWeightKg = s.weight_kg;
    }
    if (s.reps != null && (prev.bestReps == null || s.reps > prev.bestReps)) {
      prev.bestReps = s.reps;
    }
    bestByExercise.set(s.exercise_id, prev);
  }

  const exerciseIds = Array.from(bestByExercise.keys());

  // Fetch existing PRs for these exercises
  const { data: existingRows, error: fetchErr } = await supabase
    .from('personal_records')
    .select('id, exercise_id, max_weight_kg, max_reps')
    .eq('client_id', clientId)
    .in('exercise_id', exerciseIds);

  if (fetchErr) return []; // fail silently — don't block navigation

  const existingMap = new Map<string, PersonalRecord>(
    (existingRows ?? []).map((r) => [r.exercise_id, r as PersonalRecord])
  );

  const newPRs: NewPR[] = [];
  const upserts: {
    client_id: string;
    exercise_id: string;
    max_weight_kg?: number | null;
    max_reps?: number | null;
    max_weight_achieved_at?: string | null;
    max_reps_achieved_at?: string | null;
    updated_at: string;
  }[] = [];

  for (const [exId, best] of bestByExercise) {
    const existing = existingMap.get(exId);
    const updatedAt = new Date().toISOString();

    let newWeightKg: number | null = existing?.max_weight_kg ?? null;
    let newWeightDate: string | null = existing?.max_weight_achieved_at ?? null;
    let newMaxReps: number | null = existing?.max_reps ?? null;
    let newRepsDate: string | null = existing?.max_reps_achieved_at ?? null;
    let hasPR = false;

    // Check weight PR
    if (best.bestWeightKg != null) {
      const prevKg = existing?.max_weight_kg ?? null;
      if (prevKg == null || best.bestWeightKg > prevKg) {
        const displayVal = displayUnit === 'lbs'
          ? Math.round(best.bestWeightKg * 2.20462 * 10) / 10
          : Math.round(best.bestWeightKg * 10) / 10;
        const prevDisplay = prevKg == null ? null
          : displayUnit === 'lbs'
            ? Math.round(prevKg * 2.20462 * 10) / 10
            : Math.round(prevKg * 10) / 10;

        newPRs.push({
          exerciseName: best.name,
          type: 'weight',
          value: displayVal,
          unit: displayUnit,
          previous: prevDisplay,
        });
        newWeightKg = best.bestWeightKg;
        newWeightDate = workoutDate;
        hasPR = true;
      }
    }

    // Check reps PR (only for bodyweight / no-weight sets or alongside weight)
    if (best.bestReps != null) {
      const prevReps = existing?.max_reps ?? null;
      if (prevReps == null || best.bestReps > prevReps) {
        newPRs.push({
          exerciseName: best.name,
          type: 'reps',
          value: best.bestReps,
          unit: 'reps',
          previous: prevReps,
        });
        newMaxReps = best.bestReps;
        newRepsDate = workoutDate;
        hasPR = true;
      }
    }

    if (hasPR) {
      upserts.push({
        client_id: clientId,
        exercise_id: exId,
        max_weight_kg: newWeightKg,
        max_reps: newMaxReps,
        max_weight_achieved_at: newWeightDate,
        max_reps_achieved_at: newRepsDate,
        updated_at: updatedAt,
      });
    }
  }

  if (upserts.length > 0) {
    // upsert: if (client_id, exercise_id) already exists, update; else insert
    await supabase
      .from('personal_records')
      .upsert(upserts, { onConflict: 'client_id,exercise_id' });
    // ignore error — PR popup still shows based on in-memory comparison
  }

  return newPRs;
}
