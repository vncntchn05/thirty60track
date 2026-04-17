/**
 * Integration tests for recurring workout plans (migration 028).
 *
 * Requires live Supabase project credentials.
 * Tests: create recurring plan → occurrences generated → cancel single
 *        instance → cancel entire series → delete plan.
 *
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// useRecurringPlans imports the supabase singleton at module level; mock it so
// the module can be loaded even when env vars are absent (CI without .env.local).
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { onAuthStateChange: jest.fn() } },
}));

import { generateOccurrenceDates } from '@/hooks/useRecurringPlans';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Fixed dates: 2025-01-06 (Monday) to 2025-01-20 (Monday) — 3 Mondays
const START_DATE = '2026-04-20'; // Monday
const END_DATE   = '2026-05-04'; // Monday (+2 weeks) → 3 Mondays total

maybeDescribe('Recurring Workouts integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;

  const createdPlanIds: string[] = [];
  const createdWorkoutIds: string[] = [];

  beforeAll(async () => {
    sb = buildClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error) throw error;
    trainerId = data.user!.id;
  });

  afterAll(async () => {
    // Clean up assigned_workouts first (FK), then recurring_plans
    if (createdWorkoutIds.length > 0) {
      await sb.from('assigned_workouts').delete().in('id', createdWorkoutIds);
    }
    if (createdPlanIds.length > 0) {
      await sb.from('recurring_plans').delete().in('id', createdPlanIds);
    }
    await sb.auth.signOut();
  });

  // ─── Pure function ─────────────────────────────────────────────────────────

  it('generateOccurrenceDates returns 3 Mondays for weekly between Jan 6 and Jan 20', () => {
    const dates = generateOccurrenceDates(START_DATE, END_DATE, [1], 'weekly');
    expect(dates).toEqual(['2026-04-20', '2026-04-27', '2026-05-04']);
  });

  it('generateOccurrenceDates biweekly returns 2 dates (Jan 6, Jan 20)', () => {
    const dates = generateOccurrenceDates(START_DATE, END_DATE, [1], 'biweekly');
    expect(dates).toEqual(['2026-04-20', '2026-05-04']);
  });

  // ─── DB: create recurring plan ─────────────────────────────────────────────

  it('creates a recurring_plans row and 3 assigned_workout instances', async () => {
    const { data: plan, error: planErr } = await sb
      .from('recurring_plans')
      .insert({
        client_id: CLIENT_ID,
        trainer_id: trainerId,
        title: 'Test Recurring Push',
        days_of_week: [1],
        frequency: 'weekly',
        start_date: START_DATE,
        end_date: END_DATE,
        notes: null,
      })
      .select('id')
      .single();

    expect(planErr).toBeNull();
    expect(plan?.id).toBeTruthy();
    createdPlanIds.push(plan!.id);

    // Insert assigned workout instances manually (simulating createRecurringPlan)
    const dates = generateOccurrenceDates(START_DATE, END_DATE, [1], 'weekly');
    expect(dates).toHaveLength(3);

    for (const date of dates) {
      const { data: aw, error: awErr } = await sb
        .from('assigned_workouts')
        .insert({
          client_id: CLIENT_ID,
          trainer_id: trainerId,
          title: 'Test Recurring Push',
          scheduled_date: date,
          status: 'assigned',
          recurring_plan_id: plan!.id,
          notes: null,
        })
        .select('id')
        .single();

      expect(awErr).toBeNull();
      createdWorkoutIds.push(aw!.id);
    }

    // Verify: 3 assigned_workouts linked to the plan
    const { data: instances } = await sb
      .from('assigned_workouts')
      .select('id, scheduled_date, status')
      .eq('recurring_plan_id', plan!.id)
      .order('scheduled_date', { ascending: true });

    expect(instances).toHaveLength(3);
    expect(instances![0].scheduled_date).toBe('2026-04-20');
    expect(instances![2].scheduled_date).toBe('2026-05-04');
    instances!.forEach((i) => expect(i.status).toBe('assigned'));
  });

  // ─── Cancel single instance ────────────────────────────────────────────────

  it('cancelling a single instance does not affect others', async () => {
    // Cancel the first workout in the series
    const firstId = createdWorkoutIds[0];
    const { error } = await sb
      .from('assigned_workouts')
      .update({ status: 'cancelled' })
      .eq('id', firstId);

    expect(error).toBeNull();

    // First is cancelled; other two still 'assigned'
    const { data: instances } = await sb
      .from('assigned_workouts')
      .select('id, status')
      .in('id', createdWorkoutIds);

    const statuses = Object.fromEntries((instances ?? []).map((i) => [i.id, i.status]));
    expect(statuses[firstId]).toBe('cancelled');
    expect(statuses[createdWorkoutIds[1]]).toBe('assigned');
    expect(statuses[createdWorkoutIds[2]]).toBe('assigned');
  });

  // ─── Cancel full series ────────────────────────────────────────────────────

  it('cancelling the full series updates all assigned instances', async () => {
    const planId = createdPlanIds[0];
    const today = new Date().toISOString().split('T')[0];

    await sb
      .from('assigned_workouts')
      .update({ status: 'cancelled' })
      .eq('recurring_plan_id', planId)
      .eq('status', 'assigned')
      .gte('scheduled_date', today);

    const { data: instances } = await sb
      .from('assigned_workouts')
      .select('id, status')
      .eq('recurring_plan_id', planId);

    // All future instances should be cancelled (test dates are in the past, so all qualify)
    instances?.filter((_i) => true)
      .forEach((i) => expect(i.status).toBe('cancelled'));
  });

  // ─── Delete plan (ON DELETE SET NULL) ─────────────────────────────────────

  it('deleting the plan sets recurring_plan_id to NULL on instances (ON DELETE SET NULL)', async () => {
    const planId = createdPlanIds[0];
    const workoutId = createdWorkoutIds[1];

    const { error } = await sb
      .from('recurring_plans')
      .delete()
      .eq('id', planId);

    expect(error).toBeNull();

    // The plan is deleted; the workout instances should still exist with recurring_plan_id = NULL
    const { data: instance } = await sb
      .from('assigned_workouts')
      .select('id, recurring_plan_id')
      .eq('id', workoutId)
      .single();

    expect(instance?.recurring_plan_id).toBeNull();

    // Remove plan from cleanup list since it's been deleted
    createdPlanIds.splice(0, 1);
  });
});
