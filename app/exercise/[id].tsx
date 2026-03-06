import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercise } from '@/hooks/useExercises';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ExerciseCategory } from '@/types';

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
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize fields once exercise data loads
  if (exercise && !initialized) {
    setFormNotes(exercise.form_notes ?? '');
    setHelpUrl(exercise.help_url ?? '');
    setInitialized(true);
  }

  const isDirty = exercise && (
    formNotes !== (exercise.form_notes ?? '') ||
    helpUrl !== (exercise.help_url ?? '')
  );

  async function handleSave() {
    setSaving(true);
    const { error: err } = await updateExercise({
      form_notes: formNotes.trim() || null,
      help_url: helpUrl.trim() || null,
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={[styles.errorText]}>{error ?? 'Exercise not found.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          title: exercise.name,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as never)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerBtn}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Info card (read-only) ── */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.exerciseName, { color: t.textPrimary }]}>{exercise.name}</Text>
          <View style={styles.badges}>
            {exercise.muscle_group ? (
              <View style={[styles.badge, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.badgeText, { color: t.textSecondary }]}>{exercise.muscle_group}</Text>
              </View>
            ) : null}
            <View style={[styles.badge, { backgroundColor: t.background, borderColor: t.border }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {CATEGORY_LABEL[exercise.category as ExerciseCategory] ?? exercise.category}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tutorial link ── */}
        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Tutorial Link</Text>
        <View style={[styles.card, styles.urlRow, { backgroundColor: t.surface, borderColor: t.border }]}>
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

        {/* ── Form notes ── */}
        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Form Notes</Text>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TextInput
            style={[styles.notesInput, { color: t.textPrimary }]}
            value={formNotes}
            onChangeText={setFormNotes}
            placeholder={'1. Setup\n2. Brace core and take a deep breath\n3. Execute the movement\n…'}
            placeholderTextColor={t.textSecondary as string}
            multiline
            textAlignVertical="top"
          />
        </View>

      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBtn: { marginRight: spacing.sm },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl + 56 },

  sectionLabel: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: spacing.sm, paddingHorizontal: spacing.xs,
  },

  card: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },

  // ── Info card ──
  exerciseName: { ...typography.heading3 },
  badges: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  badge: {
    borderRadius: radius.full, borderWidth: 1,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  badgeText: { ...typography.label },

  // ── URL row ──
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  urlInput: { ...typography.body, flex: 1 },
  watchBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  watchBtnText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },

  // ── Form notes ──
  notesInput: { ...typography.body, minHeight: 200, lineHeight: 22 },

  // ── Save button ──
  saveBtn: {
    margin: spacing.md, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
});
