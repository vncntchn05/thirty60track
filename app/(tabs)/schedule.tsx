import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useTrainerSessions, useTrainerAvailability } from '@/hooks/useSchedule';
import { useTrainers } from '@/hooks/useTrainers';
import { getMondayOfWeek } from '@/components/schedule/CalendarStrip';
import { WeeklyTimetable } from '@/components/schedule/WeeklyTimetable';
import { SessionSheet } from '@/components/schedule/SessionSheet';
import { AvailabilitySheet } from '@/components/schedule/AvailabilitySheet';
import { WeekPickerModal } from '@/components/schedule/WeekPickerModal';
import { colors, spacing, typography, useTheme } from '@/constants/theme';
import type { ScheduledSessionWithDetails, Trainer } from '@/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function weekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }
  return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export default function ScheduleScreen() {
  const t = useTheme();
  const { trainer } = useAuth();
  const myTrainerId = trainer?.id ?? '';

  const { trainers: otherTrainers } = useTrainers();
  const allTrainers: Trainer[] = trainer
    ? [trainer as Trainer, ...otherTrainers]
    : otherTrainers;

  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const viewingId = selectedTrainerId || myTrainerId;

  const { sessions, loading, refetch } = useTrainerSessions(viewingId);
  const { slots: availSlots } = useTrainerAvailability(viewingId);

  const { weekOf } = useLocalSearchParams<{ weekOf?: string }>();
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));

  useEffect(() => {
    if (weekOf) {
      const d = new Date(weekOf);
      if (!isNaN(d.getTime())) setWeekStart(getMondayOfWeek(d));
    }
  }, [weekOf]);
  const [activeSession, setActiveSession] = useState<ScheduledSessionWithDetails | null>(null);
  const [availSheetOpen, setAvailSheetOpen] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  function prevWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; });
  }
  function nextWeek() {
    setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; });
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const weekSessions = sessions.filter((s) => {
    const d = new Date(s.scheduled_at);
    return d >= weekStart && d < weekEnd;
  });

  const sessionDates = sessions
    .filter((s) => s.status !== 'cancelled')
    .map((s) => {
      const d = new Date(s.scheduled_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

  const isViewingOwn = !selectedTrainerId || selectedTrainerId === myTrainerId;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>

      {/* Week navigator bar */}
      <View style={[styles.weekNav, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={prevWeek} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setWeekPickerOpen(true)}
          style={styles.weekLabelBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.weekLabelText, { color: t.textPrimary }]}>{weekLabel(weekStart)}</Text>
          <Ionicons name="chevron-down" size={14} color={t.textSecondary as string} />
        </TouchableOpacity>
        <TouchableOpacity onPress={nextWeek} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
      </View>

      {/* Trainer selector strip */}
      {allTrainers.length > 1 && (
        <View style={[styles.trainerBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trainerScroll}
          >
            {allTrainers.map((tr) => {
              const isSelected = (tr.id === myTrainerId && !selectedTrainerId) || tr.id === selectedTrainerId;
              const isMe = tr.id === myTrainerId;
              return (
                <TouchableOpacity
                  key={tr.id}
                  style={[
                    styles.trainerChip,
                    { borderColor: t.border },
                    isSelected && styles.trainerChipActive,
                  ]}
                  onPress={() => setSelectedTrainerId(tr.id === myTrainerId ? '' : tr.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.trainerAvatar,
                    isSelected ? styles.trainerAvatarActive : { backgroundColor: t.background },
                  ]}>
                    <Text style={[
                      styles.trainerAvatarText,
                      { color: isSelected ? colors.textInverse : t.textSecondary as string },
                    ]}>
                      {initials(tr.full_name)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.trainerChipName,
                      { color: isSelected ? colors.primary : t.textPrimary },
                      isSelected && { fontWeight: '700' },
                    ]}
                    numberOfLines={1}
                  >
                    {isMe ? 'Me' : tr.full_name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      <WeeklyTimetable
        weekStart={weekStart}
        sessions={weekSessions}
        onSessionPress={setActiveSession}
        availability={availSlots}
      />

      {isViewingOwn && (
        <TouchableOpacity style={styles.fab} onPress={() => setAvailSheetOpen(true)}>
          <Ionicons name="time-outline" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Availability</Text>
        </TouchableOpacity>
      )}

      <SessionSheet
        session={activeSession}
        role="trainer"
        trainerId={myTrainerId}
        onClose={() => setActiveSession(null)}
        onChanged={refetch}
      />

      {myTrainerId ? (
        <AvailabilitySheet
          visible={availSheetOpen}
          trainerId={myTrainerId}
          onClose={() => setAvailSheetOpen(false)}
        />
      ) : null}

      <WeekPickerModal
        visible={weekPickerOpen}
        onClose={() => setWeekPickerOpen(false)}
        onConfirm={(monday) => { setWeekStart(monday); setWeekPickerOpen(false); }}
        currentWeekStart={weekStart}
        sessionDates={sessionDates}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: spacing.xs },
  weekLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  weekLabelText: { ...typography.body, fontWeight: '600' },
  trainerBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  trainerScroll: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    gap: spacing.xs, flexDirection: 'row',
  },
  trainerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 20, borderWidth: 1,
  },
  trainerChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  trainerAvatar: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  trainerAvatarActive: { backgroundColor: colors.primary },
  trainerAvatarText: { fontSize: 9, fontWeight: '700', lineHeight: 11 },
  trainerChipName: { ...typography.bodySmall, maxWidth: 72 },
  loadingOverlay: {
    position: 'absolute', top: 52, left: 0, right: 0, zIndex: 20,
    alignItems: 'center', paddingTop: spacing.md,
  },
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.md,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs,
    borderRadius: 9999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  fabLabel: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
