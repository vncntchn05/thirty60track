import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, ClientIntake } from '@/types';

// ─── BMR / TDEE ───────────────────────────────────────────────────

const ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

function calcAge(dob: string): number {
  const [y, m, d] = dob.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

function calcBmr(client: Client): number | null {
  if (!client.weight_kg || !client.height_cm || !client.date_of_birth) return null;
  const age = calcAge(client.date_of_birth);
  const base = 10 * client.weight_kg + 6.25 * client.height_cm - 5 * age;
  return client.gender === 'female' ? base - 161 : base + 5;
}

function calcTdee(bmr: number, intake: ClientIntake | null | undefined): number {
  const level = intake?.activity_level ?? 'sedentary';
  return bmr * (ACTIVITY_MULTIPLIER[level] ?? 1.2);
}

// ─── Goal presets ─────────────────────────────────────────────────

type GoalPreset = {
  key: 'cut' | 'maintain' | 'bulk';
  label: string;
  delta: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  accent: string;
};

const PRESETS: GoalPreset[] = [
  { key: 'cut',      label: 'Cut',      delta: -400, protein_pct: 35, carbs_pct: 40, fat_pct: 25, accent: '#4DA6FF' },
  { key: 'maintain', label: 'Maintain', delta:    0, protein_pct: 30, carbs_pct: 45, fat_pct: 25, accent: colors.primary },
  { key: 'bulk',     label: 'Bulk',     delta: +350, protein_pct: 30, carbs_pct: 50, fat_pct: 20, accent: '#4DC97A' },
];

// ─── Component ────────────────────────────────────────────────────

type Props = {
  client: Client;
  intake?: ClientIntake | null;
};

export function MetabolicsCard({ client, intake }: Props) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(true);

  const bmr = calcBmr(client);
  if (!bmr) return null;

  const tdee = Math.round(calcTdee(bmr, intake));
  const activityLabel =
    intake?.activity_level
      ? intake.activity_level.replace('_', ' ')
      : 'sedentary';

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="flash-outline" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Recommendations</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={t.textSecondary as string}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {/* Metabolics row */}
          <View style={[styles.metaRow, { borderColor: t.border }]}>
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>BMR</Text>
              <Text style={[styles.metaValue, { color: t.textPrimary }]}>{Math.round(bmr)}</Text>
              <Text style={[styles.metaUnit, { color: t.textSecondary }]}>kcal/day</Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: t.border }]} />
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>TDEE</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>{tdee}</Text>
              <Text style={[styles.metaUnit, { color: t.textSecondary }]}>kcal/day</Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: t.border }]} />
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { color: t.textSecondary }]}>Activity</Text>
              <Text style={[styles.metaActivityValue, { color: t.textPrimary }]} numberOfLines={1}>
                {activityLabel.charAt(0).toUpperCase() + activityLabel.slice(1)}
              </Text>
            </View>
          </View>

          {/* Goal cards */}
          <View style={styles.goalRow}>
            {PRESETS.map((p) => {
              const kcal = tdee + p.delta;
              const proteinG = Math.round((kcal * p.protein_pct / 100) / 4);
              const carbsG   = Math.round((kcal * p.carbs_pct   / 100) / 4);
              const fatG     = Math.round((kcal * p.fat_pct     / 100) / 9);
              return (
                <View key={p.key} style={[styles.goalCard, { backgroundColor: t.background, borderColor: t.border }]}>
                  <View style={[styles.goalAccent, { backgroundColor: p.accent }]} />
                  <Text style={[styles.goalLabel, { color: p.accent }]}>{p.label}</Text>
                  <Text style={[styles.goalKcal, { color: t.textPrimary }]}>{kcal}</Text>
                  <Text style={[styles.goalKcalUnit, { color: t.textSecondary }]}>kcal</Text>
                  <View style={styles.goalMacros}>
                    <MacroBadge label="P" value={proteinG} color="#4DA6FF" />
                    <MacroBadge label="C" value={carbsG} color={colors.primary} />
                    <MacroBadge label="F" value={fatG} color="#E07A5F" />
                  </View>
                  <View style={styles.goalPcts}>
                    <Text style={[styles.goalPctText, { color: t.textSecondary }]}>
                      {p.protein_pct}% / {p.carbs_pct}% / {p.fat_pct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.footnote, { color: t.textSecondary }]}>
            BMR via Mifflin-St Jeor · TDEE = BMR × activity multiplier
          </Text>
        </View>
      )}
    </View>
  );
}

function MacroBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const t = useTheme();
  return (
    <View style={styles.macroBadge}>
      <Text style={[styles.macroBadgeLabel, { color }]}>{label}</Text>
      <Text style={[styles.macroBadgeValue, { color: t.textPrimary }]}>{value}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerTitle: { ...typography.body, fontWeight: '700' },

  body: { paddingBottom: spacing.md },

  metaRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  metaCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 2,
  },
  metaDivider: { width: StyleSheet.hairlineWidth },
  metaLabel: { ...typography.bodySmall, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { ...typography.body, fontWeight: '700', fontSize: 20 },
  metaActivityValue: { ...typography.bodySmall, fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },
  metaUnit: { ...typography.bodySmall, fontSize: 10 },

  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  goalCard: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  goalAccent: { width: '100%', height: 3, marginBottom: spacing.sm },
  goalLabel: { ...typography.bodySmall, fontWeight: '700', marginBottom: 2 },
  goalKcal: { ...typography.body, fontWeight: '700', fontSize: 18 },
  goalKcalUnit: { ...typography.bodySmall, fontSize: 10, marginBottom: spacing.xs },
  goalMacros: { flexDirection: 'row', gap: 4 },
  goalPcts: { marginTop: 4 },
  goalPctText: { fontSize: 9 },

  macroBadge: { alignItems: 'center' },
  macroBadgeLabel: { fontSize: 9, fontWeight: '700' },
  macroBadgeValue: { fontSize: 10, fontWeight: '600' },

  footnote: {
    ...typography.bodySmall,
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    opacity: 0.7,
  },
});
