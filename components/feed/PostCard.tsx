import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';
import type { FeedPostWithMeta, ReactionType, FeedAttachmentType } from '@/types';

// ─── Constants ────────────────────────────────────────────────

const ATTACHMENT_ICON: Record<FeedAttachmentType, React.ComponentProps<typeof Ionicons>['name']> = {
  exercise:         'barbell-outline',
  workout:          'calendar-outline',
  assigned_workout: 'clipboard-outline',
  guide:            'book-outline',
};

// ─── Helpers ──────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)  return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const REACTION_EMOJI: Record<ReactionType, string> = {
  like: '👍',
  fire: '🔥',
  clap: '👏',
};

const REACTIONS: ReactionType[] = ['like', 'fire', 'clap'];

// ─── Component ────────────────────────────────────────────────

type Props = {
  post: FeedPostWithMeta;
  currentUserId: string;
  canDelete: boolean;
  role?: 'trainer' | 'client' | null;
  onReact: (type: ReactionType) => void;
  onCommentPress: () => void;
  onDelete: () => void;
};

export function PostCard({ post, currentUserId, canDelete, role, onReact, onCommentPress, onDelete }: Props) {
  const t = useTheme();
  const router = useRouter();
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  function handleAttachmentPress() {
    if (!post.attachment_type || !post.attachment_id) return;
    const isClient = role === 'client';
    const exercisesBase = isClient ? '/(client)/exercises' : '/(tabs)/exercises';
    switch (post.attachment_type) {
      case 'exercise':
        router.push({ pathname: exercisesBase as '/exercises', params: { highlight: post.attachment_id } });
        break;
      case 'workout':
        // Clients view sessions at /(client)/session/[id]; trainers use /workout/[id]
        if (isClient) {
          router.push({ pathname: '/(client)/session/[id]', params: { id: post.attachment_id } });
        } else {
          router.push({ pathname: '/workout/[id]', params: { id: post.attachment_id } });
        }
        break;
      case 'assigned_workout':
        // Clients execute assigned workouts; trainers edit them
        if (isClient) {
          router.push({ pathname: '/workout/assigned/complete/[id]', params: { id: post.attachment_id } });
        } else {
          router.push({ pathname: '/workout/assigned/[id]', params: { id: post.attachment_id } });
        }
        break;
      case 'guide':
        router.push({ pathname: exercisesBase as '/exercises', params: { guide: post.attachment_id } });
        break;
    }
  }

  function handleDeletePress() {
    Alert.alert('Delete post', 'Remove this post from the feed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }

  // Count reactions by type
  const reactionCounts = REACTIONS.reduce<Record<ReactionType, number>>(
    (acc, r) => {
      acc[r] = post.reactions.filter((rx) => rx.reaction_type === r).length;
      return acc;
    },
    { like: 0, fire: 0, clap: 0 },
  );

  const totalReactions = post.reactions.length;

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons
            name={post.author_role === 'trainer' ? 'person' : 'body'}
            size={18}
            color={colors.primary}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: t.textPrimary }]}>{post.author_name}</Text>
          <View style={styles.meta}>
            <View style={[styles.roleBadge, { borderColor: t.border }]}>
              <Text style={[styles.roleLabel, { color: t.textSecondary }]}>
                {post.author_role}
              </Text>
            </View>
            <Text style={[styles.timestamp, { color: t.textSecondary }]}>
              {timeAgo(post.created_at)}
            </Text>
          </View>
        </View>
        {canDelete && (
          <TouchableOpacity onPress={handleDeletePress} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="trash-outline" size={16} color={t.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <Text style={[styles.body, { color: t.textPrimary }]}>{post.body}</Text>

      {/* Attachment card */}
      {post.attachment_type && post.attachment_id ? (
        <TouchableOpacity
          style={[styles.attachCard, { backgroundColor: colors.primary + '11', borderColor: colors.primary + '44' }]}
          onPress={handleAttachmentPress}
          activeOpacity={0.75}
        >
          <View style={[styles.attachIconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name={ATTACHMENT_ICON[post.attachment_type]} size={16} color={colors.primary} />
          </View>
          <View style={styles.attachCardText}>
            <Text style={[styles.attachCardTitle, { color: colors.primary }]} numberOfLines={1}>
              {post.attachment_title ?? post.attachment_type}
            </Text>
            {!!post.attachment_subtitle && (
              <Text style={[styles.attachCardSub, { color: t.textSecondary }]} numberOfLines={1}>
                {post.attachment_subtitle}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {/* Image */}
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}

      {/* Reaction summary row */}
      {totalReactions > 0 && (
        <View style={styles.reactionSummary}>
          {REACTIONS.filter((r) => reactionCounts[r] > 0).map((r) => (
            <Text key={r} style={styles.reactionBubble}>
              {REACTION_EMOJI[r]} {reactionCounts[r]}
            </Text>
          ))}
        </View>
      )}

      {/* Action bar */}
      <View style={[styles.actionBar, { borderTopColor: t.border }]}>
        {/* React button — tapping opens picker, long-press applies 'like' immediately */}
        <View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setReactionPickerOpen((v) => !v)}
          >
            <Text style={styles.reactionIcon}>
              {post.my_reaction ? REACTION_EMOJI[post.my_reaction] : '👍'}
            </Text>
            <Text style={[styles.actionLabel, { color: post.my_reaction ? colors.primary : t.textSecondary }]}>
              React
            </Text>
          </TouchableOpacity>
          {reactionPickerOpen && (
            <View style={[styles.picker, { backgroundColor: t.surface, borderColor: t.border }]}>
              {REACTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pickerBtn, post.my_reaction === r && styles.pickerBtnActive]}
                  onPress={() => {
                    onReact(r);
                    setReactionPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerEmoji}>{REACTION_EMOJI[r]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Comment button */}
        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={18} color={t.textSecondary} />
          <Text style={[styles.actionLabel, { color: t.textSecondary }]}>
            {post.comment_count > 0 ? `${post.comment_count}` : 'Comment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  authorName: {
    ...typography.body,
    fontWeight: '600',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  roleBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  roleLabel: { ...typography.label, fontSize: 10, textTransform: 'capitalize' },
  timestamp: { ...typography.bodySmall },
  body: {
    ...typography.body,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    lineHeight: 22,
  },
  attachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  attachIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachCardText: { flex: 1 },
  attachCardTitle: { ...typography.label, fontWeight: '700' },
  attachCardSub: { ...typography.label, marginTop: 1 },
  image: {
    width: '100%',
    height: 220,
  },
  reactionSummary: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  reactionBubble: { fontSize: 13, color: colors.textSecondaryDark },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  reactionIcon: { fontSize: 18 },
  actionLabel: { ...typography.bodySmall, fontWeight: '500' },
  picker: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xs,
    gap: 2,
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pickerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pickerBtnActive: { backgroundColor: colors.primaryDark + '33' },
  pickerEmoji: { fontSize: 22 },
});
