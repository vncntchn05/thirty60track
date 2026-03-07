import { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useClientWorkouts } from '@/hooks/useClientWorkouts';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutWithTrainer } from '@/types';

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso: string) {
  return isoToLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function WorkoutRow({ workout, onPress }: { workout: WorkoutWithTrainer; onPress: () => void }) {
  const t = useTheme();
  const { user } = useAuth();
  const isClientLogged = workout.logged_by_role === 'client' && workout.logged_by_user_id === user?.id;
  const isTrainerLogged = workout.logged_by_role === 'trainer';

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowMain}>
        <Text style={[styles.rowDate, { color: t.textPrimary }]}>{fmtDate(workout.performed_at)}</Text>
        {workout.notes ? (
          <Text style={[styles.rowNotes, { color: t.textSecondary }]} numberOfLines={1}>{workout.notes}</Text>
        ) : null}
        {isTrainerLogged && (
          <View style={styles.badgeRow}>
            <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary as string} />
            <Text style={[styles.badge, { color: t.textSecondary }]}>
              Logged by {workout.trainer?.full_name ?? 'trainer'}
            </Text>
          </View>
        )}
      </View>
      {isClientLogged && (
        <View style={styles.editHint}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
    </TouchableOpacity>
  );
}

export default function ClientWorkoutsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clientId } = useAuth();
  const { workouts, loading, error, refresh } = useClientWorkouts(clientId ?? '');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            onPress={() => router.push(`/(client)/workout/${item.id}` as never)}
          />
        )}
        ListHeaderComponent={
          error ? <Text style={styles.errorText}>{error}</Text> : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts yet</Text>
            <Text style={[styles.emptyHint, { color: t.textSecondary }]}>Log your first workout below</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(client)/workout/log' as never)}
        accessibilityLabel="Log new workout"
      >
        <Ionicons name="add" size={22} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Log Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.xxl + 64 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  rowMain: { flex: 1, gap: 2 },
  rowDate: { ...typography.body, fontWeight: '600' },
  rowNotes: { ...typography.bodySmall },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badge: { ...typography.label },
  editHint: { marginRight: spacing.xs },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.heading3 },
  emptyHint: { ...typography.bodySmall },
  errorText: { ...typography.bodySmall, color: colors.error, padding: spacing.md },
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
