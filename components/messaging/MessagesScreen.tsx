import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { useConversations } from '@/hooks/useMessaging';
import { ConversationCard } from './ConversationCard';
import { NewConversationModal } from './NewConversationModal';
import { colors, spacing, typography, useTheme } from '@/constants/theme';

type Props = {
  role: 'trainer' | 'client';
};

export function MessagesScreen({ role }: Props) {
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();
  const { conversations, loading, error, refetch } = useConversations();
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (!user) return null;

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>

      {/* New message button row */}
      <View style={[styles.topBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <Text style={[styles.topBarTitle, { color: t.textSecondary }]}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="create-outline" size={18} color={colors.textInverse} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              currentUserId={user.id}
              onPress={() => router.push(`/messages/${item.id}` as never)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={52} color={t.textSecondary as string} />
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>No messages yet</Text>
              <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
                Tap New to start a conversation
              </Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      <NewConversationModal
        visible={modalVisible}
        currentUserId={user.id}
        role={role}
        onClose={() => setModalVisible(false)}
        onConversationReady={(convId) => {
          refetch();
          router.push(`/messages/${convId}` as never);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: { ...typography.bodySmall },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: 20,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  newBtnText: { ...typography.bodySmall, fontWeight: '700', color: colors.textInverse },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyText: { ...typography.heading3 },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
  errorText: { ...typography.body },
});
