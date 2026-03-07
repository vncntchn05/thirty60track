import { useState, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, ActivityIndicator,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { useAuth } from '@/lib/auth';
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

export default function ClientWorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();
  const { workout, loading, error, updateWorkout, deleteWorkout, deleteSet, updateSet, addSet } = useWorkoutDetail(id);

  const [pendingExercise, setPendingExercise] = useState<{ id: string; name: string } | null>(null);
  const [pendingForm, setPendingForm] = useState<SetForm>(EMPTY_FORM);
  const [savingSet, setSavingSet] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editing gating: only editable if client logged this workout
  const canEdit = workout?.logged_by_role === 'client' && workout?.logged_by_user_id === user?.id;

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

  // Build sections
  const groupedMap = new Map<string, { id: string; sets: SetWithExercise[] }>();
  for (const set of workout.workout_sets) {
    if (!groupedMap.has(set.exercise.name)) {
      groupedMap.set(set.exercise.name, { id: set.exercise_id, sets: [] });
    }
    groupedMap.get(set.exercise.name)!.sets.push(set);
  }
  const sections: Section[] = [...groupedMap.entries()].map(([title, { id: exId, sets }]) => ({
    title, exerciseId: exId, data: sets,
  }));

  const [y, m, d] = workout.performed_at.split('-').map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(client)/workouts' as never)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerBtn}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: canEdit ? () => (
            <TouchableOpacity
              onPress={() => { setConfirmingDelete(true); setDeleteError(null); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          ) : undefined,
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
            displayDate={displayDate}
            notes={workout.notes}
            bodyWeightKg={workout.body_weight_kg}
            bodyFatPercent={workout.body_fat_percent}
            trainerName={workout.logged_by_role === 'trainer' ? (workout.trainer?.full_name ?? null) : null}
            canEdit={canEdit}
            onSave={updateWorkout}
            t={t}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.exerciseTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <SetRowView
            set={item}
            canEdit={canEdit}
            onDelete={() => { setDeleteSetId(item.id); setDeleteError(null); }}
            onSave={(payload) => updateSet(item.id, payload)}
            t={t}
          />
        )}
        renderSectionFooter={({ section }) => {
          if (!canEdit) return null;
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
      />

      {/* Delete confirmation bar */}
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
    </View>
  );
}

// ─── Workout header ────────────────────────────────────────────────

type WorkoutHeaderProps = {
  performedAt: string;
  displayDate: string;
  notes: string | null;
  bodyWeightKg: number | null;
  bodyFatPercent: number | null;
  trainerName: string | null;
  canEdit: boolean;
  onSave: (p: UpdateWorkout) => Promise<{ error: string | null }>;
  t: Theme;
};

function WorkoutHeader({ displayDate, notes, bodyWeightKg, bodyFatPercent, trainerName, canEdit, onSave, t }: WorkoutHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateVal, setDateVal] = useState('');
  const [notesVal, setNotesVal] = useState('');
  const [weightVal, setWeightVal] = useState('');
  const [bfVal, setBfVal] = useState('');

  function startEdit() {
    setDateVal('');
    setNotesVal(notes ?? '');
    setWeightVal(bodyWeightKg != null ? String(bodyWeightKg) : '');
    setBfVal(bodyFatPercent != null ? String(bodyFatPercent) : '');
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload: UpdateWorkout = {
      notes: notesVal.trim() || null,
      body_weight_kg: parseOptionalFloat(weightVal),
      body_fat_percent: parseOptionalFloat(bfVal),
    };
    if (dateVal.trim()) payload.performed_at = dateVal;
    const { error } = await onSave(payload);
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  return (
    <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Trainer-logged banner */}
      {trainerName && (
        <View style={[styles.trainerBanner, { backgroundColor: t.border }]}>
          <Ionicons name="lock-closed-outline" size={14} color={t.textSecondary as string} />
          <Text style={[styles.trainerBannerText, { color: t.textSecondary }]}>
            This workout was logged by your trainer
          </Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={[styles.dateText, { color: t.textPrimary }]}>{displayDate}</Text>
        {canEdit && !editing && (
          <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {editing ? (
        <>
          <DatePicker value={dateVal || new Date().toISOString().split('T')[0]} onChange={setDateVal} />
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body weight (kg)</Text>
              <TextInput
                style={[styles.headerInput, { color: t.textPrimary, borderColor: t.border }]}
                value={weightVal} onChangeText={setWeightVal} keyboardType="decimal-pad"
                placeholder="Optional" placeholderTextColor={t.textSecondary}
              />
            </View>
            <View style={styles.metricCol}>
              <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body fat (%)</Text>
              <TextInput
                style={[styles.headerInput, { color: t.textPrimary, borderColor: t.border }]}
                value={bfVal} onChangeText={setBfVal} keyboardType="decimal-pad"
                placeholder="Optional" placeholderTextColor={t.textSecondary}
              />
            </View>
          </View>
          <TextInput
            style={[styles.headerInput, styles.notesTextarea, { color: t.textPrimary, borderColor: t.border }]}
            value={notesVal} onChangeText={setNotesVal}
            placeholder="Workout notes…" placeholderTextColor={t.textSecondary} multiline
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave} disabled={saving}
              style={[styles.saveSmallBtn, saving && styles.disabledBtn]}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {(bodyWeightKg != null || bodyFatPercent != null) && (
            <View style={styles.metricsRow}>
              {bodyWeightKg != null && (
                <View style={styles.metricBadge}>
                  <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Weight</Text>
                  <Text style={[styles.metricValue, { color: t.textPrimary }]}>{bodyWeightKg} kg</Text>
                </View>
              )}
              {bodyFatPercent != null && (
                <View style={styles.metricBadge}>
                  <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body fat</Text>
                  <Text style={[styles.metricValue, { color: t.textPrimary }]}>{bodyFatPercent}%</Text>
                </View>
              )}
            </View>
          )}
          {notes ? <Text style={[styles.notesText, { color: t.textSecondary }]}>{notes}</Text> : null}
        </>
      )}
    </View>
  );
}

// ─── Add-set form ──────────────────────────────────────────────────

type AddSetFormProps = {
  label: string; form: SetForm;
  onChange: (f: SetForm) => void;
  onSave: () => void; onCancel: () => void;
  saving: boolean; t: Theme;
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
          <TouchableOpacity onPress={onSave} disabled={saving} style={[styles.saveSmallBtn, saving && styles.disabledBtn]}>
            {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveSmallBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.setFieldRow}>
        {([['Reps', 'reps', 'number-pad'], ['Weight (kg)', 'weight_kg', 'decimal-pad'], ['Duration (s)', 'duration_seconds', 'number-pad']] as const).map(([lbl, field, kb]) => (
          <View key={field} style={styles.setFieldGroup}>
            <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>{lbl}</Text>
            <TextInput
              style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
              value={form[field]} onChangeText={(v) => onChange({ ...form, [field]: v })}
              keyboardType={kb as never} placeholder="—" placeholderTextColor={t.textSecondary}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Set row ──────────────────────────────────────────────────────

type SetRowViewProps = {
  set: SetWithExercise; canEdit: boolean;
  onDelete: () => void;
  onSave: (p: UpdateWorkoutSet) => Promise<{ error: string | null }>;
  t: Theme;
};

function SetRowView({ set, canEdit, onDelete, onSave, t }: SetRowViewProps) {
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
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveSmallBtn, saving && styles.disabledBtn]}>
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.setFieldRow}>
          {([['Reps', repsVal, setRepsVal, 'number-pad'], ['Weight (kg)', weightVal, setWeightVal, 'decimal-pad'], ['Duration (s)', durationVal, setDurationVal, 'number-pad']] as const).map(([lbl, val, setter, kb]) => (
            <View key={lbl} style={styles.setFieldGroup}>
              <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>{lbl}</Text>
              <TextInput
                style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
                value={val} onChangeText={setter as (v: string) => void}
                keyboardType={kb as never} placeholder="—" placeholderTextColor={t.textSecondary}
              />
            </View>
          ))}
        </View>
        <TextInput
          style={[styles.setNotesInput, { color: t.textPrimary, borderColor: t.border }]}
          value={notesVal} onChangeText={setNotesVal}
          placeholder="Set notes…" placeholderTextColor={t.textSecondary}
        />
      </View>
    );
  }

  return (
    <View style={[styles.setRowView, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.setNumber, { color: t.textSecondary }]}>Set {set.set_number}</Text>
      <View style={styles.setMainContent}>
        <Text style={[styles.setDetail, { color: t.textPrimary }]}>{parts.join(' · ') || '—'}</Text>
        {set.notes ? <Text style={[styles.setNotes, { color: t.textSecondary }]}>{set.notes}</Text> : null}
      </View>
      {canEdit && (
        <>
          <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={15} color={colors.error} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl + 56, gap: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBtn: { marginRight: spacing.sm },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },

  // ── Header card ──
  headerCard: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, marginBottom: spacing.md, gap: spacing.xs },
  trainerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs,
  },
  trainerBannerText: { ...typography.bodySmall, fontStyle: 'italic', flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { ...typography.heading3, flex: 1 },
  notesText: { ...typography.body },
  headerInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  notesTextarea: { minHeight: 64, textAlignVertical: 'top' },
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricCol: { flex: 1, gap: 4 },
  metricBadge: { flex: 1, gap: 2 },
  cardLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { ...typography.body, fontWeight: '600' },

  // ── Edit controls ──
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

  // ── Add-set inline ──
  addSetInSection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.sm,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary,
  },
  addSetInSectionText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  // ── Add-set form card ──
  addSetCard: { borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, marginBottom: spacing.sm, gap: spacing.sm },
  addSetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addSetLabel: { ...typography.bodySmall, fontWeight: '600', flex: 1 },
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

  // ── Set row (view mode) ──
  setRowView: {
    borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, marginBottom: spacing.xs,
  },
  setNumber: { ...typography.bodySmall, fontWeight: '600', width: 44 },
  setMainContent: { flex: 1, gap: 2 },
  setDetail: { ...typography.body },
  setNotes: { ...typography.bodySmall },

  // ── Set card (edit mode) ──
  setCard: { borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, marginBottom: spacing.xs, gap: spacing.sm },
  setEditHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // ── Delete bar ──
  deleteBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  deleteBarText: { ...typography.body },
  deleteBarError: { ...typography.bodySmall, color: colors.error },
  deleteBarButtons: { flexDirection: 'row', gap: spacing.sm },
  deleteCancelBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary,
  },
  deleteCancelText: { ...typography.body },
  deleteConfirmBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.error },
  deleteConfirmText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
