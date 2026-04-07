import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ConversationWithDetails, DirectMessage, ParticipantInfo } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

async function resolveParticipantNames(userIds: string[]): Promise<ParticipantInfo[]> {
  if (!userIds.length) return [];

  const [{ data: trainers }, { data: clients }] = await Promise.all([
    supabase.from('trainers').select('id, full_name').in('id', userIds),
    supabase.from('clients').select('auth_user_id, full_name').in('auth_user_id', userIds),
  ]);

  const result: ParticipantInfo[] = [];
  for (const t of trainers ?? []) {
    result.push({ user_id: t.id, name: t.full_name ?? 'Trainer', role: 'trainer' });
  }
  for (const c of clients ?? []) {
    if (c.auth_user_id) {
      result.push({ user_id: c.auth_user_id, name: c.full_name ?? 'Client', role: 'client' });
    }
  }
  return result;
}

// ─── Hooks ────────────────────────────────────────────────────

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: myParticipations, error: pErr } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at');

    if (pErr) { setError(pErr.message); setLoading(false); return; }
    if (!myParticipations?.length) { setConversations([]); setLoading(false); return; }

    const convIds = myParticipations.map((p) => p.conversation_id);
    const lastReadMap = new Map<string, string | null>(
      myParticipations.map((p) => [p.conversation_id, p.last_read_at ?? null])
    );

    const [
      { data: convs, error: cErr },
      { data: allParticipants },
      { data: allMessages },
    ] = await Promise.all([
      supabase.from('conversations').select('*').in('id', convIds),
      supabase.from('conversation_participants').select('conversation_id, user_id').in('conversation_id', convIds),
      supabase.from('messages').select('*').in('conversation_id', convIds).order('created_at', { ascending: false }),
    ]);

    if (cErr) { setError(cErr.message); setLoading(false); return; }

    const allUserIds = [...new Set((allParticipants ?? []).map((p) => p.user_id))];
    const infos = await resolveParticipantNames(allUserIds);
    const infoMap = new Map(infos.map((p) => [p.user_id, p]));

    // Get current user to exclude own messages from unread check
    const { data: { user } } = await supabase.auth.getUser();
    const myUserId = user?.id ?? null;

    const result: ConversationWithDetails[] = (convs ?? []).map((conv) => {
      const participants = (allParticipants ?? [])
        .filter((p) => p.conversation_id === conv.id)
        .map((p) => infoMap.get(p.user_id))
        .filter((p): p is ParticipantInfo => p !== undefined);
      const last_message = (allMessages ?? []).find((m) => m.conversation_id === conv.id) ?? null;

      const lastRead = lastReadMap.get(conv.id) ?? null;
      const unread = last_message !== null
        && last_message.sender_id !== myUserId
        && (lastRead === null || last_message.created_at > lastRead);

      return { ...conv, participants, last_message, unread };
    });

    result.sort((a, b) => {
      const aTime = a.last_message?.created_at ?? a.created_at;
      const bTime = b.last_message?.created_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });

    setConversations(result);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { conversations, loading, error, refetch: load };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId);
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!cancelled) {
          setMessages(data ?? []);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!cancelled) {
            setMessages((prev) => {
              // Deduplicate — optimistic messages already have the same UUID
              const exists = prev.some((m) => m.id === (payload.new as DirectMessage).id);
              return exists ? prev : [...prev, payload.new as DirectMessage];
            });
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function send(
    senderId: string,
    body: string,
    replyToId?: string | null,
    attachment?: MessageAttachment | null,
  ): Promise<{ error: string | null }> {
    // Generate UUID client-side so the optimistic message has the same ID
    // as the row Supabase will create, enabling deduplication in the realtime handler.
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimistic: DirectMessage = {
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim() || (attachment?.title ?? ''),
      reply_to_id: replyToId ?? null,
      attachment_type: (attachment?.type ?? null) as DirectMessage['attachment_type'],
      attachment_id: attachment?.id ?? null,
      attachment_title: attachment?.title ?? null,
      attachment_subtitle: attachment?.subtitle ?? null,
      created_at: now,
    };

    // Show instantly for the sender
    setMessages((prev) => [...prev, optimistic]);

    const { error: err } = await supabase.from('messages').insert({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim() || (attachment?.title ?? ''),
      ...(replyToId ? { reply_to_id: replyToId } : {}),
      ...(attachment ? {
        attachment_type: attachment.type,
        attachment_id: attachment.id,
        attachment_title: attachment.title,
        attachment_subtitle: attachment.subtitle,
      } : {}),
    });

    if (err) {
      // Roll back optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== id));
      return { error: err.message };
    }
    return { error: null };
  }

  return { messages, loading, send };
}

// ─── Mutations ────────────────────────────────────────────────

export type MessageAttachment = {
  type: 'exercise' | 'workout' | 'assigned_workout' | 'guide';
  id: string;
  title: string;
  subtitle: string;
};

export async function sendMessage(
  conversationId: string,
  body: string,
  senderId: string,
  replyToId?: string | null,
  attachment?: MessageAttachment | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim() || (attachment?.title ?? ''),
      ...(replyToId ? { reply_to_id: replyToId } : {}),
      ...(attachment ? {
        attachment_type: attachment.type,
        attachment_id: attachment.id,
        attachment_title: attachment.title,
        attachment_subtitle: attachment.subtitle,
      } : {}),
    });
  return { error: error?.message ?? null };
}

export async function getOrCreateDM(
  _myUserId: string,
  otherUserId: string,
): Promise<string | null> {
  const { data: convId, error } = await supabase.rpc('create_dm_conversation', {
    other_user_id: otherUserId,
  });
  return error ? null : (convId as string);
}

export async function createGroupConversation(
  title: string,
  participantIds: string[],
  _creatorId: string,
): Promise<string | null> {
  const { data: convId, error } = await supabase.rpc('create_group_conversation', {
    p_title: title.trim(),
    p_participant_ids: participantIds,
  });
  return error ? null : (convId as string);
}

// ─── People search (for new conversation modal) ───────────────

export type SearchPerson = ParticipantInfo & { id: string };

export async function searchPeople(
  query: string,
  currentUserId: string,
  role: 'trainer' | 'client',
  trainerIdForClient?: string,
): Promise<SearchPerson[]> {
  const q = query.trim().toLowerCase();

  if (role === 'client') {
    // Clients can only message their own trainer
    const { data } = await supabase
      .from('trainers')
      .select('id, full_name')
      .ilike('full_name', `%${q}%`)
      .limit(20);
    return (data ?? [])
      .filter((t) => t.id !== currentUserId)
      .map((t) => ({ id: t.id, user_id: t.id, name: t.full_name ?? 'Trainer', role: 'trainer' as const }));
  }

  // Trainer: search other trainers + all clients
  const [{ data: trainers }, { data: clients }] = await Promise.all([
    supabase.from('trainers').select('id, full_name').ilike('full_name', `%${q}%`).limit(15),
    supabase.from('clients').select('auth_user_id, full_name').ilike('full_name', `%${q}%`).not('auth_user_id', 'is', null).limit(15),
  ]);

  const results: SearchPerson[] = [];
  for (const t of trainers ?? []) {
    if (t.id !== currentUserId) {
      results.push({ id: t.id, user_id: t.id, name: t.full_name ?? 'Trainer', role: 'trainer' });
    }
  }
  for (const c of clients ?? []) {
    if (c.auth_user_id) {
      results.push({ id: c.auth_user_id, user_id: c.auth_user_id, name: c.full_name ?? 'Client', role: 'client' });
    }
  }
  return results;
}
