import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise, ExerciseCategory } from '@/types';

const CATEGORIES: { value: ExerciseCategory; label: string }[] = [
  { value: 'strength',    label: 'Strength' },
  { value: 'cardio',      label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
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
  const [creating, setCreating] = useState(false);

  // ── Create-exercise form state ─────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('strength');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function openCreate() {
    setNewName(query.trim());
    setNewMuscle('');
    setNewCategory('strength');
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
    });
    setSaving(false);
    if (error) { setCreateError(error); return; }
    if (exercise) onSelect(exercise);
  }

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

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

        <View style={styles.form}>
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

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Add to Library & Select</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Search list ─────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
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

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : loadError ? (
        <Text style={[styles.emptyText, { color: colors.error }]}>{loadError}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
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
              </View>
              {existingIds?.has(item.id)
                ? <Text style={[styles.alreadyIn, { color: t.textSecondary }]}>in workout</Text>
                : <Ionicons name="add-circle-outline" size={22} color={colors.primary} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              No exercises found. Tap "Create" above to add one.
            </Text>
          }
        />
      )}
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
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
