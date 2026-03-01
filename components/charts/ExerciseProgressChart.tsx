import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, Scatter } from 'victory-native';
import { Circle } from '@shopify/react-native-skia';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ChartPoint } from '@/hooks/useClientProgress';

type Props = { data: ChartPoint[] };

/**
 * Line chart showing max weight progression for a single exercise over time.
 * Receives pre-computed data — no Supabase calls inside.
 */
export function ExerciseProgressChart({ data }: Props) {
  const t = useTheme();

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>
          {data.length === 0
            ? 'No weight data recorded for this exercise.'
            : 'Log at least 2 sessions to see progress.'}
        </Text>
      </View>
    );
  }

  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const yPad = Math.max((maxY - minY) * 0.2, 2.5);
  const latest = data[data.length - 1];
  const first = data[0];
  const gain = latest.y - first.y;

  return (
    <View>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [Math.max(0, minY - yPad), maxY + yPad] }}
          domainPadding={{ left: 16, right: 16, top: 8 }}
        >
          {({ points }) => (
            <>
              <Line
                points={points.y}
                color={colors.primary}
                strokeWidth={2.5}
                curveType="monotoneX"
                animate={{ type: 'spring' }}
              />
              <Scatter
                points={points.y}
                shape={({ x, y }) => (
                  <Circle cx={x} cy={y} r={4} color={colors.primary} />
                )}
              />
            </>
          )}
        </CartesianChart>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{first.label}</Text>
        <Text style={[styles.footerStat, gain >= 0 ? styles.positive : styles.negative]}>
          {gain >= 0 ? '+' : ''}{gain.toFixed(1)} kg  ·  Latest: {latest.y} kg
        </Text>
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
  footerStat: { ...typography.bodySmall, fontWeight: '600' },
  positive: { color: colors.success },
  negative: { color: colors.error },
});
