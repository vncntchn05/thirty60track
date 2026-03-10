import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useClientWorkouts } from '@/hooks/useClientWorkouts';
import { useClientIntake } from '@/hooks/useClientIntake';
import { IntakeForm } from '@/components/client/IntakeForm';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso: string) {
  return isoToLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ClientDashboard() {
  const router = useRouter();
  const t = useTheme();
  const { clientId } = useAuth();
  const { client, loading: profileLoading, refresh: refreshProfile } = useClientProfile();
  const { intake, saveIntake } = useClientIntake(clientId ?? '');
  const { workouts, loading, refresh } = useClientWorkouts(clientId ?? '');
  const [intakeCompleted, setIntakeCompleted] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Show intake form until the client submits it.
  // Check both DB flag and intake.completed_at in case the clients UPDATE was blocked by RLS.
  const dbIntakeComplete = client?.intake_completed || !!intake?.completed_at;
  if (!intakeCompleted && !profileLoading && client && !dbIntakeComplete) {
    return (
      <IntakeForm
        client={client}
        intake={intake}
        onSave={async (intakeData, clientData) => {
          const result = await saveIntake(intakeData, clientData, true);
          if (!result.error) {
            setIntakeCompleted(true);
            refreshProfile();
          }
          return result;
        }}
        isFirstTime
      />
    );
  }

  const firstName = client?.full_name?.split(' ')[0] ?? 'there';
  const lastWorkout = workouts[0] ?? null;

  // Current streak: consecutive weeks with at least one workout
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  let currentStreak = 0;
  if (workouts.length > 0) {
    const sortedDates = workouts.map((w) => isoToLocal(w.performed_at).getTime()).sort((a, b) => b - a);
    const now = Date.now();
    const getWeekStart = (ms: number) => ms - ((ms % WEEK_MS + WEEK_MS) % WEEK_MS);
    const nowWeek = getWeekStart(now);
    let checkWeek = nowWeek;
    const weekSet = new Set(sortedDates.map((d) => getWeekStart(d)));
    while (weekSet.has(checkWeek)) {
      currentStreak++;
      checkWeek -= WEEK_MS;
    }
  }

  // Total volume of last workout
  const lastVolume = lastWorkout ? 0 : 0; // sets not loaded here — just show count

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.scroll}>
      {/* Greeting */}
      <Text style={[styles.greeting, { color: t.textPrimary }]}>Welcome back, {firstName}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{workouts.length}</Text>
          <Text style={[styles.statLabel, { color: t.textSecondary }]}>Total Sessions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: t.textSecondary }]}>Week Streak</Text>
        </View>
      </View>

      {/* Last workout card */}
      {lastWorkout ? (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => router.push(`/(client)/session/${lastWorkout.id}` as never)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="barbell-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Last Workout</Text>
          </View>
          <Text style={[styles.cardDate, { color: t.textPrimary }]}>{fmtDate(lastWorkout.performed_at)}</Text>
          {lastWorkout.logged_by_role === 'trainer' && lastWorkout.trainer && (
            <Text style={[styles.cardSub, { color: t.textSecondary }]}>
              Logged by {lastWorkout.trainer.full_name}
            </Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.cardSub, { color: t.textSecondary }]}>No workouts yet. Log your first one!</Text>
        </View>
      )}

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: t.textSecondary }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(client)/workout/log' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>Log Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border }]}
          onPress={() => router.push('/(client)/progress' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="trending-up-outline" size={22} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>View Progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  greeting: { ...typography.heading2, marginBottom: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, alignItems: 'center', gap: spacing.xs,
  },
  statValue: { ...typography.heading1 },
  statLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDate: { ...typography.heading3 },
  cardSub: { ...typography.bodySmall },
  sectionTitle: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderRadius: radius.md, paddingVertical: spacing.md,
  },
  actionBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
