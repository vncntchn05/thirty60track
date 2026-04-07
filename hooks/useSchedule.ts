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

// ─── Sessions for a specific client (trainer view) ───────────

export function useSessionsForClient(clientId: string, trainerId: string) {
  const [sessions, setSessions] = useState<ScheduledSessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId || !trainerId) { setSessions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('scheduled_sessions')
      .select('*, client:clients(full_name, email), trainer:trainers(full_name)')
      .eq('client_id', clientId)
      .eq('trainer_id', trainerId)
      .order('scheduled_at', { ascending: true });
    setSessions((data ?? []) as ScheduledSessionWithDetails[]);
    setLoading(false);
  }, [clientId, trainerId]);

  useEffect(() => { load(); }, [load]);
  return { sessions, loading, refetch: load };
}

// ─── Auto-message helper ──────────────────────────────────────

function fmtSessionLine(scheduledAt: string, durationMinutes: number): string {
  const d = new Date(scheduledAt);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} at ${timeStr} (${durationMinutes}min)`;
}

/**
 * Sends an automatic DM between trainer and client after a session event.
 * Looks up the client's auth_user_id if only the clients-table UUID is known.
 * Non-blocking — caller should not await this if it is non-critical.
 */
async function sendSessionAutoMessage(
  otherAuthUserId: string,
  body: string,
): Promise<void> {
  try {
    const { data: convId, error } = await supabase.rpc('create_dm_conversation', {
      other_user_id: otherAuthUserId,
    });
    if (error || !convId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('messages').insert({
      conversation_id: convId as string,
      sender_id: user.id,
      body,
    });
  } catch {
    // Never let a notification failure bubble up and break the main operation
  }
}

/** Resolve a clients-table UUID → auth_user_id. */
async function getClientAuthUserId(clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('auth_user_id')
    .eq('id', clientId)
    .single();
  return data?.auth_user_id ?? null;
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

  // Notify trainer — fire-and-forget
  sendSessionAutoMessage(
    payload.trainer_id,
    `📅 Session requested — ${fmtSessionLine(payload.scheduled_at, payload.duration_minutes)}`,
  );

  return { data: data as ScheduledSession, error: null };
}

export async function confirmSession(
  sessionId: string,
  clientId: string,
  trainerId: string,
  durationMinutes: 30 | 60,
  scheduledAt: string,
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

  // 5. Notify client — fire-and-forget
  getClientAuthUserId(clientId).then((clientAuthId) => {
    if (!clientAuthId) return;
    sendSessionAutoMessage(
      clientAuthId,
      `✅ Session confirmed — ${fmtSessionLine(scheduledAt, durationMinutes)}. ${creditCost} credit${creditCost > 1 ? 's' : ''} deducted.`,
    );
  });

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

// Trainer books a session on behalf of a client — immediately confirmed, credits deducted.
export async function bookSessionForClient(
  trainerId: string,
  clientId: string,
  scheduledAt: string,
  durationMinutes: 30 | 60,
  notes?: string | null,
): Promise<{ data: ScheduledSession | null; error: string | null }> {
  const creditCost = durationMinutes === 30 ? 1 : 2;
  const now = new Date().toISOString();

  // 1. Insert session as confirmed
  const { data: session, error: sessionErr } = await supabase
    .from('scheduled_sessions')
    .insert({
      trainer_id: trainerId,
      client_id: clientId,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      notes: notes ?? null,
      status: 'confirmed',
      confirmed_at: now,
    })
    .select()
    .single();
  if (sessionErr) return { data: null, error: sessionErr.message };

  // 2. Read client's current balance
  const { data: credits } = await supabase
    .from('client_credits')
    .select('balance')
    .eq('client_id', clientId)
    .single();
  const currentBalance = credits?.balance ?? 0;

  // 3. Deduct credits (allow going negative — trainer override)
  const { error: creditErr } = await supabase
    .from('client_credits')
    .upsert({
      client_id: clientId,
      balance: currentBalance - creditCost,
      updated_at: now,
    });
  if (creditErr) return { data: null, error: creditErr.message };

  // 4. Record transaction
  const { error: txErr } = await supabase
    .from('credit_transactions')
    .insert({
      client_id: clientId,
      trainer_id: trainerId,
      session_id: (session as ScheduledSession).id,
      amount: -creditCost,
      reason: 'session_deduct',
      note: `Session booked by trainer (${durationMinutes}min)`,
    });
  if (txErr) return { data: null, error: txErr.message };

  // 5. Notify client — fire-and-forget
  getClientAuthUserId(clientId).then((clientAuthId) => {
    if (!clientAuthId) return;
    sendSessionAutoMessage(
      clientAuthId,
      `📅 Session booked — ${fmtSessionLine(scheduledAt, durationMinutes)}. ${creditCost} credit${creditCost > 1 ? 's' : ''} deducted.`,
    );
  });

  return { data: session as ScheduledSession, error: null };
}
