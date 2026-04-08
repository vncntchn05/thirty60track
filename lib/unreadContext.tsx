import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type UnreadContextValue = {
  unreadCount: number;
  refreshUnread: () => void;
};

const UnreadContext = createContext<UnreadContextValue>({ unreadCount: 0, refreshUnread: () => {} });

export function useUnread() {
  return useContext(UnreadContext);
}

export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [convIds, setConvIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUnreadCount(0); return; }

    // Filter to only the current user's rows — SELECT RLS returns all participants,
    // so without this filter another participant's last_read_at would contaminate the map.
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id);

    if (!participations?.length) { setUnreadCount(0); setConvIds([]); return; }

    const ids = participations.map((p) => p.conversation_id);

    // Only update convIds state (and thus re-subscribe) if the set actually changed.
    setConvIds((prev) => {
      const same = prev.length === ids.length && prev.every((id) => ids.includes(id));
      return same ? prev : ids;
    });

    const lastReadMap = new Map<string, string | null>(
      participations.map((p) => [p.conversation_id, p.last_read_at ?? null])
    );

    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, sender_id, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false });

    if (!messages?.length) { setUnreadCount(0); return; }

    const latestPerConv = new Map<string, { sender_id: string; created_at: string }>();
    for (const msg of messages) {
      if (!latestPerConv.has(msg.conversation_id)) {
        latestPerConv.set(msg.conversation_id, { sender_id: msg.sender_id, created_at: msg.created_at });
      }
    }

    let count = 0;
    for (const [convId, latest] of latestPerConv) {
      if (latest.sender_id === user.id) continue;
      const lastRead = lastReadMap.get(convId) ?? null;
      if (lastRead === null || latest.created_at > lastRead) count++;
    }
    setUnreadCount(count);
  }, []);

  // Initial load
  useEffect(() => { refresh(); }, [refresh]);

  // Filtered per-conversation subscriptions — rebuilt only when the conversation set changes.
  // Unfiltered postgres_changes are unreliable in Supabase; filtered ones match useMessages pattern.
  useEffect(() => {
    if (!convIds.length) return;

    const ch = supabase.channel('unread-watcher');
    convIds.forEach((id) => {
      ch.on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, () => refresh());
    });
    ch.subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [convIds, refresh]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread: refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}
