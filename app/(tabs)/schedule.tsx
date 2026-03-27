import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useTrainerSessions } from '@/hooks/useSchedule';
import { CalendarStrip, getMondayOfWeek, sameDay } from '@/components/schedule/CalendarStrip';
import { SessionSheet } from '@/components/schedule/SessionSheet';
import { AvailabilitySheet } from '@/components/schedule/AvailabilitySheet';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ScheduledSessionWithDetails } from '@/types';

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function StatusChip({ status }: { status: string }) {
  const bg =
    status === 'confirmed'  ? colors.primary :
    status === 'pending'    ? colors.warning  :
    status === 'completed'  ? colors.success  :
    colors.error;
  return (
    <View style={[styles.chip, { backgroundColor: bg + '33', borderColor: bg }]}>
      <Text style={[styles.chipText, { color: bg }]}>{status}</Text>
    </View>
  );
}

type SessionCardProps = {
  session: ScheduledSessionWithDetails;
  onPress: () => void;
};

function SessionCard({ session, onPress }: SessionCardProps) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.cardTime, { color: t.textPrimary }]}>{fmtTime(session.scheduled_at)}</Text>
        <StatusChip status={session.status} />
      </View>
      <Text style={[styles.cardClient, { color: t.textPrimary }]}>
        {session.client?.full_name ?? 'Client'}
      </Text>
      <Text style={[styles.cardMeta, { color: t.textSecondary }]}>
        {session.duration_minutes} min
      </Text>
    </TouchableOpacity>
  );
}

export default function ScheduleScreen() {
  const t = useTheme();
  const { trainer } = useAuth();
  const trainerId = trainer?.id ?? '';

  const { sessions, loading, refetch } = useTrainerSessions(trainerId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeSession, setActiveSession] = useState<ScheduledSessionWithDetails | null>(null);
  const [availSheetOpen, setAvailSheetOpen] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const daySessions = sessions.filter((s) => sameDay(new Date(s.scheduled_at), selectedDate));
  const activeCount = sessions.filter((s) => s.status === 'pending' || s.status === 'confirmed').length;

  function prevWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; });
  }
  function nextWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const weekLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Week navigator */}
      <View style={[styles.weekNav, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={prevWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.weekLabel, { color: t.textPrimary }]}>{weekLabel}</Text>
        <TouchableOpacity onPress={nextWeek} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
      </View>

      {/* Calendar strip */}
      <View style={[styles.stripWrap, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <CalendarStrip
          weekStart={weekStart}
          selectedDate={selectedDate}
          sessions={sessions}
          onSelectDate={setSelectedDate}
        />
      </View>

      {/* Day session list */}
      <ScrollView contentContainerStyle={styles.dayContent}>
        {loading
          ? <ActivityIndicator color={colors.primary} style={styles.loader} />
          : daySessions.length === 0
            ? (
              <View style={styles.emptyDay}>
                <Ionicons name="calendar-outline" size={36} color={t.textSecondary as string} />
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>No sessions on this day</Text>
              </View>
            )
            : daySessions.map((s) => (
                <SessionCard key={s.id} session={s} onPress={() => setActiveSession(s)} />
              ))
        }
      </ScrollView>

      {/* Summary strip */}
      {!loading && activeCount > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.summaryText, { color: t.textSecondary }]}>
            {activeCount} upcoming session{activeCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* FAB — manage availability */}
      <TouchableOpacity style={styles.fab} onPress={() => setAvailSheetOpen(true)}>
        <Ionicons name="time-outline" size={20} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Availability</Text>
      </TouchableOpacity>

      {/* Sheets */}
      <SessionSheet
        session={activeSession}
        role="trainer"
        trainerId={trainerId}
        onClose={() => setActiveSession(null)}
        onChanged={refetch}
      />
      {trainerId ? (
        <AvailabilitySheet
          visible={availSheetOpen}
          trainerId={trainerId}
          onClose={() => setAvailSheetOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekLabel: { ...typography.body, fontWeight: '600' },
  stripWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  dayContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  loader: { marginTop: spacing.xl },
  emptyDay: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { ...typography.body },
  card: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTime: { ...typography.body, fontWeight: '700' },
  cardClient: { ...typography.body },
  cardMeta: { ...typography.bodySmall },
  chip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  chipText: { ...typography.label },
  summaryBar: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  summaryText: { ...typography.bodySmall, textAlign: 'center' },
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  fabLabel: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
