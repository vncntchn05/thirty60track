import { lazy, Suspense, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useClientWorkouts } from '@/hooks/useClientWorkouts';
import { useClientIntake } from '@/hooks/useClientIntake';
import { IntakeForm } from '@/components/client/IntakeForm';
import ReportCardButton from '@/components/client/ReportCardButton';
import { MediaGallery } from '@/components/client/MediaGallery';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

const ProgressSection = lazy(() => import('@/components/charts/ProgressSection'));

type Segment = 'progress' | 'media';

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
  const [segment, setSegment] = useState<Segment>('progress');

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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Segment control */}
      <View style={[styles.segmentBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['progress', 'media'] as Segment[]).map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.segBtn, segment === seg && styles.segBtnActive]}
            onPress={() => setSegment(seg)}
          >
            <Text style={[styles.segText, { color: segment === seg ? colors.primary : t.textSecondary }]}>
              {seg === 'progress' ? 'Progress' : 'Media'}
            </Text>
            {segment === seg && <View style={styles.segIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Progress segment ── */}
      {segment === 'progress' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
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

          {/* Charts */}
          {clientId ? (
            <>
              <ReportCardButton clientId={clientId} />
              <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}>
                <ProgressSection clientId={clientId} />
              </Suspense>
            </>
          ) : null}
        </ScrollView>
      )}

      {/* ── Media segment ── */}
      {segment === 'media' && clientId ? (
        <View style={{ flex: 1 }}>
          <MediaGallery clientId={clientId} uploadTrainerId={client?.trainer_id} />
        </View>
      ) : null}
    </View>
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
  loader: { marginVertical: spacing.md },

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
});
