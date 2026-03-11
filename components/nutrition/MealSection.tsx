import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { NutritionLog, MealType } from '@/types';

type Props = {
  mealType: MealType;
  label: string;
  logs: NutritionLog[];
  currentUserId: string | null;
  isTrainer: boolean;
  onAdd: (mealType: MealType) => void;
  onDelete: (id: string) => void;
};

function fmt(v: number | null, unit: string) {
  return v != null ? `${Math.round(v)}${unit}` : null;
}

export function MealSection({ mealType, label, logs, currentUserId, isTrainer, onAdd, onDelete }: Props) {
  const t = useTheme();

  const totalCal = logs.reduce((s, l) => s + (l.calories ?? 0), 0);

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Meal header */}
      <View style={styles.header}>
        <Text style={[styles.mealLabel, { color: t.textPrimary }]}>{label}</Text>
        {totalCal > 0 ? (
          <Text style={[styles.mealCal, { color: t.textSecondary }]}>{Math.round(totalCal)} kcal</Text>
        ) : null}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onAdd(mealType)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Log entries */}
      {logs.map((log) => {
        const canDelete = isTrainer || log.logged_by_user_id === currentUserId;
        const macros = [
          fmt(log.protein_g, 'p'),
          fmt(log.carbs_g,   'c'),
          fmt(log.fat_g,     'f'),
        ].filter(Boolean).join(' · ');

        return (
          <View key={log.id} style={[styles.logRow, { borderTopColor: t.border }]}>
            <View style={styles.logMain}>
              <Text style={[styles.foodName, { color: t.textPrimary }]} numberOfLines={1}>
                {log.food_name}
              </Text>
              <Text style={[styles.logMeta, { color: t.textSecondary }]}>
                {log.serving_size_g}g
                {log.calories != null ? `  ·  ${Math.round(log.calories)} kcal` : ''}
                {macros ? `  ·  ${macros}` : ''}
              </Text>
            </View>
            {canDelete && (
              <TouchableOpacity
                onPress={() => onDelete(log.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {logs.length === 0 && (
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>Nothing logged yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, paddingHorizontal: spacing.md,
  },
  mealLabel: { ...typography.body, fontWeight: '700', flex: 1 },
  mealCal: { ...typography.bodySmall },
  addBtn: { marginLeft: spacing.xs },
  logRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  logMain: { flex: 1, gap: 2 },
  foodName: { ...typography.body, fontWeight: '500' },
  logMeta: { ...typography.bodySmall },
  emptyText: { ...typography.bodySmall, padding: spacing.md, paddingTop: 0 },
});
