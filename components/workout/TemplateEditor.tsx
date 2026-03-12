import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

type EditState = { id: string | null; name: string; exerciseNames: string[] };
type Theme = ReturnType<typeof useTheme>;

// ─── Main component ───────────────────────────────────────────────

export function TemplateEditor({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSave() {
    if (!editing) return;
    if (!editing.name.trim()) { Alert.alert('Name required', 'Please enter a template name.'); return; }
    if (editing.exerciseNames.length === 0) { Alert.alert('No exercises', 'Add at least one exercise.'); return; }
    setSaving(true);
    const payload = { name: editing.name.trim(), exerciseNames: editing.exerciseNames };
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
          onPress={() => setEditing({ id: null, name: '', exerciseNames: [] })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList<WorkoutTemplate>
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
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
                    <TouchableOpacity onPress={() => setDeletingId(null)} style={styles.confirmCancelBtn}>
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
                      onPress={() => setEditing({ id: item.id, name: item.name, exerciseNames: [...item.exerciseNames] })}
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
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
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

  list: { padding: spacing.md, paddingBottom: spacing.xxl },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
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

  formScroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  fieldLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  input: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
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
