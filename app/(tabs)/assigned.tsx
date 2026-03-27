import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePendingAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { useClientSessions } from '@/hooks/useSchedule';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { SessionSheet } from '@/components/schedule/SessionSheet';
import { BookingSheet } from '@/components/schedule/BookingSheet';
import type { AssignedWorkoutWithDetails, ScheduledSessionWithDetails } from '@/types';

type Segment = 'workouts' | 'schedule';

function formatScheduledDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function fmtSessionTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) + ' · ' + new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function AssignedCard({ item, onStart, t }: { item: AssignedWorkoutWithDetails; onStart: () => void; t: ReturnType<typeof useTheme> }) {
  const exerciseCount = item.exercises.length;
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.cardTitle, { color: t.textPrimary }]}>{item.title ?? 'Untitled Workout'}</Text>
      <Text style={[styles.cardDate, { color: t.textSecondary }]}>
        Scheduled for {formatScheduledDate(item.scheduled_date)}
      </Text>
      {exerciseCount > 0 && (
        <Text style={[styles.cardMeta, { color: t.textSecondary }]}>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
        </Text>
      )}
      {item.notes ? (
        <Text style={[styles.cardNotes, { color: t.textSecondary }]} numberOfLines={2}>{item.notes}</Text>
      ) : null}
      <TouchableOpacity style={styles.startBtn} onPress={onStart}>
        <Ionicons name="play" size={16} color={colors.textInverse} />
        <Text style={styles.startBtnText}>Start Workout</Text>
      </TouchableOpacity>
    </View>
  );
}

function SessionStatusChip({ status }: { status: string }) {
  const bg =
    status === 'confirmed' ? colors.primary :
    status === 'pending'   ? colors.warning  :
    colors.error;
  return (
    <View style={[styles.chip, { backgroundColor: bg + '33', borderColor: bg }]}>
      <Text style={[styles.chipText, { color: bg }]}>{status}</Text>
    </View>
  );
}

function SessionCard({ session, onPress, t }: { session: ScheduledSessionWithDetails; onPress: () => void; t: ReturnType<typeof useTheme> }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.sessionTop}>
        <Text style={[styles.sessionTime, { color: t.textPrimary }]}>{fmtSessionTime(session.scheduled_at)}</Text>
        <SessionStatusChip status={session.status} />
      </View>
      <Text style={[styles.cardMeta, { color: t.textSecondary }]}>{session.duration_minutes} min session</Text>
      {session.notes ? (
        <Text style={[styles.cardNotes, { color: t.textSecondary }]} numberOfLines={2}>{session.notes}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function AssignedTabScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clientId, user, signOut } = useAuth();
  const [segment, setSegment] = useState<Segment>('workouts');
  const [resetting, setResetting] = useState(false);
  const [activeSession, setActiveSession] = useState<ScheduledSessionWithDetails | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const { assignedWorkouts, loading: workoutsLoading, error: workoutsError } = usePendingAssignedWorkoutsForClient(clientId ?? '');
  const { sessions, loading: sessionsLoading, refetch: refetchSessions } = useClientSessions(clientId ?? '');

  useFocusEffect(useCallback(() => { refetchSessions(); }, [refetchSessions]));

  async function handleResetPassword() {
    if (!user?.email) return;
    Alert.alert('Reset Password', `Send a password reset link to ${user.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setResetting(true);
          const { error: err } = await supabase.auth.resetPasswordForEmail(user.email!);
          setResetting(false);
          if (err) Alert.alert('Error', err.message);
          else Alert.alert('Email sent', `Check ${user.email} for a password reset link.`);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen options={{ title: 'Workouts' }} />

      {/* Segment control */}
      <View style={[styles.segmentBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['workouts', 'schedule'] as Segment[]).map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.segBtn, segment === seg && styles.segBtnActive]}
            onPress={() => setSegment(seg)}
          >
            <Text style={[styles.segText, { color: segment === seg ? colors.primary : t.textSecondary }]}>
              {seg === 'workouts' ? 'Workout Log' : 'Schedule'}
            </Text>
            {segment === seg && <View style={styles.segIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {segment === 'workouts' && (
        <FlatList
          data={assignedWorkouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <AssignedCard
              item={item}
              onStart={() => router.push(`/workout/assigned/complete/${item.id}` as never)}
              t={t}
            />
          )}
          ListHeaderComponent={
            workoutsLoading
              ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              : workoutsError
                ? <Text style={[styles.errorText, { color: colors.error }]}>{workoutsError}</Text>
                : null
          }
          ListEmptyComponent={
            !workoutsLoading
              ? (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={48} color={t.textSecondary as string} />
                  <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts assigned yet.</Text>
                  <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
                    Your trainer will assign workouts here.
                  </Text>
                </View>
              )
              : null
          }
          ListFooterComponent={<View style={styles.footerPad} />}
        />
      )}

      {segment === 'schedule' && (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <SessionCard session={item} onPress={() => setActiveSession(item)} t={t} />
          )}
          ListHeaderComponent={
            sessionsLoading
              ? <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              : null
          }
          ListEmptyComponent={
            !sessionsLoading
              ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={t.textSecondary as string} />
                  <Text style={[styles.emptyText, { color: t.textSecondary }]}>No upcoming sessions.</Text>
                  <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
                    Tap the button below to book a session with your trainer.
                  </Text>
                </View>
              )
              : null
          }
          ListFooterComponent={<View style={styles.footerPad} />}
        />
      )}

      {/* Footer: reset password + sign out */}
      <View style={[styles.footer, { borderTopColor: t.border, backgroundColor: t.surface }]}>
        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: t.border }]}
          onPress={handleResetPassword}
          disabled={resetting}
        >
          {resetting
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={[styles.footerBtnText, { color: colors.primary }]}>Reset Password</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Book FAB (only on schedule segment) */}
      {segment === 'schedule' && clientId && (
        <TouchableOpacity style={styles.fab} onPress={() => setBookingOpen(true)}>
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Book Session</Text>
        </TouchableOpacity>
      )}

      {/* Session detail sheet */}
      <SessionSheet
        session={activeSession}
        role="client"
        onClose={() => setActiveSession(null)}
        onChanged={refetchSessions}
      />

      {/* Booking sheet */}
      {clientId && (
        <BookingSheet
          visible={bookingOpen}
          clientId={clientId}
          onClose={() => setBookingOpen(false)}
          onBooked={refetchSessions}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: { padding: spacing.md, gap: spacing.sm },
  footerPad: { height: spacing.xxl },
  loader: { marginBottom: spacing.sm },
  errorText: { ...typography.body, textAlign: 'center', marginBottom: spacing.sm },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600' },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
  card: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: spacing.xs,
  },
  cardTitle: { ...typography.body, fontWeight: '700' },
  cardDate: { ...typography.bodySmall },
  cardMeta: { ...typography.bodySmall },
  cardNotes: { ...typography.bodySmall, fontStyle: 'italic' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.xs,
    backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.sm,
  },
  startBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionTime: { ...typography.body, fontWeight: '600', flex: 1, marginRight: spacing.xs },
  chip: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  chipText: { ...typography.label },
  footer: {
    padding: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center',
  },
  footerBtnText: { ...typography.body, fontWeight: '600' },
  signOutBtn: {
    backgroundColor: colors.error, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  signOutText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  fab: {
    position: 'absolute', bottom: 120, right: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.full,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, gap: spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  fabLabel: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
