import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutrition } from '@/hooks/useNutrition';
import { useNutritionGuide } from '@/hooks/useNutritionGuide';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { DailySummary } from './DailySummary';
import { GoalEditor } from './GoalEditor';
import { MealSection } from './MealSection';
import { AddFoodModal } from './AddFoodModal';
import { NutritionEncyclopedia } from './NutritionEncyclopedia';
import { NutritionGuide } from './NutritionGuide';
import { MealPlanView } from './MealPlanView';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { MealType, InsertNutritionLog, NutritionLog, NutritionGoal, Client, ClientIntake } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toIso(dt);
}

function fmtDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  const todayIso = toIso(today);
  const yesterday = toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  if (iso === todayIso) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// ─── Macro warning helpers ────────────────────────────────────────

type PendingEntry = {
  meal_type: MealType;
  food_name: string;
  serving_size_g: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  usda_food_id: string | null;
};

function getMacroWarnings(
  logs: NutritionLog[],
  goal: NutritionGoal | null,
  entry: PendingEntry,
): string[] {
  if (!goal) return [];

  const current = logs.reduce(
    (acc, l) => ({
      calories:  acc.calories  + (l.calories  ?? 0),
      protein_g: acc.protein_g + (l.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + (l.carbs_g   ?? 0),
      fat_g:     acc.fat_g     + (l.fat_g     ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );

  const proteinTarget = (goal.calories * goal.protein_pct / 100) / 4;
  const carbsTarget   = (goal.calories * goal.carbs_pct   / 100) / 4;
  const fatTarget     = (goal.calories * goal.fat_pct     / 100) / 9;

  const warnings: string[] = [];

  if (entry.calories != null && current.calories + entry.calories > goal.calories) {
    warnings.push(`Calories: ${Math.round(current.calories + entry.calories)} / ${Math.round(goal.calories)} kcal`);
  }
  if (entry.protein_g != null && current.protein_g + entry.protein_g > proteinTarget) {
    warnings.push(`Protein: ${Math.round(current.protein_g + entry.protein_g)}g / ${Math.round(proteinTarget)}g`);
  }
  if (entry.carbs_g != null && current.carbs_g + entry.carbs_g > carbsTarget) {
    warnings.push(`Carbs: ${Math.round(current.carbs_g + entry.carbs_g)}g / ${Math.round(carbsTarget)}g`);
  }
  if (entry.fat_g != null && current.fat_g + entry.fat_g > fatTarget) {
    warnings.push(`Fat: ${Math.round(current.fat_g + entry.fat_g)}g / ${Math.round(fatTarget)}g`);
  }

  return warnings;
}

// ─── Props ────────────────────────────────────────────────────────

type NutritionView = 'log' | 'guide' | 'plan' | 'encyclopedia';

const SEGMENT_LABELS: Record<NutritionView, string> = {
  log: 'Log',
  guide: 'Guide',
  plan: 'Plan',
  encyclopedia: 'Ref',
};

type Props = {
  clientId: string;
  canEditGoal: boolean;
  client?: Client;
  intake?: ClientIntake | null;
};

// ─── Component ────────────────────────────────────────────────────

export function NutritionTab({ clientId, canEditGoal, client, intake }: Props) {
  const t = useTheme();
  const { user, trainer, role } = useAuth();
  const isTrainer = role === 'trainer';

  const [view, setView] = useState<NutritionView>('log');
  const [encyclopediaTopicId, setEncyclopediaTopicId] = useState<string | null>(null);

  const { guide } = useNutritionGuide(clientId);

  function navigateToEncyclopedia(topicId: string) {
    setEncyclopediaTopicId(topicId);
    setView('encyclopedia');
  }

  const [date, setDate] = useState(toIso(new Date()));
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [logDates, setLogDates] = useState<string[]>([]);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);
  const [macroWarnings, setMacroWarnings] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('nutrition_logs')
      .select('logged_date')
      .eq('client_id', clientId)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r: { logged_date: string }) => r.logged_date))];
          setLogDates(unique);
        }
      });
  }, [clientId]);

  const { logs, goal, trainerId: fetchedTrainerId, loading, error, addLog, deleteLog, saveGoal } = useNutrition(clientId, date);

  // Trainers have their own ID directly; clients get trainer_id from the hook (fetched from clients table)
  const trainerId = trainer?.id ?? fetchedTrainerId ?? '';

  async function doAdd(entry: PendingEntry) {
    if (!user || !trainerId) return;
    const payload: InsertNutritionLog = {
      client_id: clientId,
      trainer_id: trainerId,
      logged_date: date,
      logged_by_role: isTrainer ? 'trainer' : 'client',
      logged_by_user_id: user.id,
      ...entry,
    };
    await addLog(payload);
  }

  async function handleAdd(entry: PendingEntry) {
    const warnings = getMacroWarnings(logs, goal, entry);
    if (warnings.length > 0) {
      setPendingEntry(entry);
      setMacroWarnings(warnings);
      return;
    }
    await doAdd(entry);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {/* Segment bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.segmentBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}
        contentContainerStyle={styles.segmentBarContent}
      >
        {(Object.keys(SEGMENT_LABELS) as NutritionView[]).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.segBtn, view === v && styles.segBtnActive]}
            onPress={() => setView(v)}
          >
            <View style={styles.segBtnInner}>
              <Text style={[styles.segText, { color: view === v ? colors.primary : t.textSecondary }]}>
                {SEGMENT_LABELS[v]}
              </Text>
            </View>
            {view === v && <View style={styles.segIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {view === 'encyclopedia' && (
        <NutritionEncyclopedia
          key={encyclopediaTopicId ?? 'enc'}
          initialTopicId={encyclopediaTopicId}
        />
      )}

      {view === 'guide' && client && (
        <NutritionGuide
          clientId={clientId}
          trainerId={trainer?.id ?? ''}
          client={client}
          intake={intake ?? null}
          isTrainer={isTrainer}
          onNavigateToEncyclopedia={navigateToEncyclopedia}
        />
      )}

      {view === 'plan' && client && (
        <MealPlanView
          clientId={clientId}
          trainerId={trainer?.id ?? ''}
          client={client}
          intake={intake ?? null}
          guide={guide?.content ?? null}
          isTrainer={isTrainer}
        />
      )}

      {view === 'log' && (
      <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.content}>

        {/* Date navigation */}
        <View style={[styles.dateBar, { backgroundColor: t.surface, borderColor: t.border }]}>
          <TouchableOpacity
            onPress={() => setDate((d) => offsetDate(d, -1))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateLabelBtn}
            onPress={() => setShowCalendar(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{fmtDisplayDate(date)}</Text>
            <Ionicons name="calendar-outline" size={14} color={t.textSecondary as string} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDate((d) => offsetDate(d, 1))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={date >= toIso(new Date())}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={date >= toIso(new Date()) ? t.border : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        ) : null}

        {/* Daily summary */}
        <DailySummary logs={logs} goal={goal} />

        {/* Goal editor (trainer only) */}
        {canEditGoal ? (
          <GoalEditor
            clientId={clientId}
            trainerId={trainerId}
            goal={goal}
            onSave={saveGoal}
          />
        ) : null}

        {/* Meal sections */}
        {MEAL_ORDER.map((mt) => (
          <MealSection
            key={mt}
            mealType={mt}
            label={MEAL_LABELS[mt]}
            logs={logs.filter((l) => l.meal_type === mt)}
            currentUserId={user?.id ?? null}
            isTrainer={isTrainer}
            onAdd={(meal) => setModalMeal(meal)}
            onDelete={deleteLog}
          />
        ))}

      </ScrollView>
      )} {/* end log view */}

      {/* Date picker calendar */}
      <DatePickerModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelect={(iso) => { setDate(iso); setShowCalendar(false); }}
        value={date}
        logDates={logDates}
      />

      {/* Add food modal */}
      {modalMeal && (
        <AddFoodModal
          visible={modalMeal !== null}
          initialMealType={modalMeal}
          clientId={clientId}
          trainerId={trainerId}
          onClose={() => setModalMeal(null)}
          onAdd={async (entry) => {
            await handleAdd(entry);
            setModalMeal(null);
          }}
        />
      )}

      {/* ── Macro/calorie limit confirmation modal ─────────────────── */}
      <Modal transparent animationType="fade" visible={pendingEntry !== null}>
        <View style={styles.overlay}>
          <View style={[styles.warnCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.warnCardHeader, { borderBottomColor: t.border }]}>
              <Ionicons name="warning" size={22} color={colors.warning} />
              <Text style={[styles.warnCardTitle, { color: t.textPrimary }]}>Daily Limit Exceeded</Text>
            </View>
            <Text style={[styles.warnCardSubtitle, { color: t.textSecondary }]}>
              Adding this food will exceed your daily targets:
            </Text>
            <View style={styles.warnList}>
              {macroWarnings.map((w) => (
                <View key={w} style={styles.warnListRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                  <Text style={[styles.warnListText, { color: t.textPrimary }]}>{w}</Text>
                </View>
              ))}
            </View>
            <View style={styles.warnCardActions}>
              <TouchableOpacity
                style={[styles.warnBtn, { borderColor: t.border, backgroundColor: t.background }]}
                onPress={() => { setPendingEntry(null); setMacroWarnings([]); }}
              >
                <Text style={[styles.warnBtnCancelText, { color: t.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.warnBtn, styles.warnBtnConfirm]}
                onPress={async () => {
                  if (pendingEntry) await doAdd(pendingEntry);
                  setPendingEntry(null);
                  setMacroWarnings([]);
                }}
              >
                <Text style={styles.warnBtnConfirmText}>Add Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  segmentBar: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentBarContent: {
    flexDirection: 'row',
  },
  segBtn: {
    alignItems: 'center', paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md, position: 'relative',
    minWidth: 60,
  },
  segBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segBtnActive: {},
  segText: { ...typography.body, fontWeight: '600' },
  segIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
  },
  dateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, paddingHorizontal: spacing.md,
  },
  dateLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateLabel: { ...typography.body, fontWeight: '600' },
  errorText: { ...typography.bodySmall },

  // ── Macro warning modal ──
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  warnCard: {
    width: '100%', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  warnCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  warnCardTitle: { ...typography.body, fontWeight: '700' },
  warnCardSubtitle: { ...typography.bodySmall, padding: spacing.md, paddingBottom: spacing.xs },
  warnList: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  warnListRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  warnListText: { ...typography.bodySmall, fontWeight: '600' },
  warnCardActions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, paddingTop: spacing.sm,
  },
  warnBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  warnBtnConfirm: { backgroundColor: colors.primary, borderColor: colors.primary },
  warnBtnCancelText: { ...typography.body, fontWeight: '600' },
  warnBtnConfirmText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
});
