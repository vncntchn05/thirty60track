import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { resolveGroupsFromQuery } from '@/lib/muscleSearch';
import { DbExerciseSection } from '@/components/workout/DbExerciseSection';
import { fetchExerciseDb, searchDbExercises, mapDbExercise } from '@/lib/exerciseDb';
import type { DbExercise } from '@/lib/exerciseDb';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise, ExerciseCategory, EquipmentType } from '@/types';
import { EQUIPMENT_TYPES } from '@/types';
import { BodyMap } from '@/components/ui/BodyMap';

const EQUIPMENT_FILTERS: (EquipmentType | 'All')[] = [
  'All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band', 'Other',
];

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength',    label: 'Strength' },
  { value: 'cardio',      label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'stretch',     label: 'Stretch' },
  { value: 'other',       label: 'Other' },
];

type Props = {
  /** Called when the user selects (or just created) an exercise. */
  onSelect: (exercise: Exercise) => void;
  /** Called when the user presses the back arrow without selecting. */
  onClose: () => void;
  /** Exercises already in the current workout — shown with an "in workout" badge. */
  existingIds?: Set<string>;
};

/**
 * Full-screen exercise picker with inline "create new exercise" flow.
 * Render this conditionally instead of the parent screen when the picker is open.
 */
export function ExercisePicker({ onSelect, onClose, existingIds }: Props) {
  const t = useTheme();
  const { exercises, loading, error: loadError, createExercise } = useExercises();

  const [query, setQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ── Create-exercise form state ─────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('strength');
  const [newEquipment, setNewEquipment] = useState<EquipmentType | null>(null);
  const [newFormNotes, setNewFormNotes] = useState('');
  const [newHelpUrl, setNewHelpUrl] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'All'>('All');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ── External DB ────────────────────────────────────────────────
  const [dbAll, setDbAll] = useState<DbExercise[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [addingFromDb, setAddingFromDb] = useState<string | null>(null);

  useEffect(() => {
    if (dbAll.length > 0 || dbLoading) return;
    setDbLoading(true);
    fetchExerciseDb()
      .then(setDbAll)
      .catch(() => {})
      .finally(() => setDbLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const existingNames = useMemo(
    () => new Set(exercises.map((e) => e.name.toLowerCase())),
    [exercises],
  );

  const dbResults = useMemo(() => {
    if (query.trim()) return searchDbExercises(dbAll, query, existingNames);
    // No query: show first 20 DB exercises not already in the library
    const results: DbExercise[] = [];
    for (const e of dbAll) {
      if (!existingNames.has(e.name.toLowerCase())) {
        results.push(e);
        if (results.length === 20) break;
      }
    }
    return results;
  }, [dbAll, query, existingNames]);

  async function handleAddFromDb(dbEx: DbExercise) {
    setAddingFromDb(dbEx.id);
    const { exercise, error } = await createExercise(mapDbExercise(dbEx));
    setAddingFromDb(null);
    if (error) { setCreateError(error); return; }
    if (exercise) onSelect(exercise);
  }

  function openCreate() {
    setNewName(query.trim());
    setNewMuscle('');
    setNewCategory('strength');
    setNewEquipment(null);
    setNewFormNotes('');
    setNewHelpUrl('');
    setCreateError(null);
    setCreating(true);
  }

  async function handleCreate() {
    if (!newName.trim()) { setCreateError('Name is required.'); return; }
    setSaving(true);
    const { exercise, error } = await createExercise({
      name: newName.trim(),
      muscle_group: newMuscle.trim() || null,
      category: newCategory,
      equipment: newEquipment,
      form_notes: newFormNotes.trim() || null,
      help_url: newHelpUrl.trim() || null,
    });
    setSaving(false);
    if (error) { setCreateError(error); return; }
    if (exercise) onSelect(exercise);
  }

  const q = query.toLowerCase();
  const resolvedGroups = q ? resolveGroupsFromQuery(q) : [];
  const filtered = exercises
    .filter((e) => equipmentFilter === 'All' || e.equipment === equipmentFilter)
    .filter((e) => {
      if (muscleFilter !== null) {
        const mf = muscleFilter.toLowerCase();
        const mg = (e.muscle_group ?? '').toLowerCase();
        if (!(mg === mf || (mf === 'core' && mg === 'abs'))) return false;
      }
      if (!q) return true;
      const mg = (e.muscle_group ?? '').toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        mg.includes(q) ||
        resolvedGroups.some((g) => mg.includes(g))
      );
    });

  // ── Create exercise form ─────────────────────────────────────────
  if (creating) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <TouchableOpacity
            onPress={() => setCreating(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>New Exercise</Text>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {createError
            ? <Text style={styles.errorText}>{createError}</Text>
            : null}

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Barbell Squat"
            placeholderTextColor={t.textSecondary}
            autoCapitalize="words"
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Muscle group</Text>
          <TextInput
            style={[styles.input, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
            value={newMuscle}
            onChangeText={setNewMuscle}
            placeholder="e.g. Chest, Quads"
            placeholderTextColor={t.textSecondary}
            autoCapitalize="words"
          />

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(({ value, label }) => {
              const active = newCategory === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.categoryChip,
                    { borderColor: t.border },
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() => setNewCategory(value)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: t.textSecondary },
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Equipment</Text>
          <View style={styles.categoryRow}>
            {(Object.values(EQUIPMENT_TYPES) as EquipmentType[]).map((eq) => {
              const active = newEquipment === eq;
              return (
                <TouchableOpacity
                  key={eq}
                  style={[
                    styles.categoryChip,
                    { borderColor: t.border },
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() => setNewEquipment(active ? null : eq)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    { color: t.textSecondary },
                    active && styles.categoryChipTextActive,
                  ]}>
                    {eq}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Tutorial URL</Text>
          <TextInput
            style={[styles.input, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
            value={newHelpUrl}
            onChangeText={setNewHelpUrl}
            placeholder="https://youtu.be/…"
            placeholderTextColor={t.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Form Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
            value={newFormNotes}
            onChangeText={setNewFormNotes}
            placeholder={'Coaching cues, setup tips…'}
            placeholderTextColor={t.textSecondary}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Add to Library & Select</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Search list ─────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header: back + search */}
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
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

      {/* Main row: body map left, filters + list right */}
      <View style={styles.mainRow}>
        {/* Left column: body map */}
        <View style={[styles.bodyMapCol, { borderRightColor: t.border }]}>
          <BodyMap selected={muscleFilter} onSelect={setMuscleFilter} />
        </View>

        {/* Right column: equipment chips + exercise list */}
        <View style={styles.listCol}>
          {/* Equipment filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterRow, { borderBottomColor: t.border }]}
            contentContainerStyle={styles.filterRowContent}
            keyboardShouldPersistTaps="handled"
          >
            {EQUIPMENT_FILTERS.map((eq) => {
              const active = equipmentFilter === eq;
              return (
                <TouchableOpacity
                  key={eq}
                  style={[
                    styles.filterChip,
                    { borderColor: active ? colors.primary : t.border },
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setEquipmentFilter(eq)}
                >
                  <Text style={[styles.filterChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                    {eq}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FlatList
            data={loading ? [] : filtered}
            keyExtractor={(e) => e.id}
            style={styles.flatList}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.createRow, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={openCreate}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                <View style={styles.createRowBody}>
                  <Text style={styles.createRowTitle}>
                    {query.trim() ? `Create "${query.trim()}"` : 'Create new exercise'}
                  </Text>
                  <Text style={[styles.createRowSub, { color: t.textSecondary }]}>
                    Add to exercise library
                  </Text>
                </View>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.exerciseRow, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => onSelect(item)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{item.name}</Text>
                  {item.muscle_group
                    ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{item.muscle_group}</Text>
                    : null}
                  {item.equipment
                    ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{item.equipment}</Text>
                    : null}
                </View>
                {existingIds?.has(item.id)
                  ? <Text style={[styles.alreadyIn, { color: t.textSecondary }]}>in workout</Text>
                  : <Ionicons name="add-circle-outline" size={22} color={colors.primary} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
              ) : loadError ? (
                <Text style={[styles.emptyText, { color: colors.error }]}>{loadError}</Text>
              ) : (
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                  No exercises found. Tap "Create" above to add one.
                </Text>
              )
            }
            ListFooterComponent={
              <DbExerciseSection
                results={dbResults}
                loading={dbLoading}
                addingId={addingFromDb}
                onAdd={handleAddFromDb}
              />
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: spacing.xl },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  headerTitle: { ...typography.heading3, flex: 1 },
  searchInput: {
    ...typography.body, flex: 1, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 40,
  },

  // ── Two-column layout ──
  mainRow: { flex: 1, flexDirection: 'row' },
  bodyMapCol: { flex: 1, borderRightWidth: 1 },
  listCol: { flex: 1 },

  // ── Search list ──
  list: { padding: spacing.md, gap: spacing.sm },
  createRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    borderStyle: 'dashed', borderColor: colors.primary,
  },
  createRowBody: { flex: 1 },
  createRowTitle: { ...typography.body, fontWeight: '600', color: colors.primary },
  createRowSub: { ...typography.bodySmall, marginTop: 2 },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600' },
  muscleGroup: { ...typography.bodySmall, marginTop: 2 },
  alreadyIn: { ...typography.bodySmall, fontStyle: 'italic' },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },

  // ── Equipment filter chips ──
  filterRow: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1 },
  flatList: { flex: 1 },
  filterRowContent: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs },
  filterChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  filterChipText: { ...typography.label, fontWeight: '600' },

  // ── Create form ──
  form: { padding: spacing.lg, gap: spacing.sm },
  errorText: { ...typography.bodySmall, color: colors.error },
  fieldLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  input: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  categoryChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, borderWidth: 1,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { ...typography.bodySmall, fontWeight: '600' },
  categoryChipTextActive: { color: colors.textInverse },
  notesInput: { minHeight: 120, lineHeight: 22 },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
