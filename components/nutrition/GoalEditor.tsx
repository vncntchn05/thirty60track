import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { NutritionGoal, UpsertNutritionGoal } from '@/types';

type Props = {
  clientId: string;
  trainerId: string;
  goal: NutritionGoal | null;
  onSave: (payload: UpsertNutritionGoal) => Promise<{ error: string | null }>;
};

function parseNum(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function GoalEditor({ clientId, trainerId, goal, onSave }: Props) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(!goal);
  const [calories, setCalories]     = useState(String(goal?.calories ?? ''));
  const [proteinPct, setProteinPct] = useState(String(goal?.protein_pct ?? ''));
  const [carbsPct, setCarbsPct]     = useState(String(goal?.carbs_pct ?? ''));
  const [fatPct, setFatPct]         = useState(String(goal?.fat_pct ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync external goal into local state when it loads
  useEffect(() => {
    if (goal) {
      setCalories(String(goal.calories));
      setProteinPct(String(goal.protein_pct));
      setCarbsPct(String(goal.carbs_pct));
      setFatPct(String(goal.fat_pct));
    }
  }, [goal]);

  const total = parseNum(proteinPct) + parseNum(carbsPct) + parseNum(fatPct);
  const totalOk = Math.abs(total - 100) < 0.5;

  // Gram previews
  const cal = parseNum(calories);
  const proteinG = cal > 0 ? Math.round((cal * parseNum(proteinPct) / 100) / 4) : 0;
  const carbsG   = cal > 0 ? Math.round((cal * parseNum(carbsPct)   / 100) / 4) : 0;
  const fatG     = cal > 0 ? Math.round((cal * parseNum(fatPct)     / 100) / 9) : 0;

  async function handleSave() {
    if (!totalOk) { setError('Macros must add up to 100%'); return; }
    if (parseNum(calories) <= 0) { setError('Enter a calorie target'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await onSave({
      client_id: clientId, trainer_id: trainerId,
      calories: parseNum(calories),
      protein_pct: parseNum(proteinPct),
      carbs_pct: parseNum(carbsPct),
      fat_pct: parseNum(fatPct),
    });
    setSaving(false);
    if (err) setError(err);
    else setExpanded(false);
  }

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
        <Text style={[styles.title, { color: t.textPrimary }]}>Daily Goal</Text>
        {goal && !expanded ? (
          <Text style={[styles.summary, { color: t.textSecondary }]}>
            {Math.round(goal.calories)} kcal · P{goal.protein_pct}% C{goal.carbs_pct}% F{goal.fat_pct}%
          </Text>
        ) : null}
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={t.textSecondary as string} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: t.textSecondary }]}>Calories (kcal)</Text>
            <TextInput
              style={[styles.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
              value={calories} onChangeText={setCalories}
              keyboardType="numeric" placeholderTextColor={t.textSecondary as string} placeholder="e.g. 2000"
            />
          </View>

          <Text style={[styles.splitLabel, { color: t.textSecondary }]}>Macro split (must total 100%)</Text>
          <View style={styles.splitRow}>
            {[
              { label: 'Protein %', value: proteinPct, set: setProteinPct, preview: `${proteinG}g` },
              { label: 'Carbs %',   value: carbsPct,   set: setCarbsPct,   preview: `${carbsG}g` },
              { label: 'Fat %',     value: fatPct,     set: setFatPct,     preview: `${fatG}g` },
            ].map(({ label, value, set, preview }) => (
              <View key={label} style={styles.splitField}>
                <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.background }]}
                  value={value} onChangeText={set}
                  keyboardType="numeric" placeholderTextColor={t.textSecondary as string} placeholder="0"
                />
                <Text style={[styles.preview, { color: t.textSecondary }]}>{preview}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.totalLine, { color: totalOk ? colors.success : colors.error }]}>
            Total: {Math.round(total)}%{totalOk ? ' ✓' : ' (must be 100%)'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, (!totalOk || saving) && styles.btnDisabled]}
            onPress={handleSave} disabled={!totalOk || saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save Goal</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.body, fontWeight: '700', flex: 1 },
  summary: { ...typography.bodySmall },
  form: { gap: spacing.sm },
  field: { gap: 4 },
  label: { ...typography.label },
  input: {
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
    ...typography.body,
  },
  splitLabel: { ...typography.label, marginTop: spacing.xs },
  splitRow: { flexDirection: 'row', gap: spacing.sm },
  splitField: { flex: 1, gap: 4 },
  preview: { ...typography.label, textAlign: 'center' },
  totalLine: { ...typography.bodySmall, fontWeight: '600', textAlign: 'right' },
  errorText: { ...typography.bodySmall, color: colors.error },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.sm,
    padding: spacing.sm, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
