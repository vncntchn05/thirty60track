import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Client, ClientWithStats, InsertClient, UpdateClient } from '@/types';

const CLIENT_FIELDS =
  'id, trainer_id, full_name, email, phone, date_of_birth, notes, weight_kg, height_cm, bf_percent, bmi, lean_body_mass, created_at, updated_at';

type UseClientsResult = {
  clients: ClientWithStats[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addClient: (payload: Omit<InsertClient, 'trainer_id'>) => Promise<{ error: string | null }>;
  updateClient: (id: string, payload: UpdateClient) => Promise<{ error: string | null }>;
  deleteClient: (id: string) => Promise<{ error: string | null }>;
};

export function useClients(): UseClientsResult {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const [clientsRes, workoutsRes] = await Promise.all([
      supabase.from('clients').select(CLIENT_FIELDS).order('full_name'),
      supabase.from('workouts').select('client_id, performed_at').order('performed_at', { ascending: false }),
    ]);

    if (clientsRes.error) { setError(clientsRes.error.message); setLoading(false); return; }
    if (workoutsRes.error) { setError(workoutsRes.error.message); setLoading(false); return; }

    // Build per-client stats from workout rows
    const statsMap = new Map<string, { count: number; last: string | null }>();
    for (const w of workoutsRes.data ?? []) {
      const s = statsMap.get(w.client_id);
      if (!s) statsMap.set(w.client_id, { count: 1, last: w.performed_at });
      else s.count++;
    }

    const merged: ClientWithStats[] = (clientsRes.data ?? []).map((c) => ({
      ...c,
      workout_count: statsMap.get(c.id)?.count ?? 0,
      last_workout_at: statsMap.get(c.id)?.last ?? null,
    }));

    setClients(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addClient(payload: Omit<InsertClient, 'trainer_id'>) {
    if (!user) return { error: 'Not authenticated' };
    const { error: err } = await supabase
      .from('clients')
      .insert({ ...payload, trainer_id: user.id });
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function updateClient(id: string, payload: UpdateClient) {
    const { error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function deleteClient(id: string) {
    const { error: err } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  return { clients, loading, error, refetch: fetch, addClient, updateClient, deleteClient };
}

// ─── Single-client hook ───────────────────────────────────────────

type UseClientResult = {
  client: Client | null;
  loading: boolean;
  error: string | null;
  updateClient: (payload: UpdateClient) => Promise<{ error: string | null }>;
  deleteClient: () => Promise<{ error: string | null }>;
  refetch: () => void;
};

/** Fetch a single client by id. Refetches after every successful update. */
export function useClient(id: string): UseClientResult {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('clients')
      .select(CLIENT_FIELDS)
      .eq('id', id)
      .single();

    if (err) setError(err.message);
    else setClient(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  async function updateClient(payload: UpdateClient) {
    const { error: err } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function deleteClient() {
    const { error: err } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    return { error: err?.message ?? null };
  }

  return { client, loading, error, updateClient, deleteClient, refetch: fetch };
}
