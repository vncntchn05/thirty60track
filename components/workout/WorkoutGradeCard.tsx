import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/constants/theme';
import type { Theme } from '@/constants/theme';
import type { WorkoutGradeResult, GradeLetter } from '@/lib/workoutGrading';

type Props = {
  grade: WorkoutGradeResult | null;
  loading: boolean;
  t: Theme;
};

function gradeColor(letter: GradeLetter): string {
  if (letter.startsWith('A')) return '#22c55e';   // green
  if (letter.startsWith('B')) return '#84cc16';   // lime
  if (letter.startsWith('C')) return '#f59e0b';   // amber
  if (letter.startsWith('D')) return '#f97316';   // orange
  return '#ef4444';                                // red for F
}

function ScoreBar({ value, color, t }: { value: number; color: string; t: Theme }) {
  return (
    <View style={[styles.barTrack, { backgroundColor: t.border }]}>
      <View style={[styles.barFill, { width: `${value}%` as `${number}%`, backgroundColor: color }]} />
    </View>
  );
}

type ScoreRowProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  t: Theme;
};

function ScoreRow({ label, value, icon, color, t }: ScoreRowProps) {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreRowLeft}>
        <Ionicons name={icon} size={13} color={color} />
        <Text style={[styles.scoreLabel, { color: t.textSecondary }]}>{label}</Text>
      </View>
      <View style={styles.scoreBarArea}>
        <ScoreBar value={value} color={color} t={t} />
        <Text style={[styles.scoreValue, { color: t.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export function WorkoutGradeCard({ grade, loading, t }: Props) {
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!grade) return null;

  const color = gradeColor(grade.letter);
  const isNewbie = !grade.hasSufficientHistory;

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.cardTitle, { color: t.textSecondary }]}>WORKOUT GRADE</Text>
          {isNewbie && (
            <Text style={[styles.newbieNote, { color: t.textSecondary }]}>
              (building history…)
            </Text>
          )}
        </View>
        <View style={[styles.gradeBadge, { borderColor: color }]}>
          <Text style={[styles.gradeLetter, { color }]}>{grade.letter}</Text>
        </View>
      </View>

      {/* Score breakdown */}
      <View style={styles.scoresBlock}>
        <ScoreRow
          label="Volume vs best"
          value={grade.volumeVsBestScore}
          icon="barbell-outline"
          color={colors.primary}
          t={t}
        />
        <ScoreRow
          label="PRs hit"
          value={grade.prScore}
          icon="trophy-outline"
          color={color}
          t={t}
        />
        <ScoreRow
          label="vs Recent avg"
          value={grade.trendScore}
          icon="trending-up-outline"
          color={colors.info}
          t={t}
        />
      </View>

      {/* Volume stats row */}
      {(grade.currentVolume > 0 || grade.bestHistoricalVolume > 0) && (
        <View style={[styles.statsRow, { borderTopColor: t.border }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Today</Text>
            <Text style={[styles.statValue, { color: t.textPrimary }]}>
              {grade.currentVolume.toLocaleString()} kg
            </Text>
          </View>
          {grade.bestHistoricalVolume > 0 && (
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, { color: t.textSecondary }]}>Best</Text>
              <Text style={[styles.statValue, { color: t.textPrimary }]}>
                {grade.bestHistoricalVolume.toLocaleString()} kg
              </Text>
            </View>
          )}
          {grade.recentAvgVolume > 0 && (
            <View style={styles.statCell}>
              <Text style={[styles.statLabel, { color: t.textSecondary }]}>Avg (4)</Text>
              <Text style={[styles.statValue, { color: t.textPrimary }]}>
                {grade.recentAvgVolume.toLocaleString()} kg
              </Text>
            </View>
          )}
        </View>
      )}

      {/* PRs hit list */}
      {grade.prsHit.length > 0 && (
        <View style={[styles.prList, { borderTopColor: t.border }]}>
          <View style={styles.prListHeader}>
            <Ionicons name="flash" size={12} color={color} />
            <Text style={[styles.prListTitle, { color }]}>
              {grade.prsHit.length === 1 ? 'New PR' : `${grade.prsHit.length} New PRs`}
            </Text>
          </View>
          <Text style={[styles.prNames, { color: t.textSecondary }]}>
            {grade.prsHit.join('  ·  ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBlock: { gap: 2 },
  cardTitle: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  newbieNote: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  gradeBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLetter: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },

  // ── Score rows ──
  scoresBlock: { gap: spacing.xs + 2 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 120,
  },
  scoreLabel: { ...typography.bodySmall },
  scoreBarArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  scoreValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },

  // ── Volume stats ──
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  statCell: { flex: 1, gap: 2 },
  statLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { ...typography.body, fontWeight: '700' },

  // ── PR list ──
  prList: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: 4,
  },
  prListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prListTitle: {
    ...typography.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prNames: {
    ...typography.bodySmall,
    lineHeight: 18,
  },
});
