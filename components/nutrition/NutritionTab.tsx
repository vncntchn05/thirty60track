import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutrition } from '@/hooks/useNutrition';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { DailySummary } from './DailySummary';
import { GoalEditor } from './GoalEditor';
import { MealSection } from './MealSection';
import { AddFoodModal } from './AddFoodModal';
import { NutritionEncyclopedia } from './NutritionEncyclopedia';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { MealType, InsertNutritionLog } from '@/types';

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

// ─── Props ────────────────────────────────────────────────────────

type Props = {
  clientId: string;
  canEditGoal: boolean;
};

// ─── Component ────────────────────────────────────────────────────

export function NutritionTab({ clientId, canEditGoal }: Props) {
  const t = useTheme();
  const { user, trainer, role } = useAuth();
  const isTrainer = role === 'trainer';

  const [view, setView] = useState<'log' | 'encyclopedia'>('log');
  const [date, setDate] = useState(toIso(new Date()));
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [logDates, setLogDates] = useState<string[]>([]);

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

  async function handleAdd(entry: {
    meal_type: MealType;
    food_name: string;
    serving_size_g: number;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    usda_food_id: string | null;
  }) {
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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {/* Log / Encyclopedia toggle */}
      <View style={[styles.segmentBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['log', 'encyclopedia'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[styles.segBtn, view === v && styles.segBtnActive]}
            onPress={() => setView(v)}
          >
            <Text style={[styles.segText, { color: view === v ? colors.primary : t.textSecondary }]}>
              {v === 'log' ? 'Log' : 'Encyclopedia'}
            </Text>
            {view === v && <View style={styles.segIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {view === 'encyclopedia' && <NutritionEncyclopedia />}

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
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  segmentBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, position: 'relative',
  },
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
});
