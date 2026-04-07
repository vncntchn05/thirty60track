import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useClientWorkouts } from '@/hooks/useClientWorkouts';
import { usePendingAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { useClientSessions, useAvailabilityForClient } from '@/hooks/useSchedule';
import { WorkoutCalendar } from '@/components/workout/WorkoutCalendar';
import { useClientCredits } from '@/hooks/useCredits';
import { getMondayOfWeek } from '@/components/schedule/CalendarStrip';
import { WeeklyTimetable } from '@/components/schedule/WeeklyTimetable';
import { WeekPickerModal } from '@/components/schedule/WeekPickerModal';
import { SessionSheet } from '@/components/schedule/SessionSheet';
import { BookingSheet } from '@/components/schedule/BookingSheet';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { WorkoutWithTrainer, AssignedWorkoutWithDetails, ScheduledSessionWithDetails } from '@/types';
import ExercisesScreen from '@/app/(tabs)/exercises';

type Segment   = 'workouts' | 'exercises' | 'schedule';
type ViewMode  = 'calendar' | 'list';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Helpers ──────────────────────────────────────────────────

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso: string) {
  return isoToLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtScheduledDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${period}`;
}

function weekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
  }
  return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
}

// ─── Workout list components ──────────────────────────────────

function AssignedWorkoutRow({ item, onPress }: { item: AssignedWorkoutWithDetails; onPress: () => void }) {
  const t = useTheme();
  const exerciseCount = item.exercises.length;
  return (
    <TouchableOpacity
      style={[styles.row, styles.assignedRow, { backgroundColor: t.surface, borderColor: colors.success }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowMain}>
        <View style={styles.assignedBadgeRow}>
          <View style={styles.assignedBadge}>
            <Text style={styles.assignedBadgeText}>UPCOMING</Text>
          </View>
          <Text style={[styles.assignedDate, { color: t.textSecondary }]}>
            {fmtScheduledDate(item.scheduled_date)}
          </Text>
        </View>
        <Text style={[styles.rowDate, { color: t.textPrimary }]}>
          {item.title ?? 'Assigned Workout'}
        </Text>
        {exerciseCount > 0 && (
          <Text style={[styles.rowNotes, { color: t.textSecondary }]}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <Ionicons name="play-circle" size={24} color={colors.success} />
    </TouchableOpacity>
  );
}

function WorkoutRow({ workout, onPress }: { workout: WorkoutWithTrainer; onPress: () => void }) {
  const t = useTheme();
  const { user } = useAuth();
  const isClientLogged = workout.logged_by_role === 'client' && workout.logged_by_user_id === user?.id;
  const isTrainerLogged = workout.logged_by_role === 'trainer';

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.rowMain}>
        <Text style={[styles.rowDate, { color: t.textPrimary }]}>{fmtDate(workout.performed_at)}</Text>
        {workout.notes ? (
          <Text style={[styles.rowNotes, { color: t.textSecondary }]} numberOfLines={1}>{workout.notes}</Text>
        ) : null}
        {isTrainerLogged && (
          <View style={styles.badgeRow}>
            <Ionicons name="lock-closed-outline" size={12} color={t.textSecondary as string} />
            <Text style={[styles.badge, { color: t.textSecondary }]}>
              Logged by {workout.trainer?.full_name ?? 'trainer'}
            </Text>
          </View>
        )}
      </View>
      {isClientLogged && (
        <View style={styles.editHint}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────

export default function ClientWorkoutsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clientId } = useAuth();

  const [segment, setSegment] = useState<Segment>('workouts');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  type DayOption = { text: string; onPress: () => void };
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [dayOptionsTitle, setDayOptionsTitle] = useState('');
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [activeSession, setActiveSession] = useState<ScheduledSessionWithDetails | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  const { workouts, loading: workoutsLoading, error, refresh } = useClientWorkouts(clientId ?? '');
  const { assignedWorkouts, error: assignedError, refetch: refreshAssigned } = usePendingAssignedWorkoutsForClient(clientId ?? '');
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useClientSessions(clientId ?? '');
  const { slots: availSlots } = useAvailabilityForClient(clientId ?? '');
  const { balance, refetch: refetchCredits } = useClientCredits(clientId ?? '');

  useFocusEffect(useCallback(() => {
    refresh();
    refreshAssigned();
    refetchSessions();
    refetchCredits();
  }, [refresh, refreshAssigned, refetchSessions, refetchCredits]));

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

  function handleDayPress(iso: string) {
    const dayWorkouts  = workouts.filter(w => w.performed_at.slice(0, 10) === iso);
    const dayAssigned  = assignedWorkouts.filter(a => a.status === 'assigned' && a.scheduled_date.slice(0, 10) === iso);
    const daySessions  = sessions.filter(s => s.status === 'confirmed' && toIso(new Date(s.scheduled_at)) === iso);

    const options: DayOption[] = [];

    dayWorkouts.forEach(w => options.push({
      text: `Logged workout`,
      onPress: () => router.push(`/(client)/session/${w.id}` as never),
    }));
    dayAssigned.forEach(a => options.push({
      text: `Assigned: ${a.title ?? 'Workout'}`,
      onPress: () => router.push(`/workout/assigned/complete/${a.id}` as never),
    }));
    daySessions.forEach(s => options.push({
      text: `Session at ${fmtTime(s.scheduled_at)}`,
      onPress: () => {
        setSegment('schedule');
        setWeekStart(getMondayOfWeek(new Date(s.scheduled_at)));
      },
    }));

    if (options.length === 1) {
      options[0].onPress();
    } else if (options.length > 1) {
      setDayOptionsTitle(isoToLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      setDayOptions(options);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>

      {/* Segment control */}
      <View style={[styles.segmentBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['workouts', 'exercises', 'schedule'] as Segment[]).map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.segBtn, segment === seg && styles.segBtnActive]}
            onPress={() => setSegment(seg)}
          >
            <Text style={[styles.segText, { color: segment === seg ? colors.primary : t.textSecondary }]}>
              {seg === 'workouts' ? 'Workouts' : seg === 'exercises' ? 'Exercises' : 'Schedule'}
            </Text>
            {segment === seg && <View style={styles.segIndicator} />}
          </TouchableOpacity>
        ))}
        {segment === 'workouts' && (
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(v => v === 'calendar' ? 'list' : 'calendar')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={viewMode === 'calendar' ? 'list-outline' : 'calendar-outline'}
              size={20}
              color={t.textSecondary as string}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Workouts segment ── */}
      {segment === 'workouts' && (
        <>
          {workoutsLoading ? (
            <View style={[styles.centered, { backgroundColor: t.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : viewMode === 'calendar' ? (
            <WorkoutCalendar
              workouts={workouts}
              assignedWorkouts={assignedWorkouts}
              sessions={sessions}
              onDayPress={handleDayPress}
            />
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item }) => (
                <WorkoutRow
                  workout={item}
                  onPress={() => router.push(`/(client)/session/${item.id}` as never)}
                />
              )}
              ListHeaderComponent={
                <>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  {assignedError ? <Text style={styles.errorText}>{assignedError}</Text> : null}
                  {assignedWorkouts.map((item) => (
                    <AssignedWorkoutRow
                      key={item.id}
                      item={item}
                      onPress={() => router.push(`/workout/assigned/complete/${item.id}` as never)}
                    />
                  ))}
                  {assignedWorkouts.length > 0 && <View style={{ height: spacing.sm }} />}
                </>
              }
              ListEmptyComponent={
                assignedWorkouts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
                    <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts yet</Text>
                    <Text style={[styles.emptyHint, { color: t.textSecondary }]}>Log your first workout below</Text>
                  </View>
                ) : null
              }
            />
          )}

          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(client)/workout/log' as never)}
            accessibilityLabel="Log new workout"
          >
            <Ionicons name="add" size={22} color={colors.textInverse} />
            <Text style={styles.fabLabel}>Log Workout</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── Exercises segment ── */}
      {segment === 'exercises' && (
        <View style={{ flex: 1 }}>
          <ExercisesScreen />
        </View>
      )}

      {/* ── Schedule segment ── */}
      {segment === 'schedule' && (
        <>
          {/* Week nav */}
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
            <View style={styles.weekNavRight}>
              <View style={[styles.creditPill, { borderColor: colors.primary + '55' }]}>
                <Ionicons name="star" size={11} color={colors.primary} />
                <Text style={[styles.creditPillText, { color: colors.primary }]}>Credits: {balance}</Text>
              </View>
              <TouchableOpacity onPress={nextWeek} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-forward" size={20} color={t.textPrimary as string} />
              </TouchableOpacity>
            </View>
          </View>

          {sessionsLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          <WeeklyTimetable
            weekStart={weekStart}
            sessions={weekSessions}
            onSessionPress={setActiveSession}
            availability={availSlots}
            getSessionLabel={(s) => s.trainer?.full_name ?? 'Session'}
          />

          {/* Book Session FAB */}
          {clientId && (
            <TouchableOpacity style={styles.fab} onPress={() => setBookingOpen(true)}>
              <Ionicons name="add" size={22} color={colors.textInverse} />
              <Text style={styles.fabLabel}>Book Session</Text>
            </TouchableOpacity>
          )}

          <WeekPickerModal
            visible={weekPickerOpen}
            onClose={() => setWeekPickerOpen(false)}
            onConfirm={(monday) => { setWeekStart(monday); setWeekPickerOpen(false); }}
            currentWeekStart={weekStart}
            sessionDates={sessionDates}
          />
        </>
      )}

      {/* Shared sheets */}
      <SessionSheet
        session={activeSession}
        role="client"
        onClose={() => setActiveSession(null)}
        onChanged={refetchSessions}
      />

      {clientId && (
        <BookingSheet
          visible={bookingOpen}
          clientId={clientId}
          onClose={() => setBookingOpen(false)}
          onBooked={refetchSessions}
        />
      )}

      {/* ── Day picker modal (multiple items on same day) ── */}
      <Modal
        visible={dayOptions.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setDayOptions([])}
      >
        <Pressable style={styles.dayModalBackdrop} onPress={() => setDayOptions([])}>
          <Pressable style={[styles.dayModalSheet, { backgroundColor: t.surface }]} onPress={() => {}}>
            <Text style={[styles.dayModalTitle, { color: t.textPrimary }]}>{dayOptionsTitle}</Text>
            <Text style={[styles.dayModalSubtitle, { color: t.textSecondary }]}>Select an item:</Text>
            {dayOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayModalOption, { borderColor: t.border }]}
                onPress={() => { setDayOptions([]); opt.onPress(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayModalOptionText, { color: t.textPrimary }]}>{opt.text}</Text>
                <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setDayOptions([])} style={styles.dayModalCancel}>
              <Text style={[styles.dayModalCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Segment control
  segmentBar: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm, position: 'relative',
  },
  segBtnActive: {},
  segText: { ...typography.body, fontWeight: '600' },
  segIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
  },
  viewToggle: {
    position: 'absolute', right: spacing.sm,
    top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: spacing.xs,
  },

  // Week nav (schedule segment)
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { padding: spacing.xs },
  weekLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  weekLabelText: { ...typography.body, fontWeight: '600' },
  weekNavRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  creditPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: colors.primary + '10',
  },
  creditPillText: { ...typography.bodySmall, fontWeight: '700', lineHeight: 16 },
  loadingOverlay: {
    position: 'absolute', top: 100, left: 0, right: 0, zIndex: 20,
    alignItems: 'center',
  },

  // Workout list
  list: { padding: spacing.md, paddingBottom: spacing.xxl + 64 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  assignedRow: { borderLeftWidth: 3 },
  assignedBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 },
  assignedBadge: {
    backgroundColor: colors.success, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: 1,
  },
  assignedBadgeText: { ...typography.label, color: '#fff', fontWeight: '700', fontSize: 9, letterSpacing: 0.5 },
  assignedDate: { ...typography.label },
  rowMain: { flex: 1, gap: 2 },
  rowDate: { ...typography.body, fontWeight: '600' },
  rowNotes: { ...typography.bodySmall },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badge: { ...typography.label },
  editHint: { marginRight: spacing.xs },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.heading3 },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
  errorText: { ...typography.bodySmall, color: colors.error, padding: spacing.md },

  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── Day picker modal ──
  dayModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  dayModalSheet: {
    width: 300, borderRadius: 16,
    padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  },
  dayModalTitle: { ...typography.heading3, fontWeight: '700' },
  dayModalSubtitle: { ...typography.bodySmall },
  dayModalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
  dayModalOptionText: { ...typography.body, fontWeight: '600', flex: 1 },
  dayModalCancel: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  dayModalCancelText: { ...typography.body },
});
