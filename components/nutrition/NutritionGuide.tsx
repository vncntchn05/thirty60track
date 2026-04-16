import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionGuide } from '@/hooks/useNutritionGuide';
import { generateNutritionGuide, NUTRITION_AI_ENABLED, ENCYCLOPEDIA_ID_MAP } from '@/lib/nutritionAI';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { NutritionGuideContent, NutritionGuideSupplement, Client, ClientIntake } from '@/types';

// ─── Tappable token ───────────────────────────────────────────

function EncyclopediaLink({
  label,
  encyclopediaId,
  onPress,
}: {
  label: string;
  encyclopediaId: string | null | undefined;
  onPress: (id: string) => void;
}) {
  const t = useTheme();
  if (!encyclopediaId) {
    return <Text style={[styles.tagText, { color: colors.primary }]}>{label}</Text>;
  }
  return (
    <TouchableOpacity onPress={() => onPress(encyclopediaId)} activeOpacity={0.7}>
      <Text style={[styles.tagText, styles.tagLink, { color: colors.primary }]}>
        {label} <Ionicons name="open-outline" size={11} color={colors.primary} />
      </Text>
    </TouchableOpacity>
  );
}

// ─── Macro row ────────────────────────────────────────────────

function MacroRow({
  label, value, unit, encyclopediaId, onEncyclopedia,
}: {
  label: string; value: number | null; unit: string;
  encyclopediaId?: string; onEncyclopedia: (id: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={styles.macroRow}>
      <EncyclopediaLink
        label={label}
        encyclopediaId={encyclopediaId}
        onPress={onEncyclopedia}
      />
      <Text style={[styles.macroValue, { color: t.textPrimary }]}>
        {value != null ? `${value}${unit}` : '—'}
      </Text>
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name={icon as never} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────

type Props = {
  clientId: string;
  trainerId: string;
  client: Client;
  intake: ClientIntake | null;
  isTrainer: boolean;
  onNavigateToEncyclopedia: (topicId: string) => void;
};

// ─── Main component ───────────────────────────────────────────

export function NutritionGuide({ clientId, trainerId, client, intake, isTrainer, onNavigateToEncyclopedia }: Props) {
  const t = useTheme();
  const { guide, loading, error, saveGuide, refetch } = useNutritionGuide(clientId);
  const [generating, setGenerating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  async function handleGenerate() {
    if (!isTrainer) return;
    setGenerating(true);
    const age = client.date_of_birth
      ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;
    const { content, error: genErr } = await generateNutritionGuide({
      full_name: client.full_name,
      gender: client.gender,
      age,
      weight_kg: client.weight_kg,
      height_cm: client.height_cm,
      bf_percent: client.bf_percent,
      goals: intake?.goals ?? null,
      goal_timeframe: intake?.goal_timeframe ?? null,
      activity_level: intake?.activity_level ?? null,
      current_injuries: intake?.current_injuries ?? null,
      chronic_conditions: intake?.chronic_conditions ?? null,
      medications: intake?.medications ?? null,
      allergies: intake?.allergies ?? null,
      dietary_restrictions: intake?.dietary_restrictions ?? null,
      training_frequency_per_week: intake?.training_frequency_per_week ?? null,
      typical_session_length_minutes: intake?.typical_session_length_minutes ?? null,
      outside_gym_activity_level: intake?.outside_gym_activity_level ?? null,
    });
    setGenerating(false);
    if (genErr || !content) {
      Alert.alert('Generation failed', genErr ?? 'Unknown error');
      return;
    }
    const { error: saveErr } = await saveGuide(content, trainerId, false);
    if (saveErr) Alert.alert('Save failed', saveErr);
  }

  async function handleSaveNotes() {
    if (!guide) return;
    const updated: NutritionGuideContent = { ...guide.content, notes: notesText.trim() || null };
    const { error: saveErr } = await saveGuide(updated, trainerId, true);
    if (saveErr) Alert.alert('Error', saveErr);
    else setEditingNotes(false);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Empty state ──────────────────────────────────────────────
  if (!guide) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background, padding: spacing.xl }]}>
        <Ionicons name="document-text-outline" size={48} color={t.textSecondary as string} />
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Guide Yet</Text>
        <Text style={[styles.emptyBody, { color: t.textSecondary }]}>
          {isTrainer
            ? `Generate a personalised nutrition guide for ${client.full_name} based on their intake data and goals.`
            : 'Your trainer hasn\'t generated your nutrition guide yet. Ask them to set one up.'}
        </Text>
        {isTrainer && (
          <TouchableOpacity
            style={[styles.genBtn, generating && styles.genBtnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating
              ? <ActivityIndicator color={colors.textInverse} size="small" />
              : <>
                  <Ionicons name={NUTRITION_AI_ENABLED ? 'sparkles' : 'document-text'} size={16} color={colors.textInverse} />
                  <Text style={styles.genBtnText}>{NUTRITION_AI_ENABLED ? 'Generate with AI' : 'Generate Guide'}</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const c = guide.content;

  // ── Guide view ───────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Nutrition Guide</Text>
            <Text style={[styles.headerSub, { color: t.textSecondary }]}>
              {guide.is_custom ? 'Custom' : NUTRITION_AI_ENABLED ? 'AI-generated' : 'Generated'} ·{' '}
              {guide.generated_at
                ? new Date(guide.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Saved'}
            </Text>
          </View>
          {isTrainer && (
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={generating}
              style={styles.regenBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {generating
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              }
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Daily Targets */}
      <Section title="Daily Targets" icon="flame-outline">
        <View style={[styles.calorieRow, { borderColor: t.border }]}>
          <Ionicons name="nutrition-outline" size={22} color={colors.primary} />
          <Text style={[styles.calorieValue, { color: t.textPrimary }]}>
            {c.calories != null ? `${c.calories} kcal` : '—'}
          </Text>
          <Text style={[styles.calorieLabel, { color: t.textSecondary }]}>per day</Text>
        </View>
        <View style={styles.macroGrid}>
          <MacroRow
            label="Protein" value={c.protein_g} unit="g"
            encyclopediaId={ENCYCLOPEDIA_ID_MAP['protein']}
            onEncyclopedia={onNavigateToEncyclopedia}
          />
          <MacroRow
            label="Carbs" value={c.carbs_g} unit="g"
            encyclopediaId={ENCYCLOPEDIA_ID_MAP['carbs']}
            onEncyclopedia={onNavigateToEncyclopedia}
          />
          <MacroRow
            label="Fat" value={c.fat_g} unit="g"
            encyclopediaId={ENCYCLOPEDIA_ID_MAP['fat']}
            onEncyclopedia={onNavigateToEncyclopedia}
          />
        </View>
      </Section>

      {/* Meal Timing */}
      {c.meal_timing ? (
        <Section title="Meal Timing" icon="time-outline">
          <Text style={[styles.bodyText, { color: t.textPrimary }]}>{c.meal_timing}</Text>
        </Section>
      ) : null}

      {/* Foods to Prioritise */}
      {c.foods_to_prioritise.length > 0 ? (
        <Section title="Foods to Prioritise" icon="checkmark-circle-outline">
          {c.foods_to_prioritise.map((food, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} style={styles.bullet} />
              <Text style={[styles.bulletText, { color: t.textPrimary }]}>{food}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {/* Foods to Avoid */}
      {c.foods_to_avoid.length > 0 ? (
        <Section title="Foods to Avoid" icon="close-circle-outline">
          {c.foods_to_avoid.map((food, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="remove-circle-outline" size={12} color={colors.error} style={styles.bullet} />
              <Text style={[styles.bulletText, { color: t.textPrimary }]}>{food}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      {/* Supplements */}
      {c.supplements.length > 0 ? (
        <Section title="Supplements" icon="medkit-outline">
          {c.supplements.map((supp, i) => (
            <SupplementRow
              key={i}
              supp={supp}
              onEncyclopedia={onNavigateToEncyclopedia}
              t={t}
            />
          ))}
        </Section>
      ) : null}

      {/* Trainer Notes */}
      <Section title="Notes" icon="document-text-outline">
        {editingNotes ? (
          <View>
            <TextInput
              style={[styles.notesInput, { color: t.textPrimary, borderColor: t.border }]}
              value={notesText}
              onChangeText={setNotesText}
              multiline
              textAlignVertical="top"
              placeholder="Add notes..."
              placeholderTextColor={t.textSecondary}
              autoFocus
            />
            <View style={styles.notesBtns}>
              <TouchableOpacity onPress={() => setEditingNotes(false)} style={[styles.notesCancel, { borderColor: t.border }]}>
                <Text style={[styles.notesCancelText, { color: t.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotes} style={styles.notesSave}>
                <Text style={styles.notesSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={isTrainer ? () => { setNotesText(c.notes ?? ''); setEditingNotes(true); } : undefined}
            activeOpacity={isTrainer ? 0.7 : 1}
          >
            <Text style={[styles.bodyText, { color: c.notes ? t.textPrimary : t.textSecondary }]}>
              {c.notes ?? (isTrainer ? 'Tap to add notes…' : 'No additional notes.')}
            </Text>
            {isTrainer && <Ionicons name="pencil-outline" size={13} color={colors.primary} style={styles.editIcon} />}
          </TouchableOpacity>
        )}
      </Section>
    </ScrollView>
  );
}

// ─── Supplement row ────────────────────────────────────────────

function SupplementRow({
  supp, onEncyclopedia, t,
}: {
  supp: NutritionGuideSupplement;
  onEncyclopedia: (id: string) => void;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.suppRow, { borderColor: t.border }]}>
      <View style={styles.suppName}>
        <EncyclopediaLink
          label={supp.name}
          encyclopediaId={supp.encyclopediaId}
          onPress={onEncyclopedia}
        />
      </View>
      <View style={styles.suppMeta}>
        <Text style={[styles.suppDose, { color: t.textPrimary }]}>{supp.dose}</Text>
        <Text style={[styles.suppTiming, { color: t.textSecondary }]}>{supp.timing}</Text>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },

  headerCard: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { ...typography.heading3 },
  headerSub: { ...typography.bodySmall, marginTop: 2 },
  regenBtn: { padding: spacing.xs },

  section: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { ...typography.body, fontWeight: '700', flex: 1 },

  calorieRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: spacing.sm,
  },
  calorieValue: { ...typography.heading2, flex: 1 },
  calorieLabel: { ...typography.bodySmall },

  macroGrid: { gap: spacing.xs },
  macroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  macroValue: { ...typography.body, fontWeight: '600' },

  tagText: { ...typography.body, fontWeight: '700' },
  tagLink: { textDecorationLine: 'underline' },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  bullet: { marginTop: 4 },
  bulletText: { ...typography.body, flex: 1, lineHeight: 22 },

  suppRow: {
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
  },
  suppName: { flex: 1 },
  suppMeta: { flex: 1.5, gap: 2 },
  suppDose: { ...typography.bodySmall, fontWeight: '600' },
  suppTiming: { ...typography.bodySmall },

  bodyText: { ...typography.body, lineHeight: 22 },
  editIcon: { marginTop: spacing.xs },

  notesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, minHeight: 80, lineHeight: 22,
  },
  notesBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, justifyContent: 'flex-end' },
  notesCancel: {
    borderWidth: 1, borderRadius: radius.md,
    paddingVertical: 6, paddingHorizontal: spacing.md,
  },
  notesCancelText: { ...typography.bodySmall, fontWeight: '600' },
  notesSave: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 6, paddingHorizontal: spacing.md,
  },
  notesSaveText: { ...typography.bodySmall, fontWeight: '600', color: colors.textInverse },

  emptyTitle: { ...typography.heading3, marginTop: spacing.sm },
  emptyBody: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  genBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.sm,
  },
  genBtnDisabled: { opacity: 0.6 },
  genBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
