import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useFont, Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ChartPoint, FrequencyStats } from '@/hooks/useClientProgress';

type Props = {
  data: ChartPoint[];
  stats: FrequencyStats;
};

/** Maximum weeks shown in the bar chart (avoids overcrowding on long histories). */
const MAX_DISPLAY_WEEKS = 16;

/**
 * Workouts-per-week bar chart + consistency stat row.
 * Receives pre-computed data — no Supabase calls inside.
 */
export function FrequencyChart({ data, stats }: Props) {
  const t = useTheme();

  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 10);

  const displayData = data.length > MAX_DISPLAY_WEEKS
    ? data.slice(-MAX_DISPLAY_WEEKS)
    : data;

  const statItems: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'This week',      value: `${stats.thisWeek}`, highlight: stats.thisWeek > 0 },
    { label: 'Avg / week',     value: `${stats.avgPerWeek}` },
    { label: 'Current streak', value: `${stats.currentStreak}w`, highlight: stats.currentStreak >= 3 },
    { label: 'Best streak',    value: `${stats.bestStreak}w` },
  ];

  return (
    <View style={styles.wrapper}>
      {/* ── Stat chips ── */}
      <View style={styles.statsRow}>
        {statItems.map(({ label, value, highlight }) => (
          <View
            key={label}
            style={[
              styles.statChip,
              { backgroundColor: t.background, borderColor: t.border },
              highlight && styles.statChipHighlight,
            ]}
          >
            <Text style={[styles.statValue, highlight ? styles.statValueHighlight : { color: t.textPrimary }]}>
              {value}
            </Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* ── Bar chart ── */}
      {displayData.length >= 2 ? (
        <View>
          <View style={styles.chartMeta}>
            <Text style={[styles.yAxisLabel, { color: t.textSecondary }]}>↑ sessions</Text>
          </View>
          <View style={styles.chart}>
            <CartesianChart
              data={displayData}
              xKey="x"
              yKeys={['y']}
              domain={{ y: [0, Math.max(Math.max(...displayData.map((d) => d.y)), 3) + 0.5] }}
              domainPadding={{ left: 10, right: 10, top: 4 }}
              axisOptions={{
                font,
                tickCount: { x: 4, y: 4 },
                labelColor: '#888888',
                lineColor: 'rgba(128,128,128,0.2)',
                formatXLabel: (v) => String(Math.round(Number(v)) + 1),
                formatYLabel: (v) => String(Math.round(Number(v))),
              }}
            >
              {({ points, chartBounds, yScale }) => (
                <>
                  {yScale.ticks(4).map((tick: number) => (
                    <SkiaLine
                      key={tick}
                      p1={vec(chartBounds.left, yScale(tick))}
                      p2={vec(chartBounds.right, yScale(tick))}
                      color="rgba(128,128,128,0.1)"
                      strokeWidth={1}
                    />
                  ))}
                  <Bar
                    points={points.y}
                    chartBounds={chartBounds}
                    color={colors.primary}
                    roundedCorners={{ topLeft: 3, topRight: 3 }}
                    animate={{ type: 'spring' }}
                  />
                </>
              )}
            </CartesianChart>
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerDate, { color: t.textSecondary }]}>
              {displayData[0].label}
            </Text>
            <Text style={[styles.footerMeta, { color: t.textSecondary }]}>
              {stats.activeWeeks} of {data.length} weeks active
            </Text>
            <Text style={[styles.footerDate, { color: t.textSecondary }]}>
              {displayData[displayData.length - 1].label}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: t.background }]}>
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            Log more workouts to see your weekly rhythm.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },

  // ── Stat chips ──
  statsRow: { flexDirection: 'row', gap: spacing.xs },
  statChip: {
    flex: 1, alignItems: 'center', borderRadius: radius.sm,
    paddingVertical: spacing.sm, borderWidth: 1, gap: 2,
  },
  statChipHighlight: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statValue: { ...typography.heading3 },
  statValueHighlight: { color: colors.textInverse },
  statLabel: { ...typography.label, textAlign: 'center' },

  // ── Chart ──
  chart: { height: 120 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xs,
  },
  footerDate: { ...typography.bodySmall },
  footerMeta: { ...typography.bodySmall },

  // ── Empty ──
  empty: { height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },

  // ── Chart meta row ──
  chartMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  yAxisLabel: { ...typography.label },
});
