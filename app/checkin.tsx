import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { selfCheckin } from '@/hooks/useCheckins';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type State = 'idle' | 'loading' | 'success' | 'error';

export default function CheckinScreen() {
  const t = useTheme();
  const router = useRouter();
  const { clientId, role, isGuest } = useAuth();
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCheckin() {
    if (!clientId) return;
    setState('loading');
    const { error } = await selfCheckin(clientId);
    if (error) {
      setErrorMsg(error);
      setState('error');
    } else {
      setState('success');
    }
  }

  // Not logged in or guest
  if (!clientId || role !== 'client' || isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="qr-code-outline" size={52} color={colors.primary} />
          <Text style={[styles.heading, { color: t.textPrimary }]}>Gym Check-In</Text>
          <Text style={[styles.sub, { color: t.textSecondary }]}>
            Log in to your client account to check in.
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(auth)/login' as never)}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={[styles.heading, { color: t.textPrimary }]}>Checked In!</Text>
          <Text style={[styles.sub, { color: t.textSecondary }]}>Your visit has been recorded.</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="close-circle" size={72} color={colors.error} />
          <Text style={[styles.heading, { color: t.textPrimary }]}>Check-In Failed</Text>
          <Text style={[styles.sub, { color: t.textSecondary }]}>{errorMsg}</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => setState('idle')}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '1A' }]}>
          <Ionicons name="fitness-outline" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.heading, { color: t.textPrimary }]}>Gym Check-In</Text>
        <Text style={[styles.sub, { color: t.textSecondary }]}>
          Tap below to log your visit for today.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={handleCheckin}
          disabled={state === 'loading'}
        >
          {state === 'loading'
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.primaryBtnText}>Check In</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: t.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heading: { ...typography.heading2, textAlign: 'center' },
  sub: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    width: '100%',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  cancelText: { ...typography.bodySmall, marginTop: spacing.xs },
});
