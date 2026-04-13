import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ClientCredits, CreditTransaction } from '@/types';

export function useClientCredits(clientId: string) {
  const [credits, setCredits] = useState<ClientCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) { setCredits(null); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('client_credits')
      .select('*')
      .eq('client_id', clientId)
      .single();
    if (err && err.code !== 'PGRST116') setError(err.message); // PGRST116 = not found
    setCredits(data ?? null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { credits, balance: credits?.balance ?? 0, loading, error, refetch: load };
}

export function useCreditTransactions(clientId: string) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) { setTransactions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions(data ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { transactions, loading, refetch: load };
}

/**
 * Adjust a client's credit balance by `amount` (positive = grant, negative = deduct).
 * Any authenticated trainer can call this regardless of which trainer owns the client.
 */
export async function grantCredits(
  clientId: string,
  trainerId: string,
  amount: number,
  note?: string,
): Promise<{ error: string | null }> {
  if (amount === 0) return { error: 'Amount must be non-zero.' };

  // Read current balance
  const { data: existing } = await supabase
    .from('client_credits')
    .select('balance')
    .eq('client_id', clientId)
    .single();
  const currentBalance = existing?.balance ?? 0;

  // Upsert balance
  const { error: creditErr } = await supabase
    .from('client_credits')
    .upsert({
      client_id: clientId,
      balance: currentBalance + amount,
      updated_at: new Date().toISOString(),
    });
  if (creditErr) {
    if (creditErr.code === '42501' || creditErr.message.includes('row-level security')) {
      return { error: 'Permission denied — run Migration 026 in the Supabase SQL editor to allow cross-client credit adjustments.' };
    }
    return { error: creditErr.message };
  }

  // Record transaction — 'grant' for additions, 'manual' for deductions
  const { error: txErr } = await supabase
    .from('credit_transactions')
    .insert({
      client_id: clientId,
      trainer_id: trainerId,
      amount,
      reason: amount > 0 ? 'grant' : 'manual',
      note: note ?? null,
    });
  if (txErr) return { error: txErr.message };

  return { error: null };
}
