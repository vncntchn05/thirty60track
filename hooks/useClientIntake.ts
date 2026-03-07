import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ClientIntake, UpdateClientIntake, UpdateClient } from '@/types';

type UseClientIntakeResult = {
  intake: ClientIntake | null;
  loading: boolean;
  error: string | null;
  /**
   * Upsert the intake row. Pass `markComplete: true` on first submission to
   * also flip `clients.intake_completed = true` and write the client fields.
   */
  saveIntake: (
    intakeData: UpdateClientIntake,
    clientData?: UpdateClient,
    markComplete?: boolean,
  ) => Promise<{ error: string | null }>;
};

export function useClientIntake(clientId: string): UseClientIntakeResult {
  const [intake, setIntake] = useState<ClientIntake | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('client_intake')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    if (err) setError(err.message);
    else setIntake(data as ClientIntake | null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveIntake = useCallback(async (
    intakeData: UpdateClientIntake,
    clientData?: UpdateClient,
    markComplete = false,
  ) => {
    if (!clientId) return { error: 'No client ID' };

    // 1. Upsert client_intake row
    const payload = {
      ...intakeData,
      ...(markComplete ? { completed_at: new Date().toISOString() } : {}),
    };
    const { data: upserted, error: upsertErr } = await supabase
      .from('client_intake')
      .upsert({ client_id: clientId, ...payload }, { onConflict: 'client_id' })
      .select()
      .single();
    if (upsertErr) return { error: upsertErr.message };
    setIntake(upserted as ClientIntake);

    // 2. Sync client row fields (name, DOB, phone) + flip intake_completed if needed
    if (clientData || markComplete) {
      const { error: clientErr } = await supabase
        .from('clients')
        .update({ ...(clientData ?? {}), ...(markComplete ? { intake_completed: true } : {}) })
        .eq('id', clientId);
      if (clientErr) return { error: clientErr.message };
    }

    return { error: null };
  }, [clientId]);

  return { intake, loading, error, saveIntake };
}
