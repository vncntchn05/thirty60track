import { StyleSheet, Text, View, SectionList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutSet, Exercise } from '@/types';

type SetWithExercise = WorkoutSet & { exercise: Exercise };

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { workout, loading, error } = useWorkoutDetail(id);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={styles.errorText}>{error ?? 'Workout not found.'}</Text>
      </View>
    );
  }

  const grouped: Record<string, SetWithExercise[]> = {};
  for (const set of workout.workout_sets) {
    const name = set.exercise.name;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(set);
  }
  const sections = Object.entries(grouped).map(([title, data]) => ({ title, data }));

  const date = new Date(workout.performed_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <SectionList
      style={[styles.container, { backgroundColor: t.background }]}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.dateText, { color: t.textPrimary }]}>{date}</Text>
          {workout.notes ? <Text style={[styles.notesText, { color: t.textSecondary }]}>{workout.notes}</Text> : null}
        </View>
      }
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.exerciseTitle}>{title}</Text>
      )}
      renderItem={({ item }) => <SetRow set={item} />}
    />
  );
}

function SetRow({ set }: { set: SetWithExercise }) {
  const t = useTheme();
  const parts: string[] = [];
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weight_kg != null) parts.push(`${set.weight_kg} kg`);
  if (set.duration_seconds != null) parts.push(`${set.duration_seconds}s`);

  return (
    <View style={[styles.setRow, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.setNumber, { color: t.textSecondary }]}>Set {set.set_number}</Text>
      <Text style={[styles.setDetail, { color: t.textPrimary }]}>{parts.join(' · ') || '—'}</Text>
      {set.notes ? <Text style={[styles.setNotes, { color: t.textSecondary }]}>{set.notes}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: spacing.md, gap: spacing.xs },
  dateText: { ...typography.heading3 },
  notesText: { ...typography.body },
  exerciseTitle: {
    ...typography.label,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  setRow: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  setNumber: { ...typography.bodySmall, fontWeight: '600', width: 44 },
  setDetail: { ...typography.body, flex: 1 },
  setNotes: { ...typography.bodySmall },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
});
