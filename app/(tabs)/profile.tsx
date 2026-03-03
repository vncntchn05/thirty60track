import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

export default function ProfileScreen() {
  const { trainer, signOut } = useAuth();
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {trainer?.full_name
              ? trainer.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : '?'}
          </Text>
        </View>
        <Text style={[styles.name, { color: t.textPrimary }]}>{trainer?.full_name ?? '—'}</Text>
        <Text style={[styles.email, { color: t.textSecondary }]}>{trainer?.email ?? '—'}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, gap: spacing.lg },
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
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
});
