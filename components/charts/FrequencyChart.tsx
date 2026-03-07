import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useFont, Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useSkiaAvailable } from '@/lib/skia';
import type { ChartPoint, FrequencyStats } from '@/hooks/useClientProgress';

type Props = {
  data: ChartPoint[];
  stats: FrequencyStats;
};

/**
 * Workouts-per-week bar chart + consistency stat row.
 * Stat chips are always visible; bar chart only renders once CanvasKit is ready.
 */
export function FrequencyChart({ data, stats }: Props) {
  const t = useTheme();
  const skiaAvailable = useSkiaAvailable();

  const statItems: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'This week',      value: `${stats.thisWeek}`,       highlight: stats.thisWeek > 0 },
    { label: 'Avg / week',     value: `${stats.avgPerWeek}` },
    { label: 'Current streak', value: `${stats.currentStreak}w`, highlight: stats.currentStreak >= 3 },
    { label: 'Best streak',    value: `${stats.bestStreak}w` },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Stat chips — no Skia, always shown */}
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

      {/* Bar chart — only mounts after CanvasKit is initialized */}
      {skiaAvailable ? (
        <FrequencyChartInner data={data} />
      ) : (
        data.length >= 2 && (
          <View style={[styles.empty, { backgroundColor: t.background }]}>
            <Text style={[styles.emptyText, { color: t.textSecondary }]}>
              Charts unavailable — could not load rendering engine.
            </Text>
          </View>
        )
      )}
    </View>
  );
}

/** Only mounts after CanvasKit is initialized — Skia hooks are safe here. */
function FrequencyChartInner({ data }: { data: ChartPoint[] }) {
  const t = useTheme();
  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 10);

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>
          Log more workouts to see your weekly rhythm.
        </Text>
      </View>
    );
  }

  const maxY = Math.max(...data.map((d) => d.y), 1);
  const latest = data[data.length - 1];
  const first = data[0];
  const xTickCount = Math.min(data.length, 6);
  // Scale bar width with count; domainPadding must cover at least half a bar to avoid clipping
  const barWidth = Math.max(6, Math.min(20, Math.round(300 / data.length)));
  const domainPad = Math.ceil(barWidth / 2) + 2;

  return (
    <View>
      <View style={styles.chartMeta}>
        <Text style={[styles.yAxisLabel, { color: t.textSecondary }]}>Sessions / week</Text>
      </View>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [0, maxY * 1.15] }}
          domainPadding={{ left: domainPad, right: domainPad, top: 8 }}
          axisOptions={{
            font,
            tickCount: { x: xTickCount, y: 4 },
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
                barWidth={barWidth}
              />
            </>
          )}
        </CartesianChart>
      </View>
      <Text style={[styles.xAxisLabel, { color: t.textSecondary }]}>Week</Text>
      <View style={styles.footer}>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{first.label}</Text>
        <Text style={styles.footerStat}>Latest: {latest.y} sessions</Text>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{latest.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },

  statsRow: { flexDirection: 'row', gap: spacing.xs },
  statChip: {
    flex: 1, alignItems: 'center', borderRadius: radius.sm,
    paddingVertical: spacing.sm, borderWidth: 1, gap: 2,
  },
  statChipHighlight: { backgroundColor: colors.primary, borderColor: colors.primary },
  statValue: { ...typography.heading3 },
  statValueHighlight: { color: colors.textInverse },
  statLabel: { ...typography.label, textAlign: 'center' },

  chart: { height: 160 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xs,
  },
  footerDate: { ...typography.bodySmall },
  footerStat: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },

  empty: { height: 80, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },

  chartMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  yAxisLabel: { ...typography.label },
  xAxisLabel: { ...typography.label, textAlign: 'center', marginTop: 2 },
});
