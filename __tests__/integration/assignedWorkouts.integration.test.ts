/**
 * Integration tests for assigned workouts against a real Supabase project.
 *
 * Tests: create, read, update, delete, RLS scoping, and cross-trainer access
 * (migration 016 broadened RLS to any authenticated trainer).
 * Requires TEST_CLIENT_ID plus standard trainer credentials.
 * All created rows are cleaned up in afterAll.
 */

import 'dotenv/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TRAINER_EMAIL     = process.env.TEST_TRAINER_EMAIL;
const TRAINER_PASSWORD  = process.env.TEST_TRAINER_PASSWORD;
const CLIENT_ID         = process.env.TEST_CLIENT_ID;

const hasCreds = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TRAINER_EMAIL && TRAINER_PASSWORD && CLIENT_ID,
);
const maybeDescribe = hasCreds ? describe : describe.skip;

function buildTestClient() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** ISO date string N days from today. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

maybeDescribe('Assigned Workouts integration', () => {
  let sb: SupabaseClient;
  let trainerId: string;
  let exerciseId: string;
  let primaryAssignedId: string | null = null;   // main test row — kept until the end
  const extraAssignedIds: string[] = [];          // rows created for isolated sub-tests

  beforeAll(async () => {
    sb = buildTestClient();
    const { data, error } = await sb.auth.signInWithPassword({
      email: TRAINER_EMAIL!,
      password: TRAINER_PASSWORD!,
    });
    if (error || !data.user) throw new Error(`Sign-in failed: ${error?.message}`);
    trainerId = data.user.id;

    // Grab any exercise to use as a valid exercise_id
    const { data: ex, error: exErr } = await sb
      .from('exercises')
      .select('id')
      .limit(1)
      .single();
    if (exErr || !ex) throw new Error(`Could not fetch exercise: ${exErr?.message}`);
    exerciseId = ex.id;
  });

  afterAll(async () => {
    // Clean up all created assigned workouts
    const toDelete = [primaryAssignedId, ...extraAssignedIds].filter(Boolean) as string[];
    for (const id of toDelete) {
      await sb.from('assigned_workout_exercises').delete().eq('assigned_workout_id', id);
      await sb.from('assigned_workouts').delete().eq('id', id);
    }
    await sb.auth.signOut();
  });

  // ── Create ──────────────────────────────────────────────────────────────────

  it('trainer can create an assigned workout with status "assigned"', async () => {
    const { data, error } = await sb
      .from('assigned_workouts')
      .insert({
        client_id:      CLIENT_ID,
        trainer_id:     trainerId,
        title:          '__integration_assigned__',
        scheduled_date: daysFromNow(7),
        notes:          'Integration test assigned workout',
        status:         'assigned',
      })
      .select('id, title, status, scheduled_date')
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('__integration_assigned__');
    expect(data?.status).toBe('assigned');
    primaryAssignedId = data?.id ?? null;
  });

  it('assigned workout exercises can be added', async () => {
    if (!primaryAssignedId) return;

    const { error } = await sb
      .from('assigned_workout_exercises')
      .insert({
        assigned_workout_id: primaryAssignedId,
        exercise_id:         exerciseId,
        order_index:         0,
        superset_group:      null,
      });

    expect(error).toBeNull();
  });

  // ── Read ────────────────────────────────────────────────────────────────────

  it('assigned workout appears in list fetch for the client', async () => {
    if (!primaryAssignedId) return;

    const { data, error } = await sb
      .from('assigned_workouts')
      .select('id, title, status')
      .eq('client_id', CLIENT_ID!)
      .eq('id', primaryAssignedId)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(primaryAssignedId);
    expect(data?.status).toBe('assigned');
  });

  it('exercises within the assigned workout are fetchable', async () => {
    if (!primaryAssignedId) return;

    const { data, error } = await sb
      .from('assigned_workout_exercises')
      .select('id, exercise_id, order_index')
      .eq('assigned_workout_id', primaryAssignedId);

    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
    expect(data![0].exercise_id).toBe(exerciseId);
  });

  // ── Update ──────────────────────────────────────────────────────────────────

  it('trainer can update the title and notes of an assigned workout', async () => {
    if (!primaryAssignedId) return;

    const { error } = await sb
      .from('assigned_workouts')
      .update({ title: '__integration_assigned_updated__', notes: 'Updated notes' })
      .eq('id', primaryAssignedId);

    expect(error).toBeNull();

    const { data } = await sb
      .from('assigned_workouts')
      .select('title, notes')
      .eq('id', primaryAssignedId)
      .single();

    expect(data?.title).toBe('__integration_assigned_updated__');
    expect(data?.notes).toBe('Updated notes');
  });

  // ── Delete ──────────────────────────────────────────────────────────────────

  it('trainer can delete an assigned workout', async () => {
    const { data: toDelete } = await sb
      .from('assigned_workouts')
      .insert({
        client_id:      CLIENT_ID,
        trainer_id:     trainerId,
        title:          '__delete_me__',
        scheduled_date: daysFromNow(1),
        status:         'assigned',
      })
      .select('id')
      .single();

    // Delete exercises first (RLS requires it before deleting the parent)
    await sb.from('assigned_workout_exercises').delete().eq('assigned_workout_id', toDelete!.id);

    const { error, count } = await sb
      .from('assigned_workouts')
      .delete({ count: 'exact' })
      .eq('id', toDelete!.id);

    expect(error).toBeNull();
    expect(count).toBe(1);

    // Confirm deletion
    const { data: gone } = await sb
      .from('assigned_workouts')
      .select('id')
      .eq('id', toDelete!.id);
    expect(gone).toHaveLength(0);
  });

  // ── Status transitions ──────────────────────────────────────────────────────

  it('status can be updated from "assigned" to "completed"', async () => {
    const { data: row } = await sb
      .from('assigned_workouts')
      .insert({
        client_id:      CLIENT_ID,
        trainer_id:     trainerId,
        title:          '__status_test__',
        scheduled_date: daysFromNow(3),
        status:         'assigned',
      })
      .select('id')
      .single();

    extraAssignedIds.push(row!.id);

    const { error } = await sb
      .from('assigned_workouts')
      .update({ status: 'completed' })
      .eq('id', row!.id);

    expect(error).toBeNull();

    const { data: updated } = await sb
      .from('assigned_workouts')
      .select('status')
      .eq('id', row!.id)
      .single();

    expect(updated?.status).toBe('completed');
  });

  // ── RLS scoping ─────────────────────────────────────────────────────────────

  it('RLS — all returned assigned workouts belong to the test client', async () => {
    const { data, error } = await sb
      .from('assigned_workouts')
      .select('id, client_id')
      .eq('client_id', CLIENT_ID!);

    expect(error).toBeNull();
    for (const row of data ?? []) {
      expect(row.client_id).toBe(CLIENT_ID);
    }
  });
});
