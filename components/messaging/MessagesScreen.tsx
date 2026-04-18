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
import { GuestLock } from '@/components/ui/GuestLock';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  role: 'trainer' | 'client';
};

export function MessagesScreen({ role }: Props) {
  const router = useRouter();
  const t = useTheme();
  const { user, isGuest } = useAuth();
  const { conversations, loading, error, refetch } = useConversations();
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(useCallback(() => { if (!isGuest) refetch(); }, [refetch, isGuest]));

  if (!user && !isGuest) return null;

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        {/* AI Assistant card — visible but not tappable for guests */}
        <View style={[styles.aiRow, { backgroundColor: t.surface, borderBottomColor: t.border }, styles.aiRowDisabled]}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="nutrition-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.aiBody}>
            <Text style={[styles.aiName, { color: t.textPrimary }]}>AI Nutrition Assistant</Text>
            <Text style={[styles.aiSub, { color: t.textSecondary }]}>
              Ask about meals, recipes, supplements & workouts
            </Text>
          </View>
          <Ionicons name="lock-closed-outline" size={18} color={t.textSecondary as string} />
        </View>
        {/* Locked conversation area */}
        <GuestLock message="Sign up to message your trainer and use the AI assistant" />
      </View>
    );
  }

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

      {/* AI Assistant — pinned for clients (nutrition) and trainers (training + nutrition) */}
      {role === 'client' && (
        <TouchableOpacity
          style={[styles.aiRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}
          onPress={() => router.push('/messages/ai' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="nutrition-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.aiBody}>
            <Text style={[styles.aiName, { color: t.textPrimary }]}>AI Nutrition Assistant</Text>
            <Text style={[styles.aiSub, { color: t.textSecondary }]}>
              Ask about meals, recipes, supplements & workouts
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
        </TouchableOpacity>
      )}
      {role === 'trainer' && (
        <TouchableOpacity
          style={[styles.aiRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}
          onPress={() => router.push('/messages/ai-trainer' as never)}
          activeOpacity={0.7}
        >
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="barbell-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.aiBody}>
            <Text style={[styles.aiName, { color: t.textPrimary }]}>AI Training Assistant</Text>
            <Text style={[styles.aiSub, { color: t.textSecondary }]}>
              Program design, training tips, client nutrition & more
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
        </TouchableOpacity>
      )}

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
              currentUserId={user!.id}
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
        currentUserId={user!.id}
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
  aiRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  aiRowDisabled: { opacity: 0.55 },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  aiBody: { flex: 1 },
  aiName: { ...typography.body, fontWeight: '700' },
  aiSub: { ...typography.bodySmall, marginTop: 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyText: { ...typography.heading3 },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
  errorText: { ...typography.body },
});
