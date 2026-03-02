import { useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, SectionList, ActivityIndicator,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutSet, Exercise, UpdateWorkout, UpdateWorkoutSet } from '@/types';

type SetWithExercise = WorkoutSet & { exercise: Exercise };
type Theme = ReturnType<typeof useTheme>;
type Section = { title: string; exerciseId: string; data: SetWithExercise[] };
type SetForm = { reps: string; weight_kg: string; duration_seconds: string; notes: string };

const EMPTY_FORM: SetForm = { reps: '', weight_kg: '', duration_seconds: '', notes: '' };

function parseOptionalInt(v: string): number | null {
  const n = parseInt(v, 10);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

function parseOptionalFloat(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

// ─── Screen ───────────────────────────────────────────────────────

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { workout, loading, error, updateWorkout, deleteWorkout, deleteSet, updateSet, addSet } = useWorkoutDetail(id);

  // Add-set state — tracks which exercise the pending form targets
  const [pendingExercise, setPendingExercise] = useState<{ id: string; name: string } | null>(null);
  const [pendingForm, setPendingForm] = useState<SetForm>(EMPTY_FORM);
  const [savingSet, setSavingSet] = useState(false);

  // Exercise picker (for exercises not yet in this workout)
  const [showPicker, setShowPicker] = useState(false);

  function openPickerForNewExercise() {
    setShowPicker(true);
  }

  function pickExercise(exercise: Exercise) {
    setPendingExercise({ id: exercise.id, name: exercise.name });
    setPendingForm(EMPTY_FORM);
    setShowPicker(false);
  }

  const startAddSet = useCallback((exerciseId: string, exerciseName: string) => {
    setPendingExercise({ id: exerciseId, name: exerciseName });
    setPendingForm(EMPTY_FORM);
  }, []);

  const cancelAdd = useCallback(() => setPendingExercise(null), []);

  async function handleAddSet() {
    if (!pendingExercise) return;
    setSavingSet(true);
    const { error: err } = await addSet(pendingExercise.id, {
      reps: parseOptionalInt(pendingForm.reps),
      weight_kg: parseOptionalFloat(pendingForm.weight_kg),
      duration_seconds: parseOptionalInt(pendingForm.duration_seconds),
      notes: pendingForm.notes.trim() || null,
    });
    setSavingSet(false);
    if (err) Alert.alert('Error', err);
    else setPendingExercise(null);
  }

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);

  async function performDeleteWorkout() {
    setIsDeleting(true);
    const { error: err } = await deleteWorkout();
    setIsDeleting(false);
    if (err) { setDeleteError(err); return; }
    router.back();
  }

  async function performDeleteSet() {
    if (!deleteSetId) return;
    setIsDeleting(true);
    const { error: err } = await deleteSet(deleteSetId);
    setIsDeleting(false);
    if (err) { setDeleteError(err); return; }
    setDeleteSetId(null);
    setDeleteError(null);
  }

  // ── Exercise picker overlay ────────────────────────────────────────
  if (showPicker) {
    const existingIds = new Set((workout?.workout_sets ?? []).map((s) => s.exercise_id));
    return (
      <ExercisePicker
        onSelect={pickExercise}
        onClose={() => setShowPicker(false)}
        existingIds={existingIds}
      />
    );
  }

  // ── Loading / error states ─────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={styles.errorText}>{error ?? 'Workout not found.'}</Text>
      </View>
    );
  }

  const exerciseIdsInWorkout = new Set(workout.workout_sets.map((s) => s.exercise_id));
  const isNewExercise = pendingExercise != null && !exerciseIdsInWorkout.has(pendingExercise.id);

  const grouped: Record<string, SetWithExercise[]> = {};
  for (const set of workout.workout_sets) {
    if (!grouped[set.exercise.name]) grouped[set.exercise.name] = [];
    grouped[set.exercise.name].push(set);
  }
  const sections: Section[] = Object.entries(grouped).map(([title, data]) => ({
    title,
    exerciseId: data[0].exercise_id,
    data,
  }));

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerBtns}>
              <TouchableOpacity onPress={() => router.replace('/(tabs)/' as never)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="home-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setConfirmingDelete(true); setDeleteError(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <SectionList<SetWithExercise, Section>
        style={styles.list}
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <WorkoutHeader
            performedAt={workout.performed_at}
            notes={workout.notes}
            onSave={updateWorkout}
            t={t}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.exerciseTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <SetRow
            set={item}
            onDelete={() => { setDeleteSetId(item.id); setDeleteError(null); }}
            onSave={(payload) => updateSet(item.id, payload)}
            t={t}
          />
        )}
        renderSectionFooter={({ section }) => {
          const isAdding = pendingExercise?.id === section.exerciseId;
          if (isAdding) {
            return (
              <AddSetForm
                label={`Add set to ${section.title}`}
                form={pendingForm}
                onChange={setPendingForm}
                onSave={handleAddSet}
                onCancel={cancelAdd}
                saving={savingSet}
                t={t}
              />
            );
          }
          return (
            <TouchableOpacity
              style={styles.addSetInSection}
              onPress={() => startAddSet(section.exerciseId, section.title)}
            >
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={styles.addSetInSectionText}>Add set</Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          isNewExercise && pendingExercise ? (
            <View style={styles.newExerciseBlock}>
              <Text style={styles.exerciseTitle}>{pendingExercise.name}</Text>
              <AddSetForm
                label="Add first set"
                form={pendingForm}
                onChange={setPendingForm}
                onSave={handleAddSet}
                onCancel={cancelAdd}
                saving={savingSet}
                t={t}
              />
            </View>
          ) : null
        }
      />

      {/* ── Delete confirmation bar (workout or set) ── */}
      {(confirmingDelete || deleteSetId) && (
        <View style={[styles.deleteBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.deleteBarText, { color: t.textPrimary }]}>
            {confirmingDelete
              ? 'Delete this workout and all its sets?'
              : `Delete Set ${workout.workout_sets.find((s) => s.id === deleteSetId)?.set_number ?? ''}?`}
          </Text>
          {deleteError ? <Text style={styles.deleteBarError}>{deleteError}</Text> : null}
          <View style={styles.deleteBarButtons}>
            <TouchableOpacity
              onPress={() => { setConfirmingDelete(false); setDeleteSetId(null); setDeleteError(null); }}
              style={styles.deleteCancelBtn}
            >
              <Text style={[styles.deleteCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmingDelete ? performDeleteWorkout : performDeleteSet}
              disabled={isDeleting}
              style={[styles.deleteConfirmBtn, isDeleting && styles.disabledBtn]}
            >
              {isDeleting
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.deleteConfirmText}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB — add a new exercise to this workout */}
      {!confirmingDelete && !deleteSetId && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openPickerForNewExercise}
          accessibilityLabel="Add exercise"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Add Exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Shared add-set form ──────────────────────────────────────────

type AddSetFormProps = {
  label: string;
  form: SetForm;
  onChange: (f: SetForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: Theme;
};

function AddSetForm({ label, form, onChange, onSave, onCancel, saving, t }: AddSetFormProps) {
  return (
    <View style={[styles.addSetCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.addSetHeader}>
        <Text style={[styles.addSetLabel, { color: t.textSecondary }]}>{label}</Text>
        <View style={styles.editActions}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            style={[styles.saveSmallBtn, saving && styles.disabledBtn]}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.saveSmallBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setFieldRow}>
        {([
          ['Reps', 'reps', 'number-pad'],
          ['Weight (kg)', 'weight_kg', 'decimal-pad'],
          ['Duration (s)', 'duration_seconds', 'number-pad'],
        ] as const).map(([label2, field, kb]) => (
          <View key={field} style={styles.setFieldGroup}>
            <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>{label2}</Text>
            <TextInput
              style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
              value={form[field]}
              onChangeText={(v) => onChange({ ...form, [field]: v })}
              keyboardType={kb as never}
              placeholder="—"
              placeholderTextColor={t.textSecondary}
            />
          </View>
        ))}
      </View>

      <TextInput
        style={[styles.setNotesInput, { color: t.textPrimary, borderColor: t.border }]}
        value={form.notes}
        onChangeText={(v) => onChange({ ...form, notes: v })}
        placeholder="Set notes…"
        placeholderTextColor={t.textSecondary}
      />
    </View>
  );
}

// ─── Workout header (date + notes, inline edit) ───────────────────

type WorkoutHeaderProps = {
  performedAt: string;
  notes: string | null;
  onSave: (p: UpdateWorkout) => Promise<{ error: string | null }>;
  t: Theme;
};

function WorkoutHeader({ performedAt, notes, onSave, t }: WorkoutHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateVal, setDateVal] = useState(performedAt);
  const [notesVal, setNotesVal] = useState(notes ?? '');

  const [y, m, d] = performedAt.split('-').map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  function startEdit() {
    setDateVal(performedAt);
    setNotesVal(notes ?? '');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await onSave({
      performed_at: dateVal.trim() || performedAt,
      notes: notesVal.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Date</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveSmallBtn, saving && styles.disabledBtn]}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <DatePicker value={dateVal} onChange={setDateVal} />
        <Text style={[styles.cardLabel, { color: t.textSecondary, marginTop: spacing.sm }]}>Notes</Text>
        <TextInput
          style={[styles.headerInput, styles.notesTextarea, { color: t.textPrimary, borderColor: t.border }]}
          value={notesVal}
          onChangeText={setNotesVal}
          placeholder="Workout notes…"
          placeholderTextColor={t.textSecondary}
          multiline
        />
      </View>
    );
  }

  return (
    <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.dateText, { color: t.textPrimary }]}>{displayDate}</Text>
        <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {notes
        ? <Text style={[styles.notesText, { color: t.textSecondary }]}>{notes}</Text>
        : <Text style={[styles.notesEmpty, { color: t.textSecondary }]}>Tap pencil to add notes</Text>}
    </View>
  );
}

// ─── Set row (view + inline edit + delete) ────────────────────────

type SetRowProps = {
  set: SetWithExercise;
  onDelete: () => void;
  onSave: (p: UpdateWorkoutSet) => Promise<{ error: string | null }>;
  t: Theme;
};

function SetRow({ set, onDelete, onSave, t }: SetRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [repsVal, setRepsVal] = useState(set.reps != null ? String(set.reps) : '');
  const [weightVal, setWeightVal] = useState(set.weight_kg != null ? String(set.weight_kg) : '');
  const [durationVal, setDurationVal] = useState(set.duration_seconds != null ? String(set.duration_seconds) : '');
  const [notesVal, setNotesVal] = useState(set.notes ?? '');

  function startEdit() {
    setRepsVal(set.reps != null ? String(set.reps) : '');
    setWeightVal(set.weight_kg != null ? String(set.weight_kg) : '');
    setDurationVal(set.duration_seconds != null ? String(set.duration_seconds) : '');
    setNotesVal(set.notes ?? '');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await onSave({
      reps: parseOptionalInt(repsVal),
      weight_kg: parseOptionalFloat(weightVal),
      duration_seconds: parseOptionalInt(durationVal),
      notes: notesVal.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  const parts: string[] = [];
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weight_kg != null) parts.push(`${set.weight_kg} kg`);
  if (set.duration_seconds != null) parts.push(`${set.duration_seconds}s`);

  if (editing) {
    return (
      <View style={[styles.setCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.setEditHeader}>
          <Text style={[styles.setNumber, { color: t.textSecondary }]}>Set {set.set_number}</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveSmallBtn, saving && styles.disabledBtn]}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.setFieldRow}>
          {([
            ['Reps', repsVal, setRepsVal, 'number-pad'],
            ['Weight (kg)', weightVal, setWeightVal, 'decimal-pad'],
            ['Duration (s)', durationVal, setDurationVal, 'number-pad'],
          ] as const).map(([label, val, setter, kb]) => (
            <View key={label} style={styles.setFieldGroup}>
              <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>{label}</Text>
              <TextInput
                style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
                value={val}
                onChangeText={setter as (v: string) => void}
                keyboardType={kb as never}
                placeholder="—"
                placeholderTextColor={t.textSecondary}
              />
            </View>
          ))}
        </View>
        <TextInput
          style={[styles.setNotesInput, { color: t.textPrimary, borderColor: t.border }]}
          value={notesVal}
          onChangeText={setNotesVal}
          placeholder="Set notes…"
          placeholderTextColor={t.textSecondary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.setRow, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.setNumber, { color: t.textSecondary }]}>Set {set.set_number}</Text>
      <View style={styles.setMainContent}>
        <Text style={[styles.setDetail, { color: t.textPrimary }]}>{parts.join(' · ') || '—'}</Text>
        {set.notes ? <Text style={[styles.setNotes, { color: t.textSecondary }]}>{set.notes}</Text> : null}
      </View>
      <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="pencil" size={15} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={15} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl + 56, gap: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Workout header card ──
  headerCard: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    marginBottom: spacing.md, gap: spacing.xs,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { ...typography.heading3, flex: 1 },
  notesText: { ...typography.body },
  notesEmpty: { ...typography.bodySmall, fontStyle: 'italic' },
  headerInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  notesTextarea: { minHeight: 64, textAlignVertical: 'top' },

  // ── Shared edit controls ──
  cardLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  cancelBtnText: { ...typography.body },
  saveSmallBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    minWidth: 56, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  saveSmallBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },

  // ── Section header ──
  exerciseTitle: {
    ...typography.label, color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },

  // ── "Add set" in section footer ──
  addSetInSection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.sm,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary,
  },
  addSetInSectionText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  // ── Add-set form card ──
  addSetCard: {
    borderRadius: radius.sm, padding: spacing.md, borderWidth: 1,
    marginBottom: spacing.sm, gap: spacing.sm,
  },
  addSetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addSetLabel: { ...typography.bodySmall, fontWeight: '600', flex: 1 },

  // ── New exercise footer block ──
  newExerciseBlock: { marginTop: spacing.sm },

  // ── Set row (view mode) ──
  setRow: {
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, marginBottom: spacing.xs,
  },
  setNumber: { ...typography.bodySmall, fontWeight: '600', width: 44 },
  setMainContent: { flex: 1, gap: 2 },
  setDetail: { ...typography.body },
  setNotes: { ...typography.bodySmall },

  // ── Set card (edit mode) ──
  setCard: {
    borderRadius: radius.sm, padding: spacing.md, borderWidth: 1,
    marginBottom: spacing.xs, gap: spacing.sm,
  },
  setEditHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setFieldRow: { flexDirection: 'row', gap: spacing.sm },
  setFieldGroup: { flex: 1, gap: spacing.xs },
  setFieldLabel: { ...typography.bodySmall },
  setFieldInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, textAlign: 'center',
  },
  setNotesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },

  // ── Header buttons ──
  headerBtn: { marginRight: spacing.sm },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  // ── FAB ──
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── Delete confirmation bar ──
  deleteBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  deleteBarText: { ...typography.body },
  deleteBarError: { ...typography.bodySmall, color: colors.error },
  deleteBarButtons: { flexDirection: 'row', gap: spacing.sm },
  deleteCancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  deleteCancelText: { ...typography.body },
  deleteConfirmBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.error },
  deleteConfirmText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },

  // ── Misc ──
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
});
