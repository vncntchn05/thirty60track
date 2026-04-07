import { useState, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPeople, getOrCreateDM, createGroupConversation } from '@/hooks/useMessaging';
import type { SearchPerson } from '@/hooks/useMessaging';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Props = {
  visible: boolean;
  currentUserId: string;
  role: 'trainer' | 'client';
  onClose: () => void;
  onConversationReady: (conversationId: string) => void;
};

export function NewConversationModal({ visible, currentUserId, role, onClose, onConversationReady }: Props) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const [allPeople, setAllPeople] = useState<SearchPerson[]>([]);
  const [filtered, setFiltered] = useState<SearchPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchPerson[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load all contactable people when the modal opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setCreateError(null);
    searchPeople('', currentUserId, role)
      .then((people) => {
        setAllPeople(people);
        setFiltered(people);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [visible, currentUserId, role]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    const q = text.trim().toLowerCase();
    if (!q) {
      setFiltered(allPeople);
    } else {
      setFiltered(allPeople.filter((p) => p.name.toLowerCase().includes(q)));
    }
  }, [allPeople]);

  function toggleSelect(person: SearchPerson) {
    setSelected((prev) =>
      prev.some((p) => p.user_id === person.user_id)
        ? prev.filter((p) => p.user_id !== person.user_id)
        : [...prev, person],
    );
  }

  async function startConversation(people: SearchPerson[]) {
    if (!people.length) return;
    setCreating(true);
    setCreateError(null);

    let convId: string | null = null;

    try {
      if (groupMode || people.length > 1) {
        const title = groupTitle.trim() || people.map((p) => p.name).join(', ');
        convId = await createGroupConversation(title, people.map((p) => p.user_id), currentUserId);
      } else {
        convId = await getOrCreateDM(currentUserId, people[0].user_id);
      }
    } catch (err) {
      setCreateError(String(err));
      setCreating(false);
      return;
    }

    setCreating(false);

    if (!convId) {
      setCreateError('Failed to create conversation. Please try again.');
      return;
    }

    handleClose();
    setTimeout(() => onConversationReady(convId!), 300);
  }

  function handleStart() {
    startConversation(selected);
  }

  function handleClose() {
    setQuery('');
    setAllPeople([]);
    setFiltered([]);
    setSelected([]);
    setGroupMode(false);
    setGroupTitle('');
    setCreateError(null);
    onClose();
  }

  const isSelected = (person: SearchPerson) => selected.some((p) => p.user_id === person.user_id);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { backgroundColor: t.background }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>New Message</Text>
            {role === 'trainer' ? (
              <TouchableOpacity
                onPress={() => setGroupMode((g) => !g)}
                style={[styles.groupToggle, groupMode && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
              >
                <Ionicons name="people-outline" size={18} color={groupMode ? colors.primary : t.textSecondary as string} />
                <Text style={[styles.groupToggleText, { color: groupMode ? colors.primary : t.textSecondary }]}>Group</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}
          </View>

          {/* Group title input */}
          {groupMode && (
            <View style={[styles.groupTitleRow, { borderBottomColor: t.border }]}>
              <TextInput
                style={[styles.groupTitleInput, { color: t.textPrimary, borderColor: t.border }]}
                placeholder="Group name (optional)"
                placeholderTextColor={t.textSecondary as string}
                value={groupTitle}
                onChangeText={setGroupTitle}
              />
            </View>
          )}

          {/* Search filter */}
          <View style={[styles.searchRow, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
            <Ionicons name="search-outline" size={18} color={t.textSecondary as string} />
            <TextInput
              style={[styles.searchInput, { color: t.textPrimary }]}
              placeholder="Filter by name…"
              placeholderTextColor={t.textSecondary as string}
              value={query}
              onChangeText={handleSearch}
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {/* Selected chips */}
          {selected.length > 0 && (
            <View style={[styles.chipsRow, { borderBottomColor: t.border }]}>
              {selected.map((p) => (
                <TouchableOpacity
                  key={p.user_id}
                  style={[styles.chip, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                  onPress={() => toggleSelect(p)}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>{p.name}</Text>
                  <Ionicons name="close-circle" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Error */}
          {createError && (
            <View style={[styles.errorRow, { backgroundColor: colors.error + '22' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{createError}</Text>
            </View>
          )}

          {/* People list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.resultsList}
            renderItem={({ item }) => {
              const sel = isSelected(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.resultRow,
                    { borderBottomColor: t.border },
                    sel && { backgroundColor: colors.primary + '11' },
                  ]}
                  onPress={() => {
                    if (groupMode) {
                      toggleSelect(item);
                    } else {
                      // Single select — start immediately without waiting for state
                      startConversation([item]);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resultAvatar, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.resultInitials, { color: colors.primary }]}>
                      {item.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultName, { color: t.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.resultRole, { color: t.textSecondary }]}>
                      {item.role === 'trainer' ? 'Trainer' : 'Client'}
                    </Text>
                  </View>
                  {sel && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              !loading ? (
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                  {query.length > 0 ? 'No people match that name' : 'No contacts available'}
                </Text>
              ) : null
            }
          />

          {/* Start button */}
          {selected.length > 0 && (
            <View style={[styles.footer, { borderTopColor: t.border, backgroundColor: t.surface }]}>
              <TouchableOpacity
                style={[styles.startBtn, creating && { opacity: 0.6 }]}
                onPress={handleStart}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color={colors.textInverse} />
                  : <Text style={styles.startBtnText}>
                      {groupMode || selected.length > 1
                        ? `Start Group (${selected.length} people)`
                        : `Message ${selected[0].name}`}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.heading3 },
  groupToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'transparent', borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  groupToggleText: { ...typography.bodySmall, fontWeight: '600' },
  groupTitleRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  groupTitleInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { ...typography.body, flex: 1 },
  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  chipText: { ...typography.bodySmall, fontWeight: '600' },
  errorRow: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  errorText: { ...typography.bodySmall },
  resultsList: { paddingBottom: spacing.xxl },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultAvatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  resultInitials: { ...typography.body, fontWeight: '700' },
  resultInfo: { flex: 1 },
  resultName: { ...typography.body, fontWeight: '600' },
  resultRole: { ...typography.bodySmall },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  footer: {
    padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth,
  },
  startBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  startBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
