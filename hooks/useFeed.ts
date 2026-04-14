import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  FeedPost,
  FeedReaction,
  FeedComment,
  FeedPostWithMeta,
  InsertFeedPost,
  InsertFeedComment,
  ReactionType,
} from '@/types';

// ─── Internal raw row types (Supabase embedded-select shape) ──

type RawFeedPost = FeedPost & {
  feed_reactions: FeedReaction[];
  feed_comments: { id: string }[];
};

// ─── Hooks ────────────────────────────────────────────────────

export function useFeedPosts(currentUserId: string) {
  const [posts, setPosts] = useState<FeedPostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('feed_posts')
      .select('*, feed_reactions(*), feed_comments(id)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const enriched: FeedPostWithMeta[] = ((data as unknown as RawFeedPost[]) ?? []).map((p) => ({
      id:                  p.id,
      author_id:           p.author_id,
      author_role:         p.author_role,
      author_name:         p.author_name,
      body:                p.body,
      image_url:           p.image_url,
      attachment_type:     p.attachment_type,
      attachment_id:       p.attachment_id,
      attachment_title:    p.attachment_title,
      attachment_subtitle: p.attachment_subtitle,
      created_at:          p.created_at,
      updated_at:          p.updated_at,
      reactions:           p.feed_reactions ?? [],
      comment_count:       (p.feed_comments ?? []).length,
      my_reaction:         (p.feed_reactions ?? []).find((r) => r.user_id === currentUserId)?.reaction_type ?? null,
    }));

    setPosts(enriched);
    setError(null);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('feed-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_reactions' }, () => { load(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_comments' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { posts, loading, error, refetch: load };
}

export function usePostComments(postId: string) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) { setComments([]); setLoading(false); return; }
    const { data, error: err } = await supabase
      .from('feed_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (err) setError(err.message);
    else setComments((data as FeedComment[]) ?? []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    load();
    if (!postId) return;
    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'feed_comments',
        filter: `post_id=eq.${postId}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, load]);

  return { comments, loading, error, refetch: load };
}

// ─── Mutations ────────────────────────────────────────────────

export async function createPost(payload: InsertFeedPost): Promise<{ error: string | null }> {
  const { error } = await supabase.from('feed_posts').insert(payload);
  return { error: error?.message ?? null };
}

export async function deletePost(postId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('feed_posts').delete().eq('id', postId);
  return { error: error?.message ?? null };
}

/**
 * Toggles a reaction on a post:
 * - Same type → remove reaction
 * - Different type → update reaction type
 * - No current reaction → insert new reaction
 */
export async function toggleReaction(
  postId: string,
  userId: string,
  reactionType: ReactionType,
  currentReaction: ReactionType | null,
): Promise<{ error: string | null }> {
  if (currentReaction === reactionType) {
    const { error } = await supabase
      .from('feed_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    return { error: error?.message ?? null };
  }

  if (currentReaction !== null) {
    const { error } = await supabase
      .from('feed_reactions')
      .update({ reaction_type: reactionType })
      .eq('post_id', postId)
      .eq('user_id', userId);
    return { error: error?.message ?? null };
  }

  const { error } = await supabase
    .from('feed_reactions')
    .insert({ post_id: postId, reaction_type: reactionType });
  return { error: error?.message ?? null };
}

export async function addComment(payload: InsertFeedComment): Promise<{ error: string | null }> {
  const { error } = await supabase.from('feed_comments').insert(payload);
  return { error: error?.message ?? null };
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('feed_comments').delete().eq('id', commentId);
  return { error: error?.message ?? null };
}

/**
 * Uploads a local image URI to the feed-images storage bucket and returns the
 * public URL. Uses fetch() to get a Blob from the local file URI — works on
 * React Native (Expo) and web.
 */
export async function uploadPostImage(
  localUri: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(localUri);
    const blob = await response.blob();
    const { error: uploadErr } = await supabase.storage
      .from('feed-images')
      .upload(path, blob, { contentType: `image/${ext}`, upsert: false });
    if (uploadErr) return { url: null, error: uploadErr.message };
    const { data } = supabase.storage.from('feed-images').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err instanceof Error ? err.message : String(err) };
  }
}
