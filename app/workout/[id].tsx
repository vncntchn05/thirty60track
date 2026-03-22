import { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, SectionList, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutDetail } from '@/hooks/useWorkouts';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/lib/auth';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutSet, Exercise, WorkoutGroupPeer, UpdateWorkout, UpdateWorkoutSet } from '@/types';

const SUPERSET_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
function getSupersetColor(group: number): string {
  return SUPERSET_COLORS[(group - 1) % SUPERSET_COLORS.length];
}

type SetWithExercise = WorkoutSet & { exercise: Exercise };
type Theme = ReturnType<typeof useTheme>;
type Section = { title: string; exerciseId: string; supersetGroup: number | null; data: SetWithExercise[] };
type WeightUnit = 'lbs' | 'kg' | 'secs';
type SetForm = { reps: string; amount: string; notes: string };

const EMPTY_FORM: SetForm = { reps: '', amount: '', notes: '' };

const UNITS: WeightUnit[] = ['lbs', 'kg', 'secs'];
function nextUnit(u: WeightUnit): WeightUnit { return UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]; }
function resolveAmount(raw: string, unit: WeightUnit): { weight_kg: number | null; duration_seconds: number | null } {
  if (!raw.trim()) return { weight_kg: null, duration_seconds: null };
  const n = parseFloat(raw);
  if (isNaN(n)) return { weight_kg: null, duration_seconds: null };
  if (unit === 'secs') return { weight_kg: null, duration_seconds: Math.round(n) };
  return { weight_kg: unit === 'lbs' ? n * 0.453592 : n, duration_seconds: null };
}

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
  const navigation = useNavigation();
  const t = useTheme();
  const { user } = useAuth();
  const { clients } = useClients();
  const { workout, groupPeers, loading, error, updateWorkout, deleteWorkout, deleteSet, updateSet, addSet, updateExerciseSupersetGroup, addToGroup, removeFromGroup } = useWorkoutDetail(id);

  // Add-set state — tracks which exercise the pending form targets
  const [pendingExercise, setPendingExercise] = useState<{ id: string; name: string } | null>(null);
  const [pendingForm, setPendingForm] = useState<SetForm>(EMPTY_FORM);
  const [pendingUnit, setPendingUnit] = useState<WeightUnit>('lbs');
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
    setPendingUnit('lbs');
  }, []);

  const cancelAdd = useCallback(() => { setPendingExercise(null); setIsDirty(false); }, []);

  async function handleAddSet() {
    if (!pendingExercise) return;
    setSavingSet(true);
    const { error: err } = await addSet(pendingExercise.id, {
      reps: parseOptionalInt(pendingForm.reps),
      ...resolveAmount(pendingForm.amount, pendingUnit),
      notes: pendingForm.notes.trim() || null,
    });
    setSavingSet(false);
    if (err) Alert.alert('Error', err);
    else { setPendingExercise(null); setIsDirty(false); }
  }

  const [isDirty, setIsDirty] = useState(false);
  const subSaveRef = useRef<(() => Promise<void>) | null>(null);

  function handleSubDirtyChange(dirty: boolean, save?: () => Promise<void>) {
    setIsDirty(dirty);
    subSaveRef.current = dirty && save ? save : null;
  }
  const [showUnsavedBar, setShowUnsavedBar] = useState(false);

  const handleBackPress = useCallback(() => {
    if (!isDirty) { if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as never); return; }
    setShowUnsavedBar(true);
  }, [isDirty, router]);

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

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      setShowUnsavedBar(true);
      return true;
    });
    return () => sub.remove();
  }, [isDirty]);

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

  // Build sections preserving insertion order
  const groupedMap = new Map<string, { id: string; supersetGroup: number | null; sets: SetWithExercise[] }>();
  for (const set of workout.workout_sets) {
    if (!groupedMap.has(set.exercise.name)) {
      groupedMap.set(set.exercise.name, {
        id: set.exercise_id,
        supersetGroup: set.superset_group ?? null,
        sets: [],
      });
    }
    groupedMap.get(set.exercise.name)!.sets.push(set);
  }
  const sections: Section[] = [...groupedMap.entries()].map(([title, { id: exId, supersetGroup, sets }]) => ({
    title, exerciseId: exId, supersetGroup, data: sets,
  }));

  async function handleToggleSupersetLink(idx: number) {
    if (idx === 0) return;
    const curr = sections[idx];
    const prev = sections[idx - 1];
    const alreadyLinked =
      curr.supersetGroup !== null && curr.supersetGroup === prev.supersetGroup;

    if (alreadyLinked) {
      await updateExerciseSupersetGroup(curr.exerciseId, null);
      const othersInGroup = sections.filter(
        (s, i) => i !== idx && s.supersetGroup === curr.supersetGroup
      );
      if (othersInGroup.length === 1 && othersInGroup[0].exerciseId === prev.exerciseId) {
        await updateExerciseSupersetGroup(prev.exerciseId, null);
      }
    } else {
      const newGroup =
        prev.supersetGroup ??
        (Math.max(0, ...sections.map((s) => s.supersetGroup ?? 0)) + 1);
      if (prev.supersetGroup === null) {
        await updateExerciseSupersetGroup(prev.exerciseId, newGroup);
      }
      await updateExerciseSupersetGroup(curr.exerciseId, newGroup);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
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
          <>
            <WorkoutHeader
              performedAt={workout.performed_at}
              notes={workout.notes}
              bodyWeightKg={workout.body_weight_kg}
              bodyFatPercent={workout.body_fat_percent}
              trainerName={workout.logged_by_role === 'trainer' ? (workout.trainer?.full_name ?? null) : (workout.client?.full_name ?? null)}
              onSave={updateWorkout}
              onDirtyChange={handleSubDirtyChange}
              t={t}
            />
            <GroupCard
              peers={groupPeers}
              allClients={clients}
              currentClientId={workout.client_id}
              trainerId={user?.id ?? ''}
              onAdd={addToGroup}
              onRemove={removeFromGroup}
              t={t}
            />
          </>
        }
        renderSectionHeader={({ section }) => {
          const sectionIdx = sections.indexOf(section);
          const prev = sectionIdx > 0 ? sections[sectionIdx - 1] : null;
          const isLinkedToPrev =
            section.supersetGroup !== null &&
            prev !== null &&
            prev.supersetGroup === section.supersetGroup;
          const supersetColor = section.supersetGroup !== null
            ? getSupersetColor(section.supersetGroup)
            : null;

          return (
            <View>
              {/* Superset connector pill between consecutive same-group sections */}
              {isLinkedToPrev && supersetColor && (
                <View style={styles.supersetConnector}>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                  <Text style={[styles.supersetBadgeText, { color: supersetColor }]}>SUPERSET</Text>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                </View>
              )}

              <View style={styles.sectionHeaderRow}>
                <Text style={[
                  styles.exerciseTitle,
                  supersetColor !== null && { color: supersetColor },
                ]}>
                  {section.title}
                </Text>
                {/* Chain icon — available on all sections except the first */}
                {sectionIdx > 0 && (
                  <TouchableOpacity
                    onPress={() => handleToggleSupersetLink(sectionIdx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.chainBtn}
                  >
                    <Ionicons
                      name={isLinkedToPrev ? 'link' : 'link-outline'}
                      size={16}
                      color={isLinkedToPrev && supersetColor ? supersetColor : t.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        renderItem={({ item, section }) => (
          <SetRow
            set={item}
            supersetColor={section.supersetGroup !== null ? getSupersetColor(section.supersetGroup) : null}
            onDelete={() => { setDeleteSetId(item.id); setDeleteError(null); }}
            onSave={(payload) => updateSet(item.id, payload)}
            onDirtyChange={handleSubDirtyChange}
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
                unit={pendingUnit}
                onChange={(f) => { setPendingForm(f); setIsDirty(true); }}
                onUnitChange={setPendingUnit}
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
                unit={pendingUnit}
                onChange={(f) => { setPendingForm(f); setIsDirty(true); }}
                onUnitChange={setPendingUnit}
                onSave={handleAddSet}
                onCancel={cancelAdd}
                saving={savingSet}
                t={t}
              />
            </View>
          ) : null
        }
      />

      {/* ── Unsaved changes bar ── */}
      {showUnsavedBar && (
        <View style={[styles.deleteBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.deleteBarText, { color: t.textPrimary }]}>You have unsaved changes.</Text>
          <View style={styles.deleteBarButtons}>
            <TouchableOpacity
              onPress={() => { setShowUnsavedBar(false); setIsDirty(false); setPendingExercise(null); if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as never); }}
              style={[styles.deleteCancelBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.deleteCancelText, { color: t.textSecondary }]}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => { setShowUnsavedBar(false); if (subSaveRef.current) { await subSaveRef.current(); } else { await handleAddSet(); } if (router.canGoBack()) router.back(); else router.replace('/(tabs)' as never); }}
              style={styles.saveSuccessBtn}
            >
              <Text style={styles.deleteConfirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
      {!confirmingDelete && !deleteSetId && !showUnsavedBar && (
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

// ─── Worked out with card ─────────────────────────────────────────

type GroupCardProps = {
  peers: WorkoutGroupPeer[];
  allClients: import('@/types').ClientWithStats[];
  currentClientId: string;
  trainerId: string;
  onAdd: (clientId: string, trainerId: string) => Promise<{ error: string | null }>;
  onRemove: (peerWorkoutId: string) => Promise<{ error: string | null }>;
  t: Theme;
};

function GroupCard({ peers, allClients, currentClientId, trainerId, onAdd, onRemove, t }: GroupCardProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const peerClientIds = new Set([currentClientId, ...peers.map((p) => p.client_id)]);
  const available = allClients.filter((c) => !peerClientIds.has(c.id));

  async function handleAdd(clientId: string) {
    setBusy(clientId);
    const { error } = await onAdd(clientId, trainerId);
    setBusy(null);
    setShowPicker(false);
    if (error) Alert.alert('Error', error);
  }

  async function handleRemove(peer: WorkoutGroupPeer) {
    setBusy(peer.id);
    const { error } = await onRemove(peer.id);
    setBusy(null);
    if (error) Alert.alert('Error', error);
  }

  if (peers.length === 0 && !showPicker) {
    return (
      <TouchableOpacity
        style={[styles.groupCardEmpty, { borderColor: t.border }]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="people-outline" size={16} color={t.textSecondary as string} />
        <Text style={[styles.groupCardEmptyText, { color: t.textSecondary }]}>Add clients who trained together</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.groupCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.groupCardHeader}>
        <Ionicons name="people" size={15} color={colors.primary} />
        <Text style={[styles.groupCardTitle, { color: t.textPrimary }]}>Worked out with</Text>
        {available.length > 0 && (
          <TouchableOpacity onPress={() => setShowPicker((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPicker ? 'close' : 'add'} size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {peers.map((peer) => (
        <View key={peer.id} style={styles.groupPeerRow}>
          <Text style={[styles.groupPeerName, { color: t.textPrimary }]}>{peer.client?.full_name ?? peer.client_id}</Text>
          <TouchableOpacity
            onPress={() => handleRemove(peer)}
            disabled={busy === peer.id}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {busy === peer.id
              ? <ActivityIndicator size="small" color={t.textSecondary as string} />
              : <Ionicons name="close-circle-outline" size={18} color={t.textSecondary as string} />}
          </TouchableOpacity>
        </View>
      ))}

      {showPicker && available.length > 0 && (
        <View style={[styles.groupPickerBox, { borderTopColor: t.border }]}>
          {available.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.groupPickerRow}
              onPress={() => handleAdd(c.id)}
              disabled={busy === c.id}
            >
              {busy === c.id
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="add-circle-outline" size={18} color={colors.primary} />}
              <Text style={[styles.groupPeerName, { color: t.textPrimary }]}>{c.full_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Shared add-set form ──────────────────────────────────────────

type AddSetFormProps = {
  label: string;
  form: SetForm;
  unit: WeightUnit;
  onChange: (f: SetForm) => void;
  onUnitChange: (u: WeightUnit) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  t: Theme;
};

function AddSetForm({ label, form, unit, onChange, onUnitChange, onSave, onCancel, saving, t }: AddSetFormProps) {
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
        <View style={styles.setFieldGroup}>
          <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>Reps</Text>
          <TextInput
            style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
            value={form.reps}
            onChangeText={(v) => onChange({ ...form, reps: v })}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
        </View>
        <View style={styles.setFieldGroup}>
          <TouchableOpacity onPress={() => onUnitChange(nextUnit(unit))}>
            <Text style={[styles.setFieldLabel, { color: colors.primary }]}>{unit} ⟳</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
            value={form.amount}
            onChangeText={(v) => onChange({ ...form, amount: v })}
            keyboardType={unit === 'secs' ? 'number-pad' : 'decimal-pad'}
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
        </View>
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

// ─── Workout header (date + body metrics + notes, inline edit) ───

type WorkoutHeaderProps = {
  performedAt: string;
  notes: string | null;
  bodyWeightKg: number | null;
  bodyFatPercent: number | null;
  trainerName: string | null;
  onSave: (p: UpdateWorkout) => Promise<{ error: string | null }>;
  onDirtyChange?: (dirty: boolean, save?: () => Promise<void>) => void;
  t: Theme;
};

function WorkoutHeader({ performedAt, notes, bodyWeightKg, bodyFatPercent, trainerName, onSave, onDirtyChange, t }: WorkoutHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateVal, setDateVal] = useState(performedAt);
  const [notesVal, setNotesVal] = useState(notes ?? '');
  const [weightVal, setWeightVal] = useState(bodyWeightKg != null ? String(bodyWeightKg) : '');
  const [bfVal, setBfVal] = useState(bodyFatPercent != null ? String(bodyFatPercent) : '');

  // Always keep a fresh reference to handleSave to avoid stale closures in onDirtyChange callback
  const handleSaveRef = useRef<() => Promise<void>>();

  const [y, m, d] = performedAt.split('-').map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  function cancelEdit() {
    setEditing(false);
    onDirtyChange?.(false);
  }

  function startEdit() {
    setDateVal(performedAt);
    setNotesVal(notes ?? '');
    setWeightVal(bodyWeightKg != null ? String(bodyWeightKg) : '');
    setBfVal(bodyFatPercent != null ? String(bodyFatPercent) : '');
    setEditing(true);
    onDirtyChange?.(true, async () => { await handleSaveRef.current?.(); });
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await onSave({
      performed_at: dateVal.trim() || performedAt,
      notes: notesVal.trim() || null,
      body_weight_kg: parseOptionalFloat(weightVal),
      body_fat_percent: parseOptionalFloat(bfVal),
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setEditing(false); onDirtyChange?.(false); }
  }
  handleSaveRef.current = handleSave;

  const hasMetrics = bodyWeightKg != null || bodyFatPercent != null;

  if (editing) {
    return (
      <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Date</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
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
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body weight (kg)</Text>
            <TextInput
              style={[styles.headerInput, styles.metricInput, { color: t.textPrimary, borderColor: t.border }]}
              value={weightVal}
              onChangeText={setWeightVal}
              keyboardType="decimal-pad"
              placeholder="Optional"
              placeholderTextColor={t.textSecondary}
            />
          </View>
          <View style={styles.metricCol}>
            <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body fat (%)</Text>
            <TextInput
              style={[styles.headerInput, styles.metricInput, { color: t.textPrimary, borderColor: t.border }]}
              value={bfVal}
              onChangeText={setBfVal}
              keyboardType="decimal-pad"
              placeholder="Optional"
              placeholderTextColor={t.textSecondary}
            />
          </View>
        </View>
        <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Notes</Text>
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
      {trainerName ? <Text style={[styles.trainerText, { color: t.textSecondary }]}>Logged by {trainerName}</Text> : null}
      {hasMetrics && (
        <View style={styles.metricsRow}>
          {bodyWeightKg != null && (
            <View style={styles.metricBadge}>
              <Text style={[styles.metricBadgeLabel, { color: t.textSecondary }]}>Weight</Text>
              <Text style={[styles.metricBadgeValue, { color: t.textPrimary }]}>{bodyWeightKg} kg</Text>
            </View>
          )}
          {bodyFatPercent != null && (
            <View style={styles.metricBadge}>
              <Text style={[styles.metricBadgeLabel, { color: t.textSecondary }]}>Body fat</Text>
              <Text style={[styles.metricBadgeValue, { color: t.textPrimary }]}>{bodyFatPercent}%</Text>
            </View>
          )}
        </View>
      )}
      {notes
        ? <Text style={[styles.notesText, { color: t.textSecondary }]}>{notes}</Text>
        : <Text style={[styles.notesEmpty, { color: t.textSecondary }]}>Tap pencil to add notes or body metrics</Text>}
    </View>
  );
}

// ─── Set row (view + inline edit + delete) ────────────────────────

type SetRowProps = {
  set: SetWithExercise;
  supersetColor: string | null;
  onDelete: () => void;
  onSave: (p: UpdateWorkoutSet) => Promise<{ error: string | null }>;
  onDirtyChange?: (dirty: boolean, save?: () => Promise<void>) => void;
  t: Theme;
};

function SetRow({ set, supersetColor, onDelete, onSave, onDirtyChange, t }: SetRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initUnit: WeightUnit = set.duration_seconds != null ? 'secs' : set.weight_kg != null ? 'kg' : 'lbs';
  const initAmount = set.duration_seconds != null ? String(set.duration_seconds)
                   : set.weight_kg != null ? String(set.weight_kg) : '';
  const [repsVal, setRepsVal] = useState(set.reps != null ? String(set.reps) : '');
  const [amountVal, setAmountVal] = useState(initAmount);
  const [unit, setUnit] = useState<WeightUnit>(initUnit);
  const [notesVal, setNotesVal] = useState(set.notes ?? '');

  const handleSaveRef = useRef<() => Promise<void>>();

  function cancelEdit() {
    setEditing(false);
    onDirtyChange?.(false);
  }

  function startEdit() {
    setRepsVal(set.reps != null ? String(set.reps) : '');
    setAmountVal(set.duration_seconds != null ? String(set.duration_seconds)
               : set.weight_kg != null ? String(set.weight_kg) : '');
    setUnit(set.duration_seconds != null ? 'secs' : set.weight_kg != null ? 'kg' : 'lbs');
    setNotesVal(set.notes ?? '');
    setEditing(true);
    onDirtyChange?.(true, async () => { await handleSaveRef.current?.(); });
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await onSave({
      reps: parseOptionalInt(repsVal),
      ...resolveAmount(amountVal, unit),
      notes: notesVal.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else { setEditing(false); onDirtyChange?.(false); }
  }
  handleSaveRef.current = handleSave;

  const parts: string[] = [];
  if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weight_kg != null) parts.push(`${set.weight_kg} kg`);
  if (set.duration_seconds != null) parts.push(`${set.duration_seconds}s`);

  if (editing) {
    return (
      <View style={[
        styles.setCard,
        { backgroundColor: t.surface, borderColor: t.border },
        supersetColor !== null && { borderLeftWidth: 3, borderLeftColor: supersetColor },
      ]}>
        <View style={styles.setEditHeader}>
          <Text style={[styles.setNumber, { color: t.textSecondary }]}>Set {set.set_number}</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={cancelEdit} style={styles.cancelBtn}>
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
          <View style={styles.setFieldGroup}>
            <Text style={[styles.setFieldLabel, { color: t.textSecondary }]}>Reps</Text>
            <TextInput
              style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
              value={repsVal}
              onChangeText={setRepsVal}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={t.textSecondary}
            />
          </View>
          <View style={styles.setFieldGroup}>
            <TouchableOpacity onPress={() => setUnit(nextUnit(unit))}>
              <Text style={[styles.setFieldLabel, { color: colors.primary }]}>{unit} ⟳</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.setFieldInput, { color: t.textPrimary, borderColor: t.border }]}
              value={amountVal}
              onChangeText={setAmountVal}
              keyboardType={unit === 'secs' ? 'number-pad' : 'decimal-pad'}
              placeholder="—"
              placeholderTextColor={t.textSecondary}
            />
          </View>
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
    <View style={[
      styles.setRow,
      { backgroundColor: t.surface, borderColor: t.border },
      supersetColor !== null && { borderLeftWidth: 3, borderLeftColor: supersetColor },
    ]}>
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
  trainerText: { ...typography.bodySmall, fontStyle: 'italic' },
  notesText: { ...typography.body },
  notesEmpty: { ...typography.bodySmall, fontStyle: 'italic' },
  headerInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  notesTextarea: { minHeight: 64, textAlignVertical: 'top' },

  // ── Body metrics (view + edit) ──
  metricsRow: { flexDirection: 'row', gap: spacing.sm },
  metricCol: { flex: 1, gap: 4 },
  metricInput: { height: 40, textAlign: 'center' },
  metricBadge: { flex: 1, gap: 2 },
  metricBadgeLabel: { ...typography.label },
  metricBadgeValue: { ...typography.body, fontWeight: '600' },

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
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  exerciseTitle: {
    ...typography.label, color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 1,
    flex: 1,
  },
  chainBtn: { paddingLeft: spacing.sm },

  // ── Superset connector ──
  supersetConnector: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 2, gap: spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetBadgeText: {
    ...typography.label, fontWeight: '700', letterSpacing: 1,
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
  saveSuccessBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.primary },
  deleteConfirmText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── Worked out with card ──
  groupCardEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed',
    padding: spacing.sm, marginBottom: spacing.md,
  },
  groupCardEmptyText: { ...typography.bodySmall },
  groupCard: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.xs, marginBottom: spacing.md,
  },
  groupCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  groupCardTitle: { ...typography.label, fontWeight: '700', flex: 1 },
  groupPeerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  groupPeerName: { ...typography.body },
  groupPickerBox: { borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.xs, gap: spacing.xs },
  groupPickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 2 },

  // ── Misc ──
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
});
