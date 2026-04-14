import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(userId: string) {
  return `feature_guide_enabled:${userId}`;
}

/**
 * Persists the "show feature guide button" preference per user in AsyncStorage.
 * Defaults to true (enabled) for new users so they discover features on first launch.
 */
export function useFeatureGuide(userId: string | undefined) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(storageKey(userId)).then((val) => {
      // null = not set yet → default true; explicit 'false' → disabled
      setEnabled(val !== 'false');
      setLoaded(true);
    });
  }, [userId]);

  const toggle = useCallback(
    async (value: boolean) => {
      if (!userId) return;
      setEnabled(value);
      await AsyncStorage.setItem(storageKey(userId), value ? 'true' : 'false');
    },
    [userId],
  );

  return { enabled: loaded ? enabled : false, toggle };
}
