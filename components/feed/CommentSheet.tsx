import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';
import { usePostComments, addComment, deleteComment } from '@/hooks/useFeed';
import type { FeedPostWithMeta, FeedComment } from '@/types';
import type { UserRole } from '@/lib/auth';

type Props = {
  post: FeedPostWithMeta | null;
  currentUserId: string;
  authorName: string;
  authorRole: NonNullable<UserRole>;
  onClose: () => void;
};

// ─── Comment row ──────────────────────────────────────────────

function CommentRow({
  comment,
  isOwn,
  onDelete,
}: {
  comment: FeedComment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Ionicons
          name={comment.author_role === 'trainer' ? 'person' : 'body'}
          size={13}
          color={colors.primary}
        />
      </View>
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentAuthor, { color: t.textPrimary }]}>
            {comment.author_name}
          </Text>
          <Text style={[styles.commentTime, { color: t.textSecondary }]}>
            {formatCommentTime(comment.created_at)}
          </Text>
          {isOwn && (
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="trash-outline" size={13} color={t.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.commentBody, { color: t.textPrimary }]}>{comment.body}</Text>
      </View>
    </View>
  );
}

function formatCommentTime(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)  return 'now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Sheet ────────────────────────────────────────────────────

export function CommentSheet({ post, currentUserId, authorName, authorRole, onClose }: Props) {
  const t = useTheme();
  const { comments, loading } = usePostComments(post?.id ?? '');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  if (!post) return null;

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    await addComment({
      post_id: post!.id,
      body: trimmed,
      author_role: authorRole,
      author_name: authorName,
    });
    setDraft('');
    setSending(false);
  }

  async function handleDelete(commentId: string) {
    await deleteComment(commentId);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={[styles.sheet, { backgroundColor: t.surface }]}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: t.border }]}>
            <Text style={[styles.sheetTitle, { color: t.textPrimary }]}>Comments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={22} color={t.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Post preview */}
          <View style={[styles.postPreview, { borderBottomColor: t.border }]}>
            <Text style={[styles.postPreviewText, { color: t.textSecondary }]} numberOfLines={2}>
              {post.body}
            </Text>
          </View>

          {/* Comments list */}
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <CommentRow
                  comment={item}
                  isOwn={item.author_id === currentUserId}
                  onDelete={() => handleDelete(item.id)}
                />
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                  No comments yet. Be the first!
                </Text>
              }
              contentContainerStyle={styles.list}
            />
          )}

          {/* Input */}
          <View style={[styles.inputRow, { borderTopColor: t.border, backgroundColor: t.surface }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: t.textPrimary, borderColor: t.border }]}
              placeholder="Add a comment…"
              placeholderTextColor={t.textSecondary}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={500}
            />
            {sending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, { opacity: draft.trim() ? 1 : 0.4 }]}
                onPress={handleSend}
                disabled={!draft.trim()}
              >
                <Ionicons name="send" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '80%',
    minHeight: '50%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { ...typography.heading3 },
  postPreview: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postPreviewText: { ...typography.bodySmall, fontStyle: 'italic' },
  loader: { marginTop: spacing.xl },
  list: { paddingVertical: spacing.sm, flexGrow: 1 },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  commentBubble: { flex: 1 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  commentAuthor: { ...typography.bodySmall, fontWeight: '600' },
  commentTime: { ...typography.bodySmall, flex: 1 },
  commentBody: { ...typography.body, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  sendBtn: { paddingBottom: spacing.xs + 2, paddingHorizontal: spacing.xs },
});
