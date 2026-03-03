import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SectionList,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

const PHASE_ORDER = ['Phase 1', 'Phase 2', 'Phase 3', 'Abs'];

function phaseColor(phase: string): string {
  switch (phase) {
    case 'Phase 1': return '#4A90D9';
    case 'Phase 2': return '#E67E22';
    case 'Phase 3': return colors.primary;
    default:        return '#27AE60';
  }
}

function sortPhases(phases: string[]): string[] {
  return [...phases].sort((a, b) => {
    const ai = PHASE_ORDER.indexOf(a);
    const bi = PHASE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });
}

type EditState = { id: string | null; name: string; phase: string; exerciseNames: string[] };
type Theme = ReturnType<typeof useTheme>;
type Section = { title: string; data: WorkoutTemplate[] };

// ─── Main component ───────────────────────────────────────────────

export function TemplateEditor({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>('Phase 1');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Section list data (hooks must be before any early returns) ───
  const sections = useMemo<Section[]>(() => {
    const phaseMap = new Map<string, WorkoutTemplate[]>();
    for (const tmpl of templates) {
      if (!phaseMap.has(tmpl.phase)) phaseMap.set(tmpl.phase, []);
      phaseMap.get(tmpl.phase)!.push(tmpl);
    }
    return sortPhases([...phaseMap.keys()]).map((phase) => ({
      title: phase,
      data: phaseMap.get(phase)!,
    }));
  }, [templates]);

  const displaySections = useMemo<Section[]>(
    () => sections.map((s) => ({ ...s, data: expandedPhase === s.title ? s.data : [] })),
    [sections, expandedPhase],
  );

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) { Alert.alert('Name required', 'Please enter a template name.'); return; }
    if (editing.exerciseNames.length === 0) { Alert.alert('No exercises', 'Add at least one exercise.'); return; }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      phase: editing.phase,
      category: editing.phase === 'Abs' ? 'Abs' : 'Main',
      exerciseNames: editing.exerciseNames,
    };
    const { error } = editing.id
      ? await updateTemplate(editing.id, payload)
      : await createTemplate(payload);
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(null);
  }

  // ── Exercise picker overlay ──────────────────────────────────────
  if (showExercisePicker && editing) {
    return (
      <ExercisePicker
        onSelect={(exercise) => {
          if (!editing.exerciseNames.includes(exercise.name)) {
            setEditing((e) => e ? { ...e, exerciseNames: [...e.exerciseNames, exercise.name] } : e);
          }
          setShowExercisePicker(false);
        }}
        onClose={() => setShowExercisePicker(false)}
      />
    );
  }

  // ── Edit / create form ───────────────────────────────────────────
  if (editing) {
    return (
      <EditForm
        editing={editing}
        saving={saving}
        onChange={setEditing}
        onAddExercise={() => setShowExercisePicker(true)}
        onCancel={() => setEditing(null)}
        onSave={handleSave}
        t={t}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Templates</Text>
        <TouchableOpacity
          onPress={() => setEditing({ id: null, name: '', phase: 'Phase 1', exerciseNames: [] })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <SectionList<WorkoutTemplate, Section>
          sections={displaySections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => {
            const isOpen = expandedPhase === section.title;
            const color = phaseColor(section.title);
            const fullSection = sections.find((s) => s.title === section.title);
            return (
              <TouchableOpacity
                style={[styles.phaseHeader, { backgroundColor: t.surface, borderBottomColor: t.border }]}
                onPress={() => setExpandedPhase(isOpen ? null : section.title)}
                activeOpacity={0.7}
              >
                <View style={[styles.phaseDot, { backgroundColor: color }]} />
                <Text style={[styles.phaseLabel, { color: t.textPrimary }]}>{section.title}</Text>
                <Text style={[styles.phaseCount, { color: t.textSecondary }]}>
                  {fullSection?.data.length ?? 0}
                </Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={t.textSecondary as string}
                />
              </TouchableOpacity>
            );
          }}
          renderItem={({ item }) => {
            const isConfirming = deletingId === item.id;
            return (
              <View style={[styles.templateRow, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={styles.templateInfo}>
                  <Text style={[styles.templateName, { color: t.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.templateCount, { color: t.textSecondary }]}>
                    {item.exerciseNames.length} exercise{item.exerciseNames.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {isConfirming ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setDeletingId(null)}
                      style={styles.confirmCancelBtn}
                    >
                      <Text style={styles.confirmCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        setDeletingId(null);
                        const { error } = await deleteTemplate(item.id);
                        if (error) Alert.alert('Error', error);
                      }}
                      style={styles.confirmDeleteBtn}
                    >
                      <Text style={styles.confirmDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setEditing({ id: item.id, name: item.name, phase: item.phase, exerciseNames: [...item.exerciseNames] })}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDeletingId(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'transparent' }} />}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              No templates yet. Tap + to create one.
            </Text>
          }
        />
      )}
    </View>
  );
}

// ─── Edit form ────────────────────────────────────────────────────

type EditFormProps = {
  editing: EditState;
  saving: boolean;
  onChange: (e: EditState) => void;
  onAddExercise: () => void;
  onCancel: () => void;
  onSave: () => void;
  t: Theme;
};

function EditForm({ editing, saving, onChange, onAddExercise, onCancel, onSave, t }: EditFormProps) {
  const isNew = editing.id === null;

  function removeExercise(index: number) {
    onChange({ ...editing, exerciseNames: editing.exerciseNames.filter((_, i) => i !== index) });
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
          {isNew ? 'New Template' : 'Edit Template'}
        </Text>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.saveHeaderBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Template name *</Text>
        <TextInput
          style={[styles.input, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
          value={editing.name}
          onChangeText={(v) => onChange({ ...editing, name: v })}
          placeholder="e.g. Workout A: Push Focus"
          placeholderTextColor={t.textSecondary as string}
          autoCapitalize="words"
          autoFocus={isNew}
        />

        {/* Phase */}
        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Phase</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {PHASE_ORDER.map((phase) => {
            const active = editing.phase === phase;
            return (
              <TouchableOpacity
                key={phase}
                style={[
                  styles.phaseChip,
                  { borderColor: active ? phaseColor(phase) : t.border },
                  active && { backgroundColor: phaseColor(phase) },
                ]}
                onPress={() => onChange({ ...editing, phase })}
              >
                <Text style={[styles.phaseChipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                  {phase}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Exercise list */}
        <View style={styles.exercisesHeader}>
          <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>
            Exercises ({editing.exerciseNames.length})
          </Text>
          <TouchableOpacity
            style={[styles.addExerciseBtn, { borderColor: colors.primary }]}
            onPress={onAddExercise}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {editing.exerciseNames.length === 0 ? (
          <TouchableOpacity
            style={[styles.emptyExercises, { borderColor: t.border }]}
            onPress={onAddExercise}
          >
            <Ionicons name="barbell-outline" size={28} color={t.textSecondary as string} />
            <Text style={[styles.emptyExercisesText, { color: t.textSecondary }]}>
              No exercises yet — tap Add Exercise
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.exerciseList, { borderColor: t.border }]}>
            {editing.exerciseNames.map((name, i) => (
              <View
                key={i}
                style={[styles.exerciseItem, { borderBottomColor: t.border }, i === editing.exerciseNames.length - 1 && styles.exerciseItemLast]}
              >
                <Text style={[styles.exerciseIndex, { color: t.textSecondary }]}>{i + 1}</Text>
                <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{name}</Text>
                <TouchableOpacity onPress={() => removeExercise(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: spacing.xl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1,
  },
  headerTitle: { ...typography.heading3, fontWeight: '700' },
  saveHeaderBtn: { ...typography.body, color: colors.primary, fontWeight: '700' },

  list: { paddingBottom: spacing.xxl },

  phaseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseLabel: { ...typography.body, fontWeight: '700', flex: 1 },
  phaseCount: { ...typography.bodySmall },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginTop: spacing.xs,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
  },
  templateInfo: { flex: 1, gap: 2 },
  templateName: { ...typography.body, fontWeight: '600' },
  templateCount: { ...typography.bodySmall },
  iconBtn: { padding: spacing.xs },

  confirmCancelBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  confirmCancelText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  confirmDeleteBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.sm, backgroundColor: colors.error,
  },
  confirmDeleteText: { ...typography.bodySmall, color: '#fff', fontWeight: '700' },

  emptyText: {
    ...typography.body, textAlign: 'center',
    marginTop: spacing.xl, paddingHorizontal: spacing.lg,
  },

  // ── Edit form ──
  formScroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  fieldLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  input: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  chipRow: { flexGrow: 0, marginTop: spacing.xs },
  phaseChip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  phaseChipText: { ...typography.bodySmall, fontWeight: '600' },
  exercisesHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  addExerciseBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  emptyExercises: {
    alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md,
    paddingVertical: spacing.xl, marginTop: spacing.xs,
  },
  emptyExercisesText: { ...typography.bodySmall },
  exerciseList: {
    borderWidth: 1, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xs,
  },
  exerciseItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  exerciseItemLast: { borderBottomWidth: 0 },
  exerciseIndex: { ...typography.bodySmall, width: 22, textAlign: 'right' },
  exerciseName: { ...typography.body, flex: 1 },
});
