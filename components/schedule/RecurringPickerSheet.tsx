import { useEffect, useState } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClients } from '@/hooks/useClients';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { ClientWithStats } from '@/types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Slide-up sheet that lets a trainer pick a client, then navigates to
 * the recurring-series creation screen for that client.
 */
export function RecurringPickerSheet({ visible, onClose }: Props) {
  const t = useTheme();
  const router = useRouter();
  const { clients, loading } = useClients();

  function handleSelect(client: ClientWithStats) {
    onClose();
    router.push({ pathname: '/workout/recurring/new', params: { clientId: client.id } } as never);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[s.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={s.handle} />

        {/* Header */}
        <View style={[s.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={t.textPrimary as string} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: t.textPrimary }]}>Recurring Series</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={[s.hint, { color: t.textSecondary }]}>Select a client to schedule a recurring workout series for.</Text>

        {loading ? (
          <View style={s.centered}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => {
              const initials = item.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <TouchableOpacity
                  style={[s.row, { borderBottomColor: t.border }]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[s.avatar, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[s.initials, { color: colors.primary }]}>{initials}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={[s.name, { color: t.textPrimary }]}>{item.full_name}</Text>
                    {item.email ? <Text style={[s.email, { color: t.textSecondary }]}>{item.email}</Text> : null}
                  </View>
                  <Ionicons name="repeat" size={18} color={colors.primary} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[s.empty, { color: t.textSecondary }]}>No clients found.</Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0, maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#444',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.heading3 },
  hint: { ...typography.bodySmall, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  centered: { padding: spacing.xl, alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initials: { ...typography.body, fontWeight: '700' },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600' },
  email: { ...typography.bodySmall },
  empty: { ...typography.body, textAlign: 'center', padding: spacing.xl },
});
