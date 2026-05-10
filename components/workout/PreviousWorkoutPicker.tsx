import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { fetchRecentWorkoutsForPicker, fetchWorkoutForCopy, type WorkoutSummaryForPicker } from '@/hooks/useWorkouts';
import type { WorkoutWithSets } from '@/types';

type Props = {
  clientId: string;
  onSelect: (workout: WorkoutWithSets) => void;
  onClose: () => void;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function PreviousWorkoutPicker({ clientId, onSelect, onClose }: Props) {
  const t = useTheme();
  const [workouts, setWorkouts] = useState<WorkoutSummaryForPicker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecentWorkoutsForPicker(clientId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err);
      else setWorkouts(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [clientId]);

  async function handleSelect(workoutId: string) {
    setLoadingId(workoutId);
    const { data, error: err } = await fetchWorkoutForCopy(workoutId);
    setLoadingId(null);
    if (err || !data) {
      setError(err ?? 'Failed to load workout');
      return;
    }
    onSelect(data);
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.textPrimary }]}>Load Previous Workout</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : error ? (
        <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
      ) : workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={44} color={t.textSecondary} />
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>No previous workouts found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {workouts.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => handleSelect(w.id)}
              disabled={loadingId !== null}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.dateText, { color: t.textPrimary }]}>{formatDate(w.performed_at)}</Text>
                {loadingId === w.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
                )}
              </View>
              {w.exercises.length === 0 ? (
                <Text style={[styles.noExercises, { color: t.textSecondary }]}>No exercise data</Text>
              ) : (
                <View style={styles.exerciseList}>
                  {w.exercises.map((ex) => (
                    <View key={ex.id} style={styles.exerciseRow}>
                      <Text style={[styles.exerciseName, { color: t.textSecondary }]}>
                        {ex.name}
                      </Text>
                      <Text style={[styles.setCount, { color: t.textSecondary }]}>
                        {ex.set_count} {ex.set_count === 1 ? 'set' : 'sets'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {w.notes ? (
                <Text style={[styles.notes, { color: t.textSecondary }]} numberOfLines={1}>
                  {w.notes}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.heading3, fontWeight: '700', flex: 1 },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dateText: { ...typography.body, fontWeight: '700' },
  exerciseList: { gap: 4 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  exerciseName: { ...typography.bodySmall, flex: 1 },
  setCount: { ...typography.label },
  noExercises: { ...typography.bodySmall },
  notes: { ...typography.label, fontStyle: 'italic' },
});
