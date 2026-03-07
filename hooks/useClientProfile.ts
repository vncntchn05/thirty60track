import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Client } from '@/types';

type UseClientProfileResult = {
  client: Client | null;
  loading: boolean;
  error: string | null;
};

const CLIENT_FIELDS =
  'id, trainer_id, auth_user_id, full_name, email, phone, date_of_birth, gender, notes, weight_kg, height_cm, bf_percent, bmi, lean_body_mass, created_at, updated_at';

/** Returns the client row for the currently authenticated client user. */
export function useClientProfile(): UseClientProfileResult {
  const { clientId } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('clients')
      .select(CLIENT_FIELDS)
      .eq('id', clientId)
      .single();

    if (err) setError(err.message);
    else setClient(data as Client);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { client, loading, error };
}
