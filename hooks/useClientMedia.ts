import { useEffect, useState, useCallback } from 'react';
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

type UseClientMediaResult = {
  media: ClientMediaWithUrl[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  uploadMedia: (params: UploadParams) => Promise<{ error: string | null }>;
  updateMedia: (id: string, payload: UpdateClientMedia) => Promise<{ error: string | null }>;
  deleteMedia: (id: string) => Promise<{ error: string | null }>;
};

const BUCKET = 'client-media';

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

export function useClientMedia(clientId: string): UseClientMediaResult {
  const { user } = useAuth();
  const [media, setMedia] = useState<ClientMediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('client_media')
      .select('id, client_id, trainer_id, storage_path, media_type, taken_at, notes, created_at, updated_at')
      .eq('client_id', clientId)
      .order('taken_at', { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setMedia((data ?? []).map((item) => ({ ...item, url: getPublicUrl(item.storage_path) })));
    setLoading(false);
  }, [clientId]);

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
      trainer_id: user.id,
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

  return { media, loading, error, refetch: fetch, uploadMedia, updateMedia, deleteMedia };
}
