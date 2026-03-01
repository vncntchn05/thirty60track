import { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClients } from '@/hooks/useClients';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ClientWithStats } from '@/types';

export default function ClientsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { clients, loading, error, refetch } = useClients();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ClientRow client={item} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            No clients yet. Add your first client.
          </Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/client/new' as never)}
        accessibilityLabel="Add client"
      >
        <Ionicons name="add" size={20} color={colors.textInverse} />
        <Text style={styles.fabLabel}>Add Client</Text>
      </TouchableOpacity>
    </View>
  );
}

function ClientRow({ client }: { client: ClientWithStats }) {
  const router = useRouter();
  const t = useTheme();
  const initials = client.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const lastWorkout = client.last_workout_at
    ? new Date(client.last_workout_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={() => router.push(`/client/${client.id}` as never)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.clientName, { color: t.textPrimary }]}>{client.full_name}</Text>
        {client.email ? (
          <Text style={[styles.clientMeta, { color: t.textSecondary }]}>{client.email}</Text>
        ) : null}
        <View style={styles.statsRow}>
          <Text style={[styles.statText, { color: t.textSecondary }]}>
            {client.workout_count} workout{client.workout_count !== 1 ? 's' : ''}
          </Text>
          {lastWorkout ? (
            <Text style={[styles.statText, { color: t.textSecondary }]}>· Last {lastWorkout}</Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, gap: spacing.sm },
  row: {
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
  },
  avatar: {
    width: 44, height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.label, color: colors.textInverse, fontSize: 15 },
  rowInfo: { flex: 1, gap: 2 },
  clientName: { ...typography.body, fontWeight: '600' },
  clientMeta: { ...typography.bodySmall },
  statsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  statText: { ...typography.bodySmall },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
