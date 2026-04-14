import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useFeedPosts, toggleReaction, deletePost } from '@/hooks/useFeed';
import { useTodayTrend, useRecentTrends } from '@/hooks/useTrends';
import { PostCard } from '@/components/feed/PostCard';
import { PostComposer } from '@/components/feed/PostComposer';
import { CommentSheet } from '@/components/feed/CommentSheet';
import { TrendCard, TrendArchive } from '@/components/feed/TrendCard';
import type { FeedPostWithMeta, ReactionType } from '@/types';

// ─── Segment bar ──────────────────────────────────────────────

type Segment = 'community' | 'trends';

const SEGMENT_LABELS: Record<Segment, string> = {
  community: 'Community',
  trends: 'Trends',
};

function SegmentBar({ active, onChange }: { active: Segment; onChange: (s: Segment) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.segBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      {(['community', 'trends'] as Segment[]).map((seg) => (
        <TouchableOpacity
          key={seg}
          style={[styles.segBtn, active === seg && { borderBottomColor: colors.primary }]}
          onPress={() => onChange(seg)}
        >
          <Text style={[styles.segLabel, { color: active === seg ? colors.primary : t.textSecondary }]}>
            {SEGMENT_LABELS[seg]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export function FeedScreen() {
  const t = useTheme();
  const { user, role, trainer, clientId } = useAuth();

  const [segment, setSegment]     = useState<Segment>('community');
  const [authorName, setAuthorName] = useState('');
  const [selectedPost, setSelectedPost] = useState<FeedPostWithMeta | null>(null);

  const authorId = user?.id ?? '';

  // Resolve author name (trainer: from useAuth, client: DB lookup)
  useEffect(() => {
    if (role === 'trainer' && trainer) {
      setAuthorName(trainer.full_name);
    } else if (role === 'client' && clientId) {
      supabase
        .from('clients')
        .select('full_name')
        .eq('id', clientId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setAuthorName((data as { full_name: string }).full_name);
        });
    }
  }, [role, trainer, clientId]);

  // Community data
  const { posts, loading: postsLoading, refetch: refetchPosts } = useFeedPosts(authorId);

  // Trends data
  const {
    summary: todayTrend,
    loading: trendLoading,
    error: trendError,
    disabled: trendsDisabled,
    refetch: refetchTrend,
  } = useTodayTrend();
  const { summaries: recentTrends } = useRecentTrends(7);

  // Refetch community feed when screen is focused
  useFocusEffect(useCallback(() => { refetchPosts(); }, [refetchPosts]));

  // ── Handlers ────────────────────────────────────────────────

  async function handleReact(post: FeedPostWithMeta, type: ReactionType) {
    await toggleReaction(post.id, authorId, type, post.my_reaction);
  }

  async function handleDelete(postId: string) {
    await deletePost(postId);
    refetchPosts();
  }

  // ── Community render ─────────────────────────────────────────

  function renderCommunity() {
    return (
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl
            refreshing={postsLoading}
            onRefresh={refetchPosts}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          role && authorName ? (
            <PostComposer
              authorId={authorId}
              authorName={authorName}
              authorRole={role}
              clientId={clientId}
              onPosted={refetchPosts}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={authorId}
            canDelete={role === 'trainer' || item.author_id === authorId}
            role={role}
            onReact={(type) => handleReact(item, type)}
            onCommentPress={() => setSelectedPost(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={t.textSecondary} />
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>Nothing yet</Text>
              <Text style={[styles.emptyBody, { color: t.textSecondary }]}>
                Be the first to post something to the community feed.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    );
  }

  // ── Trends render ─────────────────────────────────────────────

  function renderTrends() {
    const archiveSummaries = recentTrends.filter((s) => s.date !== todayTrend?.date);

    return (
      <FlatList
        data={[]}
        keyExtractor={() => 'none'}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.trendsContent}>
            {trendsDisabled ? (
              <View style={styles.trendError}>
                <Ionicons name="sparkles-outline" size={40} color={t.textSecondary} />
                <Text style={[styles.trendErrorTitle, { color: t.textPrimary }]}>
                  AI Trends unavailable
                </Text>
                <Text style={[styles.trendErrorMsg, { color: t.textSecondary }]}>
                  The AI-generated trends feature is currently disabled.
                </Text>
              </View>
            ) : trendLoading ? (
              <View style={styles.trendLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.trendLoadingText, { color: t.textSecondary }]}>
                  Generating today's trends…
                </Text>
              </View>
            ) : trendError ? (
              <View style={styles.trendError}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
                <Text style={[styles.trendErrorTitle, { color: t.textPrimary }]}>
                  Couldn't load trends
                </Text>
                <Text style={[styles.trendErrorMsg, { color: t.textSecondary }]}>
                  {trendError.includes('not set')
                    ? 'Set EXPO_PUBLIC_ANTHROPIC_API_KEY to enable AI-powered trends.'
                    : trendError}
                </Text>
                <TouchableOpacity
                  style={[styles.retryBtn, { borderColor: colors.primary }]}
                  onPress={refetchTrend}
                >
                  <Text style={[styles.retryLabel, { color: colors.primary }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : todayTrend ? (
              <TrendCard summary={todayTrend} isToday />
            ) : null}

            {archiveSummaries.length > 0 && (
              <TrendArchive summaries={archiveSummaries} />
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: t.background }]}>
      <SegmentBar active={segment} onChange={setSegment} />

      {segment === 'community' ? renderCommunity() : renderTrends()}

      {/* Comment sheet */}
      {selectedPost && role ? (
        <CommentSheet
          post={selectedPost}
          currentUserId={authorId}
          authorName={authorName}
          authorRole={role}
          onClose={() => setSelectedPost(null)}
        />
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Segment bar — mirrors exercises.tsx rightTabBar/rightTabBtn/rightTabText
  segBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segLabel: { ...typography.body, fontWeight: '600' },

  // Lists
  listContent: { paddingBottom: spacing.xl },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.heading3, marginTop: spacing.sm },
  emptyBody: { ...typography.body, textAlign: 'center', lineHeight: 22 },

  // Trends
  trendsContent: { padding: spacing.md },
  trendLoader: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  trendLoadingText: { ...typography.body },
  trendError: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  trendErrorTitle: { ...typography.heading3 },
  trendErrorMsg: { ...typography.body, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  retryLabel: { ...typography.label },
});
