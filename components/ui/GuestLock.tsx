import { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  children?: ReactNode;
  message?: string;
};

export function GuestLock({ children, message = 'Sign up to unlock this feature' }: Props) {
  const t = useTheme();
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      {/* Faded content preview — not interactive */}
      {children ? (
        <View style={styles.preview} pointerEvents="none">
          {children}
        </View>
      ) : (
        <View style={[styles.preview, { backgroundColor: t.background }]} pointerEvents="none" />
      )}

      {/* Gradient-like fade layer */}
      <View style={[styles.fade, { backgroundColor: t.background }]} pointerEvents="none" />

      {/* Lock overlay */}
      <View style={[styles.lockOverlay, { backgroundColor: t.background + 'E6' }]}>
        <View style={[styles.lockCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.lockHeading, { color: t.textPrimary }]}>Members Only</Text>
          <Text style={[styles.lockMessage, { color: t.textSecondary }]}>{message}</Text>
          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => router.push('/(auth)/signup' as never)}
          >
            <Text style={styles.signUpBtnText}>Sign Up Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => router.push('/(auth)/login' as never)}
          >
            <Text style={[styles.signInLinkText, { color: t.textSecondary }]}>
              Already have an account? <Text style={{ color: colors.primary }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
    opacity: 0.18,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    opacity: 0.7,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  lockCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lockHeading: {
    ...typography.heading3,
    textAlign: 'center',
  },
  lockMessage: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  signUpBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  signUpBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.textInverse,
  },
  signInLink: {
    paddingVertical: spacing.xs,
  },
  signInLinkText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
