import { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet, Text, View, SectionList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExercises } from '@/hooks/useExercises';
import { useFavourites } from '@/hooks/useFavourites';
import { resolveGroupsFromQuery } from '@/lib/muscleSearch';
import { TemplateEditor } from '@/components/workout/TemplateEditor';
import { DbExerciseSection } from '@/components/workout/DbExerciseSection';
import { fetchExerciseDb, searchDbExercises, mapDbExercise } from '@/lib/exerciseDb';
import type { DbExercise } from '@/lib/exerciseDb';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise, ExerciseCategory, EquipmentType } from '@/types';
import { EQUIPMENT_TYPES } from '@/types';
import { BodyMap } from '@/components/ui/BodyMap';
import { EncyclopediaPanel } from '@/components/exercises/EncyclopediaPanel';
import { WorkoutGuides } from '@/components/exercises/WorkoutGuides';
import { GuestLock } from '@/components/ui/GuestLock';
import { useAuth } from '@/lib/auth';

const CATEGORIES: ExerciseCategory[] = ['strength', 'cardio', 'flexibility', 'stretch', 'other'];

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  strength:    'Strength',
  cardio:      'Cardio',
  flexibility: 'Flexibility',
  stretch:     'Stretch',
  other:       'Other',
};

const EQUIPMENT_FILTERS: (EquipmentType | 'All')[] = [
  'All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band', 'Other',
];

type RightTab = 'exercises' | 'encyclopedia' | 'guides';
type GroupBy = 'none' | 'category';
// count = full count, used in header when section is collapsed
type Section = { title: string; data: Exercise[]; count: number };

function buildSections(exercises: Exercise[], groupBy: GroupBy): Section[] {
  if (groupBy === 'none') {
    return [{ title: '', data: exercises, count: exercises.length }];
  }
  // category only
  const groups: Record<string, Exercise[]> = {};
  for (const e of exercises) {
    const key = CATEGORY_LABEL[e.category as ExerciseCategory] ?? 'Other';
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { role, isGuest } = useAuth();
  const isTrainer = role === 'trainer';
  const { exercises, loading, error, createExercise } = useExercises();
  const { favouriteExerciseIds, toggleFavourite } = useFavourites();
  const { tab: tabParam, topic: topicParam } = useLocalSearchParams<{ tab?: string; topic?: string }>();
  const [query, setQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState('');
  const [formCategory, setFormCategory] = useState<ExerciseCategory>('strength');
  const [formEquipment, setFormEquipment] = useState<EquipmentType | null>(null);
  const [formNotes, setFormNotes] = useState('');
  const [formHelpUrl, setFormHelpUrl] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentType | 'All'>('All');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>(
    tabParam === 'guides' ? 'guides' : tabParam === 'encyclopedia' ? 'encyclopedia' : 'exercises'
  );
  const [saving, setSaving] = useState(false);

  // ── External DB ────────────────────────────────────────────────
  const [dbAll, setDbAll] = useState<DbExercise[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [addingFromDb, setAddingFromDb] = useState<string | null>(null);
  const [pendingDbEx, setPendingDbEx] = useState<DbExercise | null>(null);
  const [dbImportEquipment, setDbImportEquipment] = useState<EquipmentType | null>(null);
  const [dbImportHelpUrl, setDbImportHelpUrl] = useState('');
  const [dbImportNotes, setDbImportNotes] = useState('');

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

  function handleAddFromDb(dbEx: DbExercise) {
    setDbImportEquipment(null);
    setDbImportHelpUrl('');
    setDbImportNotes('');
    setPendingDbEx(dbEx);
  }

  async function handleConfirmImport() {
    if (!pendingDbEx) return;
    setAddingFromDb(pendingDbEx.id);
    setPendingDbEx(null);
    await createExercise({
      ...mapDbExercise(pendingDbEx),
      equipment: dbImportEquipment,
      form_notes: dbImportNotes.trim() || null,
      help_url: dbImportHelpUrl.trim() || null,
    });
    setAddingFromDb(null);
  }

  const fullSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const resolvedGroups = q ? resolveGroupsFromQuery(q) : [];
    let base = q
      ? exercises.filter((e) => {
          const mg = (e.muscle_group ?? '').toLowerCase();
          return (
            e.name.toLowerCase().includes(q) ||
            mg.includes(q) ||
            resolvedGroups.some((g) => mg.includes(g))
          );
        })
      : exercises;
    if (equipmentFilter !== 'All') {
      base = base.filter((e) => e.equipment === equipmentFilter);
    }
    if (muscleFilter !== null) {
      const mf = muscleFilter.toLowerCase();
      base = base.filter((e) => {
        const mg = (e.muscle_group ?? '').toLowerCase();
        return mg === mf || (mf === 'core' && mg === 'abs');
      });
    }
    // Starred exercises float to the top within each section
    base = [...base].sort((a, b) => {
      const aFav = favouriteExerciseIds.has(a.id) ? 0 : 1;
      const bFav = favouriteExerciseIds.has(b.id) ? 0 : 1;
      return aFav - bFav;
    });
    return buildSections(base, groupBy);
  }, [exercises, query, groupBy, equipmentFilter, muscleFilter, favouriteExerciseIds]);

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
    setFormEquipment(null);
    setFormNotes('');
    setFormHelpUrl('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) { Alert.alert('Name required', 'Please enter an exercise name.'); return; }
    setSaving(true);
    const { error: err } = await createExercise({
      name: formName.trim(),
      muscle_group: formMuscle.trim() || null,
      category: formCategory,
      equipment: formEquipment,
      form_notes: formNotes.trim() || null,
      help_url: formHelpUrl.trim() || null,
    });
    setSaving(false);
    if (err) Alert.alert('Error', err);
    else setShowForm(false);
  }

  if (showTemplateEditor) {
    if (isGuest) {
      return (
        <GuestLock message="Sign up to view and manage workout templates">
          <TemplateEditor onClose={() => setShowTemplateEditor(false)} />
        </GuestLock>
      );
    }
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

  if (pendingDbEx) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.importHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={() => setPendingDbEx(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
          </TouchableOpacity>
          <View style={styles.importHeaderText}>
            <Text style={[styles.importTitle, { color: t.textPrimary }]}>{pendingDbEx.name}</Text>
            {pendingDbEx.primaryMuscles[0] ? (
              <Text style={[styles.importMuscle, { color: t.textSecondary }]}>
                {pendingDbEx.primaryMuscles[0]}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView style={styles.importBody} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.importBodyContent}>
          <Text style={[styles.formLabel, { color: t.textSecondary }]}>Equipment</Text>
          <View style={styles.importChipWrap}>
            {(Object.values(EQUIPMENT_TYPES) as EquipmentType[]).map((eq) => {
              const active = dbImportEquipment === eq;
              return (
                <TouchableOpacity
                  key={eq}
                  style={[styles.categoryChip, { borderColor: active ? colors.primary : t.border }, active && { backgroundColor: colors.primary }]}
                  onPress={() => setDbImportEquipment(active ? null : eq)}
                >
                  <Text style={[styles.categoryChipText, { color: active ? colors.textInverse : t.textSecondary }]}>{eq}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.formLabel, { color: t.textSecondary }]}>Tutorial URL</Text>
          <TextInput
            style={[styles.formInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="https://youtu.be/…"
            placeholderTextColor={t.textSecondary as string}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={dbImportHelpUrl}
            onChangeText={setDbImportHelpUrl}
          />

          <Text style={[styles.formLabel, { color: t.textSecondary }]}>Form Notes</Text>
          <TextInput
            style={[styles.formInput, styles.formNotesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder="Coaching cues, setup tips…"
            placeholderTextColor={t.textSecondary as string}
            autoCapitalize="sentences"
            multiline
            textAlignVertical="top"
            value={dbImportNotes}
            onChangeText={setDbImportNotes}
          />

          <TouchableOpacity onPress={handleConfirmImport} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Add to Library</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const totalFiltered = fullSections.reduce((n, s) => n + s.count, 0);
  const isVertical = rightTab !== 'exercises' || width < 768;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Tab bar — always at top */}
      <View style={[styles.rightTabBar, { borderBottomColor: t.border }]}>
        {(['exercises', 'encyclopedia', 'guides'] as RightTab[]).map((tab) => {
          const active = rightTab === tab;
          const label = tab === 'exercises' ? 'Exercises' : tab === 'encyclopedia' ? 'Encyclopedia' : 'Guides';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.rightTabBtn, active && { borderBottomColor: colors.primary }]}
              onPress={() => setRightTab(tab)}
            >
              <Text style={[styles.rightTabText, { color: active ? colors.primary : t.textSecondary }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main area */}
      <View style={[styles.mainRow, isVertical && styles.mainCol]}>
        {/* Body map — desktop side column only; on mobile it lives inside the scroll */}
        {!isVertical && (
          <View style={[styles.bodyMapCol, { borderRightColor: t.border }]}>
            <BodyMap selected={muscleFilter} onSelect={setMuscleFilter} />
          </View>
        )}

        {/* Content column */}
        <View style={styles.listCol}>

          {rightTab === 'exercises' ? (
            <SectionList<Exercise, Section>
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View>
                  {/* Body map — mobile only */}
                  {isVertical && (
                    <View style={[styles.bodyMapRow, { borderBottomColor: t.border }]}>
                      <View style={styles.bodyMapRowInner}>
                        <BodyMap selected={muscleFilter} onSelect={setMuscleFilter} />
                      </View>
                    </View>
                  )}

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

                  {/* Equipment filter chips */}
                  <View style={[styles.filterRowWrapper, { borderBottomColor: t.border }]}>
                    <Text style={[styles.filterLabel, { color: t.textSecondary }]}>Equipment</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filterRow}
                      contentContainerStyle={styles.filterRowContent}
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
                  </View>

                  {/* Group-by control */}
                  <View style={[styles.groupBar, { borderBottomColor: t.border }]}>
                    <Text style={[styles.groupByLabel, { color: t.textSecondary }]}>Group by</Text>
                    {(['none', 'category'] as GroupBy[]).map((opt) => {
                      const active = groupBy === opt;
                      const label = opt === 'none' ? 'None' : 'Category';
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

                  {/* Add exercise form — trainers only */}
                  {isTrainer && showForm && (
                    <View style={[styles.formCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                      <Text style={[styles.formTitle, { color: t.textPrimary }]}>New Exercise</Text>
                      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
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
                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Equipment</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                          {(Object.values(EQUIPMENT_TYPES) as EquipmentType[]).map((eq) => {
                            const active = formEquipment === eq;
                            return (
                              <TouchableOpacity
                                key={eq}
                                style={[styles.categoryChip, { borderColor: active ? colors.primary : t.border }, active && { backgroundColor: colors.primary }]}
                                onPress={() => setFormEquipment(active ? null : eq)}
                              >
                                <Text style={[styles.categoryChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                                  {eq}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Tutorial URL</Text>
                        <TextInput
                          style={[styles.formInput, { borderColor: t.border, color: t.textPrimary }]}
                          placeholder="https://youtu.be/…"
                          placeholderTextColor={t.textSecondary as string}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="url"
                          value={formHelpUrl}
                          onChangeText={setFormHelpUrl}
                        />
                        <Text style={[styles.formLabel, { color: t.textSecondary }]}>Form Notes</Text>
                        <TextInput
                          style={[styles.formInput, styles.formNotesInput, { borderColor: t.border, color: t.textPrimary }]}
                          placeholder={'Coaching cues, setup tips…'}
                          placeholderTextColor={t.textSecondary as string}
                          autoCapitalize="sentences"
                          multiline
                          textAlignVertical="top"
                          value={formNotes}
                          onChangeText={setFormNotes}
                        />
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
                      </ScrollView>
                    </View>
                  )}
                </View>
              }
              sections={displaySections}
                keyExtractor={(item) => item.id}
                style={styles.sectionList}
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
                renderItem={({ item }) => (
                  <ExerciseRow
                    exercise={item}
                    groupBy={groupBy}
                    t={t}
                    isFavourite={favouriteExerciseIds.has(item.id)}
                    onToggleFavourite={() => toggleFavourite('exercise', item.id)}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                    {query.trim() ? 'No exercises match your search.' : 'No exercises yet. Add your first one.'}
                  </Text>
                }
                ListFooterComponent={
                  <>
                    {totalFiltered > 0 && (
                      <Text style={[styles.countText, { color: t.textSecondary }]}>
                        {totalFiltered} exercise{totalFiltered !== 1 ? 's' : ''}
                      </Text>
                    )}
                    <DbExerciseSection
                      results={dbResults}
                      loading={dbLoading}
                      addingId={addingFromDb}
                      onAdd={isTrainer ? handleAddFromDb : undefined}
                    />
                  </>
                }
              />
          ) : rightTab === 'encyclopedia' ? (
            isGuest ? (
              <GuestLock message="Sign up to access the full exercise encyclopedia">
                <EncyclopediaPanel
                  selectedMuscle={muscleFilter}
                  onSelectMuscle={setMuscleFilter}
                  isTrainer={false}
                />
              </GuestLock>
            ) : (
              <EncyclopediaPanel
                selectedMuscle={muscleFilter}
                onSelectMuscle={setMuscleFilter}
                isTrainer={isTrainer}
                scrollHeader={isVertical ? (
                  <View style={[styles.bodyMapRow, { borderBottomColor: t.border }]}>
                    <View style={styles.bodyMapRowInner}>
                      <BodyMap selected={muscleFilter} onSelect={setMuscleFilter} />
                    </View>
                  </View>
                ) : undefined}
              />
            )
          ) : (
            isGuest ? (
              <GuestLock message="Sign up to access workout guides and training programs">
                <WorkoutGuides
                  selectedMuscle={muscleFilter}
                  onSelectMuscle={setMuscleFilter}
                  isTrainer={false}
                  initialTopicKey={topicParam ?? null}
                  onExercisePress={() => {}}
                />
              </GuestLock>
            ) : (
              <WorkoutGuides
                selectedMuscle={muscleFilter}
                onSelectMuscle={setMuscleFilter}
                isTrainer={isTrainer}
                initialTopicKey={topicParam ?? null}
                onExercisePress={(name) => {
                  const match = exercises.find((e) => e.name.toLowerCase() === name.toLowerCase());
                  if (match) router.push(`/exercise/${match.id}` as never);
                }}
                scrollHeader={isVertical ? (
                  <View style={[styles.bodyMapRow, { borderBottomColor: t.border }]}>
                    <View style={styles.bodyMapRowInner}>
                      <BodyMap selected={muscleFilter} onSelect={setMuscleFilter} />
                    </View>
                  </View>
                ) : undefined}
              />
            )
          )}
        </View>
      </View>

      {/* FABs — trainers only, exercises tab only */}
      {isTrainer && !showForm && rightTab === 'exercises' && (
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

function ExerciseRow({
  exercise, groupBy, t, isFavourite, onToggleFavourite,
}: {
  exercise: Exercise; groupBy: GroupBy; t: Theme;
  isFavourite: boolean; onToggleFavourite: () => void;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={() => router.push(`/exercise/${exercise.id}` as never)}
    >
      <View style={styles.rowInfo}>
        <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{exercise.name}</Text>
        {exercise.muscle_group ? (
          <Text style={[styles.meta, { color: t.textSecondary }]}>{exercise.muscle_group}</Text>
        ) : null}
      </View>
      {groupBy !== 'category' && (
        <View style={[styles.categoryBadge, { backgroundColor: t.background, borderColor: t.border }]}>
          <Text style={[styles.categoryBadgeText, { color: t.textSecondary }]}>
            {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
          </Text>
        </View>
      )}
      {exercise.equipment ? (
        <View style={[styles.categoryBadge, { backgroundColor: t.background, borderColor: t.border }]}>
          <Text style={[styles.categoryBadgeText, { color: t.textSecondary }]}>{exercise.equipment}</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={onToggleFavourite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={isFavourite ? 'star' : 'star-outline'}
          size={18}
          color={isFavourite ? colors.primary : (t.textSecondary as string)}
        />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainRow: { flex: 1, flexDirection: 'row' },
  mainCol: { flexDirection: 'column' },
  bodyMapCol: { flex: 1, borderRightWidth: 1 },
  bodyMapRow: { borderBottomWidth: 1, alignItems: 'center', paddingVertical: spacing.sm },
  bodyMapRowInner: { width: 200, height: 300 },
  listCol: { flex: 1 },

  rightTabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  rightTabBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  rightTabText: {
    ...typography.body, fontWeight: '600',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: 0,
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

  sectionList: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.xxl + 56 },
  separator: { height: spacing.xs },

  row: {
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
    padding: spacing.md,
    maxHeight: '70%',
  },
  formScroll: { gap: spacing.sm, paddingBottom: spacing.xs },
  formTitle: { ...typography.body, fontWeight: '700' },
  formLabel: { ...typography.label },
  formInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 44,
  },
  filterRowWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: spacing.xs },
  filterLabel: { ...typography.label, marginLeft: spacing.md, marginRight: spacing.xs },
  filterRow: { flex: 1 },
  filterRowContent: { gap: spacing.xs, paddingRight: spacing.md, paddingVertical: spacing.xs },
  filterChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  filterChipText: { ...typography.label, fontWeight: '600' },

  formNotesInput: { minHeight: 100, height: 'auto', lineHeight: 22 },
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

  importHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  importHeaderText: { flex: 1 },
  importTitle: { ...typography.heading3 },
  importMuscle: { ...typography.bodySmall, marginTop: 2, textTransform: 'capitalize' },
  importBody: { flex: 1 },
  importBodyContent: { padding: spacing.lg, gap: spacing.sm },
  importChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

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
