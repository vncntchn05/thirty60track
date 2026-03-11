import { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CartesianChart, Line, Scatter, useChartPressState } from 'victory-native';
import { Circle, useFont, Line as SkiaLine, vec } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle, useAnimatedReaction, useDerivedValue, runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useSkiaAvailable } from '@/lib/skia';
import type { ChartPoint } from '@/hooks/useClientProgress';

type Props = { data: ChartPoint[]; unit?: string; title?: string };

/**
 * Line chart showing exercise or body metric progress over time.
 * Outer component guards against uninitialized CanvasKit on web.
 */
export function ExerciseProgressChart({ data, unit = 'kg', title }: Props) {
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
          {data.length === 0
            ? `No ${unit === 'reps' ? 'rep' : unit === '%' ? 'body fat' : unit === 'secs' ? 'duration' : 'weight'} data recorded.`
            : 'Log at least 2 sessions to see progress.'}
        </Text>
      </View>
    );
  }

  return <ExerciseProgressChartInner data={data} unit={unit} title={title} />;
}

/** Only mounts after CanvasKit is initialized — Skia hooks are safe here. */
function ExerciseProgressChartInner({ data, unit = 'kg', title }: Props) {
  const t = useTheme();
  const { state } = useChartPressState({ x: 0, y: { y: 0 } });
  const [tooltip, setTooltip] = useState<{ label: string; value: string } | null>(null);
  const font = useFont(require('../../assets/fonts/Roboto-Regular.ttf'), 10);

  const handlePressChange = useCallback(
    (active: boolean, idx: number, yVal: number) => {
      if (active) {
        const pt = data[Math.max(0, Math.min(idx, data.length - 1))];
        if (pt) {
          const valueStr = unit === 'reps'
            ? `${Math.round(yVal)} reps`
            : unit === '%'
              ? `${yVal.toFixed(1)}%`
              : unit === 'secs'
                ? `${Math.round(yVal)}s`
                : unit === 'lbs'
                  ? `${yVal.toFixed(1)} lbs`
                  : `${yVal.toFixed(1)} kg`;
          setTooltip({ label: pt.label, value: valueStr });
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

  const cursorOpacity = useDerivedValue(() => state.isActive.value ? 1 : 0);

  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const yPad = Math.max((maxY - minY) * 0.2, 2.5);
  const latest = data[data.length - 1];
  const first = data[0];
  const gain = latest.y - first.y;

  const footerStat = unit === 'reps'
    ? `${gain >= 0 ? '+' : '-'}${Math.abs(gain).toFixed(0)} reps · Latest: ${Math.round(latest.y)} reps`
    : unit === '%'
      ? `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}% · Latest: ${latest.y.toFixed(1)}%`
      : unit === 'secs'
        ? `${gain >= 0 ? '+' : ''}${gain.toFixed(0)}s · Latest: ${Math.round(latest.y)}s`
        : unit === 'lbs'
          ? `${gain >= 0 ? '+' : ''}${gain.toFixed(1)} lbs · Latest: ${latest.y.toFixed(1)} lbs`
          : `${gain >= 0 ? '+' : ''}${gain.toFixed(1)} kg · Latest: ${latest.y.toFixed(1)} kg`;

  return (
    <View>
      <View style={styles.chartMeta}>
        {title ? <Text style={[styles.chartTitle, { color: t.textPrimary }]}>{title}</Text> : null}
        <Text style={[styles.yAxisLabel, { color: t.textSecondary }]}>
          {unit === 'reps' ? 'Reps'
            : unit === '%' ? 'Body fat (%)'
            : unit === 'secs' ? 'Duration (s)'
            : unit === 'lbs' ? 'Weight (lbs)'
            : 'Weight (kg)'}
        </Text>
      </View>

      <View style={styles.chart}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={['y']}
          domain={{ y: [Math.max(0, minY - yPad), maxY + yPad] }}
          domainPadding={{ left: 16, right: 16, top: 8 }}
          chartPressState={state}
          axisOptions={{
            font,
            tickCount: { x: 4, y: 5 },
            labelColor: '#888888',
            lineColor: 'rgba(128,128,128,0.2)',
            formatXLabel: (v) => String(Math.round(Number(v)) + 1),
            formatYLabel: (v) => unit === 'reps'
              ? String(Math.round(Number(v)))
              : Number(v).toFixed(1),
          }}
        >
          {({ points, chartBounds, yScale }) => (
            <>
              {yScale.ticks(5).map((tick: number) => (
                <SkiaLine
                  key={tick}
                  p1={vec(chartBounds.left, yScale(tick))}
                  p2={vec(chartBounds.right, yScale(tick))}
                  color="rgba(128,128,128,0.1)"
                  strokeWidth={1}
                />
              ))}
              <Line
                points={points.y}
                color={colors.primary}
                strokeWidth={2.5}
                curveType="natural"
                animate={{ type: 'spring' }}
              />
              <Scatter
                points={points.y}
                shape="circle"
                radius={4}
                color={colors.primary}
              />
              <Circle
                cx={state.x.position}
                cy={state.y.y.position}
                r={7}
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

      <Text style={[styles.xAxisLabel, { color: t.textSecondary }]}>Session</Text>
      <View style={styles.footer}>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{first.label}</Text>
        <Text style={[styles.footerStat, gain >= 0 ? styles.positive : styles.negative]}>
          {footerStat}
        </Text>
        <Text style={[styles.footerDate, { color: t.textSecondary }]}>{latest.label}</Text>
      </View>
    </View>
  );
}

const TOOLTIP_WIDTH = 88;

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
  footerStat: { ...typography.bodySmall, fontWeight: '600' },
  positive: { color: colors.success },
  negative: { color: colors.error },

  chartMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  chartTitle: { ...typography.label, fontWeight: '600' },
  yAxisLabel: { ...typography.label },
  xAxisLabel: { ...typography.label, textAlign: 'center', marginTop: 2 },
});
