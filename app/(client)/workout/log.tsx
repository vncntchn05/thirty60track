import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert, BackHandler,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise } from '@/types';

type SetRow = { reps: string; weight_kg: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[] };

const EMPTY_SET: SetRow = { reps: '', weight_kg: '', notes: '' };
const EMPTY_BLOCK = (exercise: Exercise): ExerciseBlock => ({ exercise, sets: [{ ...EMPTY_SET }] });

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function ClientNewWorkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, clientId } = useAuth();
  const { client } = useClientProfile();
  const t = useTheme();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedBar, setShowUnsavedBar] = useState(false);

  function addExercise(exercise: Exercise) {
    setBlocks((prev) => [...prev, EMPTY_BLOCK(exercise)]);
    setIsDirty(true);
  }

  function removeBlock(bi: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== bi));
    setIsDirty(true);
  }

  function addSet(bi: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b)
    );
    setIsDirty(true);
  }

  function updateSet(bi: number, si: number, field: keyof SetRow, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b
      )
    );
    setIsDirty(true);
  }

  function removeSet(bi: number, si: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b)
    );
    setIsDirty(true);
  }

  const handleBackPress = useCallback(() => {
    if (!isDirty) { router.back(); return; }
    setShowUnsavedBar(true);
  }, [isDirty, router]);

  // Keep header back button and swipe gesture in sync with dirty state
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

  async function handleSave() {
    if (!user || !clientId || !client) return;
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before saving.'); return; }

    const allSets = blocks.flatMap((b, _bi) =>
      b.sets
        .filter((s) => s.reps.trim() !== '' || s.weight_kg.trim() !== '')
        .map((s, si) => ({
          exercise_id: b.exercise.id,
          set_number: si + 1,
          superset_group: null,
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          weight_kg: s.weight_kg.trim() ? parseFloat(s.weight_kg) : null,
          duration_seconds: null,
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
        trainer_id: client.trainer_id,
        performed_at: date,
        notes: workoutNotes.trim() || null,
        body_weight_kg: !isNaN(wVal) && wVal > 0 ? wVal : null,
        body_fat_percent: !isNaN(bfVal) && bfVal >= 0 && bfVal < 100 ? bfVal : null,
        workout_group_id: null,
        logged_by_role: 'client',
        logged_by_user_id: user.id,
      },
      allSets,
    );
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setIsDirty(false); router.back(); }
  }

  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={(exercise) => { addExercise(exercise); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ title: 'Log Workout' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Date + metrics header */}
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <TouchableOpacity
            style={styles.dateTouchable}
            onPress={() => setShowCalendar((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{formatDate(date)}</Text>
            <Ionicons name={showCalendar ? 'calendar' : 'calendar-outline'} size={18} color={colors.primary} />
          </TouchableOpacity>
          {showCalendar && (
            <DatePicker value={date} onChange={(d) => { setDate(d); setShowCalendar(false); }} />
          )}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body weight (kg)</Text>
              <TextInput
                style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                placeholder="Optional" placeholderTextColor={t.textSecondary}
                keyboardType="decimal-pad" value={bodyWeight}
                onChangeText={(v) => { setBodyWeight(v); setIsDirty(true); }}
              />
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body fat (%)</Text>
              <TextInput
                style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                placeholder="Optional" placeholderTextColor={t.textSecondary}
                keyboardType="decimal-pad" value={bodyFat}
                onChangeText={(v) => { setBodyFat(v); setIsDirty(true); }}
              />
            </View>
          </View>
          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Workout notes (optional)" placeholderTextColor={t.textSecondary}
            value={workoutNotes}
            onChangeText={(v) => { setWorkoutNotes(v); setIsDirty(true); }}
            multiline
          />
        </View>

        {blocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
            <Text style={[styles.emptyStateText, { color: t.textSecondary }]}>No exercises added yet</Text>
          </View>
        )}

        {blocks.map((block, bi) => (
          <View key={bi} style={[styles.blockCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.blockHeader, { backgroundColor: t.background, borderBottomColor: t.border }]}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.blockName, { color: t.textPrimary }]}>{block.exercise.name}</Text>
                {block.exercise.muscle_group
                  ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.exercise.muscle_group}</Text>
                  : null}
              </View>
              <TouchableOpacity onPress={() => removeBlock(bi)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.colHeader}>
              <Text style={[styles.colLabel, styles.colSet, { color: t.textSecondary }]}>Set</Text>
              <Text style={[styles.colLabel, styles.colReps, { color: t.textSecondary }]}>Reps</Text>
              <Text style={[styles.colLabel, styles.colWeight, { color: t.textSecondary }]}>kg</Text>
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
                  placeholder="0.0" placeholderTextColor={t.textSecondary}
                  keyboardType="decimal-pad" value={s.weight_kg}
                  onChangeText={(v) => updateSet(bi, si, 'weight_kg', v)}
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
        ))}

        <TouchableOpacity
          style={[styles.addExerciseBtn, { borderColor: colors.primary }]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {showUnsavedBar ? (
        <View style={[styles.unsavedBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.unsavedBarText, { color: t.textPrimary }]}>You have unsaved changes.</Text>
          <View style={styles.unsavedBarButtons}>
            <TouchableOpacity
              onPress={() => { setShowUnsavedBar(false); setIsDirty(false); router.back(); }}
              style={[styles.unsavedCancelBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.unsavedCancelText, { color: t.textSecondary }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowUnsavedBar(false); handleSave(); }}
              style={styles.unsavedSaveBtn}
            >
              <Text style={styles.unsavedSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.saveBtnText}>Save Workout</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginRight: spacing.sm },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1 },
  dateTouchable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { ...typography.body, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricCol: { flex: 1, gap: 4 },
  metricLabel: { ...typography.label },
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
  colHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.xs },
  colLabel: { ...typography.label, textAlign: 'center' },
  colSet: { width: 32 }, colReps: { width: 56 }, colWeight: { width: 68 },
  colNotes: { flex: 1 }, colRemove: { width: 28, alignItems: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.xs },
  setNumber: { ...typography.label, textAlign: 'center' },
  setInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.xs, height: 40, textAlign: 'center',
  },
  invisible: { opacity: 0 },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginHorizontal: spacing.md, marginTop: spacing.xs,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, gap: spacing.xs,
  },
  addSetBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs,
  },
  addExerciseBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  saveBtn: {
    margin: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  unsavedBar: { borderTopWidth: 1, padding: spacing.md, gap: spacing.sm },
  unsavedBarText: { ...typography.body },
  unsavedBarButtons: { flexDirection: 'row', gap: spacing.sm },
  unsavedCancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1 },
  unsavedCancelText: { ...typography.body },
  unsavedSaveBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  unsavedSaveText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
