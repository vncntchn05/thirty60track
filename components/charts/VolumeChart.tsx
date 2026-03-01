import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ChartPoint } from '@/hooks/useClientProgress';

type Props = { data: ChartPoint[] };

/**
 * Bar chart showing total workout volume (kg·reps) over time.
 * Receives pre-computed data — no Supabase calls inside.
 */
export function VolumeChart({ data }: Props) {
  const t = useTheme();

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.textSecondary }]}>
          Log at least 2 workouts to see volume trends.
        </Text>
      </View>
    );
  }

  const maxY = Math.max(...data.map((d) => d.y), 1);
  const latest = data[data.length - 1];
  const first = data[0];

  return (
    <View>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [0, maxY * 1.15] }}
          domainPadding={{ left: 12, right: 12, top: 8 }}
        >
          {({ points, chartBounds }) => (
            <Bar
              points={points.y}
              chartBounds={chartBounds}
              color={colors.primary}
              roundedCorners={{ topLeft: 3, topRight: 3 }}
              animate={{ type: 'spring' }}
            />
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
});
