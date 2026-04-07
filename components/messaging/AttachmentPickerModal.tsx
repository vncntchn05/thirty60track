import { useState, useEffect } from 'react';
import {
  Modal, View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { MessageAttachment } from '@/hooks/useMessaging';

// ─── Guide topics (mirrors WorkoutGuides.tsx) ─────────────────

const GUIDE_ITEMS: MessageAttachment[] = [
  { type: 'guide', id: 'getting_started',     title: 'Getting Started',        subtitle: 'Basics & fundamentals' },
  { type: 'guide', id: 'full_body',            title: 'Full Body',              subtitle: 'Total body training' },
  { type: 'guide', id: 'upper_lower',          title: 'Upper / Lower',          subtitle: '4-day split' },
  { type: 'guide', id: 'push_pull_legs',       title: 'Push / Pull / Legs',     subtitle: '6-day split' },
  { type: 'guide', id: 'exercise_selection',   title: 'Exercise Selection',     subtitle: 'Choosing the right moves' },
  { type: 'guide', id: 'progressive_overload', title: 'Progressive Overload',   subtitle: 'Building strength over time' },
  { type: 'guide', id: 'sets_reps',            title: 'Sets, Reps & Intensity', subtitle: 'Volume & intensity guidelines' },
  { type: 'guide', id: 'warmup',               title: 'Warm-Up',                subtitle: 'Preparation & injury prevention' },
  { type: 'guide', id: 'deload',               title: 'Deload',                 subtitle: 'Recovery & periodization' },
  { type: 'guide', id: 'abs_core',             title: 'Abs & Core',             subtitle: 'Core strength & stability' },
];

// ─── Segment tabs ─────────────────────────────────────────────

type Seg = 'exercise' | 'workout' | 'assigned_workout' | 'guide';

const SEGS: { key: Seg; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'exercise',         label: 'Exercise', icon: 'barbell-outline' },
  { key: 'workout',          label: 'Workout',  icon: 'calendar-outline' },
  { key: 'assigned_workout', label: 'Assigned', icon: 'clipboard-outline' },
  { key: 'guide',            label: 'Guide',    icon: 'book-outline' },
];

// ─── Props ────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (attachment: MessageAttachment) => void;
  role?: 'trainer' | 'client' | null;
  clientId?: string | null;
};

// ─── Row item ─────────────────────────────────────────────────

function AttachmentRow({
  item,
  icon,
  onPress,
}: {
  item: MessageAttachment;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primary + '22' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: t.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={[styles.rowSub, { color: t.textSecondary }]} numberOfLines={1}>{item.subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────

export function AttachmentPickerModal({ visible, onClose, onSelect, role, clientId }: Props) {
  const t = useTheme();
  const isClient = role === 'client';
  const [seg, setSeg] = useState<Seg>('exercise');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MessageAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load items when the segment or visibility changes
  useEffect(() => {
    if (!visible) return;
    if (seg === 'guide') {
      setItems(GUIDE_ITEMS);
      return;
    }
    setLoading(true);
    setQuery('');
    loadItems(seg).then((data) => { setItems(data); setLoading(false); });
  }, [visible, seg]);

  async function loadItems(type: Seg): Promise<MessageAttachment[]> {
    if (type === 'exercise') {
      const { data } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, category')
        .order('name')
        .limit(100);
      return (data ?? []).map((e) => ({
        type: 'exercise',
        id: e.id,
        title: e.name,
        subtitle: [e.muscle_group, e.category].filter(Boolean).join(' · '),
      }));
    }

    if (type === 'workout') {
      let q = supabase
        .from('workouts')
        .select('id, performed_at, clients(full_name)')
        .order('performed_at', { ascending: false })
        .limit(30);
      // Clients can only attach their own workouts
      if (isClient && clientId) {
        q = q.eq('client_id', clientId);
      }
      const { data } = await q;
      return (data ?? []).map((w: { id: string; performed_at: string; clients: { full_name: string } | null }) => ({
        type: 'workout',
        id: w.id,
        title: `Workout — ${new Date(w.performed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        subtitle: w.clients?.full_name ?? '',
      }));
    }

    if (type === 'assigned_workout') {
      let q = supabase
        .from('assigned_workouts')
        .select('id, title, scheduled_date, status')
        .order('scheduled_date', { ascending: false })
        .limit(30);
      // Clients can only attach their own assigned workouts
      if (isClient && clientId) {
        q = q.eq('client_id', clientId);
      }
      const { data } = await q;
      return (data ?? []).map((a: { id: string; title: string | null; scheduled_date: string; status: string }) => ({
        type: 'assigned_workout',
        id: a.id,
        title: a.title ?? `Assigned — ${a.scheduled_date}`,
        subtitle: `${new Date(a.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${a.status}`,
      }));
    }

    return [];
  }

  const iconFor = (type: Seg): React.ComponentProps<typeof Ionicons>['name'] => {
    if (type === 'exercise') return 'barbell-outline';
    if (type === 'workout') return 'calendar-outline';
    if (type === 'assigned_workout') return 'clipboard-outline';
    return 'book-outline';
  };

  const filtered = query.trim()
    ? items.filter((it) => it.title.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  function handleSelect(item: MessageAttachment) {
    onClose();
    onSelect(item);
  }

  function handleClose() {
    setQuery('');
    setItems([]);
    setSeg('exercise');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { backgroundColor: t.background }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Share</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Segment tabs */}
          <View style={[styles.segRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            {SEGS.map((s) => {
              const active = seg === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.segBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                  onPress={() => setSeg(s.key)}
                >
                  <Ionicons name={s.icon} size={16} color={active ? colors.primary : t.textSecondary as string} />
                  <Text style={[styles.segLabel, { color: active ? colors.primary : t.textSecondary }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <Ionicons name="search-outline" size={16} color={t.textSecondary as string} />
            <TextInput
              style={[styles.searchInput, { color: t.textPrimary }]}
              placeholder="Search…"
              placeholderTextColor={t.textSecondary as string}
              value={query}
              onChangeText={setQuery}
            />
            {loading && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AttachmentRow
                item={item}
                icon={iconFor(seg)}
                onPress={() => handleSelect(item)}
              />
            )}
            ListEmptyComponent={
              !loading ? (
                <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                  {query ? 'No matches' : 'Nothing available'}
                </Text>
              ) : null
            }
          />
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
  segRow: {
    flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  segLabel: { ...typography.bodySmall, fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { ...typography.body, flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowTitle: { ...typography.body, fontWeight: '600' },
  rowSub: { ...typography.bodySmall },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
});
