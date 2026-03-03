import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet, Text, View, SectionList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { TemplateEditor } from '@/components/workout/TemplateEditor';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise, ExerciseCategory } from '@/types';

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'other'];

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  other: 'Other',
};

type GroupBy = 'none' | 'muscle' | 'category';
// count = full count, used in header when section is collapsed
type Section = { title: string; data: Exercise[]; count: number };

function buildSections(exercises: Exercise[], groupBy: GroupBy): Section[] {
  if (groupBy === 'none') {
    return [{ title: '', data: exercises, count: exercises.length }];
  }

  const groups: Record<string, Exercise[]> = {};
  for (const e of exercises) {
    const muscleKey = e.muscle_group?.trim().toLowerCase() ?? '';
    const key =
      groupBy === 'muscle'
        ? (e.muscle_group?.trim() || 'Other')
        : (muscleKey === 'abs' || muscleKey === 'core')
          ? 'Abs'
          : (CATEGORY_LABEL[e.category as ExerciseCategory] ?? 'Other');
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      return a.localeCompare(b);
    })
    .map(([title, data]) => ({ title, data, count: data.length }));
}

// ─── Screen ───────────────────────────────────────────────────────

export default function ExercisesScreen() {
  const t = useTheme();
  const { exercises, loading, error, createExercise } = useExercises();
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState('');
  const [formCategory, setFormCategory] = useState<ExerciseCategory>('strength');
  const [saving, setSaving] = useState(false);

  const fullSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? exercises.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.muscle_group ?? '').toLowerCase().includes(q),
        )
      : exercises;
    return buildSections(base, groupBy);
  }, [exercises, query, groupBy]);

  // Collapse all sections by default whenever groupBy changes to a grouped mode
  useEffect(() => {
    if (groupBy !== 'none') {
      setCollapsedSections(new Set(fullSections.map((s) => s.title)));
    } else {
      setCollapsedSections(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  function toggleSection(title: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  // Sections passed to SectionList — collapsed ones get empty data so items aren't rendered
  const displaySections = useMemo<Section[]>(() => {
    if (groupBy === 'none') return fullSections;
    return fullSections.map((s) => ({
      ...s,
      data: collapsedSections.has(s.title) ? [] : s.data,
    }));
  }, [fullSections, collapsedSections, groupBy]);

  function openForm() {
    setFormName('');
    setFormMuscle('');
    setFormCategory('strength');
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) { Alert.alert('Name required', 'Please enter an exercise name.'); return; }
    setSaving(true);
    const { error: err } = await createExercise({
      name: formName.trim(),
      muscle_group: formMuscle.trim() || null,
      category: formCategory,
    });
    setSaving(false);
    if (err) Alert.alert('Error', err);
    else setShowForm(false);
  }

  if (showTemplateEditor) {
    return <TemplateEditor onClose={() => setShowTemplateEditor(false)} />;
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const totalFiltered = fullSections.reduce((n, s) => n + s.count, 0);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={16} color={t.textSecondary as string} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          placeholder="Search exercises…"
          placeholderTextColor={t.textSecondary as string}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
      </View>

      {/* Group-by control */}
      <View style={[styles.groupBar, { borderBottomColor: t.border }]}>
        <Text style={[styles.groupByLabel, { color: t.textSecondary }]}>Group by</Text>
        {(['none', 'muscle', 'category'] as GroupBy[]).map((opt) => {
          const active = groupBy === opt;
          const label = opt === 'none' ? 'None' : opt === 'muscle' ? 'Muscle' : 'Category';
          return (
            <TouchableOpacity
              key={opt}
              style={[
                styles.groupChip,
                { borderColor: active ? colors.primary : t.border },
                active && { backgroundColor: colors.primary },
              ]}
              onPress={() => setGroupBy(opt)}
            >
              <Text style={[styles.groupChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Add exercise form */}
      {showForm && (
        <View style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.formTitle, { color: t.textPrimary }]}>New Exercise</Text>
          <TextInput
            style={[styles.formInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Exercise name *"
            placeholderTextColor={t.textSecondary as string}
            autoCapitalize="words"
            value={formName}
            onChangeText={setFormName}
            autoFocus
          />
          <TextInput
            style={[styles.formInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Muscle group (optional)"
            placeholderTextColor={t.textSecondary as string}
            autoCapitalize="words"
            value={formMuscle}
            onChangeText={setFormMuscle}
          />
          <Text style={[styles.formLabel, { color: t.textSecondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const active = formCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, { borderColor: active ? colors.primary : t.border }, active && { backgroundColor: colors.primary }]}
                  onPress={() => setFormCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                    {CATEGORY_LABEL[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={[styles.cancelBtn, { borderColor: t.border }]}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveBtnText}>Add Exercise</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      <SectionList<Exercise, Section>
        sections={displaySections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={groupBy !== 'none'}
        renderSectionHeader={({ section }) => {
          if (!section.title) return null;
          const collapsed = collapsedSections.has(section.title);
          return (
            <TouchableOpacity
              style={[styles.sectionHeader, { backgroundColor: t.background, borderBottomColor: t.border }]}
              onPress={() => toggleSection(section.title)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
              <Text style={[styles.sectionCount, { color: t.textSecondary }]}>{section.count}</Text>
              <Ionicons
                name={collapsed ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={t.textSecondary as string}
              />
            </TouchableOpacity>
          );
        }}
        renderItem={({ item }) => <ExerciseRow exercise={item} groupBy={groupBy} t={t} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            {query.trim() ? 'No exercises match your search.' : 'No exercises yet. Add your first one.'}
          </Text>
        }
        ListFooterComponent={
          totalFiltered > 0
            ? <Text style={[styles.countText, { color: t.textSecondary }]}>{totalFiltered} exercise{totalFiltered !== 1 ? 's' : ''}</Text>
            : null
        }
      />

      {/* FABs */}
      {!showForm && (
        <View style={styles.fabRow}>
          <TouchableOpacity style={[styles.fab, styles.fabSecondary]} onPress={() => setShowTemplateEditor(true)} accessibilityLabel="Edit templates">
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.fabLabel, { color: colors.primary }]}>Edit Templates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fab} onPress={openForm} accessibilityLabel="Add exercise">
            <Ionicons name="add" size={20} color={colors.textInverse} />
            <Text style={styles.fabLabel}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Exercise row ──────────────────────────────────────────────────

type Theme = ReturnType<typeof useTheme>;

function ExerciseRow({ exercise, groupBy, t }: { exercise: Exercise; groupBy: GroupBy; t: Theme }) {
  return (
    <View style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{exercise.name}</Text>
        {groupBy === 'muscle' ? (
          <Text style={[styles.meta, { color: t.textSecondary }]}>
            {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
          </Text>
        ) : exercise.muscle_group ? (
          <Text style={[styles.meta, { color: t.textSecondary }]}>{exercise.muscle_group}</Text>
        ) : null}
      </View>
      {groupBy !== 'muscle' && groupBy !== 'category' && (
        <View style={[styles.categoryBadge, { backgroundColor: t.background, borderColor: t.border }]}>
          <Text style={[styles.categoryBadgeText, { color: t.textSecondary }]}>
            {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.md, marginBottom: 0,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
  searchInput: { ...typography.body, flex: 1 },

  groupBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  groupByLabel: { ...typography.label, marginRight: spacing.xs },
  groupChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  groupChipText: { ...typography.label, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 1, flex: 1,
  },
  sectionCount: { ...typography.label },

  list: { paddingTop: spacing.xs, paddingBottom: spacing.xxl + 56 },
  separator: { height: spacing.xs },

  row: {
    marginHorizontal: spacing.md,
    borderRadius: radius.md, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, borderWidth: 1,
  },
  rowInfo: { flex: 1, gap: 2 },
  exerciseName: { ...typography.body, fontWeight: '600' },
  meta: { ...typography.bodySmall },
  categoryBadge: {
    borderRadius: radius.sm, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  categoryBadgeText: { ...typography.label },

  countText: {
    ...typography.bodySmall, textAlign: 'center',
    marginTop: spacing.md, marginBottom: spacing.sm,
  },

  formCard: {
    margin: spacing.md, marginBottom: 0,
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  formTitle: { ...typography.body, fontWeight: '700' },
  formLabel: { ...typography.label },
  formInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 44,
  },
  chipRow: { flexGrow: 0 },
  categoryChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  categoryChipText: { ...typography.bodySmall, fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
  cancelBtnText: { ...typography.body },
  saveBtn: {
    flex: 2, backgroundColor: colors.primary,
    borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },

  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl, marginHorizontal: spacing.lg },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  fabRow: {
    position: 'absolute', bottom: spacing.xl,
    left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm,
  },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabSecondary: {
    backgroundColor: colors.textInverse,
    borderWidth: 1.5, borderColor: colors.primary,
    shadowOpacity: 0.1,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
