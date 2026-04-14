import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, useTheme } from '@/constants/theme';

// ─── Data types ───────────────────────────────────────────────

type FeatureItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  route: string | null;
  routeLabel: string;
};

type FeatureGroup = {
  category: string;
  items: FeatureItem[];
};

// ─── Trainer feature map ──────────────────────────────────────

const TRAINER_FEATURES: FeatureGroup[] = [
  {
    category: 'Clients',
    items: [
      {
        icon: 'people-outline',
        title: 'Client List',
        description: 'View all your clients with workout count and last session date.',
        route: '/(tabs)/',
        routeLabel: 'Clients tab',
      },
      {
        icon: 'barbell-outline',
        title: 'Log a Workout',
        description: 'Multi-exercise builder with sets, reps, weight, and a per-set rest timer.',
        route: null,
        routeLabel: 'Client detail → Log Workout',
      },
      {
        icon: 'clipboard-outline',
        title: 'Assign a Workout',
        description: 'Schedule workout programs for a client with a date and instructions.',
        route: null,
        routeLabel: 'Client detail → Assign Workout',
      },
      {
        icon: 'repeat-outline',
        title: 'Recurring Workouts',
        description: 'Create weekly or biweekly workout series on selected days of the week.',
        route: '/workout/recurring/new',
        routeLabel: 'New Recurring Plan',
      },
      {
        icon: 'copy-outline',
        title: 'Workout Templates',
        description: '40 clinical templates (Fat Loss, Rehab, Neurological & more) matched to client health conditions.',
        route: null,
        routeLabel: 'Client detail → Log Workout → Use Template',
      },
      {
        icon: 'trophy-outline',
        title: 'Personal Records',
        description: 'All-time best weight and reps per client per exercise, shown on the Progress tab.',
        route: null,
        routeLabel: 'Client detail → Progress tab',
      },
      {
        icon: 'trending-up-outline',
        title: 'Progress Charts',
        description: 'Volume and exercise progress charts for any client over any time range.',
        route: null,
        routeLabel: 'Client detail → Progress tab',
      },
      {
        icon: 'document-text-outline',
        title: 'Report Card',
        description: 'Generate a formatted progress report to share with a client.',
        route: null,
        routeLabel: 'Client detail → Progress tab',
      },
      {
        icon: 'images-outline',
        title: 'Media Gallery',
        description: 'Upload and manage progress photos for any client.',
        route: null,
        routeLabel: 'Client detail → Media tab',
      },
    ],
  },
  {
    category: 'Scheduling',
    items: [
      {
        icon: 'calendar-outline',
        title: 'Schedule & Availability',
        description: 'Set recurring availability slots and manage weekly sessions for all clients.',
        route: '/(tabs)/schedule',
        routeLabel: 'Schedule tab',
      },
      {
        icon: 'card-outline',
        title: 'Session Credits',
        description: 'Grant or deduct session credits for any client; 1 credit = 30 min.',
        route: null,
        routeLabel: 'Client detail → Credits tab',
      },
    ],
  },
  {
    category: 'Community',
    items: [
      {
        icon: 'newspaper-outline',
        title: 'Community Feed',
        description: 'Post updates, react, comment, and attach exercises or workouts to any post.',
        route: '/(tabs)/feed',
        routeLabel: 'Feed tab',
      },
      {
        icon: 'sparkles-outline',
        title: 'AI Fitness Trends',
        description: 'Daily AI-generated fitness trend summaries with article links.',
        route: '/(tabs)/feed',
        routeLabel: 'Feed → Trends tab',
      },
      {
        icon: 'chatbubble-outline',
        title: 'Messaging',
        description: 'Direct messages with workout, exercise, and guide attachments; video call links.',
        route: '/(tabs)/messages',
        routeLabel: 'Messages tab',
      },
    ],
  },
  {
    category: 'Exercise Library',
    items: [
      {
        icon: 'barbell-outline',
        title: 'Exercise Library',
        description: '200+ exercises with muscle groups, equipment, form cues, and verified tutorial videos.',
        route: '/(tabs)/exercises',
        routeLabel: 'Exercises tab',
      },
      {
        icon: 'book-outline',
        title: 'Workout Guides',
        description: 'Trainer-editable fitness encyclopaedia across 9 topics (PPL, Full Body, Progressive Overload & more).',
        route: '/(tabs)/exercises',
        routeLabel: 'Exercises → Guides tab',
      },
    ],
  },
  {
    category: 'Client Tools',
    items: [
      {
        icon: 'nutrition-outline',
        title: 'Nutrition & Recipes',
        description: 'Build recipe templates with ingredient search, macro tracking, and per-client meal logs.',
        route: null,
        routeLabel: 'Client detail → Nutrition tab',
      },
      {
        icon: 'people-circle-outline',
        title: 'Family Account Linking',
        description: 'Link client accounts into a family group for shared workout tracking.',
        route: null,
        routeLabel: 'Client detail → Family tab',
      },
      {
        icon: 'qr-code-outline',
        title: 'QR Check-In Scanner',
        description: "Scan a client's QR code to instantly log a timestamped gym visit.",
        route: '/(tabs)/profile',
        routeLabel: 'Profile tab',
      },
    ],
  },
];

// ─── Client feature map ───────────────────────────────────────

const CLIENT_FEATURES: FeatureGroup[] = [
  {
    category: 'Progress',
    items: [
      {
        icon: 'trending-up-outline',
        title: 'Progress Dashboard',
        description: 'Total sessions, week streak, last workout summary, and your full chart history.',
        route: '/(client)/',
        routeLabel: 'Home',
      },
      {
        icon: 'bar-chart-outline',
        title: 'Progress Charts',
        description: 'Volume and exercise progress charts over any time range.',
        route: '/(client)/',
        routeLabel: 'Home → Progress tab',
      },
      {
        icon: 'trophy-outline',
        title: 'Personal Records',
        description: 'Your all-time best weight and reps per exercise tracked automatically.',
        route: '/(client)/',
        routeLabel: 'Home → Progress tab',
      },
      {
        icon: 'images-outline',
        title: 'Media Gallery',
        description: 'View progress photos uploaded by your trainer.',
        route: '/(client)/',
        routeLabel: 'Home → Media tab',
      },
      {
        icon: 'document-text-outline',
        title: 'Report Card',
        description: "View your trainer's formatted progress report.",
        route: '/(client)/',
        routeLabel: 'Home',
      },
    ],
  },
  {
    category: 'Workouts',
    items: [
      {
        icon: 'list-outline',
        title: 'Workout History',
        description: 'Browse all your logged training sessions with full set details.',
        route: '/(client)/workouts',
        routeLabel: 'Workouts tab',
      },
      {
        icon: 'clipboard-outline',
        title: 'Assigned Workouts',
        description: 'Trainer-assigned programs you can execute with one tap and full guidance.',
        route: '/(client)/workouts',
        routeLabel: 'Workouts tab',
      },
      {
        icon: 'add-circle-outline',
        title: 'Log Your Own Workout',
        description: 'Record a session yourself using the multi-exercise builder.',
        route: '/(client)/workout/log',
        routeLabel: 'Log Workout screen',
      },
    ],
  },
  {
    category: 'Scheduling',
    items: [
      {
        icon: 'calendar-outline',
        title: 'Book a Session',
        description: "Request a session from your trainer's available time slots using your credits.",
        route: '/(client)/workouts',
        routeLabel: 'Workouts → Schedule tab',
      },
      {
        icon: 'qr-code-outline',
        title: 'Check-In QR Code',
        description: 'Show your personal QR code to your trainer to log a gym visit.',
        route: '/(client)/profile',
        routeLabel: 'Profile tab',
      },
    ],
  },
  {
    category: 'Nutrition',
    items: [
      {
        icon: 'nutrition-outline',
        title: 'Food Logging & Macros',
        description: 'Log daily meals by searching 1M+ foods (USDA + Open Food Facts) and track macro goals.',
        route: '/(client)/nutrition',
        routeLabel: 'Nutrition tab',
      },
      {
        icon: 'restaurant-outline',
        title: 'Recipes',
        description: 'Access trainer-provided recipe templates with full macro breakdowns.',
        route: '/(client)/nutrition',
        routeLabel: 'Nutrition tab',
      },
    ],
  },
  {
    category: 'Community',
    items: [
      {
        icon: 'newspaper-outline',
        title: 'Community Feed',
        description: 'Post updates, react, comment, and attach exercises or workouts.',
        route: '/(client)/feed',
        routeLabel: 'Feed tab',
      },
      {
        icon: 'sparkles-outline',
        title: 'AI Fitness Trends',
        description: 'Daily AI-generated fitness trend summaries with article links.',
        route: '/(client)/feed',
        routeLabel: 'Feed → Trends tab',
      },
      {
        icon: 'chatbubble-outline',
        title: 'Messaging',
        description: 'Chat with your trainer and share workouts or exercises as attachments.',
        route: '/(client)/messages',
        routeLabel: 'Messages tab',
      },
      {
        icon: 'barbell-outline',
        title: 'Exercise Library',
        description: 'Browse exercises with form cues and tutorial videos.',
        route: '/(client)/exercises',
        routeLabel: 'Exercises tab',
      },
    ],
  },
  {
    category: 'Family',
    items: [
      {
        icon: 'people-circle-outline',
        title: 'Family Member Tracking',
        description: 'View and log workouts for linked family members from your home screen.',
        route: '/(client)/',
        routeLabel: 'Home',
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  role: 'trainer' | 'client';
  onClose: () => void;
};

// ─── Feature row ──────────────────────────────────────────────

function FeatureRow({
  item,
  onNavigate,
}: {
  item: FeatureItem;
  onNavigate: (route: string) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.featureRow, { borderBottomColor: t.border }]}>
      <View style={[styles.featureIcon, { backgroundColor: colors.primary + '1A' }]}>
        <Ionicons name={item.icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: t.textPrimary }]}>{item.title}</Text>
        <Text style={[styles.featureDesc, { color: t.textSecondary }]}>{item.description}</Text>
        {item.route ? (
          <TouchableOpacity
            style={[styles.routeChip, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '55' }]}
            onPress={() => onNavigate(item.route!)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward-circle-outline" size={13} color={colors.primary} />
            <Text style={[styles.routeLabel, { color: colors.primary }]}>{item.routeLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.routeChipGhost, { borderColor: t.border }]}>
            <Ionicons name="navigate-outline" size={13} color={t.textSecondary as string} />
            <Text style={[styles.routeLabel, { color: t.textSecondary }]}>{item.routeLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────

export function FeaturesModal({ visible, role, onClose }: Props) {
  const t = useTheme();
  const router = useRouter();
  const groups = role === 'trainer' ? TRAINER_FEATURES : CLIENT_FEATURES;

  function handleNavigate(route: string) {
    onClose();
    // Brief delay to let the modal close before navigating
    setTimeout(() => router.push(route as never), 200);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: t.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="compass-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Feature Guide</Text>
              <Text style={[styles.headerSub, { color: t.textSecondary }]}>
                {role === 'trainer' ? 'Trainer' : 'Client'} · {groups.reduce((n, g) => n + g.items.length, 0)} features
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={t.textPrimary as string} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Intro banner */}
          <View style={[styles.introBanner, { backgroundColor: colors.primary + '0F', borderColor: colors.primary + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={[styles.introBannerText, { color: colors.primary }]}>
              Gold buttons navigate directly to that feature. Grey labels show how to reach it manually.
            </Text>
          </View>

          {groups.map((group) => (
            <View key={group.category} style={styles.group}>
              <Text style={[styles.groupHeader, { color: t.textSecondary, borderBottomColor: t.border }]}>
                {group.category.toUpperCase()}
              </Text>
              {group.items.map((item) => (
                <FeatureRow key={item.title} item={item} onNavigate={handleNavigate} />
              ))}
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: t.textSecondary }]}>
              You can hide this guide from your Profile settings.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.heading3, fontWeight: '700' },
  headerSub: { ...typography.bodySmall, marginTop: 1 },

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  introBannerText: { ...typography.bodySmall, flex: 1, lineHeight: 18 },

  group: { marginBottom: spacing.lg },
  groupHeader: {
    ...typography.label,
    letterSpacing: 1,
    fontWeight: '700',
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },

  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  featureContent: { flex: 1, gap: 4 },
  featureTitle: { ...typography.body, fontWeight: '600' },
  featureDesc: { ...typography.bodySmall, lineHeight: 18 },

  routeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  routeChipGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  routeLabel: { ...typography.label, fontWeight: '600' },

  footer: { alignItems: 'center', paddingTop: spacing.md },
  footerText: { ...typography.bodySmall, textAlign: 'center' },
});
