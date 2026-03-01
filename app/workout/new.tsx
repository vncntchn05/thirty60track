import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise } from '@/types';

type SetRow = { reps: string; weight_kg: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[] };

const EMPTY_SET: SetRow = { reps: '', weight_kg: '', notes: '' };
const today = new Date().toISOString().split('T')[0];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function NewWorkoutScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTheme();
  const { exercises, loading: exercisesLoading } = useExercises();

  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  function openPicker() { setQuery(''); setShowPicker(true); }

  function addExercise(exercise: Exercise) {
    setBlocks((prev) => [...prev, { exercise, sets: [{ ...EMPTY_SET }] }]);
    setShowPicker(false); setQuery('');
  }

  function removeBlock(bi: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== bi));
  }

  function addSet(bi: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b)
    );
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

  async function handleSave() {
    if (!user || !clientId) return;
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before saving.'); return; }

    const allSets = blocks.flatMap((b) =>
      b.sets
        .filter((s) => s.reps.trim() !== '' || s.weight_kg.trim() !== '')
        .map((s, i) => ({
          exercise_id: b.exercise.id,
          set_number: i + 1,
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          weight_kg: s.weight_kg.trim() ? parseFloat(s.weight_kg) : null,
          duration_seconds: null,
          notes: s.notes.trim() || null,
        }))
    );
    if (allSets.length === 0) { Alert.alert('No sets entered', 'Add at least one set with reps or weight.'); return; }

    setSaving(true);
    const { error } = await createWorkoutWithSets(
      { client_id: clientId, trainer_id: user.id, performed_at: today, notes: workoutNotes.trim() || null },
      allSets
    );
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else router.back();
  }

  // ── Exercise picker ───────────────────────────────────────────────
  if (showPicker) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.pickerHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
            placeholder="Search exercises…"
            placeholderTextColor={t.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        {exercisesLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.exerciseList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.exerciseRow, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => addExercise(item)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{item.name}</Text>
                  {item.muscle_group ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{item.muscle_group}</Text> : null}
                </View>
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: t.textSecondary }]}>No exercises found.</Text>}
          />
        )}
      </View>
    );
  }

  // ── Workout builder ───────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <Text style={[styles.dateLabel, { color: t.textSecondary }]}>{formatDate(today)}</Text>
          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Workout notes (optional)"
            placeholderTextColor={t.textSecondary}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            multiline
          />
        </View>

        {blocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
            <Text style={[styles.emptyStateText, { color: t.textSecondary }]}>No exercises added yet</Text>
            <Text style={[styles.emptyStateHint, { color: t.textSecondary }]}>Tap "Add Exercise" below to get started</Text>
          </View>
        )}

        {blocks.map((block, bi) => (
          <View key={bi} style={[styles.blockCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.blockHeader, { backgroundColor: t.background, borderBottomColor: t.border }]}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.blockName, { color: t.textPrimary }]}>{block.exercise.name}</Text>
                {block.exercise.muscle_group ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.exercise.muscle_group}</Text> : null}
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

        <TouchableOpacity style={[styles.addExerciseBtn, { borderColor: colors.primary }]} onPress={openPicker}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveBtnText}>Save Workout</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  dateLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
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
  blockName: { ...typography.body, fontWeight: '600' },
  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.xs,
  },
  colLabel: { ...typography.label, textAlign: 'center' },
  colSet: { width: 32 }, colReps: { width: 56 }, colWeight: { width: 68 },
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
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs,
  },
  addExerciseBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  saveBtn: { margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
