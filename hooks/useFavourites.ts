import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserFavourite, FavouriteItemType } from '@/types';

const FIELDS = 'id, user_id, item_type, item_id, created_at';

export function useFavourites() {
  const [rows, setRows] = useState<UserFavourite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('user_favourites')
      .select(FIELDS)
      .then(({ data }) => {
        setRows((data ?? []) as UserFavourite[]);
        setLoading(false);
      });
  }, []);

  const favouriteExerciseIds = useMemo(
    () => new Set(rows.filter((r) => r.item_type === 'exercise').map((r) => r.item_id)),
    [rows],
  );

  const favouriteTemplateIds = useMemo(
    () => new Set(rows.filter((r) => r.item_type === 'template').map((r) => r.item_id)),
    [rows],
  );

  const toggleFavourite = useCallback(
    async (itemType: FavouriteItemType, itemId: string) => {
      const existing = rows.find((r) => r.item_type === itemType && r.item_id === itemId);
      if (existing) {
        // Optimistic remove
        setRows((prev) => prev.filter((r) => r.id !== existing.id));
        await supabase.from('user_favourites').delete().eq('id', existing.id);
      } else {
        // Optimistic add
        const tempId = `temp-${Date.now()}`;
        const tempRow: UserFavourite = {
          id: tempId, user_id: '', item_type: itemType, item_id: itemId,
          created_at: new Date().toISOString(),
        };
        setRows((prev) => [...prev, tempRow]);
        const { data } = await supabase
          .from('user_favourites')
          .insert({ item_type: itemType, item_id: itemId })
          .select(FIELDS)
          .single();
        if (data) {
          setRows((prev) => prev.map((r) => (r.id === tempId ? (data as UserFavourite) : r)));
        }
      }
    },
    [rows],
  );

  return { loading, favouriteExerciseIds, favouriteTemplateIds, toggleFavourite };
}
