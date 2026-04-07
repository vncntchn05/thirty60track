import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ConversationWithDetails } from '@/types';

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'PM' : 'AM';
    return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${period}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type Props = {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onPress: () => void;
};

export function ConversationCard({ conversation, currentUserId, onPress }: Props) {
  const t = useTheme();

  const displayName = conversation.is_group
    ? (conversation.title ?? 'Group')
    : (conversation.participants.find((p) => p.user_id !== currentUserId)?.name ?? 'Unknown');

  const lastMsg = conversation.last_message;
  const timeStr = lastMsg ? timeLabel(lastMsg.created_at) : timeLabel(conversation.created_at);

  const { unread } = conversation;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
        unread && { backgroundColor: colors.primary + '14', borderColor: colors.primary + '55' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
        {conversation.is_group ? (
          <Ionicons name="people" size={20} color={colors.primary} />
        ) : (
          <Text style={[styles.initials, { color: colors.primary }]}>{getInitials(displayName)}</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: t.textPrimary }, unread && styles.nameUnread]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.time, unread ? { color: colors.primary } : { color: t.textSecondary }]}>{timeStr}</Text>
        </View>
        {lastMsg ? (
          <Text
            style={[styles.preview, unread ? { color: t.textPrimary, fontWeight: '600' } : { color: t.textSecondary }]}
            numberOfLines={1}
          >
            {lastMsg.sender_id === currentUserId ? 'You: ' : ''}{lastMsg.body}
          </Text>
        ) : (
          <Text style={[styles.preview, { color: t.textSecondary }]}>No messages yet</Text>
        )}
      </View>

      {unread ? (
        <View style={styles.unreadDot} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.md,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { ...typography.body, fontWeight: '700' },
  content: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.body, fontWeight: '600', flex: 1, marginRight: spacing.sm },
  nameUnread: { fontWeight: '700' },
  time: { ...typography.bodySmall },
  preview: { ...typography.bodySmall },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
