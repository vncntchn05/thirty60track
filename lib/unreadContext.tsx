import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUnreadCount(0); return; }

    // Fetch my participations with last_read_at
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at');

    if (!participations?.length) { setUnreadCount(0); return; }

    const convIds = participations.map((p) => p.conversation_id);
    const lastReadMap = new Map<string, string | null>(
      participations.map((p) => [p.conversation_id, p.last_read_at ?? null])
    );

    // Get latest message per conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, sender_id, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    if (!messages?.length) { setUnreadCount(0); return; }

    // Find the most recent message per conversation
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
      if (lastRead === null || latest.created_at > lastRead) {
        count++;
      }
    }

    setUnreadCount(count);
  }, []);

  // Subscribe to new messages to auto-refresh unread count
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    refresh();

    channelRef.current = supabase
      .channel('unread-watcher')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { refresh(); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversation_participants' },
        () => { refresh(); },
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [refresh]);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnread: refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}
