import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealPlan } from '@/hooks/useMealPlan';
import { generateMealPlan, NUTRITION_AI_ENABLED } from '@/lib/nutritionAI';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { MealPlanDay, MealPlanItem, SupplementScheduleItem, NutritionGuideContent, Client, ClientIntake } from '@/types';

// ─── Macro badge ──────────────────────────────────────────────

function MacroBadge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { backgroundColor: color + '18' }]}>
      <Text style={[styles.macroBadgeValue, { color }]}>{value}{unit}</Text>
      <Text style={[styles.macroBadgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Meal card ────────────────────────────────────────────────

function MealCard({ meal, t }: { meal: MealPlanItem; t: ReturnType<typeof useTheme> }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <View style={[styles.mealCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <TouchableOpacity style={styles.mealHeader} onPress={() => setExpanded((e) => !e)} activeOpacity={0.7}>
        <View>
          <Text style={[styles.mealName, { color: t.textPrimary }]}>{meal.name}</Text>
          {meal.time ? <Text style={[styles.mealTime, { color: t.textSecondary }]}>{meal.time}</Text> : null}
        </View>
        <View style={styles.mealHeaderRight}>
          <Text style={[styles.mealCalories, { color: colors.primary }]}>{meal.calories} kcal</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={t.textSecondary as string} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={[styles.macroRow, { borderBottomColor: t.border }]}>
            <MacroBadge label="Protein" value={meal.protein_g} unit="g" color="#E07B54" />
            <MacroBadge label="Carbs" value={meal.carbs_g} unit="g" color="#5B9BD5" />
            <MacroBadge label="Fat" value={meal.fat_g} unit="g" color={colors.primary} />
          </View>
          <View style={styles.foodsList}>
            {meal.foods.map((food, i) => (
              <View key={i} style={styles.foodRow}>
                <Ionicons name="ellipse" size={5} color={t.textSecondary as string} />
                <Text style={[styles.foodText, { color: t.textPrimary }]}>{food}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Supplement schedule ──────────────────────────────────────

function SupplementSchedule({ items, t }: { items: SupplementScheduleItem[]; t: ReturnType<typeof useTheme> }) {
  if (!items.length) return null;
  return (
    <View style={[styles.suppSchedule, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.suppHeader}>
        <Ionicons name="medkit-outline" size={16} color={colors.primary} />
        <Text style={[styles.suppTitle, { color: t.textPrimary }]}>Supplement Schedule</Text>
      </View>
      {items.map((slot, i) => (
        <View key={i} style={[styles.suppSlot, i < items.length - 1 && { borderBottomColor: t.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <Text style={[styles.suppTime, { color: colors.primary }]}>{slot.time}</Text>
          <View style={styles.suppItems}>
            {slot.items.map((item, j) => (
              <Text key={j} style={[styles.suppItem, { color: t.textPrimary }]}>• {item}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Day section ──────────────────────────────────────────────

function DaySection({ day, t }: { day: MealPlanDay; t: ReturnType<typeof useTheme> }) {
  const totalCalories = day.meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein  = day.meals.reduce((s, m) => s + m.protein_g, 0);
  const totalCarbs    = day.meals.reduce((s, m) => s + m.carbs_g, 0);
  const totalFat      = day.meals.reduce((s, m) => s + m.fat_g, 0);

  return (
    <View style={styles.daySection}>
      <View style={[styles.dayHeader, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.dayName, { color: t.textPrimary }]}>{day.day}</Text>
        <Text style={[styles.dayTotals, { color: t.textSecondary }]}>
          {totalCalories} kcal · P{totalProtein}g · C{totalCarbs}g · F{totalFat}g
        </Text>
      </View>
      {day.meals.map((meal, i) => <MealCard key={i} meal={meal} t={t} />)}
      <SupplementSchedule items={day.supplements} t={t} />
      {day.swap_suggestions && day.swap_suggestions.length > 0 ? (
        <View style={[styles.swapBox, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.swapTitle, { color: t.textSecondary }]}>Swap suggestions</Text>
          {day.swap_suggestions.map((s, i) => (
            <Text key={i} style={[styles.swapText, { color: t.textPrimary }]}>↔ {s}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────

type Props = {
  clientId: string;
  trainerId: string;
  client: Client;
  intake: ClientIntake | null;
  guide: NutritionGuideContent | null;
  isTrainer: boolean;
};

// ─── Main component ───────────────────────────────────────────

export function MealPlanView({ clientId, trainerId, client, intake, guide, isTrainer }: Props) {
  const t = useTheme();
  const { plan, loading, savePlan } = useMealPlan(clientId);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!isTrainer) return;
    setGenerating(true);
    const age = client.date_of_birth
      ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null;
    const context = {
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
    };
    const { data, error: genErr } = await generateMealPlan(context, guide ?? {
      calories: null, protein_g: null, carbs_g: null, fat_g: null,
      meal_timing: null, foods_to_prioritise: [], foods_to_avoid: [], supplements: [], notes: null,
    }, 'weekly');
    setGenerating(false);
    if (genErr || !data) {
      Alert.alert('Generation failed', genErr ?? 'Unknown error');
      return;
    }
    const title = `${client.full_name} — Weekly Plan`;
    const { error: saveErr } = await savePlan(trainerId, title, 'weekly', data);
    if (saveErr) Alert.alert('Save failed', saveErr);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background, padding: spacing.xl }]}>
        <Ionicons name="restaurant-outline" size={48} color={t.textSecondary as string} />
        <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Meal Plan</Text>
        <Text style={[styles.emptyBody, { color: t.textSecondary }]}>
          {isTrainer
            ? `Generate a structured meal plan for ${client.full_name}. A nutrition guide helps produce better results.`
            : "Your trainer hasn't set up a meal plan yet."}
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
                  <Ionicons name={NUTRITION_AI_ENABLED ? 'sparkles' : 'restaurant'} size={16} color={colors.textInverse} />
                  <Text style={styles.genBtnText}>{NUTRITION_AI_ENABLED ? 'Generate with AI' : 'Generate Plan'}</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Plan header */}
      <View style={[styles.planHeader, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.planHeaderLeft}>
          <Text style={[styles.planTitle, { color: t.textPrimary }]}>{plan.title}</Text>
          <Text style={[styles.planMeta, { color: t.textSecondary }]}>
            {plan.plan_type === 'weekly' ? 'Weekly plan' : 'Daily plan'} ·{' '}
            {plan.generated_at
              ? new Date(plan.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Saved'}
          </Text>
        </View>
        {isTrainer && (
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={generating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {generating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="refresh-outline" size={18} color={colors.primary} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Days */}
      {plan.data.days.map((day, i) => <DaySection key={i} day={day} t={t} />)}

      {/* Notes */}
      {plan.data.notes ? (
        <View style={[styles.notesBox, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.notesLabel, { color: t.textSecondary }]}>Notes</Text>
          <Text style={[styles.notesText, { color: t.textPrimary }]}>{plan.data.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },

  planHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
  },
  planHeaderLeft: { flex: 1, gap: 2 },
  planTitle: { ...typography.heading3 },
  planMeta: { ...typography.bodySmall },

  daySection: { gap: spacing.sm },
  dayHeader: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: 2,
  },
  dayName: { ...typography.body, fontWeight: '700' },
  dayTotals: { ...typography.bodySmall },

  mealCard: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md,
  },
  mealHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mealName: { ...typography.body, fontWeight: '700' },
  mealTime: { ...typography.bodySmall },
  mealCalories: { ...typography.bodySmall, fontWeight: '700' },

  macroRow: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.sm,
    paddingHorizontal: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  macroBadge: { flex: 1, alignItems: 'center', padding: spacing.xs, borderRadius: radius.sm },
  macroBadgeValue: { ...typography.bodySmall, fontWeight: '700' },
  macroBadgeLabel: { ...typography.label, fontSize: 10 },

  foodsList: { padding: spacing.md, gap: spacing.xs },
  foodRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  foodText: { ...typography.body, flex: 1, lineHeight: 22 },

  suppSchedule: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  suppHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm,
  },
  suppTitle: { ...typography.body, fontWeight: '700' },
  suppSlot: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  suppTime: { ...typography.label },
  suppItems: { gap: 2 },
  suppItem: { ...typography.bodySmall },

  swapBox: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  swapTitle: { ...typography.label, marginBottom: spacing.xs },
  swapText: { ...typography.bodySmall },

  notesBox: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs },
  notesLabel: { ...typography.label },
  notesText: { ...typography.body, lineHeight: 22 },

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
