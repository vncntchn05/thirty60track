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
  /** Called with the Monday of the selected week. */
  onConfirm: (monday: Date) => void;
  /** Current week's Monday — pre-selects that week. */
  currentWeekStart: Date;
  /** ISO 'YYYY-MM-DD' strings — days that have sessions (shown as gold dots). */
  sessionDates: string[];
};

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS   = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth()      === b.getMonth()
    && a.getDate()       === b.getDate();
}

/** Returns the Monday of the week containing `d`. */
function mondayOf(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow  = copy.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

/** Returns the Sunday of the week starting at Monday `mon`. */
function sundayOf(mon: Date): Date {
  const copy = new Date(mon);
  copy.setDate(mon.getDate() + 6);
  return copy;
}

export function WeekPickerModal({
  visible, onClose, onConfirm, currentWeekStart, sessionDates,
}: Props) {
  const t = useTheme();
  const today = new Date();

  const [viewYear,  setViewYear]  = useState(currentWeekStart.getFullYear());
  const [viewMonth, setViewMonth] = useState(currentWeekStart.getMonth());
  const [selected,  setSelected]  = useState<Date>(currentWeekStart); // always a Monday

  const sessionDateSet = useMemo(() => new Set(sessionDates), [sessionDates]);

  // Build Mon-aligned calendar grid with null padding cells
  const grid = useMemo(() => {
    const first        = new Date(viewYear, viewMonth, 1);
    const leadingNulls = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(leadingNulls).fill(null);
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
    setSelected(mondayOf(day));
  }

  function handleConfirm() {
    onConfirm(selected);
    onClose();
  }

  const selSunday  = sundayOf(selected);
  const weekRangeLabel =
    selected.getMonth() === selSunday.getMonth()
      ? `${MONTHS_SHORT[selected.getMonth()]} ${selected.getDate()} – ${selSunday.getDate()}, ${selSunday.getFullYear()}`
      : `${MONTHS_SHORT[selected.getMonth()]} ${selected.getDate()} – ${MONTHS_SHORT[selSunday.getMonth()]} ${selSunday.getDate()}, ${selSunday.getFullYear()}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>

          <Text style={[styles.title, { color: t.textPrimary }]}>Select Week</Text>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: t.textPrimary }]}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers + day grid — pinned to exactly 7 columns */}
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

              const isToday      = sameDay(day, today);
              const inSelected   = day >= selected && day <= selSunday;
              const isWeekStart  = sameDay(day, selected);
              const isWeekEnd    = sameDay(day, selSunday);
              const isMidRange   = inSelected && !isWeekStart && !isWeekEnd;
              const hasSession   = sessionDateSet.has(toKey(day));
              // Show strip on every day in the week range
              const showStrip    = inSelected;

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.cell}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  {/* Week highlight strip */}
                  {showStrip && (
                    <View
                      style={[
                        styles.stripAbsolute,
                        { backgroundColor: colors.primary + '2E' },
                        isWeekStart && styles.stripRight,
                        isWeekEnd   && styles.stripLeft,
                        isMidRange  && styles.stripFull,
                      ]}
                    />
                  )}

                  {/* Day circle */}
                  <View style={[
                    styles.dayCircle,
                    (isWeekStart || isWeekEnd) && styles.dayCircleActive,
                    isToday && !isWeekStart && !isWeekEnd && styles.dayCircleToday,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      { color: t.textPrimary },
                      (isWeekStart || isWeekEnd) && styles.dayTextActive,
                      isToday && !isWeekStart && !isWeekEnd && { color: colors.primary },
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>

                  {/* Session dot */}
                  {hasSession && (
                    <View style={[
                      styles.dot,
                      { backgroundColor: (isWeekStart || isWeekEnd) ? colors.textInverse : colors.primary },
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          </View>

          {/* Selected week label */}
          <View style={[styles.weekChip, { borderColor: colors.primary, backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.weekChipText, { color: colors.primary }]}>{weekRangeLabel}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, { borderColor: t.border }]} onPress={onClose}>
              <Text style={[styles.btnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleConfirm}>
              <Text style={[styles.btnText, styles.btnPrimaryText]}>Go to Week</Text>
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

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  monthLabel: { ...typography.body, fontWeight: '600' },

  calendarContainer: { width: CELL_SIZE * 7, alignSelf: 'center' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: CELL_SIZE, textAlign: 'center', ...typography.label },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stripAbsolute: {
    position: 'absolute',
    top: 2, bottom: 6,
    left: 0, right: 0,
  },
  stripRight: { left: '50%' },   // week-start edge: fill only right half
  stripLeft:  { right: '50%' },  // week-end edge: fill only left half
  stripFull:  {},                 // mid-week: full width (default)

  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: colors.primary },
  dayCircleToday: {
    borderWidth: 1.5, borderColor: colors.primary,
  },
  dayText: { ...typography.bodySmall, fontWeight: '500' },
  dayTextActive: { color: colors.textInverse, fontWeight: '700' },

  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4, height: 4, borderRadius: 2,
  },

  weekChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    alignSelf: 'center',
  },
  weekChipText: { ...typography.bodySmall, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1,
  },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnText: { ...typography.label, fontWeight: '700' },
  btnPrimaryText: { color: colors.textInverse },
});
