import { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { type WorkoutTemplate } from '@/constants/workoutTemplates';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

const PHASE_ORDER = ['Phase 1', 'Phase 2', 'Phase 3', 'Abs'];

type Props = {
  onSelect: (template: WorkoutTemplate) => void;
  onClose: () => void;
};

export function TemplatePicker({ onSelect, onClose }: Props) {
  const t = useTheme();
  const { templates, loading, error } = useWorkoutTemplates();
  const [expandedPhase, setExpandedPhase] = useState<string | null>('Phase 1');

  const phases = useMemo(() => {
    const unique = [...new Set(templates.map((tp) => tp.phase))];
    return unique.sort((a, b) => {
      const ai = PHASE_ORDER.indexOf(a);
      const bi = PHASE_ORDER.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [templates]);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
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
        {phases.map((phase) => {
          const isOpen = expandedPhase === phase;
          const phaseTemplates = templates.filter((tp) => tp.phase === phase);

          return (
            <View key={phase}>
              {/* Phase header — tappable to expand/collapse */}
              <TouchableOpacity
                style={[styles.phaseHeader, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => setExpandedPhase(isOpen ? null : phase)}
                activeOpacity={0.7}
              >
                <View style={styles.phaseHeaderLeft}>
                  <View style={[styles.phaseDot, { backgroundColor: phaseColor(phase) }]} />
                  <Text style={[styles.phaseLabel, { color: t.textPrimary }]}>{phase}</Text>
                  <Text style={[styles.phaseCount, { color: t.textSecondary }]}>
                    {phaseTemplates.length} workout{phaseTemplates.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={t.textSecondary as string}
                />
              </TouchableOpacity>

              {/* Template cards */}
              {isOpen && phaseTemplates.map((tmpl) => (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
                  onPress={() => onSelect(tmpl)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      <Text style={[styles.cardId, { color: phaseColor(phase) }]}>{tmpl.id}</Text>
                      <Text style={[styles.cardName, { color: t.textPrimary }]}>{tmpl.name}</Text>
                    </View>
                    <View style={[styles.countBadge, { backgroundColor: phaseColor(phase) + '22' }]}>
                      <Text style={[styles.countBadgeText, { color: phaseColor(phase) }]}>
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
            </View>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
}

function phaseColor(phase: string): string {
  switch (phase) {
    case 'Phase 1': return '#4A90D9';
    case 'Phase 2': return '#E67E22';
    case 'Phase 3': return colors.primary;
    default:        return '#27AE60'; // Abs
  }
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

  scroll: { gap: spacing.xs, paddingBottom: spacing.xxl },
  errorText: { ...typography.body, textAlign: 'center', margin: spacing.xl },

  // Phase accordion header
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    marginTop: spacing.xs,
  },
  phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseLabel: { ...typography.body, fontWeight: '700' },
  phaseCount: { ...typography.bodySmall },

  // Template card
  card: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
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
  cardTopLeft: { flex: 1, gap: 2 },
  cardId: { ...typography.label, fontWeight: '700' },
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
