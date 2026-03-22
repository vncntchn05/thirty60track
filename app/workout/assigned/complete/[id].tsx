import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAssignedWorkoutDetail, completeAssignedWorkout } from '@/hooks/useAssignedWorkouts';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { InsertWorkoutSet } from '@/types';

const SUPERSET_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
function getSupersetColor(group: number): string {
  return SUPERSET_COLORS[(group - 1) % SUPERSET_COLORS.length];
}

type WeightUnit = 'lbs' | 'kg' | 'secs';
type ExecuteSetRow = { reps: string; amount: string; notes: string };
type ExecuteBlock = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string | null;
  supersetGroup: number | null;
  sets: ExecuteSetRow[];
  unit: WeightUnit;
};

const UNITS: WeightUnit[] = ['lbs', 'kg', 'secs'];
function nextUnit(u: WeightUnit): WeightUnit { return UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]; }
function resolveAmount(raw: string, unit: WeightUnit): { weight_kg: number | null; duration_seconds: number | null } {
  if (!raw.trim()) return { weight_kg: null, duration_seconds: null };
  const n = parseFloat(raw);
  if (isNaN(n)) return { weight_kg: null, duration_seconds: null };
  if (unit === 'secs') return { weight_kg: null, duration_seconds: Math.round(n) };
  return { weight_kg: unit === 'lbs' ? n * 0.453592 : n, duration_seconds: null };
}

function formatScheduledDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function CompleteAssignedWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { role } = useAuth();
  const isTrainer = role === 'trainer';
  const { assignedWorkout, loading, error } = useAssignedWorkoutDetail(id);
  const [blocks, setBlocks] = useState<ExecuteBlock[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Pre-fill blocks from trainer's prescribed sets (assigned_workout_sets)
  useEffect(() => {
    if (!assignedWorkout || initialized) return;
    const loaded: ExecuteBlock[] = assignedWorkout.exercises.map((ex) => {
      const firstSet = ex.sets[0];
      const unit: WeightUnit =
        firstSet?.duration_seconds != null ? 'secs' :
        firstSet?.weight_kg != null ? 'kg' :
        'lbs';
      return {
        exerciseId: ex.exercise_id,
        exerciseName: ex.exercise.name,
        muscleGroup: ex.exercise.muscle_group,
        supersetGroup: ex.superset_group,
        unit,
        sets: ex.sets.length > 0
          ? ex.sets.map((s) => ({
              reps: s.reps != null ? String(s.reps) : '',
              amount: s.duration_seconds != null ? String(s.duration_seconds)
                    : s.weight_kg != null ? String(s.weight_kg)
                    : '',
              notes: s.notes ?? '',
            }))
          : [{ reps: '', amount: '', notes: '' }],
      };
    });
    setBlocks(loaded);
    setInitialized(true);
  }, [assignedWorkout, initialized]);

  function updateSet(bi: number, si: number, field: keyof ExecuteSetRow, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi
          ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) }
          : b
      )
    );
  }

  function updateBlockUnit(bi: number, unit: WeightUnit) {
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, unit } : b));
  }

  function addSet(bi: number) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: [...b.sets, { reps: '', amount: '', notes: '' }] } : b
      )
    );
  }

  function removeSet(bi: number, si: number) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b
      )
    );
  }

  async function performComplete() {
    const clientActualSets: Omit<InsertWorkoutSet, 'workout_id'>[] = blocks.flatMap((b) =>
      b.sets
        .filter((s) => s.reps !== '' || s.amount !== '')
        .map((s, si) => ({
          exercise_id: b.exerciseId,
          set_number: si + 1,
          reps: s.reps ? parseInt(s.reps, 10) : null,
          ...resolveAmount(s.amount, b.unit),
          notes: s.notes.trim() || null,
          superset_group: b.supersetGroup,
        }))
    );

    if (clientActualSets.length === 0) {
      setCompleteError('Enter at least one set before completing.');
      return;
    }

    setCompleting(true);
    setCompleteError(null);
    const { error: completeErr } = await completeAssignedWorkout(
      id,
      clientActualSets,
      isTrainer ? 'trainer' : 'client',
    );
    setCompleting(false);

    if (completeErr) {
      setCompleteError(completeErr);
    } else if (isTrainer && assignedWorkout) {
      router.replace(`/client/${assignedWorkout.client_id}` as never);
    } else {
      router.replace('/(client)' as never);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !assignedWorkout) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error ?? 'Workout not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: assignedWorkout.title ?? 'Workout',
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.textPrimary,
          headerTitleStyle: { fontWeight: '700' as const },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Workout header */}
        <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.workoutTitle, { color: t.textPrimary }]}>
            {assignedWorkout.title ?? 'Untitled Workout'}
          </Text>
          <Text style={[styles.workoutDate, { color: t.textSecondary }]}>
            {formatScheduledDate(assignedWorkout.scheduled_date)}
          </Text>
          {assignedWorkout.notes ? (
            <Text style={[styles.workoutNotes, { color: t.textSecondary }]}>{assignedWorkout.notes}</Text>
          ) : null}
        </View>

        {/* Exercise blocks */}
        {blocks.map((block, bi) => {
          const supersetColor = block.supersetGroup != null ? getSupersetColor(block.supersetGroup) : null;
          const prevBlock = bi > 0 ? blocks[bi - 1] : null;
          const isLinkedFromPrev = prevBlock?.supersetGroup != null && prevBlock.supersetGroup === block.supersetGroup;

          return (
            <View key={bi}>
              {isLinkedFromPrev && supersetColor && (
                <View style={styles.supersetConnector}>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                  <Text style={[styles.supersetBadge, { color: supersetColor }]}>SUPERSET</Text>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                </View>
              )}

              <View style={[
                styles.blockCard,
                { backgroundColor: t.surface, borderColor: t.border },
                supersetColor !== null && { borderLeftWidth: 3, borderLeftColor: supersetColor },
              ]}>
                <View style={[styles.blockHeader, { backgroundColor: t.background, borderBottomColor: t.border }]}>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.blockName, { color: t.textPrimary }]}>{block.exerciseName}</Text>
                    {block.muscleGroup
                      ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.muscleGroup}</Text>
                      : null}
                  </View>
                </View>

                <View style={styles.colHeader}>
                  <Text style={[styles.colLabel, styles.colSet, { color: t.textSecondary }]}>Set</Text>
                  <Text style={[styles.colLabel, styles.colReps, { color: t.textSecondary }]}>Reps</Text>
                  <TouchableOpacity style={[styles.colWeight, styles.unitToggle]} onPress={() => updateBlockUnit(bi, nextUnit(block.unit))}>
                    <Text style={[styles.colLabel, { color: colors.primary }]}>{block.unit} ⟳</Text>
                  </TouchableOpacity>
                  <Text style={[styles.colLabel, styles.colNotes, { color: t.textSecondary }]}>Notes</Text>
                  <View style={styles.colRemove} />
                </View>

                {block.sets.map((s, si) => (
                  <View key={si} style={styles.setRow}>
                    <Text style={[styles.setNumber, styles.colSet, { color: t.textSecondary }]}>{si + 1}</Text>
                    <TextInput
                      style={[styles.setInput, styles.colReps, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                      placeholder="0" placeholderTextColor={t.textSecondary}
                      keyboardType="number-pad" value={s.reps}
                      onChangeText={(v) => updateSet(bi, si, 'reps', v)}
                    />
                    <TextInput
                      style={[styles.setInput, styles.colWeight, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                      placeholder={block.unit === 'secs' ? '0' : '0.0'} placeholderTextColor={t.textSecondary}
                      keyboardType={block.unit === 'secs' ? 'number-pad' : 'decimal-pad'} value={s.amount}
                      onChangeText={(v) => updateSet(bi, si, 'amount', v)}
                    />
                    <TextInput
                      style={[styles.setInput, styles.colNotes, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                      placeholder="—" placeholderTextColor={t.textSecondary}
                      value={s.notes} onChangeText={(v) => updateSet(bi, si, 'notes', v)}
                    />
                    <TouchableOpacity
                      style={[styles.colRemove, block.sets.length === 1 && styles.invisible]}
                      onPress={() => removeSet(bi, si)}
                      disabled={block.sets.length === 1}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(bi)}>
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.addSetBtnText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {confirming ? (
        <View style={[styles.confirmBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.confirmBarText, { color: t.textPrimary }]}>
            {isTrainer
              ? 'Log this workout for the client?'
              : 'Save this workout to your log?'}
          </Text>
          {completeError ? (
            <Text style={styles.confirmBarError}>{completeError}</Text>
          ) : null}
          <View style={styles.confirmBarButtons}>
            <TouchableOpacity
              onPress={() => { setConfirming(false); setCompleteError(null); }}
              style={[styles.cancelBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={performComplete}
              disabled={completing}
              style={[styles.confirmCompleteBtn, completing && styles.completeBtnDisabled]}
            >
              {completing
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.confirmCompleteBtnText}>Complete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
          onPress={() => { if (isTrainer) { setCompleteError(null); performComplete(); } else { setConfirming(true); setCompleteError(null); } }}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
          <Text style={styles.completeBtnText}>Complete Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBtn: { marginRight: spacing.sm },
  errorText: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.lg },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl + 72 },

  // ── Workout header card ──
  headerCard: {
    padding: spacing.md, borderBottomWidth: 1, gap: spacing.xs,
  },
  workoutTitle: { ...typography.heading3 },
  workoutDate: { ...typography.bodySmall },
  workoutNotes: { ...typography.body, fontStyle: 'italic' },

  // ── Exercise blocks ──
  blockCard: {
    marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden', gap: spacing.xs, paddingBottom: spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  exerciseInfo: { flex: 1 },
  blockName: { ...typography.body, fontWeight: '600' },
  muscleGroup: { ...typography.bodySmall, marginTop: 2 },

  // ── Set columns ──
  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.xs,
  },
  colLabel: { ...typography.label, textAlign: 'center' },
  colSet: { width: 32 }, colReps: { width: 56 }, colWeight: { width: 68 },
  unitToggle: { alignItems: 'center', justifyContent: 'center' },
  colNotes: { flex: 1 }, colRemove: { width: 28, alignItems: 'center' },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.xs,
  },
  setNumber: { ...typography.label, textAlign: 'center' },
  setInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.xs,
    height: 40, textAlign: 'center',
  },
  invisible: { opacity: 0 },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginHorizontal: spacing.md, marginTop: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, gap: spacing.xs,
  },
  addSetBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  // ── Superset connector ──
  supersetConnector: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md + 3, marginVertical: 2, gap: spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetBadge: { ...typography.label, fontWeight: '700', letterSpacing: 1 },

  // ── Complete button / confirmation bar ──
  completeBtn: {
    margin: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md,
  },
  completeBtnDisabled: { opacity: 0.6 },
  completeBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  confirmBar: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  confirmBarText: { ...typography.body },
  confirmBarError: { ...typography.bodySmall, color: colors.error },
  confirmBarButtons: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1 },
  cancelBtnText: { ...typography.body },
  confirmCompleteBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  confirmCompleteBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
