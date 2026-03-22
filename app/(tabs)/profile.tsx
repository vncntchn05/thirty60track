import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useTrainers } from '@/hooks/useTrainers';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Trainer } from '@/types';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function TrainerRow({ trainer, t }: { trainer: Trainer; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.trainerRow, { borderBottomColor: t.border }]}>
      <View style={styles.trainerAvatar}>
        <Text style={styles.trainerAvatarText}>{initials(trainer.full_name)}</Text>
      </View>
      <View style={styles.trainerInfo}>
        <Text style={[styles.trainerName, { color: t.textPrimary }]}>{trainer.full_name}</Text>
        <Text style={[styles.trainerEmail, { color: t.textSecondary }]}>{trainer.email}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { trainer, signOut } = useAuth();
  const { trainers, loading: trainersLoading, error: trainersError } = useTrainers();
  const t = useTheme();
  const [resetting, setResetting] = useState(false);

  async function handleResetPassword() {
    if (!trainer?.email) return;
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${trainer.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setResetting(true);
            const { error } = await supabase.auth.resetPasswordForEmail(trainer.email);
            setResetting(false);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              Alert.alert('Email sent', `Check ${trainer.email} for a password reset link.`);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.background }}
      contentContainerStyle={styles.container}
    >
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {trainer?.full_name ? initials(trainer.full_name) : '?'}
          </Text>
        </View>
        <Text style={[styles.name, { color: t.textPrimary }]}>{trainer?.full_name ?? '—'}</Text>
        <Text style={[styles.email, { color: t.textSecondary }]}>{trainer?.email ?? '—'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.sectionHeader, { color: t.textSecondary }]}>OTHER TRAINERS</Text>
        {trainersLoading && (
          <ActivityIndicator style={styles.loader} color={t.primary} />
        )}
        {!trainersLoading && trainersError && (
          <Text style={[styles.errorText, { color: colors.error }]}>{trainersError}</Text>
        )}
        {!trainersLoading && !trainersError && trainers.length === 0 && (
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>No other trainers yet.</Text>
        )}
        {!trainersLoading && trainers.map((tr) => (
          <TrainerRow key={tr.id} trainer={tr} t={t} />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={handleResetPassword}
        disabled={resetting}
      >
        {resetting
          ? <ActivityIndicator color={colors.primary} />
          : <Text style={[styles.resetText, { color: colors.primary }]}>Reset Password</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  avatar: {
    width: 72, height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.textInverse },
  name: { ...typography.heading3 },
  email: { ...typography.body },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    ...typography.label,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loader: { paddingVertical: spacing.lg },
  errorText: { ...typography.bodySmall, padding: spacing.md },
  emptyText: { ...typography.body, padding: spacing.md, paddingTop: 0 },
  trainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trainerAvatar: {
    width: 40, height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerAvatarText: { fontSize: 15, fontWeight: '700', color: colors.textInverse },
  trainerInfo: { flex: 1 },
  trainerName: { ...typography.body, fontWeight: '600' },
  trainerEmail: { ...typography.bodySmall },
  resetButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: { ...typography.body, fontWeight: '600' },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
});
