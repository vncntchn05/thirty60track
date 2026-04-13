import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useMessages, markConversationRead } from '@/hooks/useMessaging';
import type { MessageAttachment } from '@/hooks/useMessaging';
import { useUnread } from '@/lib/unreadContext';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ParticipantInfo, DirectMessage, MessageAttachmentType } from '@/types';
import { AttachmentPickerModal } from '@/components/messaging/AttachmentPickerModal';

function timeStr(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${period}`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_SIZE = 30;

const ATTACHMENT_ICON: Record<MessageAttachmentType, React.ComponentProps<typeof Ionicons>['name']> = {
  exercise:         'barbell-outline',
  workout:          'calendar-outline',
  assigned_workout: 'clipboard-outline',
  guide:            'book-outline',
};

// Renders plain text with any URLs highlighted and tappable.
function BubbleText({ body, isMe, textColor }: { body: string; isMe: boolean; textColor: string | undefined }) {
  const parts: { text: string; isUrl: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX.source, 'g');
  while ((match = re.exec(body)) !== null) {
    if (match.index > lastIndex) parts.push({ text: body.slice(lastIndex, match.index), isUrl: false });
    parts.push({ text: match[0], isUrl: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push({ text: body.slice(lastIndex), isUrl: false });

  if (parts.length === 0) parts.push({ text: body, isUrl: false });

  return (
    <Text style={[styles.bubbleText, { color: textColor }]}>
      {parts.map((p, i) =>
        p.isUrl ? (
          <Text
            key={i}
            style={[styles.bubbleLink, { color: isMe ? colors.textInverse : colors.primary }]}
            onPress={() => Linking.openURL(p.text)}
          >
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
}

type MessageBubbleProps = {
  msg: DirectMessage;
  isMe: boolean;
  senderName: string | null;
  replyTo: DirectMessage | null;
  replyToName: string | null;
  showDate: boolean;
  showSender: boolean;
  showAvatar: boolean;
  onReply: (msg: DirectMessage) => void;
  onAttachmentPress: (msg: DirectMessage) => void;
};

function MessageBubble({
  msg, isMe, senderName, replyTo, replyToName,
  showDate, showSender, showAvatar, onReply, onAttachmentPress,
}: MessageBubbleProps) {
  const t = useTheme();

  return (
    <>
      {showDate && (
        <View style={styles.dateDivider}>
          <Text style={[styles.dateDividerText, { color: t.textSecondary }]}>{dateLabel(msg.created_at)}</Text>
        </View>
      )}
      <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
        {/* Avatar slot — only for received messages */}
        {!isMe && (
          showAvatar && senderName ? (
            <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials(senderName)}</Text>
            </View>
          ) : (
            <View style={styles.avatarSpacer} />
          )
        )}

        <View style={[
          styles.bubble,
          isMe
            ? { backgroundColor: colors.primary }
            : { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 },
        ]}>
          {/* Quoted reply block */}
          {replyTo && (
            <View style={[
              styles.replyQuote,
              isMe
                ? { borderLeftColor: colors.textInverse + '88', backgroundColor: colors.primaryDark + '44' }
                : { borderLeftColor: colors.primary, backgroundColor: colors.primary + '11' },
            ]}>
              <Text style={[styles.replyQuoteName, { color: isMe ? colors.textInverse + 'cc' : colors.primary }]}>
                {replyToName ?? 'Unknown'}
              </Text>
              <Text
                style={[styles.replyQuoteBody, { color: isMe ? colors.textInverse + 'bb' : t.textSecondary }]}
                numberOfLines={2}
              >
                {replyTo.body}
              </Text>
            </View>
          )}

          {showSender && senderName && (
            <Text style={[styles.senderName, { color: colors.primary }]}>{senderName}</Text>
          )}
          {/* Attachment card */}
          {msg.attachment_type && msg.attachment_id && (
            <TouchableOpacity
              style={[
                styles.attachCard,
                isMe
                  ? { backgroundColor: colors.primaryDark + '55', borderColor: colors.textInverse + '33' }
                  : { backgroundColor: colors.primary + '11', borderColor: colors.primary + '44' },
              ]}
              onPress={() => onAttachmentPress(msg)}
              activeOpacity={0.75}
            >
              <View style={[styles.attachIconWrap, { backgroundColor: isMe ? colors.textInverse + '22' : colors.primary + '22' }]}>
                <Ionicons
                  name={ATTACHMENT_ICON[msg.attachment_type]}
                  size={16}
                  color={isMe ? colors.textInverse : colors.primary}
                />
              </View>
              <View style={styles.attachInfo}>
                <Text style={[styles.attachTitle, { color: isMe ? colors.textInverse : t.textPrimary }]} numberOfLines={1}>
                  {msg.attachment_title}
                </Text>
                {!!msg.attachment_subtitle && (
                  <Text style={[styles.attachSub, { color: isMe ? colors.textInverse + 'aa' : t.textSecondary }]} numberOfLines={1}>
                    {msg.attachment_subtitle}
                  </Text>
                )}
              </View>
              <Ionicons name="arrow-forward-circle-outline" size={18} color={isMe ? colors.textInverse + 'bb' : colors.primary} />
            </TouchableOpacity>
          )}
          {/* Only show body text if it differs from the attachment title (i.e. user typed extra text) */}
          {(!msg.attachment_type || msg.body !== msg.attachment_title) && (
            <BubbleText
              body={msg.body}
              isMe={isMe}
              textColor={isMe ? colors.textInverse : t.textPrimary}
            />
          )}
          <Text style={[styles.bubbleTime, { color: isMe ? colors.textInverse + '99' : t.textSecondary }]}>
            {timeStr(msg.created_at)}
          </Text>
        </View>

        {/* Reply button — right of every bubble, vertically centered */}
        <TouchableOpacity
          style={styles.replyBtn}
          onPress={() => onReply(msg)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-undo-outline" size={16} color={t.textSecondary as string} />
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── URL detection helpers ─────────────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s]+/g;

function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  // Format: thirty60-xxxx-xxxx  (unique enough for casual use)
  return `https://meet.jit.si/thirty60-${rand(4)}-${rand(4)}`;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();
  const { messages, loading, send } = useMessages(id ?? '');

  const { role, clientId } = useAuth();
  const { refreshUnread } = useUnread();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [convTitle, setConvTitle] = useState<string | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [attachPickerOpen, setAttachPickerOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const flatRef = useRef<FlatList<DirectMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Mark conversation as read on mount and when new messages arrive
  useEffect(() => {
    if (!id || !user?.id) return;
    markConversationRead(id).then(() => refreshUnread());
  }, [id, user?.id, messages.length, refreshUnread]);

  // Load conversation metadata
  useEffect(() => {
    if (!id) return;

    async function loadMeta() {
      const { data: conv } = await supabase
        .from('conversations')
        .select('is_group, title')
        .eq('id', id)
        .single();

      if (conv) {
        setIsGroup(conv.is_group);
        setConvTitle(conv.title);
      }

      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', id);

      if (!parts?.length) return;
      const userIds = parts.map((p: { user_id: string }) => p.user_id);

      const [{ data: trainers }, { data: clients }] = await Promise.all([
        supabase.from('trainers').select('id, full_name').in('id', userIds),
        supabase.from('clients').select('auth_user_id, full_name').in('auth_user_id', userIds),
      ]);

      const infos: ParticipantInfo[] = [];
      for (const tr of trainers ?? []) infos.push({ user_id: tr.id, name: tr.full_name ?? 'Trainer', role: 'trainer' });
      for (const cl of clients ?? []) {
        if (cl.auth_user_id) infos.push({ user_id: cl.auth_user_id, name: cl.full_name ?? 'Client', role: 'client' });
      }
      setParticipants(infos);
    }

    loadMeta();
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const headerTitle = isGroup
    ? (convTitle ?? 'Group')
    : (participants.find((p) => p.user_id !== user?.id)?.name ?? 'Message');

  function handleReply(msg: DirectMessage) {
    setReplyingTo(msg);
    inputRef.current?.focus();
  }

  function handleAttachmentPress(msg: DirectMessage) {
    if (!msg.attachment_type || !msg.attachment_id) return;
    const exercisesBase = role === 'client' ? '/(client)/exercises' : '/(tabs)/exercises';
    switch (msg.attachment_type) {
      case 'exercise':
        router.push(`/exercise/${msg.attachment_id}` as never);
        break;
      case 'guide':
        router.push(`${exercisesBase}?tab=guides&topic=${msg.attachment_id}` as never);
        break;
      case 'workout':
        // Clients always view shared workouts as read-only (can't edit another client's data)
        if (role === 'client') {
          router.push(`/workout/${msg.attachment_id}?readonly=true` as never);
        } else {
          router.push(`/workout/${msg.attachment_id}` as never);
        }
        break;
      case 'assigned_workout':
        // Clients view their own assigned workouts via the session screen (read/complete flow).
        // The trainer edit screen is not accessible to clients.
        if (role === 'client') {
          router.push(`/(client)/session/${msg.attachment_id}` as never);
        } else {
          router.push(`/workout/assigned/${msg.attachment_id}` as never);
        }
        break;
    }
  }

  async function handleSend() {
    if (!text.trim() && !attachment) return;
    if (!user?.id || !id) return;
    setSending(true);
    const body = text.trim();
    const replyId = replyingTo?.id ?? null;
    const att = attachment;
    // Clear UI immediately — message appears optimistically
    setText('');
    setReplyingTo(null);
    setAttachment(null);
    await send(user.id, body, replyId, att);
    setSending(false);
  }

  const participantMap = new Map(participants.map((p) => [p.user_id, p.name]));
  const messageMap = new Map(messages.map((m) => [m.id, m]));

  const q = searchQuery.trim().toLowerCase();
  const displayMessages = searchActive && q
    ? messages.filter((m) => m.body.toLowerCase().includes(q))
    : messages;

  function shouldShowDate(list: DirectMessage[], index: number): boolean {
    if (index === 0) return true;
    const prev = new Date(list[index - 1].created_at);
    const curr = new Date(list[index].created_at);
    return (
      prev.getFullYear() !== curr.getFullYear() ||
      prev.getMonth() !== curr.getMonth() ||
      prev.getDate() !== curr.getDate()
    );
  }

  function shouldShowSender(list: DirectMessage[], index: number): boolean {
    if (!isGroup) return false;
    if (list[index].sender_id === user?.id) return false;
    if (index === 0) return true;
    return list[index - 1].sender_id !== list[index].sender_id;
  }

  function shouldShowAvatar(list: DirectMessage[], index: number): boolean {
    if (list[index].sender_id === user?.id) return false;
    const next = list[index + 1];
    return !next || next.sender_id !== list[index].sender_id;
  }

  const openSearch = useCallback(() => {
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchActive(false);
    setSearchQuery('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 50);
  }, []);

  const replyingToName = replyingTo
    ? (replyingTo.sender_id === user?.id ? 'You' : (participantMap.get(replyingTo.sender_id) ?? 'Unknown'))
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <Stack.Screen
        options={{
          headerTitle: searchActive
            ? () => (
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchHeaderInput, { color: t.textPrimary }]}
                  placeholder="Search messages…"
                  placeholderTextColor={t.textSecondary as string}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
              )
            : headerTitle,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginLeft: 4 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () =>
            searchActive ? (
              <TouchableOpacity
                onPress={closeSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginRight: 12 }}
              >
                <Text style={[styles.searchCancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={openSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="search-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            ),
        }}
      />

      {/* Search match count bar */}
      {searchActive && q.length > 0 && (
        <View style={[styles.matchBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Text style={[styles.matchText, { color: t.textSecondary }]}>
            {displayMessages.length === 0
              ? 'No results'
              : `${displayMessages.length} result${displayMessages.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={searchActive ? undefined : () => flatRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const replyTo = item.reply_to_id ? (messageMap.get(item.reply_to_id) ?? null) : null;
            const replyToName = replyTo
              ? (replyTo.sender_id === user?.id ? 'You' : (participantMap.get(replyTo.sender_id) ?? 'Unknown'))
              : null;
            return (
              <MessageBubble
                msg={item}
                isMe={item.sender_id === user?.id}
                senderName={participantMap.get(item.sender_id) ?? null}
                replyTo={replyTo}
                replyToName={replyToName}
                showDate={shouldShowDate(displayMessages, index)}
                showSender={shouldShowSender(displayMessages, index)}
                showAvatar={shouldShowAvatar(displayMessages, index)}
                onReply={handleReply}
                onAttachmentPress={handleAttachmentPress}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={44} color={t.textSecondary as string} />
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>No messages yet</Text>
              <Text style={[styles.emptyHint, { color: t.textSecondary }]}>Say hello!</Text>
            </View>
          }
        />
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <View style={[styles.contextBar, { backgroundColor: t.surface, borderTopColor: t.border, borderLeftColor: colors.primary }]}>
          <View style={styles.contextBarContent}>
            <Text style={[styles.contextBarLabel, { color: colors.primary }]}>
              Replying to {replyingToName}
            </Text>
            <Text style={[styles.contextBarBody, { color: t.textSecondary }]} numberOfLines={1}>
              {replyingTo.body}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={t.textSecondary as string} />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachment preview bar */}
      {attachment && (
        <View style={[styles.contextBar, { backgroundColor: t.surface, borderTopColor: replyingTo ? 'transparent' : t.border, borderLeftColor: colors.primary }]}>
          <Ionicons name={ATTACHMENT_ICON[attachment.type as MessageAttachmentType]} size={16} color={colors.primary} />
          <View style={styles.contextBarContent}>
            <Text style={[styles.contextBarLabel, { color: colors.primary }]}>{attachment.title}</Text>
            {!!attachment.subtitle && (
              <Text style={[styles.contextBarBody, { color: t.textSecondary }]} numberOfLines={1}>{attachment.subtitle}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setAttachment(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={18} color={t.textSecondary as string} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: t.surface, borderTopColor: (replyingTo || attachment) ? 'transparent' : t.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: t.background, borderColor: t.border, color: t.textPrimary }]}
          placeholder={attachment ? 'Add a message (optional)…' : 'Message…'}
          placeholderTextColor={t.textSecondary as string}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setAttachPickerOpen(true)}
        >
          <Ionicons name="attach-outline" size={20} color={colors.textInverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.videoBtn}
          onPress={() => {
            const link = generateMeetLink();
            setText(`Join my video call: ${link}`);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <Ionicons name="videocam-outline" size={20} color={colors.textInverse} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() && !attachment || sending) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={(!text.trim() && !attachment) || sending}
        >
          <Ionicons name="send" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <AttachmentPickerModal
        visible={attachPickerOpen}
        onClose={() => setAttachPickerOpen(false)}
        onSelect={(item) => setAttachment(item)}
        role={role}
        clientId={clientId}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.xs },

  dateDivider: { alignItems: 'center', marginVertical: spacing.sm },
  dateDividerText: { ...typography.label },

  bubbleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2, gap: spacing.xs },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontSize: 11, fontWeight: '700' },
  avatarSpacer: { width: AVATAR_SIZE, flexShrink: 0 },
  replyBtn: { justifyContent: 'center', paddingHorizontal: 2 },
  bubble: {
    maxWidth: '68%', borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: 2,
  },
  replyQuote: {
    borderLeftWidth: 3, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    marginBottom: spacing.xs, gap: 2,
  },
  replyQuoteName: { ...typography.label, fontWeight: '700' },
  replyQuoteBody: { ...typography.bodySmall },
  senderName: { ...typography.label, marginBottom: 2 },
  bubbleText: { ...typography.body },
  bubbleTime: { ...typography.label, textAlign: 'right', marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyText: { ...typography.heading3 },
  emptyHint: { ...typography.bodySmall },

  contextBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3,
    gap: spacing.sm,
  },
  contextBarContent: { flex: 1, gap: 2 },
  contextBarLabel: { ...typography.label, fontWeight: '700' },
  contextBarBody: { ...typography.bodySmall },

  attachCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.sm, marginBottom: spacing.xs,
  },
  attachIconWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  attachInfo: { flex: 1 },
  attachTitle: { ...typography.bodySmall, fontWeight: '600' },
  attachSub: { ...typography.label },

  searchHeaderInput: {
    ...typography.body, flex: 1, minWidth: 180,
  },
  searchCancelText: { ...typography.body, fontWeight: '600' },
  matchBar: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchText: { ...typography.bodySmall },

  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  videoBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleLink: {
    textDecorationLine: 'underline',
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
