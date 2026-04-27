import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ClientMedia, ClientMediaType, UpdateClientMedia } from '@/types';

export type ClientMediaWithUrl = ClientMedia & { url: string };

type UploadParams = {
  uri: string;
  mimeType: string;
  mediaType: ClientMediaType;
  takenAt: string;
  notes: string | null;
};

const MEDIA_PAGE_SIZE = 50;

type UseClientMediaResult = {
  media: ClientMediaWithUrl[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  uploadMedia: (params: UploadParams) => Promise<{ error: string | null }>;
  updateMedia: (id: string, payload: UpdateClientMedia) => Promise<{ error: string | null }>;
  deleteMedia: (id: string) => Promise<{ error: string | null }>;
};

const BUCKET = 'client-media';

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

const MEDIA_COLS = 'id, client_id, trainer_id, storage_path, media_type, taken_at, notes, created_at, updated_at';

/** Pass uploadTrainerId when the caller is a client user (whose user.id is not a trainer). */
export function useClientMedia(clientId: string, uploadTrainerId?: string): UseClientMediaResult {
  const { user } = useAuth();
  const [media, setMedia] = useState<ClientMediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    pageRef.current = 0;
    const { data, error: err } = await supabase
      .from('client_media')
      .select(MEDIA_COLS)
      .eq('client_id', clientId)
      .order('taken_at', { ascending: false })
      .range(0, MEDIA_PAGE_SIZE - 1);

    if (err) { setError(err.message); setLoading(false); return; }
    setMedia((data ?? []).map((item) => ({ ...item, url: getPublicUrl(item.storage_path) })));
    setHasMore((data?.length ?? 0) === MEDIA_PAGE_SIZE);
    setLoading(false);
  }, [clientId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    const { data } = await supabase
      .from('client_media')
      .select(MEDIA_COLS)
      .eq('client_id', clientId)
      .order('taken_at', { ascending: false })
      .range(next * MEDIA_PAGE_SIZE, (next + 1) * MEDIA_PAGE_SIZE - 1);
    if (data && data.length > 0) {
      pageRef.current = next;
      setMedia((prev) => [...prev, ...data.map((item) => ({ ...item, url: getPublicUrl(item.storage_path) }))]);
      setHasMore(data.length === MEDIA_PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [clientId, hasMore, loadingMore]);

  useEffect(() => { fetch(); }, [fetch]);

  async function uploadMedia({ uri, mimeType, mediaType, takenAt, notes }: UploadParams) {
    if (!user) return { error: 'Not authenticated' };

    // Read the local file as a blob
    let blob: Blob;
    try {
      const response = await global.fetch(uri);
      blob = await response.blob();
    } catch {
      return { error: 'Failed to read file' };
    }

    // Build a unique storage path
    const ext = mimeType.split('/')[1]?.split(';')[0] ?? (mediaType === 'video' ? 'mp4' : 'jpg');
    const filename = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}.${ext}`;
    const storagePath = `${clientId}/${filename}`;

    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: mimeType });

    if (storageErr) return { error: storageErr.message };

    const { error: dbErr } = await supabase.from('client_media').insert({
      client_id: clientId,
      trainer_id: uploadTrainerId ?? user.id,
      storage_path: storagePath,
      media_type: mediaType,
      taken_at: takenAt,
      notes: notes || null,
    });

    if (dbErr) {
      // Best-effort cleanup of orphaned storage file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return { error: dbErr.message };
    }

    fetch();
    return { error: null };
  }

  async function updateMedia(id: string, payload: UpdateClientMedia) {
    const { error: err } = await supabase
      .from('client_media')
      .update(payload)
      .eq('id', id);
    if (!err) fetch();
    return { error: err?.message ?? null };
  }

  async function deleteMedia(id: string) {
    const item = media.find((m) => m.id === id);
    if (!item) return { error: 'Item not found' };

    const { error: dbErr } = await supabase.from('client_media').delete().eq('id', id);
    if (dbErr) return { error: dbErr.message };

    // Best-effort cleanup; ignore storage errors
    await supabase.storage.from(BUCKET).remove([item.storage_path]);

    fetch();
    return { error: null };
  }

  return { media, loading, loadingMore, hasMore, error, refetch: fetch, loadMore, uploadMedia, updateMedia, deleteMedia };
}
