import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  TrainerAvailability, InsertTrainerAvailability,
  ScheduledSession, ScheduledSessionWithDetails, InsertScheduledSession,
} from '@/types';

// ─── Trainer availability ─────────────────────────────────────

export function useTrainerAvailability(trainerId: string) {
  const [slots, setSlots] = useState<TrainerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trainerId) { setSlots([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');
    if (err) setError(err.message);
    else setSlots(data ?? []);
    setLoading(false);
  }, [trainerId]);

  useEffect(() => { load(); }, [load]);

  async function upsertSlot(slot: InsertTrainerAvailability): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('trainer_availability')
      .upsert({ ...slot, trainer_id: trainerId });
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }

  async function deleteSlot(id: string): Promise<{ error: string | null }> {
    const { error: err } = await supabase
      .from('trainer_availability')
      .delete()
      .eq('id', id);
    if (err) return { error: err.message };
    await load();
    return { error: null };
  }

  return { slots, loading, error, upsertSlot, deleteSlot, refetch: load };
}

// ─── Trainer's client's availability (for booking) ────────────

export function useAvailabilityForClient(clientId: string) {
  const [slots, setSlots] = useState<TrainerAvailability[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    (async () => {
      const { data: client } = await supabase
        .from('clients')
        .select('trainer_id')
        .eq('id', clientId)
        .single();
      if (!client) { setLoading(false); return; }
      setTrainerId(client.trainer_id);
      const { data } = await supabase
        .from('trainer_availability')
        .select('*')
        .eq('trainer_id', client.trainer_id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      setSlots(data ?? []);
      setLoading(false);
    })();
  }, [clientId]);

  return { slots, trainerId, loading };
}

// ─── Trainer sessions ─────────────────────────────────────────

export function useTrainerSessions(trainerId: string) {
  const [sessions, setSessions] = useState<ScheduledSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trainerId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('scheduled_sessions')
      .select('*, client:clients(full_name, email), trainer:trainers(full_name)')
      .eq('trainer_id', trainerId)
      .order('scheduled_at', { ascending: true });
    if (err) setError(err.message);
    else setSessions((data ?? []) as ScheduledSessionWithDetails[]);
    setLoading(false);
  }, [trainerId]);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, error, refetch: load };
}

// ─── Client sessions ──────────────────────────────────────────

export function useClientSessions(clientId: string) {
  const [sessions, setSessions] = useState<ScheduledSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('scheduled_sessions')
      .select('*, client:clients(full_name, email), trainer:trainers(full_name)')
      .eq('client_id', clientId)
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at', { ascending: true });
    if (err) setError(err.message);
    else setSessions((data ?? []) as ScheduledSessionWithDetails[]);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { sessions, loading, error, refetch: load };
}

// ─── Session mutations (shared) ───────────────────────────────

export async function requestSession(
  payload: InsertScheduledSession,
): Promise<{ data: ScheduledSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from('scheduled_sessions')
    .insert({
      trainer_id: payload.trainer_id,
      client_id: payload.client_id,
      availability_id: payload.availability_id ?? null,
      scheduled_at: payload.scheduled_at,
      duration_minutes: payload.duration_minutes,
      notes: payload.notes ?? null,
      status: 'pending',
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as ScheduledSession, error: null };
}

export async function confirmSession(
  sessionId: string,
  clientId: string,
  trainerId: string,
  durationMinutes: 30 | 60,
): Promise<{ error: string | null }> {
  const creditCost = durationMinutes === 30 ? 1 : 2;

  // 1. Update session status
  const { error: sessionErr } = await supabase
    .from('scheduled_sessions')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (sessionErr) return { error: sessionErr.message };

  // 2. Read current credits balance
  const { data: credits } = await supabase
    .from('client_credits')
    .select('balance')
    .eq('client_id', clientId)
    .single();
  const currentBalance = credits?.balance ?? 0;

  // 3. Upsert credits (deduct)
  const { error: creditErr } = await supabase
    .from('client_credits')
    .upsert({
      client_id: clientId,
      balance: Math.max(0, currentBalance - creditCost),
      updated_at: new Date().toISOString(),
    });
  if (creditErr) return { error: creditErr.message };

  // 4. Record transaction
  const { error: txErr } = await supabase
    .from('credit_transactions')
    .insert({
      client_id: clientId,
      trainer_id: trainerId,
      session_id: sessionId,
      amount: -creditCost,
      reason: 'session_deduct',
      note: `Session confirmed (${durationMinutes}min)`,
    });
  if (txErr) return { error: txErr.message };

  return { error: null };
}

export async function cancelSession(
  sessionId: string,
  clientId: string,
  trainerId: string,
  cancelledBy: 'trainer' | 'client',
  wasConfirmed: boolean,
  durationMinutes: 30 | 60,
): Promise<{ error: string | null }> {
  const creditRefund = durationMinutes === 30 ? 1 : 2;

  // 1. Update session status
  const { error: sessionErr } = await supabase
    .from('scheduled_sessions')
    .update({
      status: 'cancelled',
      cancelled_by: cancelledBy,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  if (sessionErr) return { error: sessionErr.message };

  // 2. Refund credits only if session was confirmed (credits were already deducted)
  if (wasConfirmed) {
    const { data: credits } = await supabase
      .from('client_credits')
      .select('balance')
      .eq('client_id', clientId)
      .single();
    const currentBalance = credits?.balance ?? 0;

    const { error: creditErr } = await supabase
      .from('client_credits')
      .upsert({
        client_id: clientId,
        balance: currentBalance + creditRefund,
        updated_at: new Date().toISOString(),
      });
    if (creditErr) return { error: creditErr.message };

    const { error: txErr } = await supabase
      .from('credit_transactions')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        session_id: sessionId,
        amount: creditRefund,
        reason: 'session_refund',
        note: `Session cancelled by ${cancelledBy} (${durationMinutes}min refund)`,
      });
    if (txErr) return { error: txErr.message };
  }

  return { error: null };
}

export async function completeSession(sessionId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('scheduled_sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId);
  return { error: error?.message ?? null };
}
