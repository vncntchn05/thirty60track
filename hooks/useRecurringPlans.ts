import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RecurringPlan, InsertRecurringPlan } from '@/types';

// ─── Date generation ──────────────────────────────────────────

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns all dates between startDate and endDate (inclusive) that fall on
 * one of the specified daysOfWeek and satisfy the frequency constraint.
 *
 * daysOfWeek: JS day-of-week integers, 0=Sun … 6=Sat
 * frequency:  'weekly' — every matching week
 *             'biweekly' — every other week starting from startDate's week
 */
export function generateOccurrenceDates(
  startDate: string,
  endDate: string,
  daysOfWeek: number[],
  frequency: 'weekly' | 'biweekly',
): string[] {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const MS_PER_WEEK = 7 * MS_PER_DAY;

  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end   = new Date(ey, em - 1, ed);

  // Anchor the biweekly rhythm to the Monday of the start week
  const startMonday = new Date(start);
  startMonday.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dow = current.getDay();
    if (daysOfWeek.includes(dow)) {
      if (frequency === 'weekly') {
        dates.push(toIso(current));
      } else {
        // biweekly: only include even-offset weeks from startMonday
        const currentMonday = new Date(current);
        currentMonday.setDate(current.getDate() - ((current.getDay() + 6) % 7));
        const weekOffset = Math.round(
          (currentMonday.getTime() - startMonday.getTime()) / MS_PER_WEEK,
        );
        if (weekOffset % 2 === 0) dates.push(toIso(current));
      }
    }
    current.setTime(current.getTime() + MS_PER_DAY);
  }

  return dates;
}

// ─── Hook ─────────────────────────────────────────────────────

/** List all recurring plans for a client, sorted by start_date ASC. */
export function useRecurringPlansForClient(clientId: string) {
  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setPlans([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('recurring_plans')
      .select('*')
      .eq('client_id', clientId)
      .order('start_date', { ascending: true });

    if (err) setError(err.message);
    else setPlans((data ?? []) as RecurringPlan[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { plans, loading, error, refetch: fetch };
}

// ─── Mutations ────────────────────────────────────────────────

/**
 * Creates a recurring plan and generates all assigned_workout instances.
 * Returns the plan id and any error.
 */
export async function createRecurringPlan(
  clientId: string,
  trainerId: string,
  payload: InsertRecurringPlan,
): Promise<{ planId: string | null; count: number; error: string | null }> {
  // 1. Insert the plan record
  const { data: plan, error: planErr } = await supabase
    .from('recurring_plans')
    .insert({
      client_id:    clientId,
      trainer_id:   trainerId,
      title:        payload.title,
      notes:        payload.notes ?? null,
      days_of_week: payload.days_of_week,
      frequency:    payload.frequency,
      start_date:   payload.start_date,
      end_date:     payload.end_date,
    })
    .select('id')
    .single();

  if (planErr || !plan) {
    return { planId: null, count: 0, error: planErr?.message ?? 'Failed to create plan' };
  }

  const planId = plan.id as string;

  // 2. Generate occurrence dates
  const dates = generateOccurrenceDates(
    payload.start_date,
    payload.end_date,
    payload.days_of_week,
    payload.frequency,
  );

  if (dates.length === 0) {
    return { planId, count: 0, error: null };
  }

  // 3. For each date, insert an assigned_workout + its exercises/sets
  for (const date of dates) {
    const { data: aw, error: awErr } = await supabase
      .from('assigned_workouts')
      .insert({
        client_id:         clientId,
        trainer_id:        trainerId,
        title:             payload.title,
        scheduled_date:    date,
        notes:             payload.notes ?? null,
        status:            'assigned',
        recurring_plan_id: planId,
      })
      .select('id')
      .single();

    if (awErr || !aw) {
      return { planId, count: 0, error: awErr?.message ?? 'Failed to create workout instance' };
    }

    for (const ex of payload.exercises) {
      const { data: awe, error: aweErr } = await supabase
        .from('assigned_workout_exercises')
        .insert({
          assigned_workout_id: aw.id,
          exercise_id:         ex.exercise_id,
          order_index:         ex.order_index,
          superset_group:      ex.superset_group,
        })
        .select('id')
        .single();

      if (aweErr || !awe) return { planId, count: 0, error: aweErr?.message ?? 'Failed to insert exercise' };

      if (ex.sets.length > 0) {
        const { error: setsErr } = await supabase
          .from('assigned_workout_sets')
          .insert(ex.sets.map((s) => ({ ...s, assigned_workout_exercise_id: awe.id })));
        if (setsErr) return { planId, count: 0, error: setsErr.message };
      }
    }
  }

  return { planId, count: dates.length, error: null };
}

/**
 * Cancels all future (still 'assigned') instances of a recurring plan.
 * Does NOT delete past or already-completed instances.
 */
export async function cancelRecurringPlan(
  planId: string,
): Promise<{ cancelled: number; error: string | null }> {
  const today = toIso(new Date());

  const { error, count } = await supabase
    .from('assigned_workouts')
    .update({ status: 'cancelled' })
    .eq('recurring_plan_id', planId)
    .eq('status', 'assigned')
    .gte('scheduled_date', today);

  if (error) return { cancelled: 0, error: error.message };
  return { cancelled: count ?? 0, error: null };
}

/**
 * Cancels a single recurring instance by setting its status to 'cancelled'.
 * The other instances in the series are untouched.
 */
export async function cancelRecurringInstance(
  assignedWorkoutId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('assigned_workouts')
    .update({ status: 'cancelled' })
    .eq('id', assignedWorkoutId);
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Deletes a recurring plan record. All generated instances have their
 * recurring_plan_id set to NULL (ON DELETE SET NULL) but are not removed.
 */
export async function deleteRecurringPlan(
  planId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('recurring_plans')
    .delete()
    .eq('id', planId);
  if (error) return { error: error.message };
  return { error: null };
}
