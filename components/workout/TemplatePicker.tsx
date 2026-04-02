import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { type WorkoutTemplate } from '@/constants/workoutTemplates';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  onSelect: (template: WorkoutTemplate) => void;
  onClose: () => void;
};

// ─── Display ordering ────────────────────────────────────────

const SPLIT_ORDER = [
  'Full Body',
  'Upper / Lower',
  'Push / Pull / Legs',
  'Abs & Core',
];

const SUBGROUP_ORDER: Record<string, string[]> = {
  'Full Body':          ['Standard', 'Phase 1', 'Phase 2', 'Phase 3'],
  'Upper / Lower':      ['Upper', 'Lower'],
  'Push / Pull / Legs': ['Push', 'Pull', 'Legs'],
  'Abs & Core':         ['Core Fundamentals', 'Ab Circuits'],
};

// ─── Two-level grouping ───────────────────────────────────────

type SubgroupEntry = { subgroup: string; items: WorkoutTemplate[] };
type SplitEntry    = { split: string; subgroups: SubgroupEntry[] };

function groupTemplates(templates: WorkoutTemplate[]): SplitEntry[] {
  // Build nested map: split → subgroup → items
  const map = new Map<string, Map<string, WorkoutTemplate[]>>();
  for (const tmpl of templates) {
    const s = tmpl.split    ?? 'Other';
    const g = tmpl.subgroup ?? '';
    if (!map.has(s)) map.set(s, new Map());
    const inner = map.get(s)!;
    if (!inner.has(g)) inner.set(g, []);
    inner.get(g)!.push(tmpl);
  }

  function orderedSubgroups(split: string, inner: Map<string, WorkoutTemplate[]>): SubgroupEntry[] {
    const order = SUBGROUP_ORDER[split] ?? [];
    const result: SubgroupEntry[] = [];
    for (const g of order) {
      if (inner.has(g)) result.push({ subgroup: g, items: inner.get(g)! });
    }
    // Append any subgroups not in SUBGROUP_ORDER
    for (const [g, items] of inner) {
      if (!order.includes(g)) result.push({ subgroup: g, items });
    }
    return result;
  }

  const result: SplitEntry[] = [];
  for (const split of SPLIT_ORDER) {
    if (map.has(split)) {
      result.push({ split, subgroups: orderedSubgroups(split, map.get(split)!) });
      map.delete(split);
    }
  }
  // Append splits not in SPLIT_ORDER
  for (const [split, inner] of map) {
    result.push({ split, subgroups: orderedSubgroups(split, inner) });
  }
  return result;
}

// ─── Component ────────────────────────────────────────────────

export function TemplatePicker({ onSelect, onClose }: Props) {
  const t = useTheme();
  const { templates, loading, error } = useWorkoutTemplates();

  const groups = groupTemplates(templates);

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
          {groups.map(({ split, subgroups }) => (
            <View key={split} style={styles.splitSection}>
              <Text style={[styles.splitHeader, { color: t.textPrimary, borderBottomColor: t.border }]}>
                {split}
              </Text>

              {subgroups.map(({ subgroup, items }) => (
                <View key={subgroup} style={styles.subgroupSection}>
                  {subgroup !== '' && (
                    <Text style={[styles.subgroupHeader, { color: t.textSecondary }]}>
                      {subgroup}
                    </Text>
                  )}

                  {items.map((tmpl) => (
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
                </View>
              ))}
            </View>
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

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  errorText: { ...typography.body, textAlign: 'center', margin: spacing.xl },

  splitSection: { marginBottom: spacing.lg },
  splitHeader: {
    ...typography.heading3,
    fontWeight: '700',
    paddingBottom: spacing.xs,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },

  subgroupSection: { marginBottom: spacing.sm },
  subgroupHeader: {
    ...typography.label,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    paddingLeft: 2,
  },

  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xs,
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
