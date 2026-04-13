import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Client, ClientLink, ClientWithStats } from '@/types';

const CLIENT_FIELDS =
  'id, trainer_id, auth_user_id, full_name, email, phone, date_of_birth, gender, notes, weight_kg, height_cm, bf_percent, bmi, lean_body_mass, intake_completed, created_at, updated_at';

// ── Trainer side: links for a specific client ──────────────────────

export type LinkedClientEntry = {
  link: ClientLink;
  client: Client;
};

/**
 * Lists all clients linked to `clientId` (either direction).
 * Used in the trainer's "Family" tab on the client detail screen.
 */
export function useClientLinks(clientId: string) {
  const [links, setLinks] = useState<LinkedClientEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!clientId) { setLinks([]); setLoading(false); return; }
    setLoading(true);
    setError(null);

    const { data: linkRows, error: linkErr } = await supabase
      .from('client_links')
      .select('*')
      .or(`client_id.eq.${clientId},linked_client_id.eq.${clientId}`);

    if (linkErr) { setError(linkErr.message); setLoading(false); return; }
    if (!linkRows || linkRows.length === 0) { setLinks([]); setLoading(false); return; }

    const otherIds = linkRows.map((l) =>
      l.client_id === clientId ? l.linked_client_id : l.client_id
    );

    const { data: clientRows, error: clientErr } = await supabase
      .from('clients')
      .select(CLIENT_FIELDS)
      .in('id', otherIds);

    if (clientErr) { setError(clientErr.message); setLoading(false); return; }

    const clientMap = new Map((clientRows ?? []).map((c) => [c.id, c as Client]));
    const entries: LinkedClientEntry[] = linkRows
      .map((l) => {
        const otherId = l.client_id === clientId ? l.linked_client_id : l.client_id;
        const client = clientMap.get(otherId);
        return client ? { link: l as ClientLink, client } : null;
      })
      .filter((e): e is LinkedClientEntry => e !== null);

    setLinks(entries);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { links, loading, error, refetch: load };
}

// ── Client side: all linked clients for the logged-in client ──────

/**
 * Returns all clients linked to `myClientId`, with workout stats.
 * Used on the client home screen to render the family cards.
 */
export function useMyLinkedClients(myClientId: string) {
  const [linkedClients, setLinkedClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!myClientId) { setLinkedClients([]); setLoading(false); return; }
    setLoading(true);

    const { data: linkRows } = await supabase
      .from('client_links')
      .select('client_id, linked_client_id')
      .or(`client_id.eq.${myClientId},linked_client_id.eq.${myClientId}`);

    const otherIds = (linkRows ?? []).map((l) =>
      l.client_id === myClientId ? l.linked_client_id : l.client_id
    );

    if (otherIds.length === 0) { setLinkedClients([]); setLoading(false); return; }

    const [clientsRes, workoutsRes] = await Promise.all([
      supabase.from('clients').select(CLIENT_FIELDS).in('id', otherIds),
      supabase
        .from('workouts')
        .select('client_id, performed_at')
        .in('client_id', otherIds)
        .order('performed_at', { ascending: false }),
    ]);

    const statsMap = new Map<string, { count: number; last: string | null }>();
    for (const w of workoutsRes.data ?? []) {
      const s = statsMap.get(w.client_id);
      if (!s) statsMap.set(w.client_id, { count: 1, last: w.performed_at });
      else s.count++;
    }

    const merged: ClientWithStats[] = (clientsRes.data ?? []).map((c) => ({
      ...(c as Client),
      workout_count: statsMap.get(c.id)?.count ?? 0,
      last_workout_at: statsMap.get(c.id)?.last ?? null,
    }));

    setLinkedClients(merged);
    setLoading(false);
  }, [myClientId]);

  useEffect(() => { load(); }, [load]);

  return { linkedClients, loading, refetch: load };
}

// ── Mutations ──────────────────────────────────────────────────────

/**
 * Resolves all members of a client's current family group.
 * Returns every client ID that is transitively linked to `clientId`,
 * including `clientId` itself.
 */
async function resolveGroupMembers(clientId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('client_links')
    .select('client_id, linked_client_id')
    .or(`client_id.eq.${clientId},linked_client_id.eq.${clientId}`);

  const members = new Set<string>([clientId]);
  for (const l of data ?? []) {
    members.add(l.client_id === clientId ? l.linked_client_id : l.client_id);
  }
  return members;
}

/**
 * Adds `newMemberId` to the family group that `anchorClientId` belongs to.
 *
 * If `newMemberId` is already in a group of their own, those two groups are
 * merged — every member of both groups ends up linked to every other member
 * (full mesh). Only the missing pairs are inserted; duplicates are ignored.
 */
export async function addToFamilyGroup(
  trainerId: string,
  anchorClientId: string,
  newMemberId: string,
): Promise<{ error: string | null }> {
  // Collect members from both existing groups
  const [anchorGroup, newMemberGroup] = await Promise.all([
    resolveGroupMembers(anchorClientId),
    resolveGroupMembers(newMemberId),
  ]);

  const allMembers = Array.from(new Set([...anchorGroup, ...newMemberGroup]));

  // Insert every missing pair (canonical order guaranteed by the DB unique index)
  for (let i = 0; i < allMembers.length; i++) {
    for (let j = i + 1; j < allMembers.length; j++) {
      const { error } = await supabase.from('client_links').insert({
        trainer_id: trainerId,
        client_id: allMembers[i],
        linked_client_id: allMembers[j],
      });
      // 23505 = unique violation — pair already exists, safe to ignore
      if (error && error.code !== '23505') return { error: error.message };
    }
  }

  return { error: null };
}

/**
 * Removes `removedClientId` from their family group entirely.
 * Deletes every link connecting `removedClientId` to any other member.
 * Because `addToFamilyGroup` always maintains a full mesh, all of a client's
 * links are within their single family group — so this is safe and complete.
 * The remaining members' links to each other are untouched.
 */
export async function removeFromFamilyGroup(
  removedClientId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('client_links')
    .delete()
    .or(`client_id.eq.${removedClientId},linked_client_id.eq.${removedClientId}`);
  if (error) return { error: error.message };
  return { error: null };
}
