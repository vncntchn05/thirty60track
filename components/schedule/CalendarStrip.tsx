import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';
import type { ScheduledSessionWithDetails } from '@/types';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  weekStart: Date;
  selectedDate: Date;
  sessions: ScheduledSessionWithDetails[];
  onSelectDate: (date: Date) => void;
};

function dotColor(status: string): string {
  if (status === 'confirmed') return colors.primary;
  if (status === 'pending')   return colors.warning;
  return 'transparent';
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarStrip({ weekStart, selectedDate, sessions, onSelectDate }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {days.map((day) => {
        const active = sameDay(day, selectedDate);
        const dots = sessions.filter(
          (s) => sameDay(new Date(s.scheduled_at), day) && s.status !== 'cancelled' && s.status !== 'completed',
        );

        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[styles.dayBtn, active && styles.dayBtnActive]}
            onPress={() => onSelectDate(day)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayAbbr, { color: active ? colors.textInverse : '#888' }]}>
              {DAY_ABBR[day.getDay()]}
            </Text>
            <Text style={[styles.dayNum, { color: active ? colors.textInverse : '#fff' }]}>
              {day.getDate()}
            </Text>
            <View style={styles.dotRow}>
              {dots.slice(0, 3).map((s) => (
                <View key={s.id} style={[styles.dot, { backgroundColor: dotColor(s.status) }]} />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { paddingHorizontal: spacing.md, gap: spacing.xs, paddingVertical: spacing.xs },
  dayBtn: {
    width: 48, alignItems: 'center', paddingVertical: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1, borderColor: '#2E2E2E', gap: 2,
  },
  dayBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayAbbr: { ...typography.label },
  dayNum: { ...typography.body, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 3, height: 6, alignItems: 'center', minHeight: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
