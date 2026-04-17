import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { generateWorkouts, type GeneratedWorkout, type WorkoutAIContext } from '@/lib/workoutAI';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, ClientIntake } from '@/types';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';
import type { WorkoutHistorySummary, PersonalRecordSummary } from '@/lib/nutritionAI';

// ─── Props ────────────────────────────────────────────────────

type Props = {
  /** Used to fetch workout history and personal records for richer context. */
  clientId?: string;
  client?: Client | null;
  intake?: ClientIntake | null;
  /** If provided, a "Use Now" button appears on each card. */
  onTemplateSelect?: (template: WorkoutTemplate) => void;
};

// ─── Data fetchers ────────────────────────────────────────────

async function fetchWorkoutSummaries(clientId: string): Promise<WorkoutHistorySummary[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id, performed_at,
      workout_sets (
        reps, weight_kg,
        exercise:exercises ( name, muscle_group )
      )
    `)
    .eq('client_id', clientId)
    .order('performed_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return (data as unknown[]).map((w: unknown) => {
    const row = w as {
      performed_at: string;
      workout_sets: Array<{
        reps: number | null;
        weight_kg: number | null;
        exercise: { name: string; muscle_group: string | null } | null;
      }>;
    };
    const exercises = new Set<string>();
    const muscles   = new Set<string>();
    let totalSets   = 0;
    let totalVol    = 0;
    for (const s of row.workout_sets ?? []) {
      totalSets++;
      if (s.exercise?.name)         exercises.add(s.exercise.name);
      if (s.exercise?.muscle_group) muscles.add(s.exercise.muscle_group);
      if (s.weight_kg && s.reps)    totalVol += s.weight_kg * s.reps;
    }
    return {
      performed_at:       row.performed_at,
      exercises:          Array.from(exercises),
      muscle_groups:      Array.from(muscles),
      total_sets:         totalSets,
      estimated_volume_kg: Math.round(totalVol),
    };
  });
}

async function fetchPRSummaries(clientId: string): Promise<PersonalRecordSummary[]> {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`id, max_weight_kg, max_reps, exercise:exercises ( name, muscle_group )`)
    .eq('client_id', clientId)
    .limit(20);

  if (error || !data) return [];

  return (data as unknown[]).map((r: unknown) => {
    const row = r as {
      max_weight_kg: number | null;
      max_reps: number | null;
      exercise: { name: string; muscle_group: string | null } | null;
    };
    return {
      exercise_name: row.exercise?.name ?? '',
      muscle_group:  row.exercise?.muscle_group ?? null,
      max_weight_kg: row.max_weight_kg,
      max_reps:      row.max_reps,
    };
  });
}

// ─── WorkoutCard ──────────────────────────────────────────────

function WorkoutCard({
  workout,
  index,
  onSave,
  onUse,
  saved,
  saving,
}: {
  workout: GeneratedWorkout;
  index: number;
  onSave: () => void;
  onUse?: () => void;
  saved: boolean;
  saving: boolean;
}) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header */}
      <View style={[styles.cardHeader, { borderBottomColor: t.border }]}>
        <View style={[styles.indexBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.indexBadgeText}>{index + 1}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]}>{workout.name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.pill, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>{workout.split}</Text>
            </View>
            {workout.subgroup ? (
              <View style={[styles.pill, { backgroundColor: t.border + 'CC' }]}>
                <Text style={[styles.pillText, { color: t.textSecondary }]}>{workout.subgroup}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Rationale */}
      <View style={[styles.rationaleBox, { backgroundColor: colors.primary + '0C', borderLeftColor: colors.primary }]}>
        <Ionicons name="sparkles-outline" size={13} color={colors.primary} style={styles.sparkle} />
        <Text style={[styles.rationaleText, { color: t.textSecondary }]}>{workout.rationale}</Text>
      </View>

      {/* Exercise list */}
      <View style={[styles.exerciseList, { borderColor: t.border }]}>
        {workout.exerciseNames.map((name, i) => (
          <View
            key={i}
            style={[
              styles.exerciseRow,
              i < workout.exerciseNames.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
            ]}
          >
            <Text style={[styles.exerciseNum, { color: t.textSecondary }]}>{i + 1}</Text>
            <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{name}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={[styles.cardFooter, { borderTopColor: t.border }]}>
        {onUse && (
          <TouchableOpacity
            style={[styles.useBtn, { borderColor: colors.primary }]}
            onPress={onUse}
            activeOpacity={0.7}
          >
            <Ionicons name="play-outline" size={14} color={colors.primary} />
            <Text style={[styles.useBtnText, { color: colors.primary }]}>Use Now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            saved
              ? { backgroundColor: colors.success }
              : { backgroundColor: colors.primary },
            saving && { opacity: 0.6 },
          ]}
          onPress={onSave}
          disabled={saving || saved}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : saved ? (
            <>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Saved to Templates</Text>
            </>
          ) : (
            <>
              <Ionicons name="bookmark-outline" size={14} color="#fff" />
              <Text style={styles.saveBtnText}>Save as Template</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────

export function GenerateTemplateModal({ clientId, client, intake, onTemplateSelect }: Props) {
  const t = useTheme();
  const { createTemplate } = useWorkoutTemplates();

  type Status = 'loading' | 'done' | 'error';
  const [status, setStatus]       = useState<Status>('loading');
  const [workouts, setWorkouts]   = useState<GeneratedWorkout[]>([]);
  const [errorMsg, setErrorMsg]   = useState('');
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [saved, setSaved]         = useState<Set<number>>(new Set());

  const generate = useCallback(async () => {
    setStatus('loading');
    setWorkouts([]);
    setSaved(new Set());
    try {
      let recentWorkouts: WorkoutHistorySummary[]  = [];
      let personalRecords: PersonalRecordSummary[] = [];

      if (clientId) {
        [recentWorkouts, personalRecords] = await Promise.all([
          fetchWorkoutSummaries(clientId),
          fetchPRSummaries(clientId),
        ]);
      }

      const dobMs    = client?.date_of_birth ? new Date(client.date_of_birth).getTime() : null;
      const ageYears = dobMs ? Math.floor((Date.now() - dobMs) / (365.25 * 24 * 3600 * 1000)) : null;

      const context: WorkoutAIContext = {
        client_name:                   client?.full_name ?? 'Client',
        goals:                         intake?.goals ?? null,
        goal_timeframe:                intake?.goal_timeframe ?? null,
        age:                           ageYears,
        gender:                        client?.gender ?? null,
        current_injuries:              intake?.current_injuries ?? null,
        past_injuries:                 intake?.past_injuries ?? null,
        chronic_conditions:            intake?.chronic_conditions ?? null,
        training_frequency_per_week:   intake?.training_frequency_per_week ?? null,
        typical_session_length_minutes: intake?.typical_session_length_minutes ?? null,
        activity_level:                intake?.activity_level ?? null,
        recent_workouts:               recentWorkouts.length  > 0 ? recentWorkouts  : null,
        personal_records:              personalRecords.length > 0 ? personalRecords : null,
      };

      const result = await generateWorkouts(context);
      setWorkouts(result);
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, [clientId, client, intake]);

  useEffect(() => { generate(); }, [generate]);

  async function handleSave(index: number) {
    const w = workouts[index];
    if (!w) return;
    setSavingIdx(index);
    const { error } = await createTemplate({
      name:          w.name,
      exerciseNames: w.exerciseNames,
      split:         w.split,
      subgroup:      w.subgroup,
    });
    setSavingIdx(null);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setSaved((prev) => new Set([...prev, index]));
    }
  }

  function handleUse(index: number) {
    const w = workouts[index];
    if (!w || !onTemplateSelect) return;
    onTemplateSelect({
      id:            `generated-${index}`,
      name:          w.name,
      exerciseNames: w.exerciseNames,
      split:         w.split,
      subgroup:      w.subgroup,
    });
  }

  // ── Loading ──────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadTitle, { color: t.textPrimary }]}>Analysing client data…</Text>
        <Text style={[styles.loadSub, { color: t.textSecondary }]}>
          Reviewing workout history, goals, and injury profile to generate personalised workouts
        </Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.loadTitle, { color: t.textPrimary }]}>Generation failed</Text>
        <Text style={[styles.loadSub, { color: t.textSecondary }]}>{errorMsg}</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={generate}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Results ──────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {/* AI banner */}
      <View style={[styles.aiBanner, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '44' }]}>
        <Ionicons name="sparkles" size={13} color={colors.primary} />
        <Text style={[styles.aiBannerText, { color: colors.primary }]}>
          Generated from {client?.full_name?.split(' ')[0] ?? 'this client'}'s goals, history & injury profile
        </Text>
      </View>

      {workouts.map((w, i) => (
        <WorkoutCard
          key={i}
          workout={w}
          index={i}
          onSave={() => handleSave(i)}
          onUse={onTemplateSelect ? () => handleUse(i) : undefined}
          saved={saved.has(i)}
          saving={savingIdx === i}
        />
      ))}

      <TouchableOpacity
        style={[styles.regenerateBtn, { borderColor: t.border }]}
        onPress={generate}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={16} color={t.textSecondary as string} />
        <Text style={[styles.regenerateBtnText, { color: t.textSecondary }]}>Regenerate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Loading / error centre pane
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadTitle: { ...typography.heading3, fontWeight: '700', textAlign: 'center' },
  loadSub:   { ...typography.body, textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.full, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  retryBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },

  // Scroll container
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  // AI banner
  aiBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  aiBannerText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },

  // Card
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },

  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  indexBadge: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  indexBadgeText: { ...typography.label, color: '#fff', fontWeight: '800' },
  cardHeaderText: { flex: 1, gap: 6 },
  cardTitle: { ...typography.body, fontWeight: '700' },

  badgeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  pillText: { ...typography.label, fontWeight: '600' },

  // Rationale
  rationaleBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs,
    borderLeftWidth: 3, marginHorizontal: spacing.md, marginVertical: spacing.sm,
    paddingLeft: spacing.sm, paddingVertical: spacing.xs,
  },
  sparkle:      { marginTop: 2, flexShrink: 0 },
  rationaleText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  // Exercises
  exerciseList: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderRadius: radius.sm, overflow: 'hidden',
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  exerciseNum:  { ...typography.bodySmall, width: 20, textAlign: 'right' },
  exerciseName: { ...typography.body, flex: 1 },

  // Footer actions
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1,
  },
  useBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  useBtnText:  { ...typography.bodySmall, fontWeight: '600' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: radius.full,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  saveBtnText: { ...typography.bodySmall, color: '#fff', fontWeight: '700' },

  // Regenerate
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.full,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
    alignSelf: 'center',
  },
  regenerateBtnText: { ...typography.bodySmall, fontWeight: '600' },
});
