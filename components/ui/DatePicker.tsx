import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Props = {
  /** Selected date as 'YYYY-MM-DD'. */
  value: string;
  onChange: (date: string) => void;
};

function parseISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d }; // month 0-indexed
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Mon … 6=Sun for the first day of the given month. */
function firstWeekday(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

/**
 * Inline calendar date picker. Fully self-contained — no external deps.
 * Works on iOS, Android, and Web.
 */
export function DatePicker({ value, onChange }: Props) {
  const t = useTheme();
  const sel = parseISO(value);
  const todayISO = new Date().toISOString().split('T')[0];
  const tod = parseISO(todayISO);

  const [viewYear, setViewYear] = useState(sel.year);
  const [viewMonth, setViewMonth] = useState(sel.month);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const offset = firstWeekday(viewYear, viewMonth);
  const days = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <View style={[styles.container, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* ── Month navigation ── */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={20} color={t.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: t.textPrimary }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={20} color={t.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Weekday header ── */}
      <View style={styles.row}>
        {DAY_LABELS.map((d) => (
          <Text key={d} style={[styles.dayLabel, { color: t.textSecondary }]}>{d}</Text>
        ))}
      </View>

      {/* ── Day grid ── */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;

            const isSelected =
              day === sel.day && viewMonth === sel.month && viewYear === sel.year;
            const isToday =
              day === tod.day && viewMonth === tod.month && viewYear === tod.year;

            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.cell,
                  isToday && !isSelected && [styles.todayRing, { borderColor: colors.primary }],
                  isSelected && styles.selectedCell,
                ]}
                onPress={() => onChange(toISO(viewYear, viewMonth, day))}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  { color: t.textPrimary },
                  isToday && !isSelected && { color: colors.primary, fontWeight: '700' },
                  isSelected && styles.selectedDayText,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.sm,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xs, paddingBottom: spacing.sm,
  },
  monthLabel: { ...typography.body, fontWeight: '700' },
  row: { flexDirection: 'row' },
  dayLabel: {
    ...typography.label, flex: 1, textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  cell: {
    flex: 1, height: 36, justifyContent: 'center', alignItems: 'center',
    borderRadius: radius.full, borderWidth: 1, borderColor: 'transparent',
    marginVertical: 1,
  },
  todayRing: { borderWidth: 1.5 },
  selectedCell: { backgroundColor: colors.primary },
  dayText: { ...typography.bodySmall },
  selectedDayText: { color: colors.textInverse, fontWeight: '700' },
});
