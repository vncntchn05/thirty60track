import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { type WorkoutTemplate } from '@/constants/workoutTemplates';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { getSuggestedSplits } from '@/constants/conditionKeywords';
import type { ClientIntake } from '@/types';

type Props = {
  onSelect: (template: WorkoutTemplate) => void;
  onClose: () => void;
  clientIntake?: ClientIntake | null;
};

// ─── Display ordering ────────────────────────────────────────

const SPLIT_ORDER = [
  'Full Body',
  'Upper / Lower',
  'Push / Pull / Legs',
  'Abs & Core',
  'Metabolic & Chronic Disease',
  'Musculoskeletal & Orthopedic',
  'Postural Deviations',
  'Special Populations',
  'Neurological & Mental Health',
];

const SUBGROUP_ORDER: Record<string, string[]> = {
  'Full Body':          ['Standard', 'Phase 1', 'Phase 2', 'Phase 3'],
  'Upper / Lower':      ['Upper', 'Lower'],
  'Push / Pull / Legs': ['Push', 'Pull', 'Legs'],
  'Abs & Core':         ['Core Fundamentals', 'Ab Circuits'],
  'Metabolic & Chronic Disease': [
    'Diabetes & Obesity', 'Hypertension & High Cholesterol',
    'Cardiac Rehabilitation', 'COPD & Respiratory',
  ],
  'Musculoskeletal & Orthopedic': [
    'Sciatica & Lower Back Pain', 'Arthritis & Joint Replacements',
    'Osteoporosis', 'Shoulder Impingement & Rotator Cuff', 'Knee Rehabilitation',
  ],
  'Postural Deviations': ['Upper Crossed Syndrome', 'Lower Crossed Syndrome & Scoliosis'],
  'Special Populations': [
    'Elderly (Seniors)', 'Prenatal & Postpartum', 'Cancer Survivors', 'Hypermobility & EDS',
  ],
  'Neurological & Mental Health': [
    'MS / Parkinson\'s / Fibromyalgia', 'Anxiety & Depression', 'Chronic Fatigue & Post-COVID',
  ],
};

// ─── Two-level grouping ───────────────────────────────────────

type SubgroupEntry = { subgroup: string; items: WorkoutTemplate[] };
type SplitEntry    = { split: string; subgroups: SubgroupEntry[] };

function groupTemplates(templates: WorkoutTemplate[]): SplitEntry[] {
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
  for (const [split, inner] of map) {
    result.push({ split, subgroups: orderedSubgroups(split, inner) });
  }
  return result;
}

// ─── Intake text helper ───────────────────────────────────────

function buildIntakeText(intake: ClientIntake | null | undefined): string {
  if (!intake) return '';
  return [
    intake.chronic_conditions ?? '',
    intake.current_injuries ?? '',
    intake.past_injuries ?? '',
    intake.medications ?? '',
    intake.goals ?? '',
  ].join(' ');
}

// ─── Template Card ────────────────────────────────────────────

function TemplateCard({
  tmpl,
  onSelect,
  highlightSubgroup,
}: {
  tmpl: WorkoutTemplate;
  onSelect: (t: WorkoutTemplate) => void;
  highlightSubgroup?: boolean;
}) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={() => onSelect(tmpl)}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={[styles.cardName, { color: t.textPrimary }]}>{tmpl.name}</Text>
          {highlightSubgroup && tmpl.subgroup && (
            <Text style={[styles.cardMeta, { color: colors.primary }]}>
              {tmpl.split} · {tmpl.subgroup}
            </Text>
          )}
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
  );
}

// ─── Component ────────────────────────────────────────────────

export function TemplatePicker({ onSelect, onClose, clientIntake }: Props) {
  const t = useTheme();
  const { templates, loading, error } = useWorkoutTemplates();

  const intakeText = buildIntakeText(clientIntake);
  const matchedKeys = intakeText ? getSuggestedSplits(intakeText) : new Set<string>();
  const hasSuggestions = matchedKeys.size > 0;

  const [tab, setTab] = useState<'all' | 'suggested'>(hasSuggestions ? 'suggested' : 'all');

  const suggestedTemplates = templates.filter((tmpl) => {
    const key = `${tmpl.split ?? ''}|||${tmpl.subgroup ?? ''}`;
    return matchedKeys.has(key);
  });

  const groups = groupTemplates(templates);

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

      {/* Tab bar — only show when there are suggestions */}
      {hasSuggestions && (
        <View style={[styles.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'suggested' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab('suggested')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="star"
              size={13}
              color={tab === 'suggested' ? colors.primary : (t.textSecondary as string)}
            />
            <Text style={[styles.tabLabel, { color: tab === 'suggested' ? colors.primary : t.textSecondary }]}>
              Suggested ({suggestedTemplates.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'all' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, { color: tab === 'all' ? colors.primary : t.textSecondary }]}>
              All Templates
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : tab === 'suggested' && hasSuggestions ? (
        /* ── Suggested view ── */
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.suggestBanner, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '40' }]}>
            <Ionicons name="medical" size={14} color={colors.primary} />
            <Text style={[styles.suggestBannerText, { color: colors.primary }]}>
              Matched to this client's health conditions
            </Text>
          </View>
          {suggestedTemplates.map((tmpl) => (
            <TemplateCard key={tmpl.id} tmpl={tmpl} onSelect={onSelect} highlightSubgroup />
          ))}
        </ScrollView>
      ) : (
        /* ── All templates view ── */
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
                    <TemplateCard key={tmpl.id} tmpl={tmpl} onSelect={onSelect} />
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

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.xs,
  },
  tabLabel: { ...typography.bodySmall, fontWeight: '600' },

  suggestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  suggestBannerText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },

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
  cardMeta: { ...typography.bodySmall, marginTop: 2 },
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
