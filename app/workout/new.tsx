import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { TemplatePicker } from '@/components/workout/TemplatePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { createAssignedWorkout } from '@/hooks/useAssignedWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise } from '@/types';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

const SUPERSET_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
function getSupersetColor(group: number): string {
  return SUPERSET_COLORS[(group - 1) % SUPERSET_COLORS.length];
}

type Mode = 'log' | 'assign';
type WeightUnit = 'lbs' | 'kg' | 'secs';
type SetRow = { reps: string; amount: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[]; linkedToNext: boolean; unit: WeightUnit };

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
  ({ exercise, sets: [{ ...EMPTY_SET }], linkedToNext: false, unit: 'lbs' });

function formatDate(iso: string) {
  // Avoid timezone shift by parsing as local date
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function NewWorkoutScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTheme();
  const { exercises: allExercises } = useExercises();
  const { clients } = useClients();
  // ── mode ──
  const [mode, setMode] = useState<Mode>('log');
  // ── log-now state ──
  const [workedOutWith, setWorkedOutWith] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  // ── assign-for-later state ──
  const [scheduledDate, setScheduledDate] = useState(getTomorrow);
  const [showScheduledCalendar, setShowScheduledCalendar] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [assignedClients, setAssignedClients] = useState<Set<string>>(() => {
    const id = Array.isArray(clientId) ? clientId[0] : clientId;
    return id ? new Set([id]) : new Set();
  });
  // ── shared state ──
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function addExercise(exercise: Exercise) {
    setBlocks((prev) => [...prev, EMPTY_BLOCK(exercise)]);
  }

  function removeBlock(bi: number) {
    setBlocks((prev) => {
      const next = prev.filter((_, i) => i !== bi);
      // If the removed block was linked to next, unlink the previous block
      if (bi > 0 && prev[bi - 1].linkedToNext && bi === prev.length - 1) {
        return next.map((b, i) => i === bi - 1 ? { ...b, linkedToNext: false } : b);
      }
      return next;
    });
  }

  function addSet(bi: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b)
    );
  }

  function updateBlockUnit(bi: number, unit: WeightUnit) {
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, unit } : b));
  }

  function updateSet(bi: number, si: number, field: keyof SetRow, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b
      )
    );
  }

  function removeSet(bi: number, si: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b)
    );
  }

  function toggleLink(bi: number) {
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, linkedToNext: !b.linkedToNext } : b));
  }

  function isInSuperset(bi: number): boolean {
    return blocks[bi].linkedToNext || (bi > 0 && blocks[bi - 1].linkedToNext);
  }

  function handleSelectTemplate(template: WorkoutTemplate) {
    const matched: ExerciseBlock[] = [];
    const skipped: string[] = [];

    for (const name of template.exerciseNames) {
      const exercise = allExercises.find(
        (e) => e.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (exercise) {
        matched.push(EMPTY_BLOCK(exercise));
      } else {
        skipped.push(name);
      }
    }

    const apply = () => {
      setBlocks(matched);
      setShowTemplatePicker(false);
      if (skipped.length > 0) {
        Alert.alert(
          'Some exercises not found',
          `The following exercises aren't in your library yet and were skipped:\n\n${skipped.join('\n')}\n\nYou can add them manually.`,
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

  async function handleAssign() {
    if (!user) { Alert.alert('Not signed in', 'Please sign in to assign workouts.'); return; }
    if (assignedClients.size === 0) { Alert.alert('No clients selected', 'Select at least one client to assign this workout to.'); return; }
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before assigning.'); return; }

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
    try {
      const results = await Promise.all(
        [...assignedClients].map((cid) =>
          createAssignedWorkout(cid, user.id, {
            title: workoutTitle.trim() || null,
            scheduled_date: scheduledDate,
            notes: workoutNotes.trim() || null,
            exercises,
          })
        )
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        Alert.alert('Error saving assigned workout', firstError);
      } else {
        router.back();
      }
    } catch (e) {
      Alert.alert('Unexpected error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!user || !clientId) return;
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before saving.'); return; }

    // Compute superset_group per block using linkedToNext chain
    let groupCounter = 0;
    const blockGroups: (number | null)[] = new Array(blocks.length).fill(null);
    for (let i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].linkedToNext) {
        if (blockGroups[i] === null) blockGroups[i] = ++groupCounter;
        blockGroups[i + 1] = blockGroups[i];
      }
    }

    const allSets = blocks.flatMap((b, bi) =>
      b.sets
        .filter((s) => s.reps.trim() !== '' || s.amount.trim() !== '')
        .map((s, si) => ({
          exercise_id: b.exercise.id,
          set_number: si + 1,
          superset_group: blockGroups[bi],
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          ...resolveAmount(s.amount, b.unit),
          notes: s.notes.trim() || null,
        }))
    );
    if (allSets.length === 0) { Alert.alert('No sets entered', 'Add at least one set with reps or weight.'); return; }

    const wVal = bodyWeight.trim() ? parseFloat(bodyWeight) : NaN;
    const bfVal = bodyFat.trim() ? parseFloat(bodyFat) : NaN;

    setSaving(true);
    const { error } = await createWorkoutWithSets(
      {
        client_id: clientId,
        trainer_id: user.id,
        performed_at: date,
        notes: workoutNotes.trim() || null,
        body_weight_kg: !isNaN(wVal) && wVal > 0 ? wVal : null,
        body_fat_percent: !isNaN(bfVal) && bfVal >= 0 && bfVal < 100 ? bfVal : null,
      },
      allSets,
      [...workedOutWith],
    );
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else router.back();
  }

  // ── Template picker ───────────────────────────────────────────────
  if (showTemplatePicker) {
    return (
      <TemplatePicker
        onSelect={handleSelectTemplate}
        onClose={() => setShowTemplatePicker(false)}
      />
    );
  }

  // ── Exercise picker ───────────────────────────────────────────────
  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={(exercise) => { addExercise(exercise); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    );
  }

  // Compute superset group numbers for display coloring
  const displayGroups: (number | null)[] = new Array(blocks.length).fill(null);
  let _gc = 0;
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].linkedToNext) {
      if (displayGroups[i] === null) displayGroups[i] = ++_gc;
      displayGroups[i + 1] = displayGroups[i];
    }
  }

  // ── Workout builder ───────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          title: mode === 'log' ? 'Log Workout' : 'Assign Workout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.replace('/(tabs)/' as never)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="home-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          {/* ── Mode toggle ── */}
          <View style={[styles.modeToggle, { backgroundColor: t.background, borderColor: t.border }]}>
            {(['log', 'assign'] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeBtn, active && styles.modeBtnActive]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeBtnText, { color: active ? colors.textInverse : t.textSecondary }]}>
                    {m === 'log' ? 'Log Now' : 'Assign for Later'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mode === 'log' ? (
            <>
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setShowCalendar((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{formatDate(date)}</Text>
                <Ionicons
                  name={showCalendar ? 'calendar' : 'calendar-outline'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              {showCalendar && (
                <DatePicker
                  value={date}
                  onChange={(d) => { setDate(d); setShowCalendar(false); }}
                />
              )}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body weight (kg)</Text>
                  <TextInput
                    style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                    placeholder="Optional"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="decimal-pad"
                    value={bodyWeight}
                    onChangeText={setBodyWeight}
                  />
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body fat (%)</Text>
                  <TextInput
                    style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                    placeholder="Optional"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="decimal-pad"
                    value={bodyFat}
                    onChangeText={setBodyFat}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Workout Title</Text>
              <TextInput
                style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
                placeholder="e.g. Upper Body A"
                placeholderTextColor={t.textSecondary}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
              />
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setShowScheduledCalendar((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Scheduled Date</Text>
                <View style={styles.dateTouchableRight}>
                  <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{formatDate(scheduledDate)}</Text>
                  <Ionicons
                    name={showScheduledCalendar ? 'calendar' : 'calendar-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
              {showScheduledCalendar && (
                <DatePicker
                  value={scheduledDate}
                  onChange={(d) => { setScheduledDate(d); setShowScheduledCalendar(false); }}
                />
              )}
            </>
          )}

          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder={mode === 'log' ? 'Workout notes (optional)' : 'Instructions for client (optional)'}
            placeholderTextColor={t.textSecondary}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            multiline
          />
        </View>

        {/* Assign to — only shown in Assign mode */}
        {mode === 'assign' && (
          <View style={[styles.groupSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Assign to</Text>
            {clients.length === 0 ? (
              <Text style={[styles.groupClientName, { color: t.textSecondary }]}>No clients found.</Text>
            ) : clients.map((c) => {
              const selected = assignedClients.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.groupRow}
                  onPress={() => setAssignedClients((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  })}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.primary : t.textSecondary as string}
                  />
                  <Text style={[styles.groupClientName, { color: t.textPrimary }]}>{c.full_name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Worked out with — only shown in Log Now mode */}
        {mode === 'log' && clients.filter((c) => c.id !== clientId).length > 0 && (
          <View style={[styles.groupSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.groupLabel, { color: t.textSecondary }]}>Worked out with</Text>
            {clients.filter((c) => c.id !== clientId).map((c) => {
              const selected = workedOutWith.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.groupRow}
                  onPress={() => setWorkedOutWith((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  })}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.primary : t.textSecondary as string}
                  />
                  <Text style={[styles.groupClientName, { color: t.textPrimary }]}>{c.full_name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
              {/* Superset connector pill between blocks */}
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
                    {block.exercise.muscle_group ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.exercise.muscle_group}</Text> : null}
                  </View>
                  <View style={styles.blockHeaderActions}>
                    {/* Chain/link icon — available on all blocks except the last (linking "this to next") */}
                    {bi < blocks.length - 1 && (
                      <TouchableOpacity
                        onPress={() => toggleLink(bi)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
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

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={mode === 'log' ? handleSave : handleAssign}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color={colors.textInverse} />
          : <Text style={styles.saveBtnText}>{mode === 'log' ? 'Save Workout' : 'Assign Workout'}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginRight: spacing.sm },
  // ── Mode toggle ──
  modeToggle: {
    flexDirection: 'row', borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden', marginBottom: spacing.xs,
  },
  modeBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { ...typography.body, fontWeight: '600' },
  dateTouchableRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  loader: { marginTop: spacing.xl },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  backBtn: { padding: spacing.xs },
  searchInput: {
    ...typography.body, flex: 1, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 40,
  },
  exerciseList: { padding: spacing.md, gap: spacing.sm },
  exerciseRow: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600' },
  muscleGroup: { ...typography.bodySmall, marginTop: 2 },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1 },
  dateTouchable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { ...typography.body, fontWeight: '600' },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCol: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    ...typography.label,
  },
  metricInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 40,
  },
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
  blockHeaderActions: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  blockName: { ...typography.body, fontWeight: '600' },
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
  actionRow: {
    flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md,
  },
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
  saveBtn: { margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  groupSection: {
    marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  groupLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  groupClientName: { ...typography.body },
  // Superset connector
  supersetConnector: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md + 3, // align with left border
    marginVertical: 2, gap: spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetBadge: {
    ...typography.label, fontWeight: '700', letterSpacing: 1,
  },
});
