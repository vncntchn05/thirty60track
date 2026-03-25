import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '@/hooks/useExercises';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ExerciseCategory, EquipmentType } from '@/types';
import { EQUIPMENT_TYPES } from '@/types';

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  other: 'Other',
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { exercise, loading, error, updateExercise } = useExercise(id);

  const [formNotes, setFormNotes] = useState('');
  const [helpUrl, setHelpUrl] = useState('');
  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize fields once exercise data loads
  if (exercise && !initialized) {
    setFormNotes(exercise.form_notes ?? '');
    setHelpUrl(exercise.help_url ?? '');
    setEquipment(exercise.equipment ?? null);
    setInitialized(true);
  }

  const isDirty = exercise && (
    formNotes !== (exercise.form_notes ?? '') ||
    helpUrl !== (exercise.help_url ?? '') ||
    equipment !== (exercise.equipment ?? null)
  );

  async function handleSave() {
    setSaving(true);
    const { error: err } = await updateExercise({
      form_notes: formNotes.trim() || null,
      help_url: helpUrl.trim() || null,
      equipment,
    });
    setSaving(false);
    if (err) Alert.alert('Error', err);
  }

  async function handleWatch() {
    const url = (helpUrl.trim() || (exercise?.help_url ?? '')).trim();
    if (!url) return;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert('Cannot open URL', url);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error ?? 'Exercise not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={t.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>{exercise.name}</Text>
          <View style={styles.headerMeta}>
            {exercise.muscle_group ? (
              <Text style={[styles.headerSub, { color: t.textSecondary }]}>{exercise.muscle_group}</Text>
            ) : null}
            <Text style={[styles.headerSub, { color: colors.primary }]}>
              {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Equipment</Text>
        <View style={styles.chipWrap}>
          {(Object.values(EQUIPMENT_TYPES) as EquipmentType[]).map((eq) => {
            const active = equipment === eq;
            return (
              <TouchableOpacity
                key={eq}
                style={[
                  styles.chip,
                  { borderColor: active ? colors.primary : t.border },
                  active && { backgroundColor: colors.primary },
                ]}
                onPress={() => setEquipment(active ? null : eq)}
              >
                <Text style={[styles.chipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                  {eq}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Tutorial URL</Text>
        <View style={[styles.urlRow, { borderColor: t.border }]}>
          <Ionicons name="logo-youtube" size={20} color="#FF0000" />
          <TextInput
            style={[styles.urlInput, { color: t.textPrimary }]}
            value={helpUrl}
            onChangeText={setHelpUrl}
            placeholder="https://youtu.be/…"
            placeholderTextColor={t.textSecondary as string}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {(helpUrl.trim() || exercise.help_url) ? (
            <TouchableOpacity onPress={handleWatch} style={styles.watchBtn}>
              <Text style={styles.watchBtnText}>Watch</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>Form Notes</Text>
        <TextInput
          style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
          value={formNotes}
          onChangeText={setFormNotes}
          placeholder={'1. Setup\n2. Brace core and take a deep breath\n3. Execute the movement\n…'}
          placeholderTextColor={t.textSecondary as string}
          multiline
          textAlignVertical="top"
        />

        {isDirty ? (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  headerText: { flex: 1 },
  headerTitle: { ...typography.heading3 },
  headerMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  headerSub: { ...typography.bodySmall, textTransform: 'capitalize' },

  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },

  fieldLabel: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: spacing.xs,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipText: { ...typography.bodySmall, fontWeight: '600' },

  urlRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  urlInput: { ...typography.body, flex: 1 },
  watchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  watchBtnText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },

  notesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, minHeight: 200, lineHeight: 22,
  },

  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
});
