import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePendingAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { AssignedWorkoutWithDetails } from '@/types';

function formatScheduledDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
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


export default function AssignedTabScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clientId, user, signOut } = useAuth();
  const [resetting, setResetting] = useState(false);

  const { assignedWorkouts, loading: workoutsLoading, error: workoutsError } = usePendingAssignedWorkoutsForClient(clientId ?? '');

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
