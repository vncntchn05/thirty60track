import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { DbExercise } from '@/lib/exerciseDb';

type Props = {
  results: DbExercise[];
  loading: boolean;
  /** ID of the exercise currently being added, or null. */
  addingId: string | null;
  onAdd: (exercise: DbExercise) => void;
};

export function DbExerciseSection({ results, loading, addingId, onAdd }: Props) {
  const t = useTheme();

  if (!loading && results.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { borderTopColor: t.border, borderBottomColor: t.border }]}>
        <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>FROM DATABASE</Text>
        {loading && <ActivityIndicator size="small" color={t.textSecondary as string} />}
      </View>

      {results.map((ex) => (
        <View
          key={ex.id}
          style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <View style={styles.info}>
            <Text style={[styles.name, { color: t.textPrimary }]}>{ex.name}</Text>
            {ex.primaryMuscles[0] ? (
              <Text style={[styles.muscle, { color: t.textSecondary }]}>
                {ex.primaryMuscles[0]}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.addBtn, addingId !== null && styles.addBtnDisabled]}
            onPress={() => onAdd(ex)}
            disabled={addingId !== null}
          >
            {addingId === ex.id ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.addBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...typography.label,
    letterSpacing: 1,
    flex: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600' },
  muscle: { ...typography.bodySmall, marginTop: 2, textTransform: 'capitalize' },

  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 52,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
});
