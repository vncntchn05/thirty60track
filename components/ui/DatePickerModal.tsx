import { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called when the user taps a day. */
  onSelect: (iso: string) => void;
  /** Currently selected date as 'YYYY-MM-DD'. */
  value: string;
  /** ISO 'YYYY-MM-DD' strings — days that have a log entry (shown as gold dots). */
  logDates: string[];
  /** Latest selectable date (defaults to today). */
  maxDate?: string;
};

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function DatePickerModal({ visible, onClose, onSelect, value, logDates, maxDate }: Props) {
  const t = useTheme();
  const today = new Date();
  const todayKey = toKey(today);
  const maxKey = maxDate ?? todayKey;

  const selected = parseIso(value);
  const [viewYear, setViewYear]   = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const logDateSet = useMemo(() => new Set(logDates), [logDates]);

  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
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

  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>

          {/* Title */}
          <View style={styles.titleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: t.textPrimary }]}>Select Date</Text>
          </View>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: t.textPrimary }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={[styles.weekday, { color: t.textSecondary }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (!day) return <View key={i} style={styles.cell} />;

              const key = toKey(day);
              const isSelected = key === value;
              const isToday = key === todayKey;
              const isFuture = key > maxKey;
              const hasLog = logDateSet.has(key);

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.cell}
                  onPress={() => { if (!isFuture) { onSelect(key); onClose(); } }}
                  activeOpacity={isFuture ? 1 : 0.7}
                  disabled={isFuture}
                >
                  <View style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      { color: isFuture ? (t.border as string) : (t.textPrimary as string) },
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && { color: colors.primary, fontWeight: '700' },
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  {hasLog && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? colors.textInverse : colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: t.textSecondary }]}>Has entries</Text>
            </View>
            <TouchableOpacity
              onPress={() => { onSelect(todayKey); onClose(); }}
              style={[styles.todayBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  title: { ...typography.heading3, fontWeight: '700' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { ...typography.body, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: CELL_SIZE, textAlign: 'center', ...typography.label },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE + 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: colors.primary },
  dayCircleToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayText: { ...typography.bodySmall, fontWeight: '500' },
  dayTextSelected: { color: colors.textInverse, fontWeight: '700' },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4, height: 4, borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { ...typography.label },
  todayBtn: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  todayBtnText: { ...typography.label, fontWeight: '700' },
});
