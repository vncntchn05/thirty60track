import { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/lib/auth';
import { useFeatureGuide } from '@/hooks/useFeatureGuide';
import { FeaturesModal } from '@/components/ui/FeaturesModal';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { clientSlug } from '@/lib/slugify';
import type { ClientWithStats } from '@/types';

function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function ClientsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();
  const { clients, loading, error, refetch } = useClients();
  const [query, setQuery] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const { enabled: guideEnabled } = useFeatureGuide(user?.id);


  const filtered = query.trim()
    ? clients.filter((c) =>
        c.full_name.toLowerCase().includes(query.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : clients;

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
      {guideEnabled && (
        <TouchableOpacity
          style={[styles.guideBanner, { backgroundColor: t.surface, borderColor: t.border }]}
          onPress={() => setGuideOpen(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="compass-outline" size={16} color={colors.primary} />
          <Text style={[styles.guideBannerText, { color: colors.primary }]}>Feature Guide</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} style={styles.guideBannerChevron} />
        </TouchableOpacity>
      )}

      <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Ionicons name="search" size={16} color={t.textSecondary as string} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          placeholder="Search clients…"
          placeholderTextColor={t.textSecondary as string}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ClientRow client={item} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>
            {query.trim() ? 'No clients match your search.' : 'No clients yet. Add your first client.'}
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

      <FeaturesModal visible={guideOpen} role="trainer" onClose={() => setGuideOpen(false)} />
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
    ? isoToLocal(client.last_workout_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={() => router.push(`/client/${clientSlug(client.full_name)}` as never)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.clientName, { color: t.textPrimary }]}>{client.full_name}</Text>
          {client.auth_user_id ? (
            <Ionicons name="checkmark" size={16} color={colors.success} />
          ) : null}
        </View>
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
  guideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    margin: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  guideBannerText: { ...typography.label, fontWeight: '700' },
  guideBannerChevron: { marginLeft: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    marginBottom: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  searchInput: { ...typography.body, flex: 1 },
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
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
