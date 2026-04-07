import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ExerciseMedia, ExerciseMediaType } from '@/types';

export type ExerciseMediaWithUrl = ExerciseMedia & { url: string };

const BUCKET = 'exercise-media';

function getPublicUrl(storagePath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

type UploadParams = {
  uri: string;
  mimeType: string;
  mediaType: ExerciseMediaType;
  caption: string | null;
};

export function useExerciseMedia(exerciseId: string) {
  const { user } = useAuth();
  const [media, setMedia]     = useState<ExerciseMediaWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!exerciseId) { setMedia([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('exercise_media')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    setMedia((data ?? []).map((item) => ({ ...item, url: getPublicUrl(item.storage_path) })));
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => { load(); }, [load]);

  async function uploadMedia({ uri, mimeType, mediaType, caption }: UploadParams): Promise<{ error: string | null }> {
    if (!user) return { error: 'Not authenticated' };

    let blob: Blob;
    try {
      const response = await global.fetch(uri);
      blob = await response.blob();
    } catch {
      return { error: 'Failed to read file' };
    }

    const ext = mimeType.split('/')[1]?.split(';')[0] ?? (mediaType === 'video' ? 'mp4' : 'jpg');
    const filename = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}.${ext}`;
    const storagePath = `${exerciseId}/${filename}`;

    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: mimeType });
    if (storageErr) return { error: storageErr.message };

    const { error: dbErr } = await supabase.from('exercise_media').insert({
      exercise_id: exerciseId,
      trainer_id: user.id,
      storage_path: storagePath,
      media_type: mediaType,
      caption: caption || null,
    });

    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return { error: dbErr.message };
    }

    load();
    return { error: null };
  }

  async function deleteMedia(id: string): Promise<{ error: string | null }> {
    const item = media.find((m) => m.id === id);
    if (!item) return { error: 'Item not found' };

    const { error: dbErr } = await supabase.from('exercise_media').delete().eq('id', id);
    if (dbErr) return { error: dbErr.message };

    await supabase.storage.from(BUCKET).remove([item.storage_path]);
    load();
    return { error: null };
  }

  return { media, loading, error, refetch: load, uploadMedia, deleteMedia };
}
