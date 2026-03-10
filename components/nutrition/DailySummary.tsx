import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { NutritionLog, NutritionGoal } from '@/types';

type Props = {
  logs: NutritionLog[];
  goal: NutritionGoal | null;
};

type Totals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

function sumLogs(logs: NutritionLog[]): Totals {
  return logs.reduce(
    (acc, l) => ({
      calories:  acc.calories  + (l.calories  ?? 0),
      protein_g: acc.protein_g + (l.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + (l.carbs_g   ?? 0),
      fat_g:     acc.fat_g     + (l.fat_g     ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

function MacroBar({ label, consumed, target, color }: {
  label: string; consumed: number; target: number | null; color: string;
}) {
  const t = useTheme();
  const pct = target != null && target > 0 ? Math.min(consumed / target, 1) : 0;
  const showTarget = target != null && target > 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text style={[styles.macroLabel, { color: t.textPrimary }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: t.textSecondary }]}>
          {Math.round(consumed)}g{showTarget ? ` / ${Math.round(target!)}g` : ''}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: t.border }]}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as `${number}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function DailySummary({ logs, goal }: Props) {
  const t = useTheme();
  const totals = sumLogs(logs);

  // Derive gram targets from goal
  const proteinTarget = goal ? Math.round((goal.calories * goal.protein_pct / 100) / 4) : null;
  const carbsTarget   = goal ? Math.round((goal.calories * goal.carbs_pct   / 100) / 4) : null;
  const fatTarget     = goal ? Math.round((goal.calories * goal.fat_pct     / 100) / 9) : null;

  const calPct = goal && goal.calories > 0 ? Math.min(totals.calories / goal.calories, 1) : 0;

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Calorie row */}
      <View style={styles.calRow}>
        <View>
          <Text style={[styles.calValue, { color: t.textPrimary }]}>
            {Math.round(totals.calories)}
            <Text style={[styles.calUnit, { color: t.textSecondary }]}> kcal</Text>
          </Text>
          {goal ? (
            <Text style={[styles.calGoal, { color: t.textSecondary }]}>
              of {Math.round(goal.calories)} goal
            </Text>
          ) : null}
        </View>
        {goal ? (
          <View style={[styles.calRing, { borderColor: t.border }]}>
            <View
              style={[
                styles.calRingFill,
                { borderColor: colors.primary, borderRightColor: calPct >= 0.5 ? colors.primary : t.border },
              ]}
            />
            <Text style={[styles.calRingPct, { color: colors.primary }]}>
              {Math.round(calPct * 100)}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* Macro bars */}
      <View style={styles.macros}>
        <MacroBar label="Protein" consumed={totals.protein_g} target={proteinTarget} color="#3b82f6" />
        <MacroBar label="Carbs"   consumed={totals.carbs_g}   target={carbsTarget}   color={colors.primary} />
        <MacroBar label="Fat"     consumed={totals.fat_g}     target={fatTarget}     color="#ef4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md,
  },
  calRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  calValue: { ...typography.heading3, fontWeight: '700' },
  calUnit: { ...typography.body, fontWeight: '400' },
  calGoal: { ...typography.bodySmall, marginTop: 2 },
  calRing: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  calRingFill: {
    position: 'absolute', width: 52, height: 52,
    borderRadius: 26, borderWidth: 4, borderTopColor: 'transparent', borderLeftColor: 'transparent',
  },
  calRingPct: { ...typography.label, fontWeight: '700' },
  macros: { gap: spacing.sm },
  macroRow: { gap: 4 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { ...typography.label, fontWeight: '600' },
  macroValue: { ...typography.label },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
});
