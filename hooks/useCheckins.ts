import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ClientCheckin } from '@/types/database';

export function useCheckins(clientId: string | null | undefined) {
  const [checkins, setCheckins] = useState<ClientCheckin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setCheckins([]); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('client_checkins')
      .select('*')
      .eq('client_id', clientId)
      .order('checked_in_at', { ascending: false })
      .limit(100);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setCheckins(data ?? []);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { checkins, loading, error, refetch: fetch };
}

/** Called by the trainer after scanning a client QR code. */
export async function recordCheckin(params: {
  clientId: string;
  trainerId: string;
  note?: string;
}): Promise<{ data: ClientCheckin | null; error: string | null }> {
  const { data, error } = await supabase
    .from('client_checkins')
    .insert({
      client_id:       params.clientId,
      trainer_id:      params.trainerId,
      note:            params.note ?? null,
      is_self_checkin: false,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

/** Called by the client when they scan the master gym QR code. */
export async function selfCheckin(clientId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('client_checkins')
    .insert({
      client_id:       clientId,
      trainer_id:      null,
      is_self_checkin: true,
    });

  if (error) return { error: error.message };
  return { error: null };
}
