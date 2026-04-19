import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert, BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { TemplatePicker } from '@/components/workout/TemplatePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAssignedWorkoutDetail, updateAssignedWorkout, deleteAssignedWorkout } from '@/hooks/useAssignedWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal';
import type { Exercise } from '@/types';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

function normalizeExerciseName(name: string): string {
  return name
    .replace(/\s+\d+\s*[×x]\s*\S+.*/i, '')          // "3×12", "3×8/side"
    .replace(/\s+\d+[-–\d]*\s*(reps?|sets?|sec(onds?)?|min(utes?)?|yards?|rounds?|holds?|times?)\b.*/gi, '') // "10 reps", "45 sec"
    .replace(/\s*\([^)]+\)\s*$/g, '')                 // trailing "(warm-up)"
    .trim()
    .toLowerCase();
}

const SUPERSET_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
function getSupersetColor(group: number): string {
  return SUPERSET_COLORS[(group - 1) % SUPERSET_COLORS.length];
}

type WeightUnit = 'lbs' | 'kg' | 'secs';
type SetRow = { reps: string; amount: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[]; linkedToNext: boolean; unit: WeightUnit; restSecs: number };

const UNITS: WeightUnit[] = ['lbs', 'kg', 'secs'];
function nextUnit(u: WeightUnit): WeightUnit { return UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]; }
function resolveAmount(raw: string, unit: WeightUnit): { weight_kg: number | null; duration_seconds: number | null } {
  if (!raw.trim()) return { weight_kg: null, duration_seconds: null };
  const n = parseFloat(raw);
  if (isNaN(n)) return { weight_kg: null, duration_seconds: null };
  if (unit === 'secs') return { weight_kg: null, duration_seconds: Math.round(n) };
  return { weight_kg: unit === 'lbs' ? n * 0.453592 : n, duration_seconds: null };
}

const EMPTY_SET: SetRow = { reps: '', amount: '', notes: '' };
const EMPTY_BLOCK = (exercise: Exercise): ExerciseBlock =>
  ({ exercise, sets: [{ ...EMPTY_SET }], linkedToNext: false, unit: 'lbs', restSecs: 120 });

const REST_PRESETS = [0, 30, 60, 90, 120, 150, 180] as const;

function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function EditAssignedWorkoutScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const navigation = useNavigation();
  const t = useTheme();
  const [isDirty, setIsDirty] = useState(false);
  const { exercises: allExercises } = useExercises();
  const { assignedWorkout, loading, error } = useAssignedWorkoutDetail(id);

  const [initialized, setInitialized] = useState(false);
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  async function performDelete() {
    setIsDeleting(true);
    const { error: delErr } = await deleteAssignedWorkout(id ?? '');
    setIsDeleting(false);
    if (delErr) { setDeleteError(delErr); return; }
    setIsDirty(false);
    router.back();
  }

  // Populate state once the assigned workout loads
  useEffect(() => {
    if (!assignedWorkout || initialized) return;
    setTitle(assignedWorkout.title ?? '');
    setScheduledDate(assignedWorkout.scheduled_date);
    setWorkoutNotes(assignedWorkout.notes ?? '');

    const loaded: ExerciseBlock[] = assignedWorkout.exercises.map((ex, i) => {
      const next = assignedWorkout.exercises[i + 1];
      const linkedToNext =
        ex.superset_group != null && next != null && next.superset_group === ex.superset_group;
      // Infer unit from stored data: secs if duration_seconds, kg if weight_kg, else default lbs
      const firstSet = ex.sets[0];
      const unit: WeightUnit =
        firstSet?.duration_seconds != null ? 'secs' :
        firstSet?.weight_kg != null ? 'kg' :
        'lbs';
      return {
        exercise: ex.exercise,
        sets: ex.sets.length > 0
          ? ex.sets.map((s) => ({
              reps: s.reps != null ? String(s.reps) : '',
              amount: s.duration_seconds != null ? String(s.duration_seconds)
                    : s.weight_kg != null ? String(s.weight_kg)
                    : '',
              notes: s.notes ?? '',
            }))
          : [{ ...EMPTY_SET }],
        linkedToNext,
        unit,
        restSecs: ex.rest_seconds ?? 120,
      };
    });
    setBlocks(loaded);
    setInitialized(true);
  }, [assignedWorkout, initialized]);

  function updateBlockUnit(bi: number, unit: WeightUnit) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, unit } : b));
  }

  function updateBlockRestSecs(bi: number, secs: number) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, restSecs: secs } : b));
  }

  function addExercise(exercise: Exercise) {
    setIsDirty(true);
    setBlocks((prev) => [...prev, EMPTY_BLOCK(exercise)]);
  }

  function removeBlock(bi: number) {
    setIsDirty(true);
    setBlocks((prev) => {
      const next = prev.filter((_, i) => i !== bi);
      if (bi > 0 && prev[bi - 1].linkedToNext && bi === prev.length - 1) {
        return next.map((b, i) => i === bi - 1 ? { ...b, linkedToNext: false } : b);
      }
      return next;
    });
  }

  function addSet(bi: number) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b)
    );
  }

  function updateSet(bi: number, si: number, field: keyof SetRow, value: string) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b
      )
    );
  }

  function removeSet(bi: number, si: number) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b)
    );
  }

  function toggleLink(bi: number) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, linkedToNext: !b.linkedToNext } : b));
  }

  function handleSelectTemplate(template: WorkoutTemplate) {
    const matched: ExerciseBlock[] = [];
    const skipped: string[] = [];
    for (const name of template.exerciseNames) {
      const exercise = allExercises.find(
        (e) => normalizeExerciseName(e.name) === normalizeExerciseName(name)
      );
      if (exercise) matched.push(EMPTY_BLOCK(exercise));
      else skipped.push(name);
    }
    const apply = () => {
      setIsDirty(true);
      setBlocks(matched);
      setShowTemplatePicker(false);
      if (skipped.length > 0) {
        Alert.alert(
          'Some exercises not found',
          `The following exercises aren't in your library yet and were skipped:\n\n${skipped.join('\n')}`,
          [{ text: 'OK' }],
        );
      }
    };
    if (blocks.length > 0) {
      Alert.alert(
        'Replace current workout?',
        `Loading "${template.name}" will replace the ${blocks.length} exercise${blocks.length !== 1 ? 's' : ''} you've already added.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: apply },
        ],
      );
    } else {
      apply();
    }
  }

  // Returns null on success, error string on failure
  const performSave = useCallback(async (): Promise<string | null> => {
    if (blocks.length === 0) {
      Alert.alert('No exercises', 'Add at least one exercise before saving.');
      return 'no exercises';
    }

    let groupCounter = 0;
    const blockGroups: (number | null)[] = new Array(blocks.length).fill(null);
    for (let i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].linkedToNext) {
        if (blockGroups[i] === null) blockGroups[i] = ++groupCounter;
        blockGroups[i + 1] = blockGroups[i];
      }
    }

    const exercises = blocks.map((b, bi) => ({
      exercise_id: b.exercise.id,
      order_index: bi,
      superset_group: blockGroups[bi],
      rest_seconds: b.restSecs,
      sets: b.sets
        .filter((s) => s.reps.trim() !== '' || s.amount.trim() !== '')
        .map((s, si) => ({
          set_number: si + 1,
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          ...resolveAmount(s.amount, b.unit),
          notes: s.notes.trim() || null,
        })),
    }));

    setSaving(true);
    const { error: saveErr } = await updateAssignedWorkout(id, {
      title: title.trim() || null,
      scheduled_date: scheduledDate,
      notes: workoutNotes.trim() || null,
      exercises,
    });
    setSaving(false);
    if (saveErr) { Alert.alert('Error', saveErr); return saveErr; }
    setIsDirty(false);
    return null;
  }, [blocks, id, title, scheduledDate, workoutNotes]);

  const handleSave = useCallback(async () => {
    const err = await performSave();
    if (!err) router.back();
  }, [performSave, router]);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleBackPress = useCallback(() => {
    if (!isDirty) { router.back(); return; }
    setShowUnsavedModal(true);
  }, [isDirty, router]);

  // Keep header back button and gesture guard in sync with dirty state
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isDirty,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [isDirty, handleBackPress, navigation]);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      handleBackPress();
      return true;
    });
    return () => sub.remove();
  }, [isDirty, handleBackPress]);

  // ── Template picker ──
  if (showTemplatePicker) {
    return (
      <TemplatePicker
        onSelect={handleSelectTemplate}
        onClose={() => setShowTemplatePicker(false)}
      />
    );
  }

  // ── Exercise picker ──
  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={(exercise) => { addExercise(exercise); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    );
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

  // Compute superset group display colors
  const displayGroups: (number | null)[] = new Array(blocks.length).fill(null);
  let _gc = 0;
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].linkedToNext) {
      if (displayGroups[i] === null) displayGroups[i] = ++_gc;
      displayGroups[i + 1] = displayGroups[i];
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Assigned Workout',
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.textPrimary,
          headerTitleStyle: { fontWeight: '700' as const },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => { setConfirmingDelete(true); setDeleteError(null); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerBtn}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Workout Title</Text>
          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="e.g. Upper Body A"
            placeholderTextColor={t.textSecondary}
            value={title}
            onChangeText={(v) => { setIsDirty(true); setTitle(v); }}
          />
          <TouchableOpacity
            style={styles.dateTouchable}
            onPress={() => setShowCalendar((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Scheduled Date</Text>
            <View style={styles.dateTouchableRight}>
              <Text style={[styles.dateLabel, { color: t.textPrimary }]}>
                {scheduledDate ? formatDate(scheduledDate) : '—'}
              </Text>
              <Ionicons
                name={showCalendar ? 'calendar' : 'calendar-outline'}
                size={18}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>
          {showCalendar && scheduledDate && (
            <DatePicker
              value={scheduledDate}
              onChange={(d) => { setIsDirty(true); setScheduledDate(d); setShowCalendar(false); }}
            />
          )}
          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Instructions for client (optional)"
            placeholderTextColor={t.textSecondary}
            value={workoutNotes}
            onChangeText={(v) => { setIsDirty(true); setWorkoutNotes(v); }}
            multiline
          />
        </View>

        {blocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
            <Text style={[styles.emptyStateText, { color: t.textSecondary }]}>No exercises added yet</Text>
            <Text style={[styles.emptyStateHint, { color: t.textSecondary }]}>
              Load a template or add exercises manually below
            </Text>
          </View>
        )}

        {blocks.map((block, bi) => {
          const isLinkedToNext = block.linkedToNext;
          const isLinkedFromPrev = bi > 0 && blocks[bi - 1].linkedToNext;
          const group = displayGroups[bi];
          const supersetColor = group !== null ? getSupersetColor(group) : null;

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
                    <Text style={[styles.blockName, { color: t.textPrimary }]}>{block.exercise.name}</Text>
                    {block.exercise.muscle_group
                      ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.exercise.muscle_group}</Text>
                      : null}
                  </View>
                  <View style={styles.blockHeaderActions}>
                    {bi < blocks.length - 1 && (
                      <TouchableOpacity onPress={() => toggleLink(bi)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons
                          name={isLinkedToNext ? 'link' : 'link-outline'}
                          size={18}
                          color={isLinkedToNext && supersetColor ? supersetColor : t.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeBlock(bi)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
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

                {/* ── Rest timer prescription ── */}
                <View style={styles.restRow}>
                  <View style={styles.restRowLeft}>
                    <Ionicons name="timer-outline" size={14} color={t.textSecondary as string} />
                    <Text style={[styles.restRowLabel, { color: t.textSecondary }]}>Rest</Text>
                  </View>
                  <View style={styles.restPresets}>
                    {REST_PRESETS.map((secs) => {
                      const active = block.restSecs === secs;
                      return (
                        <TouchableOpacity
                          key={secs}
                          style={[
                            styles.restPresetBtn,
                            { borderColor: active ? colors.primary : t.border },
                            active && styles.restPresetBtnActive,
                          ]}
                          onPress={() => updateBlockRestSecs(bi, secs)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.restPresetText, { color: active ? colors.textInverse : t.textSecondary }]}>
                            {fmtCountdown(secs)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.addExerciseBtn, styles.actionFlex, { borderColor: colors.primary }]} onPress={() => setShowPicker(true)}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.templateBtn, styles.actionFlex]} onPress={() => setShowTemplatePicker(true)}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={styles.addExerciseBtnText}>Use Template</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!confirmingDelete && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.saveBtn, styles.footerFlex, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
          {assignedWorkout?.status === 'assigned' && (
            <TouchableOpacity
              style={[styles.completeBtn]}
              onPress={() => {
                if (isDirty) {
                  Alert.alert(
                    'Unsaved Changes',
                    'You have unsaved changes. Save before completing?',
                    [
                      { text: 'Discard & Continue', style: 'destructive', onPress: () => { setIsDirty(false); router.push(`/workout/assigned/complete/${id}` as never); } },
                      { text: 'Save & Continue', onPress: async () => { const err = await performSave(); if (!err) router.push(`/workout/assigned/complete/${id}` as never); } },
                    ],
                  );
                } else {
                  router.push(`/workout/assigned/complete/${id}` as never);
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
              <Text style={styles.saveBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {confirmingDelete && (
        <View style={[styles.deleteBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.deleteBarText, { color: t.textPrimary }]}>
            Delete this assigned workout?
          </Text>
          {deleteError ? <Text style={styles.deleteBarError}>{deleteError}</Text> : null}
          <View style={styles.deleteBarButtons}>
            <TouchableOpacity
              onPress={() => { setConfirmingDelete(false); setDeleteError(null); }}
              style={[styles.deleteCancelBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.deleteCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={performDelete}
              disabled={isDeleting}
              style={[styles.deleteConfirmBtn, isDeleting && styles.saveBtnDisabled]}
            >
              {isDeleting
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.deleteConfirmText}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
      <UnsavedChangesModal
        visible={showUnsavedModal}
        saveLabel="Save Changes"
        onDiscard={() => { setShowUnsavedModal(false); setIsDirty(false); router.back(); }}
        onSave={() => { setShowUnsavedModal(false); handleSave(); }}
        onKeepEditing={() => setShowUnsavedModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBtn: { marginRight: spacing.sm },
  errorText: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing.lg },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1 },
  dateTouchable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateTouchableRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateLabel: { ...typography.body, fontWeight: '600' },
  metricLabel: { ...typography.label },
  notesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 40,
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyStateText: { ...typography.heading3 },
  emptyStateHint: { ...typography.bodySmall },
  blockCard: {
    marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden', gap: spacing.xs, paddingBottom: spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  blockHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  blockName: { ...typography.body, fontWeight: '600' },
  exerciseInfo: { flex: 1 },
  muscleGroup: { ...typography.bodySmall, marginTop: 2 },
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
  restRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm, paddingTop: spacing.xs, paddingHorizontal: spacing.md },
  restRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  restRowLabel: { ...typography.label },
  restPresets: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', flex: 1 },
  restPresetBtn: { paddingVertical: 3, paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1 },
  restPresetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  restPresetText: { ...typography.label, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md },
  actionFlex: { flex: 1, marginHorizontal: 0 },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs,
  },
  templateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.primary, gap: spacing.xs,
  },
  addExerciseBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  footerRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginVertical: spacing.md },
  footerFlex: { flex: 1, margin: 0 },
  saveBtn: { margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  completeBtn: { backgroundColor: colors.success, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  deleteBar: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  deleteBarText: { ...typography.body },
  deleteBarError: { ...typography.bodySmall, color: colors.error },
  deleteBarButtons: { flexDirection: 'row', gap: spacing.sm },
  deleteCancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1 },
  deleteCancelText: { ...typography.body },
  deleteConfirmBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.error },
  saveSuccessBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  deleteConfirmText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  supersetConnector: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md + 3,
    marginVertical: 2, gap: spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetBadge: { ...typography.label, fontWeight: '700', letterSpacing: 1 },
});
