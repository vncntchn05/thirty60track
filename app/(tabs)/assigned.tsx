import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePendingAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { AssignedWorkoutWithDetails } from '@/types';

// TODO: This tab is currently designed for the client role.
// The clientId is sourced from useAuth() which reads the auth_user_id → clients lookup
// done in lib/auth.tsx. When a client logs in, auth.clientId is populated automatically.
// Trainers who open this tab will see "No workouts assigned yet" because their auth.clientId
// will be null.

function formatScheduledDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

type AssignedCardProps = {
  item: AssignedWorkoutWithDetails;
  onStart: () => void;
  t: ReturnType<typeof useTheme>;
};

function AssignedCard({ item, onStart, t }: AssignedCardProps) {
  const exerciseCount = item.exercises.length;
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.cardTitle, { color: t.textPrimary }]}>
        {item.title ?? 'Untitled Workout'}
      </Text>
      <Text style={[styles.cardDate, { color: t.textSecondary }]}>
        Scheduled for {formatScheduledDate(item.scheduled_date)}
      </Text>
      {exerciseCount > 0 && (
        <Text style={[styles.cardExerciseCount, { color: t.textSecondary }]}>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
        </Text>
      )}
      {item.notes ? (
        <Text style={[styles.cardNotes, { color: t.textSecondary }]} numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}
      <TouchableOpacity style={styles.startBtn} onPress={onStart}>
        <Ionicons name="play" size={16} color={colors.textInverse} />
        <Text style={styles.startBtnText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AssignedTabScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clientId } = useAuth();

  const { assignedWorkouts, loading, error } = usePendingAssignedWorkoutsForClient(clientId ?? '');

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ title: 'Assigned' }} />
      <FlatList
        data={assignedWorkouts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <AssignedCard
            item={item}
            onStart={() => router.push(`/workout/assigned/complete/${item.id}` as never)}
            t={t}
          />
        )}
        ListHeaderComponent={
          loading
            ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            : error
              ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              : null
        }
        ListEmptyComponent={
          !loading
            ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={t.textSecondary} />
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts assigned yet.</Text>
                <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
                  Your trainer will assign workouts here.
                </Text>
              </View>
            )
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  loader: { marginBottom: spacing.sm },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600' },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
  card: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: spacing.xs,
  },
  cardTitle: { ...typography.body, fontWeight: '700' },
  cardDate: { ...typography.bodySmall },
  cardExerciseCount: { ...typography.bodySmall },
  cardNotes: { ...typography.bodySmall, fontStyle: 'italic' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.xs,
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.sm,
  },
  startBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
