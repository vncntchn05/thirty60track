import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { type WorkoutTemplate } from '@/constants/workoutTemplates';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  onSelect: (template: WorkoutTemplate) => void;
  onClose: () => void;
};

export function TemplatePicker({ onSelect, onClose }: Props) {
  const t = useTheme();
  const { templates, loading, error } = useWorkoutTemplates();

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.textPrimary }]}>Use Template</Text>
        <View style={styles.closeBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {templates.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
              onPress={() => onSelect(tmpl)}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={[styles.cardName, { color: t.textPrimary }]}>{tmpl.name}</Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                    {tmpl.exerciseNames.length} exercises
                  </Text>
                </View>
              </View>

              <View style={styles.exerciseList}>
                {tmpl.exerciseNames.slice(0, 5).map((name, i) => (
                  <Text key={i} style={[styles.exerciseName, { color: t.textSecondary }]} numberOfLines={1}>
                    {i + 1}. {name}
                  </Text>
                ))}
                {tmpl.exerciseNames.length > 5 && (
                  <Text style={[styles.exerciseName, { color: t.textSecondary }]}>
                    +{tmpl.exerciseNames.length - 5} more…
                  </Text>
                )}
              </View>

              <View style={[styles.cardFooter, { borderTopColor: t.border }]}>
                <Text style={[styles.selectLabel, { color: colors.primary }]}>Load this template</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 32 },
  title: { ...typography.heading3, fontWeight: '700' },

  scroll: { gap: spacing.xs, padding: spacing.md, paddingBottom: spacing.xxl },
  errorText: { ...typography.body, textAlign: 'center', margin: spacing.xl },

  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTopLeft: { flex: 1 },
  cardName: { ...typography.body, fontWeight: '600' },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  countBadgeText: { ...typography.label, fontWeight: '700' },

  exerciseList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  exerciseName: { ...typography.bodySmall },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  selectLabel: { ...typography.bodySmall, fontWeight: '600' },
});
