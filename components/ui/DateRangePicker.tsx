import { useState, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called when the user taps Apply with a valid selection. */
  onConfirm: (start: Date, end: Date) => void;
  /** ISO 'YYYY-MM-DD' strings — days that have a workout logged. */
  workoutDates: string[];
  initialStart?: Date;
  initialEnd?: Date;
};

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DateRangePicker({
  visible, onClose, onConfirm, workoutDates, initialStart, initialEnd,
}: Props) {
  const t = useTheme();
  const today = new Date();

  const [viewYear, setViewYear]   = useState(initialStart?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialStart?.getMonth() ?? today.getMonth());
  const [start, setStart]         = useState<Date | null>(initialStart ?? null);
  const [end, setEnd]             = useState<Date | null>(initialEnd ?? null);
  // 'start' phase: next tap sets start; 'end' phase: next tap sets end
  const [phase, setPhase]         = useState<'start' | 'end'>('start');

  const workoutDateSet = useMemo(() => new Set(workoutDates), [workoutDates]);

  // Build calendar grid: Mon-aligned, with null padding cells
  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const leadingBlanks = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayPress(day: Date) {
    if (phase === 'start') {
      setStart(day);
      setEnd(null);
      setPhase('end');
    } else {
      if (start && day < start) {
        // Tapped before the start — treat as new start
        setStart(day);
        setEnd(null);
        setPhase('end');
      } else {
        setEnd(day);
        setPhase('start');
      }
    }
  }

  function handleConfirm() {
    const s = start ? startOfDay(start) : null;
    const e = end   ? startOfDay(end)   : s;
    if (s && e) onConfirm(s, e);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const canConfirm = start !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop tap-through so tapping inside the sheet doesn't close it */}
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>

          {/* Title */}
          <Text style={[styles.title, { color: t.textPrimary }]}>Select Date Range</Text>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: t.textPrimary }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers + grid — pinned to exactly 7 columns */}
          <View style={styles.calendarContainer}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[styles.weekday, { color: t.textSecondary }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (!day) return <View key={i} style={styles.cell} />;

              const isStart = !!start && sameDay(day, start);
              const isEnd   = !!end   && sameDay(day, end);
              const isRange = !!start && !!end && !sameDay(start, end) && day > start && day < end;
              const isEdge  = isStart || isEnd;
              // Range strip spans start→end inclusive (but only when it's an actual range, not single day)
              const showStrip = isRange || (isEdge && !!end && !sameDay(start!, end!));
              const hasWorkout = workoutDateSet.has(toDateKey(day));

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.cell}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  {/* Range background strip (half-cell on edges, full on middles) */}
                  {showStrip && (
                    <View
                      style={[
                        styles.stripAbsolute,
                        { backgroundColor: colors.primary + '30' },
                        isStart && !isEnd && styles.stripRight,
                        isEnd   && !isStart && styles.stripLeft,
                      ]}
                    />
                  )}

                  {/* Day circle */}
                  <View style={[styles.dayCircle, isEdge && styles.dayCircleActive]}>
                    <Text style={[
                      styles.dayText,
                      { color: t.textPrimary },
                      isEdge && styles.dayTextActive,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>

                  {/* Workout dot */}
                  {hasWorkout && (
                    <View style={[
                      styles.dot,
                      { backgroundColor: isEdge ? colors.textInverse : colors.primary },
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          </View>

          {/* Selected range labels */}
          <View style={styles.selectionRow}>
            <View style={[
              styles.selectionChip,
              { borderColor: t.border, backgroundColor: t.background },
              phase === 'start' && styles.selectionChipActive,
            ]}>
              <Text style={[styles.selectionLabel, { color: t.textSecondary }]}>FROM</Text>
              <Text style={[styles.selectionValue, { color: t.textPrimary }]}>
                {start
                  ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Tap a day'}
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={14} color={t.textSecondary as string} />

            <View style={[
              styles.selectionChip,
              { borderColor: t.border, backgroundColor: t.background },
              phase === 'end' && styles.selectionChipActive,
            ]}>
              <Text style={[styles.selectionLabel, { color: t.textSecondary }]}>TO</Text>
              <Text style={[styles.selectionValue, { color: t.textPrimary }]}>
                {end
                  ? end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : start ? 'Tap a day' : '—'}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: t.border }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !canConfirm && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Text style={[styles.btnText, styles.btnPrimaryText]}>Apply</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },

  title: { ...typography.heading3, textAlign: 'center' },

  // Month navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: { ...typography.body, fontWeight: '600' },

  // Weekday row
  calendarContainer: { width: CELL_SIZE * 7, alignSelf: 'center' },
  weekRow: { flexDirection: 'row' },
  weekday: {
    width: CELL_SIZE,
    textAlign: 'center',
    ...typography.label,
  },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 6,  // extra 6px for the dot below the circle
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Range strip (absolutely positioned inside cell)
  stripAbsolute: {
    position: 'absolute',
    top: 2,
    bottom: 6,       // leave room for dot
    left: 0,
    right: 0,
  },
  stripRight: { left: '50%' },   // start edge: only right half
  stripLeft:  { right: '50%' },  // end edge: only left half

  // Day circle
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: colors.primary },
  dayText: { ...typography.bodySmall, fontWeight: '500' },
  dayTextActive: { color: colors.textInverse, fontWeight: '700' },

  // Workout indicator dot
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Range selection chips
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectionChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  selectionChipActive: { borderColor: colors.primary },
  selectionLabel: { ...typography.label },
  selectionValue: { ...typography.bodySmall, fontWeight: '500' },

  // Buttons
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnDisabled: { opacity: 0.4 },
  btnText: { ...typography.label, fontWeight: '700' },
  btnPrimaryText: { color: colors.textInverse },
});
