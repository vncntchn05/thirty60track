import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { useFont, Line as SkiaLine, vec } from '@shopify/react-native-skia';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useSkiaAvailable } from '@/lib/skia';
import type { ChartPoint } from '@/hooks/useClientProgress';

type Props = { data: ChartPoint[] };

/**
 * Bar chart showing total workout volume (kg·reps) over time.
 * Outer component guards against uninitialized CanvasKit on web.
 */
export function VolumeChart({ data }: Props) {
  const t = useTheme();
  const skiaAvailable = useSkiaAvailable();

  if (!skiaAvailable) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>
          Charts unavailable — could not load rendering engine.
        </Text>
      </View>
    );
  }

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>
          Log at least 2 workouts to see volume trends.
        </Text>
      </View>
    );
  }

  return <VolumeChartInner data={data} />;
}

/** Only mounts after CanvasKit is initialized — Skia hooks are safe here. */
function VolumeChartInner({ data }: Props) {
  const t = useTheme();
  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 10);

  const maxY = Math.max(...data.map((d) => d.y), 1);
  const latest = data[data.length - 1];
  const first = data[0];

  return (
    <View>
      <View style={styles.chartMeta}>
        <Text style={[styles.yAxisLabel, { color: t.textSecondary }]}>↑ kg·reps</Text>
      </View>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [0, maxY * 1.15] }}
          domainPadding={{ left: 12, right: 12, top: 8 }}
          axisOptions={{
            font,
            tickCount: { x: 4, y: 4 },
            labelColor: '#888888',
            lineColor: 'rgba(128,128,128,0.2)',
            formatXLabel: (v) => String(Math.round(Number(v)) + 1),
            formatYLabel: (v) =>
              Number(v) >= 1000
                ? `${(Number(v) / 1000).toFixed(1)}k`
                : String(Math.round(Number(v))),
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
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{first.label}</Text>
        <Text style={styles.footerStat}>Latest: {Math.round(latest.y).toLocaleString()} kg·reps</Text>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{latest.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: 160 },
  empty: { height: 80, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xs,
  },
  footerDate: { ...typography.bodySmall },
  footerStat: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  chartMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  yAxisLabel: { ...typography.label },
});
