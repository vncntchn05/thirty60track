import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { useFont, Line as SkiaLine, vec, Circle } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle, useAnimatedReaction, useDerivedValue, runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useSkiaAvailable } from '@/lib/skia';
import type { ChartPoint } from '@/hooks/useClientProgress';

type Props = { data: ChartPoint[]; unit?: 'kg' | 'lbs' };

/**
 * Bar chart showing total workout volume (kg·reps or lbs·reps) per workout.
 * Outer component guards against uninitialized CanvasKit on web.
 */
export function VolumeChart({ data, unit = 'kg' }: Props) {
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

  return <VolumeChartInner data={data} unit={unit} />;
}

const TOOLTIP_WIDTH = 88;

/** Only mounts after CanvasKit is initialized — Skia hooks are safe here. */
function VolumeChartInner({ data, unit = 'kg' }: Props) {
  const t = useTheme();
  const { state } = useChartPressState({ x: 0, y: { y: 0 } });
  const [tooltip, setTooltip] = useState<{ label: string; value: string } | null>(null);
  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 10);

  const handlePressChange = useCallback(
    (active: boolean, idx: number, yVal: number) => {
      if (active) {
        const pt = data[Math.max(0, Math.min(idx, data.length - 1))];
        if (pt) {
          setTooltip({
            value: `${Math.round(yVal).toLocaleString()} ${unit}·reps`,
            label: pt.label,
          });
        }
      } else {
        setTooltip(null);
      }
    },
    [data, unit],
  );

  useAnimatedReaction(
    () => ({
      active: state.isActive.value,
      xVal: state.x.value.value,
      yVal: state.y.y.value.value,
    }),
    ({ active, xVal, yVal }) => {
      runOnJS(handlePressChange)(active, Math.round(xVal), yVal);
    },
  );

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: state.isActive.value ? 1 : 0,
    transform: [
      { translateX: state.x.position.value - 44 },
      { translateY: state.y.y.position.value - 56 },
    ],
  }));

  const cursorOpacity = useDerivedValue(() => (state.isActive.value ? 1 : 0));

  const maxY = Math.max(...data.map((d) => d.y), 1);
  const latest = data[data.length - 1];
  const first = data[0];

  return (
    <View>
      <View style={styles.chartMeta}>
        <Text style={[styles.yAxisLabel, { color: t.textSecondary }]}>Total volume ({unit} × reps)</Text>
      </View>
      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [0, maxY * 1.15] }}
          domainPadding={{ left: 12, right: 12, top: 8 }}
          chartPressState={state}
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
                barWidth={8}
              />
              <Circle
                cx={state.x.position}
                cy={state.y.y.position}
                r={5}
                color={colors.primary}
                opacity={cursorOpacity}
              />
            </>
          )}
        </CartesianChart>

        <Animated.View
          style={[
            styles.tooltip,
            { backgroundColor: t.surface, borderColor: t.border },
            tooltipStyle,
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.tooltipValue, { color: t.textPrimary }]}>
            {tooltip?.value ?? ''}
          </Text>
          <Text style={[styles.tooltipLabel, { color: t.textSecondary }]}>
            {tooltip?.label ?? ''}
          </Text>
        </Animated.View>
      </View>
      <Text style={[styles.xAxisLabel, { color: t.textSecondary }]}>Workout #</Text>
      <View style={styles.footer}>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{first.label}</Text>
        <Text style={styles.footerStat}>{Math.round(latest.y).toLocaleString()} {unit}·reps</Text>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{latest.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: 160 },
  empty: { height: 80, justifyContent: 'center', alignItems: 'center', borderRadius: radius.sm },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  tooltip: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TOOLTIP_WIDTH,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipValue: { ...typography.bodySmall, fontWeight: '700' },
  tooltipLabel: { ...typography.label },
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
  xAxisLabel: { ...typography.label, textAlign: 'center', marginTop: 2 },
});
