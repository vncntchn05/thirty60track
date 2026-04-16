import { useState, lazy, Suspense, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClient, useClients } from '@/hooks/useClients';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useClientIntake } from '@/hooks/useClientIntake';
import { useAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { useClientCredits, useCreditTransactions, grantCredits } from '@/hooks/useCredits';
import { useSessionsForClient } from '@/hooks/useSchedule';
import { useClientLinks, addToFamilyGroup, removeFromFamilyGroup } from '@/hooks/useClientLinks';
import { useRecurringPlansForClient, cancelRecurringPlan, cancelRecurringInstance } from '@/hooks/useRecurringPlans';
import { WorkoutCalendar } from '@/components/workout/WorkoutCalendar';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, ClientWithStats, ClientIntake, WorkoutWithTrainer, UpdateClient, UpdateClientIntake, AssignedWorkoutWithDetails, CreditTransaction, RecurringPlan } from '@/types';
import type { LinkedClientEntry } from '@/hooks/useClientLinks';
import { MediaGallery } from '@/components/client/MediaGallery';
import ReportCardButton from '@/components/client/ReportCardButton';
import { NutritionTab } from '@/components/nutrition/NutritionTab';
import { useCheckins } from '@/hooks/useCheckins';
import type { ClientCheckin } from '@/types';

const ProgressSection = lazy(() => import('@/components/charts/ProgressSection'));

// ─── Helpers ──────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string as local midnight to avoid UTC offset shifting the day. */
function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours(); const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${period}`;
}

function parseOptionalFloat(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

function fmt(v: number | null, unit: string): string {
  return v != null ? `${v}${unit}` : '—';
}

type Tab      = 'progress' | 'workouts' | 'nutrition' | 'media' | 'credits' | 'family' | 'checkins';
type ViewMode = 'calendar' | 'list';
type Theme = ReturnType<typeof useTheme>;

// ─── Screen ───────────────────────────────────────────────────────

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const [workoutViewMode, setWorkoutViewMode] = useState<ViewMode>('calendar');
  type DayOption = { text: string; onPress: () => void };
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [dayOptionsTitle, setDayOptionsTitle] = useState('');

  const { trainer, role } = useAuth();
  // When role === 'client', this screen is being viewed by a linked family member
  const isLinkedClientViewer = role === 'client';

  const { client, loading: clientLoading, error: clientError, updateClient, deleteClient } = useClient(id);
  const { workouts, loading: workoutsLoading, error: workoutsError, refetch: refetchWorkouts } = useWorkouts(client?.id ?? '');
  const { intake, saveIntake } = useClientIntake(client?.id ?? '');
  const { assignedWorkouts, refetch: refetchAssigned } = useAssignedWorkoutsForClient(client?.id ?? '');
  const { balance, loading: creditsLoading, refetch: refetchCredits } = useClientCredits(client?.id ?? '');
  const { transactions, refetch: refetchTransactions } = useCreditTransactions(client?.id ?? '');
  const { sessions: clientSessions } = useSessionsForClient(client?.id ?? '', trainer?.id ?? '');
  const { links: familyLinks, loading: familyLoading, refetch: refetchFamily } = useClientLinks(isLinkedClientViewer ? '' : (client?.id ?? ''));
  const { clients: allClients } = useClients();
  const { plans: recurringPlans, refetch: refetchPlans } = useRecurringPlansForClient(isLinkedClientViewer ? '' : (client?.id ?? ''));
  const { checkins, loading: checkinsLoading, refetch: refetchCheckins } = useCheckins(client?.id ?? '');

  useFocusEffect(useCallback(() => { refetchWorkouts(); refetchAssigned(); }, [refetchWorkouts, refetchAssigned]));

  function handleCalendarDayPress(iso: string) {
    const dayWorkouts  = workouts.filter(w => w.performed_at.slice(0, 10) === iso);
    const dayAssigned  = assignedWorkouts.filter(a => a.status === 'assigned' && a.scheduled_date.slice(0, 10) === iso);
    const daySessions  = clientSessions.filter(s => s.status === 'confirmed' && toIso(new Date(s.scheduled_at)) === iso);

    const options: DayOption[] = [];

    dayWorkouts.forEach(w => options.push({
      text: `Logged workout`,
      onPress: () => router.push(`/workout/${w.id}` as never),
    }));
    dayAssigned.forEach(a => options.push({
      text: `Assigned: ${a.title ?? 'Workout'}`,
      onPress: () => router.push(`/workout/assigned/${a.id}` as never),
    }));
    daySessions.forEach(s => options.push({
      text: `Session at ${fmtTime(s.scheduled_at)}`,
      onPress: () => router.push(`/(tabs)/schedule?weekOf=${iso}` as never),
    }));

    if (options.length === 1) {
      options[0].onPress();
    } else if (options.length > 1) {
      setDayOptionsTitle(isoToLocal(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
      setDayOptions(options);
    }
  }

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function performDelete() {
    setIsDeleting(true);
    const { error } = await deleteClient();
    setIsDeleting(false);
    if (error) { setDeleteError(error); return; }
    router.back();
  }

  if (clientLoading) {
    return <View style={[styles.centered, { backgroundColor: t.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (clientError || !client) {
    return <View style={[styles.centered, { backgroundColor: t.background }]}><Text style={styles.errorText}>{clientError ?? 'Client not found.'}</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          title: client.full_name,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.canGoBack() ? router.back() : router.replace(isLinkedClientViewer ? '/(client)' : '/(tabs)' as never)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerBtn}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: isLinkedClientViewer ? undefined : () => (
            <TouchableOpacity onPress={() => { setConfirmingDelete(true); setDeleteError(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── Health warning banner ── */}
      {(intake?.current_injuries || intake?.chronic_conditions || intake?.allergies || intake?.dietary_restrictions) && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color={colors.error} style={styles.warningIcon} />
          <View style={styles.warningBody}>
            <Text style={styles.warningTitle}>Health Alert</Text>
            {intake.current_injuries ? (
              <Text style={styles.warningText}><Text style={styles.warningFieldLabel}>Injuries: </Text>{intake.current_injuries}</Text>
            ) : null}
            {intake.chronic_conditions ? (
              <Text style={styles.warningText}><Text style={styles.warningFieldLabel}>Conditions: </Text>{intake.chronic_conditions}</Text>
            ) : null}
            {intake.allergies ? (
              <Text style={styles.warningText}><Text style={styles.warningFieldLabel}>Allergies: </Text>{intake.allergies}</Text>
            ) : null}
            {intake.dietary_restrictions ? (
              <Text style={styles.warningText}><Text style={styles.warningFieldLabel}>Diet: </Text>{intake.dietary_restrictions}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Tab bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {(isLinkedClientViewer
          ? ['progress', 'workouts', 'nutrition', 'media', 'credits'] as Tab[]
          : ['progress', 'workouts', 'nutrition', 'media', 'credits', 'checkins', 'family'] as Tab[]
        ).map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === 'progress'  ? 'Progress'
            : tab === 'workouts'  ? 'Workouts'
            : tab === 'nutrition' ? 'Nutrition'
            : tab === 'credits'   ? 'Credits'
            : tab === 'checkins'  ? 'Check-ins'
            : tab === 'family'    ? 'Family'
            : 'Media';
          return (
            <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : t.textSecondary }]}>
                {label}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Progress tab ── */}
      {activeTab === 'progress' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <ClientInfoCard
            client={client}
            intake={intake}
            onUpdate={updateClient}
            onIntakeSave={(intakeData, clientData) => saveIntake(intakeData, clientData, false)}
            t={t}
          />
          <MetricsCard client={client} onUpdate={updateClient} t={t} />
          <ReportCardButton clientId={client.id} clientName={client.full_name} />
          <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} style={styles.progressLoader} />}>
            <ProgressSection clientId={client.id} />
          </Suspense>
        </ScrollView>
      )}

      {/* ── Workouts tab ── */}
      {activeTab === 'workouts' && (
        <View style={{ flex: 1 }}>
          {/* View toggle bar */}
          <View style={[styles.viewToggleBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
            <Text style={[styles.viewToggleLabel, { color: t.textSecondary }]}>
              {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={() => setWorkoutViewMode(v => v === 'calendar' ? 'list' : 'calendar')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={workoutViewMode === 'calendar' ? 'list-outline' : 'calendar-outline'}
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {workoutViewMode === 'calendar' ? (
            <WorkoutCalendar
              workouts={workouts as WorkoutWithTrainer[]}
              assignedWorkouts={assignedWorkouts}
              sessions={clientSessions}
              onDayPress={handleCalendarDayPress}
            />
          ) : (
            <FlatList
              data={workouts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.tabContent}
              renderItem={({ item }) => <WorkoutRow workout={item as WorkoutWithTrainer} clientName={client.full_name} t={t} />}
              ListHeaderComponent={
                <>
                  {workoutsLoading
                    ? <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: spacing.sm }} />
                    : workoutsError
                      ? <Text style={styles.errorText}>{workoutsError}</Text>
                      : null}

                  {/* Recurring series section — trainers only */}
                  {!isLinkedClientViewer && (
                    <RecurringSeriesSection
                      clientId={client.id}
                      plans={recurringPlans}
                      onRefresh={() => { refetchPlans(); refetchAssigned(); }}
                      t={t}
                      router={router}
                    />
                  )}

                  {/* Upcoming assigned workouts */}
                  {assignedWorkouts.filter((a) => a.status === 'assigned').map((item) => (
                    <UpcomingWorkoutRow
                      key={item.id}
                      item={item}
                      t={t}
                      onCancelRecurring={item.recurring_plan_id ? async () => {
                        const { error } = await cancelRecurringInstance(item.id);
                        if (error) Alert.alert('Error', error);
                        else refetchAssigned();
                      } : undefined}
                    />
                  ))}
                </>
              }
              ListEmptyComponent={
                !workoutsLoading && assignedWorkouts.filter((a) => a.status === 'assigned').length === 0
                  ? <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts logged yet.</Text>
                  : null
              }
            />
          )}
        </View>
      )}

      {/* ── Nutrition tab ── */}
      {activeTab === 'nutrition' && (
        <NutritionTab
          clientId={client.id}
          canEditGoal={!isLinkedClientViewer}
          client={client}
          intake={intake}
        />
      )}

      {/* ── Media tab ── */}
      {activeTab === 'media' && <MediaGallery clientId={client.id} />}

      {/* ── Credits tab ── */}
      {activeTab === 'credits' && (
        <CreditsTab
          clientId={client.id}
          trainerId={trainer?.id ?? ''}
          balance={balance}
          transactions={transactions}
          creditsLoading={creditsLoading}
          onRefresh={() => { refetchCredits(); refetchTransactions(); }}
          readOnly={isLinkedClientViewer}
          t={t}
        />
      )}

      {/* ── Check-ins tab (trainer only) ── */}
      {activeTab === 'checkins' && !isLinkedClientViewer && (
        <CheckinsTab
          checkins={checkins}
          loading={checkinsLoading}
          onRefresh={refetchCheckins}
          t={t}
        />
      )}

      {/* ── Family tab (trainer only) ── */}
      {activeTab === 'family' && !isLinkedClientViewer && (
        <FamilyTab
          clientId={client.id}
          trainerId={trainer?.id ?? ''}
          links={familyLinks}
          loading={familyLoading}
          allClients={allClients}
          onRefresh={refetchFamily}
          t={t}
        />
      )}

      {/* ── Delete confirmation bar (trainer only) ── */}
      {!isLinkedClientViewer && confirmingDelete && (
        <View style={[styles.deleteBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Text style={[styles.deleteBarText, { color: t.textPrimary }]} numberOfLines={2}>
            Delete {client.full_name} and all workout history?
          </Text>
          {deleteError ? <Text style={styles.deleteBarError}>{deleteError}</Text> : null}
          <View style={styles.deleteBarButtons}>
            <TouchableOpacity onPress={() => { setConfirmingDelete(false); setDeleteError(null); }} style={styles.deleteCancelBtn}>
              <Text style={[styles.deleteCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={performDelete} disabled={isDeleting} style={[styles.deleteConfirmBtn, isDeleting && styles.disabledBtn]}>
              {isDeleting
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.deleteConfirmText}>Delete</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── FAB (Log Workout — trainer only, progress/workouts tabs only) ── */}
      {!confirmingDelete && !isLinkedClientViewer && (activeTab === 'progress' || activeTab === 'workouts') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: '/workout/new', params: { clientId: client.id } } as never)}
          accessibilityLabel="Log workout"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Log Workout</Text>
        </TouchableOpacity>
      )}

      {/* ── Day picker modal (multiple items on same day) ── */}
      <Modal
        visible={dayOptions.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setDayOptions([])}
      >
        <Pressable style={styles.dayModalBackdrop} onPress={() => setDayOptions([])}>
          <Pressable style={[styles.dayModalSheet, { backgroundColor: t.surface }]} onPress={() => {}}>
            <Text style={[styles.dayModalTitle, { color: t.textPrimary }]}>{dayOptionsTitle}</Text>
            <Text style={[styles.dayModalSubtitle, { color: t.textSecondary }]}>Select an item:</Text>
            {dayOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.dayModalOption, { borderColor: t.border }]}
                onPress={() => { setDayOptions([]); opt.onPress(); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayModalOptionText, { color: t.textPrimary }]}>{opt.text}</Text>
                <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setDayOptions([])} style={styles.dayModalCancel}>
              <Text style={[styles.dayModalCancelText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Check-ins tab ────────────────────────────────────────────────

type CheckinsTabProps = {
  checkins: ClientCheckin[];
  loading: boolean;
  onRefresh: () => void;
  t: Theme;
};

function CheckinsTab({ checkins, loading, onRefresh, t }: CheckinsTabProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  function fmtCheckin(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <FlatList
      data={checkins}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      onRefresh={onRefresh}
      refreshing={loading}
      renderItem={({ item }) => (
        <View style={[styles.checkinRow, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={[styles.checkinDot, { backgroundColor: colors.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.checkinTime, { color: t.textPrimary }]}>{fmtCheckin(item.checked_in_at)}</Text>
            {item.note ? (
              <Text style={[styles.checkinNote, { color: t.textSecondary }]}>{item.note}</Text>
            ) : null}
          </View>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="qr-code-outline" size={44} color={t.textSecondary as string} />
          <Text style={[styles.emptyTitle, { color: t.textSecondary }]}>No check-ins yet</Text>
          <Text style={[styles.emptyBody, { color: t.textSecondary }]}>
            Ask the client to show their QR code from their Profile tab
          </Text>
        </View>
      }
    />
  );
}

// ─── Credits tab ──────────────────────────────────────────────────

type CreditsTabProps = {
  clientId: string;
  trainerId: string;
  balance: number;
  transactions: CreditTransaction[];
  creditsLoading: boolean;
  onRefresh: () => void;
  readOnly?: boolean;
  t: Theme;
};

function CreditsTab({ clientId, trainerId, balance, transactions, creditsLoading, onRefresh, readOnly = false, t }: CreditsTabProps) {
  const [grantAmount, setGrantAmount] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  async function handleGrant() {
    const amount = parseInt(grantAmount, 10);
    if (isNaN(amount) || amount === 0) { setGrantError('Enter a non-zero amount.'); return; }
    setGranting(true); setGrantError(null);
    const { error } = await grantCredits(clientId, trainerId, amount, grantNote.trim() || undefined);
    setGranting(false);
    if (error) { setGrantError(error); return; }
    setGrantAmount(''); setGrantNote('');
    onRefresh();
  }

  function reasonLabel(reason: string): string {
    if (reason === 'grant')          return 'Granted';
    if (reason === 'manual')         return 'Adjusted';
    if (reason === 'session_deduct') return 'Session';
    if (reason === 'session_refund') return 'Refund';
    return 'Manual';
  }

  const parsedAmount = parseInt(grantAmount, 10);

  return (
    <ScrollView contentContainerStyle={creditsStyles.container}>
      {/* Balance card */}
      <View style={[creditsStyles.balanceCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        {creditsLoading
          ? <ActivityIndicator color={colors.primary} />
          : <>
              <Text style={[creditsStyles.balanceLabel, { color: t.textSecondary }]}>Current Balance</Text>
              <Text style={[creditsStyles.balanceValue, { color: colors.primary }]}>{balance}</Text>
              <Text style={[creditsStyles.creditsWord, { color: t.textSecondary }]}>
                credit{balance !== 1 ? 's' : ''}
              </Text>
            </>
        }
      </View>

      {/* Adjust credits — hidden for linked-client viewers */}
      {!readOnly && <View style={[creditsStyles.grantCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[creditsStyles.sectionTitle, { color: t.textSecondary }]}>ADJUST CREDITS</Text>
        <View style={creditsStyles.grantRow}>
          <TextInput
            style={[creditsStyles.grantInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
            placeholder="Amount (− to deduct)"
            placeholderTextColor={t.textSecondary as string}
            keyboardType="numbers-and-punctuation"
            value={grantAmount}
            onChangeText={setGrantAmount}
          />
          <TextInput
            style={[creditsStyles.grantNoteInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
            placeholder="Note (optional)"
            placeholderTextColor={t.textSecondary as string}
            value={grantNote}
            onChangeText={setGrantNote}
          />
        </View>
        {grantError ? <Text style={creditsStyles.errText}>{grantError}</Text> : null}
        <TouchableOpacity style={creditsStyles.grantBtn} onPress={handleGrant} disabled={granting}>
          {granting
            ? <ActivityIndicator size="small" color={colors.textInverse} />
            : <Text style={creditsStyles.grantBtnText}>
                {!isNaN(parsedAmount) && parsedAmount < 0 ? 'Deduct Credits' : 'Grant Credits'}
              </Text>
          }
        </TouchableOpacity>
        <Text style={[creditsStyles.hint, { color: t.textSecondary }]}>
          Use a negative number (e.g. −2) to deduct · 30 min = 1 credit · 60 min = 2 credits
        </Text>
      </View>}

      {/* Transaction history */}
      <Text style={[creditsStyles.sectionTitle, { color: t.textSecondary, paddingHorizontal: spacing.md }]}>HISTORY</Text>
      {transactions.length === 0
        ? <Text style={[creditsStyles.emptyHint, { color: t.textSecondary }]}>No transactions yet.</Text>
        : transactions.map((tx) => (
            <View key={tx.id} style={[creditsStyles.txRow, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={creditsStyles.txLeft}>
                <Text style={[creditsStyles.txReason, { color: t.textPrimary }]}>{reasonLabel(tx.reason)}</Text>
                {tx.note ? <Text style={[creditsStyles.txNote, { color: t.textSecondary }]}>{tx.note}</Text> : null}
                <Text style={[creditsStyles.txDate, { color: t.textSecondary }]}>
                  {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={[creditsStyles.txAmount, { color: tx.amount > 0 ? colors.success : colors.error }]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </Text>
            </View>
          ))
      }
    </ScrollView>
  );
}

// ─── Family tab ───────────────────────────────────────────────────

type FamilyTabProps = {
  clientId: string;
  trainerId: string;
  links: LinkedClientEntry[];
  loading: boolean;
  allClients: ClientWithStats[];
  onRefresh: () => void;
  t: Theme;
};

function FamilyTab({ clientId, trainerId, links, loading, allClients, onRefresh, t }: FamilyTabProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const router = useRouter();

  // Clients not already linked and not the client themselves
  const linkedIds = new Set(links.map((l) => l.client.id));
  const available = allClients.filter((c) => c.id !== clientId && !linkedIds.has(c.id));

  async function handleLink(newMemberId: string) {
    setLinking(true); setLinkError(null);
    const { error } = await addToFamilyGroup(trainerId, clientId, newMemberId);
    setLinking(false);
    if (error) { setLinkError(error); return; }
    setPickerVisible(false);
    onRefresh();
  }

  async function handleUnlink(removedClientId: string) {
    const { error } = await removeFromFamilyGroup(removedClientId);
    if (error) { setLinkError(error); return; }
    onRefresh();
  }

  return (
    <ScrollView contentContainerStyle={familyStyles.container}>
      <Text style={[familyStyles.heading, { color: t.textSecondary }]}>LINKED FAMILY MEMBERS</Text>
      <Text style={[familyStyles.subText, { color: t.textSecondary }]}>
        Linked clients can view and edit each other's progress, workouts, and nutrition.
      </Text>

      {linkError ? <Text style={familyStyles.errText}>{linkError}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      ) : links.length === 0 ? (
        <Text style={[familyStyles.emptyText, { color: t.textSecondary }]}>No family members linked yet.</Text>
      ) : (
        links.map(({ link, client }) => (
          <View key={link.id} style={[familyStyles.linkRow, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TouchableOpacity
              style={familyStyles.linkLeft}
              onPress={() => router.push(`/client/${client.id}` as never)}
              activeOpacity={0.7}
            >
              <View style={[familyStyles.avatar, { backgroundColor: colors.primary + '33' }]}>
                <Text style={[familyStyles.avatarText, { color: colors.primary }]}>
                  {client.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[familyStyles.linkName, { color: t.textPrimary }]}>{client.full_name}</Text>
                {client.email ? (
                  <Text style={[familyStyles.linkEmail, { color: t.textSecondary }]}>{client.email}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleUnlink(client.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="unlink-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[familyStyles.addBtn, { borderColor: colors.primary }]}
        onPress={() => { setLinkError(null); setPickerVisible(true); }}
      >
        <Ionicons name="person-add-outline" size={16} color={colors.primary} />
        <Text style={[familyStyles.addBtnText, { color: colors.primary }]}>Link a Client</Text>
      </TouchableOpacity>

      {/* Client picker modal */}
      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={familyStyles.modalOverlay}>
          <View style={[familyStyles.modalSheet, { backgroundColor: t.surface }]}>
            <View style={familyStyles.modalHeader}>
              <Text style={[familyStyles.modalTitle, { color: t.textPrimary }]}>Link a client</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color={t.textSecondary} />
              </TouchableOpacity>
            </View>
            {linking && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.sm }} />}
            {available.length === 0 ? (
              <Text style={[familyStyles.emptyText, { color: t.textSecondary }]}>All your clients are already linked.</Text>
            ) : (
              <FlatList
                data={available}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[familyStyles.pickerRow, { borderBottomColor: t.border }]}
                    onPress={() => handleLink(item.id)}
                    disabled={linking}
                    activeOpacity={0.7}
                  >
                    <View style={[familyStyles.avatar, { backgroundColor: colors.primary + '22' }]}>
                      <Text style={[familyStyles.avatarText, { color: colors.primary }]}>
                        {item.full_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[familyStyles.linkName, { color: t.textPrimary }]}>{item.full_name}</Text>
                      {item.email ? (
                        <Text style={[familyStyles.linkEmail, { color: t.textSecondary }]}>{item.email}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const familyStyles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  heading: { ...typography.label, letterSpacing: 1 },
  subText: { ...typography.bodySmall, lineHeight: 18 },
  emptyText: { ...typography.body, textAlign: 'center', marginVertical: spacing.md },
  errText: { ...typography.bodySmall, color: colors.error },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...typography.body, fontWeight: '700' },
  linkName: { ...typography.body, fontWeight: '600' },
  linkEmail: { ...typography.bodySmall },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: { ...typography.body, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.md, maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.heading3 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

const creditsStyles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  balanceCard: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.lg,
    alignItems: 'center', gap: spacing.xs,
  },
  balanceLabel: { ...typography.label },
  balanceValue: { fontSize: 56, fontWeight: '700', lineHeight: 64 },
  creditsWord: { ...typography.body },
  grantCard: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  sectionTitle: { ...typography.label, letterSpacing: 1 },
  grantRow: { flexDirection: 'row', gap: spacing.sm },
  grantInput: {
    width: 80, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    ...typography.body,
  },
  grantNoteInput: {
    flex: 1, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    ...typography.body,
  },
  grantBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    padding: spacing.sm, alignItems: 'center',
  },
  grantBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  hint: { ...typography.bodySmall, textAlign: 'center' },
  errText: { ...typography.bodySmall, color: colors.error },
  emptyHint: { ...typography.bodySmall, textAlign: 'center', paddingVertical: spacing.md },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: radius.sm, borderWidth: 1, padding: spacing.sm,
    marginHorizontal: spacing.md,
  },
  txLeft: { flex: 1, gap: 2 },
  txReason: { ...typography.body, fontWeight: '600' },
  txNote: { ...typography.bodySmall },
  txDate: { ...typography.bodySmall },
  txAmount: { ...typography.body, fontWeight: '700', minWidth: 40, textAlign: 'right' },
});

// ─── Client info card (view + inline edit, includes intake fields) ─

type GenderValue = 'male' | 'female' | 'other' | '';
type InfoForm = {
  // clients table
  full_name: string; email: string; phone: string; date_of_birth: string; gender: GenderValue; notes: string;
  // client_intake table
  address: string; emergency_name: string; emergency_phone: string; emergency_relation: string;
  occupation: string; current_injuries: string; past_injuries: string;
  chronic_conditions: string; medications: string;
  activity_level: string; goals: string; goal_timeframe: string;
  // Migration 034: health restrictions & training volume
  allergies: string; dietary_restrictions: string;
  training_frequency_per_week: string; typical_session_length_minutes: string;
  outside_gym_activity_level: string;
};

function infoFormFrom(c: Client, i: ClientIntake | null): InfoForm {
  return {
    full_name: c.full_name, email: c.email ?? '', phone: c.phone ?? '',
    date_of_birth: c.date_of_birth ?? '', gender: c.gender ?? '', notes: c.notes ?? '',
    address: i?.address ?? '', emergency_name: i?.emergency_name ?? '',
    emergency_phone: i?.emergency_phone ?? '', emergency_relation: i?.emergency_relation ?? '',
    occupation: i?.occupation ?? '', current_injuries: i?.current_injuries ?? '',
    past_injuries: i?.past_injuries ?? '', chronic_conditions: i?.chronic_conditions ?? '',
    medications: i?.medications ?? '', activity_level: i?.activity_level ?? '',
    goals: i?.goals ?? '', goal_timeframe: i?.goal_timeframe ?? '',
    allergies: i?.allergies ?? '', dietary_restrictions: i?.dietary_restrictions ?? '',
    training_frequency_per_week: i?.training_frequency_per_week != null ? String(i.training_frequency_per_week) : '',
    typical_session_length_minutes: i?.typical_session_length_minutes != null ? String(i.typical_session_length_minutes) : '',
    outside_gym_activity_level: i?.outside_gym_activity_level ?? '',
  };
}

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary', light: 'Lightly Active', moderate: 'Moderate',
  active: 'Active', very_active: 'Very Active',
};

type ClientInfoCardProps = {
  client: Client;
  intake: ClientIntake | null;
  onUpdate: (p: UpdateClient) => Promise<{ error: string | null }>;
  onIntakeSave: (intakeData: UpdateClientIntake, clientData: UpdateClient) => Promise<{ error: string | null }>;
  t: Theme;
};

function ClientInfoCard({ client, intake, onUpdate, onIntakeSave, t }: ClientInfoCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InfoForm>(() => infoFormFrom(client, intake));

  function startEdit() { setForm(infoFormFrom(client, intake)); setEditing(true); }
  function set(key: keyof InfoForm, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSave() {
    if (!form.full_name.trim()) { Alert.alert('Name required', 'Full name cannot be empty.'); return; }
    setSaving(true);
    const parseIntOrNull = (v: string) => { const n = parseInt(v, 10); return v.trim() !== '' && !isNaN(n) ? n : null; };
    const { error } = await onIntakeSave(
      {
        address: form.address.trim() || null,
        emergency_name: form.emergency_name.trim() || null,
        emergency_phone: form.emergency_phone.trim() || null,
        emergency_relation: form.emergency_relation.trim() || null,
        occupation: form.occupation.trim() || null,
        current_injuries: form.current_injuries.trim() || null,
        past_injuries: form.past_injuries.trim() || null,
        chronic_conditions: form.chronic_conditions.trim() || null,
        medications: form.medications.trim() || null,
        activity_level: (form.activity_level || null) as UpdateClientIntake['activity_level'],
        goals: form.goals.trim() || null,
        goal_timeframe: form.goal_timeframe.trim() || null,
        allergies: form.allergies.trim() || null,
        dietary_restrictions: form.dietary_restrictions.trim() || null,
        training_frequency_per_week: parseIntOrNull(form.training_frequency_per_week),
        typical_session_length_minutes: parseIntOrNull(form.typical_session_length_minutes),
        outside_gym_activity_level: (form.outside_gym_activity_level || null) as UpdateClientIntake['outside_gym_activity_level'],
      },
      {
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth.trim() || null,
        gender: (form.gender || null) as Client['gender'],
        notes: form.notes.trim() || null,
      },
    );
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  // ── Edit mode ──────────────────────────────────────────────────
  if (editing) {
    const textRow = (label: string, field: keyof InfoForm, cap: 'none'|'words'|'sentences' = 'sentences', kb: 'default'|'email-address'|'phone-pad' = 'default') => (
      <View key={field} style={[styles.infoEditRow, { borderBottomColor: t.border }]}>
        <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>{label}</Text>
        <TextInput
          style={[styles.infoEditInput, { color: t.textPrimary }]}
          value={form[field]}
          onChangeText={(v) => set(field, v)}
          autoCapitalize={cap}
          keyboardType={kb}
          placeholder="—"
          placeholderTextColor={t.textSecondary}
        />
      </View>
    );
    const multiRow = (label: string, field: keyof InfoForm) => (
      <View key={field} style={[styles.infoEditNotesRow, { borderBottomColor: t.border, borderBottomWidth: 1 }]}>
        <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>{label}</Text>
        <TextInput
          style={[styles.infoEditNotesInput, { color: t.textPrimary }]}
          value={form[field]}
          onChangeText={(v) => set(field, v)}
          placeholder="—"
          placeholderTextColor={t.textSecondary}
          multiline
          textAlignVertical="top"
        />
      </View>
    );
    const sectionLabel = (title: string) => (
      <Text key={title} style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>{title}</Text>
    );

    return (
      <View style={[styles.infoCard, styles.infoCardEdit, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Client Info</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveSmallBtn, saving && styles.disabledBtn]}>
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {sectionLabel('Personal')}
        {textRow('Full name *', 'full_name', 'words')}
        {textRow('Email', 'email', 'none', 'email-address')}
        {textRow('Phone', 'phone', 'none', 'phone-pad')}
        {textRow('Date of birth', 'date_of_birth', 'none')}
        <View style={[styles.infoEditRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>Gender</Text>
          <View style={styles.genderPicker}>
            {(['male', 'female', 'other'] as const).map((g) => {
              const selected = form.gender === g;
              return (
                <Pressable key={g} style={[styles.genderOption, { borderColor: colors.primary }, selected && styles.genderOptionSelected]}
                  onPress={() => set('gender', selected ? '' : g)}>
                  <Text style={[styles.genderOptionText, { color: colors.primary }, selected && styles.genderOptionTextSelected]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {textRow('Address', 'address', 'words')}
        {multiRow('Notes', 'notes')}

        {sectionLabel('Emergency Contact')}
        {textRow('Name', 'emergency_name', 'words')}
        {textRow('Phone', 'emergency_phone', 'none', 'phone-pad')}
        {textRow('Relationship', 'emergency_relation', 'words')}

        {sectionLabel('Occupation & Lifestyle')}
        {textRow('Occupation', 'occupation', 'words')}
        <View style={[styles.infoEditRow, { borderBottomColor: t.border, flexWrap: 'wrap', height: 'auto' as never }]}>
          <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>Activity level</Text>
          <View style={styles.activityPicker}>
            {(['sedentary','light','moderate','active','very_active'] as const).map((v) => {
              const sel = form.activity_level === v;
              return (
                <Pressable key={v} style={[styles.activityChip, { borderColor: t.border }, sel && styles.activityChipSel]}
                  onPress={() => set('activity_level', sel ? '' : v)}>
                  <Text style={[styles.activityChipText, { color: t.textSecondary }, sel && styles.activityChipTextSel]}>
                    {ACTIVITY_LABELS[v]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {multiRow('Goals', 'goals')}
        {textRow('Timeframe', 'goal_timeframe', 'sentences')}

        {sectionLabel('Health History')}
        {multiRow('Current injuries', 'current_injuries')}
        {multiRow('Past injuries / surgery', 'past_injuries')}
        {multiRow('Chronic conditions', 'chronic_conditions')}
        {multiRow('Medications', 'medications')}

        {sectionLabel('Health Restrictions')}
        {multiRow('Allergies', 'allergies')}
        {multiRow('Dietary restrictions', 'dietary_restrictions')}

        {sectionLabel('Training Volume')}
        {textRow('Sessions per week', 'training_frequency_per_week', 'none', 'number-pad' as never)}
        {textRow('Session length (min)', 'typical_session_length_minutes', 'none', 'number-pad' as never)}
        <View style={[styles.infoEditRow, { borderBottomColor: t.border, flexWrap: 'wrap', height: 'auto' as never }]}>
          <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>Outside gym</Text>
          <View style={styles.activityPicker}>
            {(['sedentary','light','moderate','active','very_active'] as const).map((v) => {
              const sel = form.outside_gym_activity_level === v;
              return (
                <Pressable key={v} style={[styles.activityChip, { borderColor: t.border }, sel && styles.activityChipSel]}
                  onPress={() => set('outside_gym_activity_level', sel ? '' : v)}>
                  <Text style={[styles.activityChipText, { color: t.textSecondary }, sel && styles.activityChipTextSel]}>
                    {ACTIVITY_LABELS[v]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ── View mode ──────────────────────────────────────────────────
  const initials = client.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const viewRow = (label: string, value: string | null | undefined) =>
    value ? (
      <View key={label} style={[styles.infoViewRow, { borderBottomColor: t.border }]}>
        <Text style={[styles.infoViewLabel, { color: t.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoViewValue, { color: t.textPrimary }]}>{value}</Text>
      </View>
    ) : null;

  return (
    <View style={[styles.infoCard, styles.infoCardEdit, { backgroundColor: t.surface, borderColor: t.border }]}>
      {/* Header row: avatar + name + pencil */}
      <View style={styles.infoViewHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <Text style={[styles.clientName, { color: t.textPrimary, flex: 1 }]}>{client.full_name}</Text>
        <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Personal */}
      {viewRow('Email', client.email)}
      {viewRow('Phone', client.phone)}
      {viewRow('Date of birth', client.date_of_birth ? isoToLocal(client.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null)}
      {viewRow('Gender', client.gender ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1) : null)}
      {viewRow('Address', intake?.address)}
      {viewRow('Notes', client.notes)}

      {/* Emergency contact */}
      {(intake?.emergency_name || intake?.emergency_phone) ? (
        <>
          <Text style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>Emergency Contact</Text>
          {viewRow('Name', intake?.emergency_name)}
          {viewRow('Phone', intake?.emergency_phone)}
          {viewRow('Relationship', intake?.emergency_relation)}
        </>
      ) : null}

      {/* Occupation & fitness */}
      {(intake?.occupation || intake?.activity_level || intake?.goals) ? (
        <>
          <Text style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>Occupation & Fitness</Text>
          {viewRow('Occupation', intake?.occupation)}
          {viewRow('Activity level', intake?.activity_level ? ACTIVITY_LABELS[intake.activity_level] : null)}
          {viewRow('Goals', intake?.goals)}
          {viewRow('Timeframe', intake?.goal_timeframe)}
        </>
      ) : null}

      {/* Health */}
      {(intake?.current_injuries || intake?.past_injuries || intake?.chronic_conditions || intake?.medications) ? (
        <>
          <Text style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>Health History</Text>
          {viewRow('Current injuries', intake?.current_injuries)}
          {viewRow('Past injuries', intake?.past_injuries)}
          {viewRow('Chronic conditions', intake?.chronic_conditions)}
          {viewRow('Medications', intake?.medications)}
        </>
      ) : null}

      {/* Health Restrictions (M034) */}
      {(intake?.allergies || intake?.dietary_restrictions) ? (
        <>
          <Text style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>Health Restrictions</Text>
          {viewRow('Allergies', intake?.allergies)}
          {viewRow('Dietary restrictions', intake?.dietary_restrictions)}
        </>
      ) : null}

      {/* Training Volume (M034) */}
      {(intake?.training_frequency_per_week != null || intake?.typical_session_length_minutes != null || intake?.outside_gym_activity_level) ? (
        <>
          <Text style={[styles.infoSectionLabel, { color: t.textSecondary, borderBottomColor: t.border }]}>Training Volume</Text>
          {viewRow('Sessions per week', intake?.training_frequency_per_week != null ? `${intake.training_frequency_per_week}× / week` : null)}
          {viewRow('Session length', intake?.typical_session_length_minutes != null ? `${intake.typical_session_length_minutes} min` : null)}
          {viewRow('Outside gym', intake?.outside_gym_activity_level ? ACTIVITY_LABELS[intake.outside_gym_activity_level] : null)}
        </>
      ) : null}
    </View>
  );
}

// ─── Body metrics card ────────────────────────────────────────────

type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'in';
type MetricsForm = { weight: string; height: string; bf_percent: string; lean_body_mass: string };

function kgToLbs(kg: number): number { return Math.round(kg * 2.20462 * 10) / 10; }
function lbsToKg(lbs: number): number { return Math.round(lbs / 2.20462 * 10) / 10; }
function cmToIn(cm: number): number { return Math.round(cm / 2.54 * 10) / 10; }
function inToCm(inches: number): number { return Math.round(inches * 2.54 * 10) / 10; }

function formFromClient(c: Client, wu: WeightUnit, hu: HeightUnit): MetricsForm {
  const w = c.weight_kg != null ? (wu === 'lbs' ? kgToLbs(c.weight_kg) : c.weight_kg) : null;
  const h = c.height_cm != null ? (hu === 'in' ? cmToIn(c.height_cm) : c.height_cm) : null;
  const lbm = c.lean_body_mass != null ? (wu === 'lbs' ? kgToLbs(c.lean_body_mass) : c.lean_body_mass) : null;
  return {
    weight: w != null ? String(w) : '',
    height: h != null ? String(h) : '',
    bf_percent: c.bf_percent != null ? String(c.bf_percent) : '',
    lean_body_mass: lbm != null ? String(lbm) : '',
  };
}

function MetricsCard({ client, onUpdate, t }: { client: Client; onUpdate: (p: UpdateClient) => Promise<{ error: string | null }>; t: Theme }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [form, setForm] = useState<MetricsForm>(() => formFromClient(client, 'kg', 'cm'));

  function startEdit() { setForm(formFromClient(client, weightUnit, heightUnit)); setEditing(true); }

  function toggleWeightUnit() {
    setWeightUnit((prev) => {
      const next = prev === 'kg' ? 'lbs' : 'kg';
      const nW = parseOptionalFloat(form.weight);
      const nL = parseOptionalFloat(form.lean_body_mass);
      setForm((f) => ({
        ...f,
        weight: nW != null ? String(next === 'lbs' ? kgToLbs(nW) : lbsToKg(nW)) : f.weight,
        lean_body_mass: nL != null ? String(next === 'lbs' ? kgToLbs(nL) : lbsToKg(nL)) : f.lean_body_mass,
      }));
      return next;
    });
  }

  function toggleHeightUnit() {
    setHeightUnit((prev) => {
      const next = prev === 'cm' ? 'in' : 'cm';
      const nH = parseOptionalFloat(form.height);
      setForm((f) => ({
        ...f,
        height: nH != null ? String(next === 'in' ? cmToIn(nH) : inToCm(nH)) : f.height,
      }));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const rawW = parseOptionalFloat(form.weight);
    const rawH = parseOptionalFloat(form.height);
    const rawL = parseOptionalFloat(form.lean_body_mass);
    const { error } = await onUpdate({
      weight_kg: rawW != null ? (weightUnit === 'lbs' ? lbsToKg(rawW) : rawW) : null,
      height_cm: rawH != null ? (heightUnit === 'in' ? inToCm(rawH) : rawH) : null,
      bf_percent: parseOptionalFloat(form.bf_percent),
      lean_body_mass: rawL != null ? (weightUnit === 'lbs' ? lbsToKg(rawL) : rawL) : null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  // Display values in selected units
  const displayWeight = client.weight_kg != null
    ? (weightUnit === 'lbs' ? kgToLbs(client.weight_kg) : client.weight_kg)
    : null;
  const displayHeight = client.height_cm != null
    ? (heightUnit === 'in' ? cmToIn(client.height_cm) : client.height_cm)
    : null;
  const displayLbm = client.lean_body_mass != null
    ? (weightUnit === 'lbs' ? kgToLbs(client.lean_body_mass) : client.lean_body_mass)
    : null;

  const hasMetrics = client.weight_kg != null || client.height_cm != null || client.bf_percent != null || client.lean_body_mass != null;

  if (editing) {
    return (
      <View style={[styles.metricsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body Metrics</Text>
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveSmallBtn, saving && styles.disabledBtn]}>
              {saving ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Text style={styles.saveSmallBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.metricRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>{`Weight (${weightUnit})`}</Text>
          <TextInput
            style={[styles.metricInput, { color: t.textPrimary }]}
            value={form.weight}
            onChangeText={(v) => setForm((f) => ({ ...f, weight: v }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
          <MetricUnitToggle value={weightUnit} options={['kg', 'lbs']} onToggle={toggleWeightUnit} t={t} />
        </View>
        <View style={[styles.metricRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>{`Height (${heightUnit})`}</Text>
          <TextInput
            style={[styles.metricInput, { color: t.textPrimary }]}
            value={form.height}
            onChangeText={(v) => setForm((f) => ({ ...f, height: v }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
          <MetricUnitToggle value={heightUnit} options={['cm', 'in']} onToggle={toggleHeightUnit} t={t} />
        </View>
        <View style={[styles.metricRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>Body fat (%)</Text>
          <TextInput
            style={[styles.metricInput, { color: t.textPrimary }]}
            value={form.bf_percent}
            onChangeText={(v) => setForm((f) => ({ ...f, bf_percent: v }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
        </View>
        <View style={[styles.metricRow, { borderBottomColor: t.border }]}>
          <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>{`Lean mass (${weightUnit})`}</Text>
          <TextInput
            style={[styles.metricInput, { color: t.textPrimary }]}
            value={form.lean_body_mass}
            onChangeText={(v) => setForm((f) => ({ ...f, lean_body_mass: v }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={t.textSecondary}
          />
        </View>
        {client.bmi != null ? (
          <View style={styles.metricRow}>
            <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>BMI (auto-calculated)</Text>
            <Text style={[styles.bmiReadOnly, { color: t.textSecondary }]}>{client.bmi.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.metricsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardLabel, { color: t.textSecondary }]}>Body Metrics</Text>
        <View style={styles.metricsCardHeaderRight}>
          <TouchableOpacity onPress={() => { setWeightUnit((u) => u === 'kg' ? 'lbs' : 'kg'); }} style={[styles.unitPill, { borderColor: t.border }]}>
            <Text style={[styles.unitPillText, { color: colors.primary }]}>{weightUnit}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setHeightUnit((u) => u === 'cm' ? 'in' : 'cm'); }} style={[styles.unitPill, { borderColor: t.border }]}>
            <Text style={[styles.unitPillText, { color: colors.primary }]}>{heightUnit}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {hasMetrics ? (
        <>
          <View style={styles.metricsGrid}>
            {[
              ['Weight', displayWeight != null ? `${displayWeight} ${weightUnit}` : '—'],
              ['Height', displayHeight != null ? `${displayHeight} ${heightUnit}` : '—'],
              ['BMI', fmt(client.bmi, '')],
              ['Body fat', fmt(client.bf_percent, '%')],
            ].map(([label, value]) => (
              <View key={label} style={[styles.metricChip, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.metricChipValue, { color: t.textPrimary }]}>{value}</Text>
                <Text style={[styles.metricChipLabel, { color: t.textSecondary }]}>{label}</Text>
              </View>
            ))}
          </View>
          {client.lean_body_mass != null ? (
            <View style={[styles.leanMassRow, { borderTopColor: t.border }]}>
              <Text style={[styles.leanMassLabel, { color: t.textSecondary }]}>Lean body mass</Text>
              <Text style={[styles.leanMassValue, { color: t.textPrimary }]}>{displayLbm} {weightUnit}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <TouchableOpacity onPress={startEdit}>
          <Text style={[styles.emptyMetricsText, { color: t.textSecondary }]}>No metrics recorded — tap to add</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MetricUnitToggle({ value, options, onToggle, t }: { value: string; options: [string, string]; onToggle: () => void; t: Theme }) {
  return (
    <TouchableOpacity onPress={onToggle} style={[styles.metricUnitToggle, { borderColor: t.border }]}>
      {options.map((opt) => (
        <Text key={opt} style={[styles.metricUnitOption, { color: opt === value ? colors.primary : t.textSecondary }]}>
          {opt}
        </Text>
      ))}
    </TouchableOpacity>
  );
}

// ─── Upcoming assigned workout row (green outline, shown in Workouts tab) ────

function UpcomingWorkoutRow({
  item,
  t,
  onCancelRecurring,
}: {
  item: AssignedWorkoutWithDetails;
  t: Theme;
  onCancelRecurring?: () => void;
}) {
  const router = useRouter();
  const [y, m, d] = item.scheduled_date.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const exerciseCount = item.exercises.length;
  const isRecurring = !!item.recurring_plan_id;

  return (
    <TouchableOpacity
      style={[styles.row, styles.upcomingRow, { backgroundColor: t.surface }]}
      onPress={() => router.push(`/workout/assigned/${item.id}` as never)}
    >
      <View style={styles.rowMain}>
        <View style={styles.upcomingBadgeRow}>
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
          </View>
          {isRecurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={10} color={colors.primary} />
              <Text style={[styles.recurringBadgeText, { color: colors.primary }]}>RECURRING</Text>
            </View>
          )}
          <Text style={[styles.dateText, { color: t.textPrimary }]}>
            {item.title ?? 'Untitled Workout'}
          </Text>
        </View>
        <Text style={[styles.trainerText, { color: t.textSecondary }]}>{dateStr}</Text>
        {exerciseCount > 0 && (
          <Text style={[styles.rowMetricText, { color: t.textSecondary }]}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
      <View style={styles.upcomingRowRight}>
        {isRecurring && onCancelRecurring && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onCancelRecurring(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.cancelInstanceBtn}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Recurring series section ─────────────────────────────────

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function RecurringSeriesSection({
  clientId,
  plans,
  onRefresh,
  t,
  router,
}: {
  clientId: string;
  plans: RecurringPlan[];
  onRefresh: () => void;
  t: Theme;
  router: ReturnType<typeof useRouter>;
}) {
  const today = new Date().toISOString().split('T')[0];

  async function handleCancelSeries(plan: RecurringPlan) {
    Alert.alert(
      'Cancel recurring series',
      `Cancel all remaining "${plan.title}" sessions? Past and completed sessions will not be affected.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Series',
          style: 'destructive',
          onPress: async () => {
            const { error } = await cancelRecurringPlan(plan.id);
            if (error) Alert.alert('Error', error);
            else onRefresh();
          },
        },
      ],
    );
  }

  return (
    <View style={recurStyles.container}>
      <View style={recurStyles.header}>
        <Text style={[recurStyles.heading, { color: t.textSecondary }]}>RECURRING SERIES</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/workout/recurring/new', params: { clientId } } as never)}
          style={recurStyles.newBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[recurStyles.newBtnText, { color: colors.primary }]}>New</Text>
        </TouchableOpacity>
      </View>

      {plans.length === 0 ? (
        <Text style={[recurStyles.emptyText, { color: t.textSecondary }]}>
          No recurring series. Tap + New to create one.
        </Text>
      ) : (
        plans.map((plan) => {
          const dayLabels = [...plan.days_of_week]
            .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
            .map((d) => DOW_NAMES[d])
            .join(', ');
          const isActive = plan.end_date >= today;

          return (
            <View key={plan.id} style={[recurStyles.planRow, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={recurStyles.planInfo}>
                <View style={recurStyles.planTitleRow}>
                  <Ionicons name="repeat" size={14} color={colors.primary} style={{ marginTop: 1 }} />
                  <Text style={[recurStyles.planTitle, { color: t.textPrimary }]}>{plan.title}</Text>
                  {!isActive && (
                    <View style={recurStyles.endedBadge}>
                      <Text style={recurStyles.endedBadgeText}>ENDED</Text>
                    </View>
                  )}
                </View>
                <Text style={[recurStyles.planSub, { color: t.textSecondary }]}>
                  {plan.frequency === 'weekly' ? 'Weekly' : 'Biweekly'} · {dayLabels}
                </Text>
                <Text style={[recurStyles.planSub, { color: t.textSecondary }]}>
                  {plan.start_date} → {plan.end_date === '9999-12-31' ? 'No end date' : plan.end_date}
                </Text>
              </View>
              {isActive && (
                <TouchableOpacity
                  onPress={() => handleCancelSeries(plan)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={recurStyles.cancelBtn}
                >
                  <Text style={[recurStyles.cancelBtnText, { color: colors.error }]}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const recurStyles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heading: { ...typography.label, letterSpacing: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  newBtnText: { ...typography.bodySmall, fontWeight: '600' },
  emptyText: { ...typography.bodySmall, marginBottom: spacing.sm },
  planRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.md, borderWidth: 1, padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  planInfo: { flex: 1, gap: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  planTitle: { ...typography.body, fontWeight: '600', flex: 1 },
  planSub: { ...typography.bodySmall },
  endedBadge: {
    backgroundColor: '#55555533', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  endedBadgeText: { ...typography.label, fontSize: 9, color: '#888' },
  cancelBtn: { paddingLeft: spacing.sm },
  cancelBtnText: { ...typography.bodySmall, fontWeight: '600' },
});

// ─── Workout row ──────────────────────────────────────────────────

function WorkoutRow({ workout, clientName, t }: { workout: WorkoutWithTrainer; clientName: string; t: Theme }) {
  const router = useRouter();
  const date = isoToLocal(workout.performed_at).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const metricParts = [
    workout.body_weight_kg != null ? `${workout.body_weight_kg} kg` : null,
    workout.body_fat_percent != null ? `${workout.body_fat_percent}% BF` : null,
  ].filter(Boolean).join(' · ');

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
      onPress={() => router.push(`/workout/${workout.id}` as never)}
    >
      <View style={styles.rowMain}>
        <Text style={[styles.dateText, { color: t.textPrimary }]}>{date}</Text>
        {workout.logged_by_role === 'trainer'
          ? <Text style={[styles.trainerText, { color: t.textSecondary }]}>Logged by {workout.trainer?.full_name ?? 'trainer'}</Text>
          : <Text style={[styles.trainerText, { color: t.textSecondary }]}>Logged by {clientName}</Text>}
        {workout.notes ? <Text style={[styles.notesText, { color: t.textSecondary }]} numberOfLines={1}>{workout.notes}</Text> : null}
        {metricParts ? <Text style={[styles.rowMetricText, { color: t.textSecondary }]}>{metricParts}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Tab bar ──
  tabBar: {
    borderBottomWidth: 1,
    flexShrink: 0,
    flexGrow: 0,
    zIndex: 2,
    height: 44,
  },
  tabBarContent: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  tabLabel: { ...typography.body, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: spacing.lg, right: spacing.lg,
    height: 2, borderRadius: 1, backgroundColor: colors.primary,
  },

  // ── Check-ins tab ──
  checkinRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md,
  },
  checkinDot: {
    width: 8, height: 8, borderRadius: 4, flexShrink: 0,
  },
  checkinTime: { ...typography.body, fontWeight: '600' },
  checkinNote: { ...typography.bodySmall, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.heading3 },
  emptyBody: { ...typography.bodySmall, textAlign: 'center' },

  // ── Shared tab content ──
  tabContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl + 56 },
  viewToggleBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  viewToggleLabel: { ...typography.bodySmall },

  // ── Info card ──
  infoCard: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
  },
  infoCardEdit: { flexDirection: 'column', gap: 0 },
  avatar: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { ...typography.heading3, color: colors.textInverse },
  infoDetails: { flex: 1, gap: 2 },
  clientName: { ...typography.heading3 },
  clientMeta: { ...typography.bodySmall },
  clientNotes: { ...typography.bodySmall, marginTop: 2, fontStyle: 'italic' },

  // ── Inline info edit ──
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cancelBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  cancelBtnText: { ...typography.body },
  saveSmallBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minWidth: 56, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  saveSmallBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  infoEditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, borderBottomWidth: 1, gap: spacing.md },
  infoEditNotesRow: { flexDirection: 'column', paddingVertical: spacing.sm, gap: spacing.xs, alignSelf: 'stretch' },
  infoEditLabel: { ...typography.bodySmall, width: 110 },
  infoEditInput: { ...typography.body, flex: 1, paddingVertical: spacing.xs },
  infoEditNotesInput: { ...typography.body, width: '100%', minHeight: 80, paddingVertical: spacing.xs },
  genderPicker: { flexDirection: 'row', gap: spacing.xs, flex: 1, justifyContent: 'flex-end' },
  genderOption: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, borderWidth: 1 },
  genderOptionSelected: { backgroundColor: colors.primary },
  genderOptionText: { ...typography.bodySmall },
  genderOptionTextSelected: { color: colors.textInverse, fontWeight: '600' },

  // ── Metrics card ──
  metricsCard: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: spacing.sm },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metricChip: { flex: 1, minWidth: '45%', borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center', borderWidth: 1, gap: 2 },
  metricChipValue: { ...typography.heading3 },
  metricChipLabel: { ...typography.bodySmall },
  leanMassRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1 },
  leanMassLabel: { ...typography.bodySmall },
  leanMassValue: { ...typography.body, fontWeight: '600' },
  emptyMetricsText: { ...typography.bodySmall, fontStyle: 'italic' },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1 },
  metricRowLabel: { ...typography.body, flex: 1 },
  metricInput: { ...typography.body, width: 90, textAlign: 'right', paddingVertical: spacing.xs },
  bmiReadOnly: { ...typography.body, fontStyle: 'italic' },
  metricsCardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitPill: { borderWidth: 1, borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: 8 },
  unitPillText: { ...typography.bodySmall, fontWeight: '600' },
  metricUnitToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.full, overflow: 'hidden', marginLeft: spacing.xs },
  metricUnitOption: { ...typography.bodySmall, paddingVertical: 2, paddingHorizontal: 6, fontWeight: '600' },

  // ── Progress ──
  progressLoader: { marginVertical: spacing.md },

  // ── Workouts tab ──
  row: { borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  upcomingRow: { borderColor: colors.success, borderLeftWidth: 3 },
  upcomingBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  upcomingBadge: {
    backgroundColor: `${colors.success}22`,
    paddingHorizontal: spacing.xs, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  upcomingBadgeText: { ...typography.label, color: colors.success, letterSpacing: 0.5 },
  recurringBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: `${colors.primary}22`,
    paddingHorizontal: spacing.xs, paddingVertical: 2,
    borderRadius: radius.sm,
  },
  recurringBadgeText: { ...typography.label, fontSize: 9, letterSpacing: 0.5 },
  upcomingRowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cancelInstanceBtn: {},
  rowMain: { flex: 1, gap: 2 },
  dateText: { ...typography.body, fontWeight: '600' },
  trainerText: { ...typography.bodySmall, fontStyle: 'italic' },
  notesText: { ...typography.bodySmall },
  rowMetricText: { ...typography.bodySmall },

  // ── Header buttons ──
  headerBtn: { marginRight: spacing.sm },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  // ── Intake card ──
  intakeCard: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: 0 },
  intakePending: { ...typography.bodySmall, fontStyle: 'italic', paddingVertical: spacing.xs },
  intakeRow: {
    flexDirection: 'row', paddingVertical: spacing.sm,
    borderBottomWidth: 1, gap: spacing.md,
  },
  intakeLabel: { ...typography.bodySmall, width: 130, flexShrink: 0 },
  intakeValue: { ...typography.bodySmall, flex: 1 },

  // ── Health warning banner ──
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FECACA',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs,
    zIndex: 1,
  },
  warningIcon: { marginTop: 1 },
  warningBody: { flex: 1, gap: 2 },
  warningTitle: { ...typography.label, color: colors.error, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  warningText: { ...typography.bodySmall, color: '#991B1B' },
  warningFieldLabel: { fontWeight: '700' },

  // ── Info view mode ──
  infoViewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.sm },
  infoViewRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, gap: spacing.md },
  infoViewLabel: { ...typography.bodySmall, width: 130, flexShrink: 0 },
  infoViewValue: { ...typography.bodySmall, flex: 1, fontWeight: '600' },
  infoSectionLabel: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5,
    paddingTop: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1,
  },

  // ── Activity level picker ──
  activityPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, flex: 1, justifyContent: 'flex-end' },
  activityChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full, borderWidth: 1 },
  activityChipSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityChipText: { ...typography.bodySmall },
  activityChipTextSel: { color: colors.textInverse, fontWeight: '600' },

  // ── Assigned workout cards ──
  assignedCard: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: spacing.xs,
  },
  assignedCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  assignedCardTitle: { flex: 1, gap: 2 },
  assignedTitle: { ...typography.body, fontWeight: '600' },
  assignedDate: { ...typography.bodySmall },
  statusBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  statusBadgeText: { ...typography.label, fontWeight: '700' },

  // ── Misc ──
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  errorText: { ...typography.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabLabel: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── Day picker modal ──
  dayModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  dayModalSheet: {
    width: 300, borderRadius: 16,
    padding: spacing.md, gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  },
  dayModalTitle: { ...typography.heading3, fontWeight: '700' },
  dayModalSubtitle: { ...typography.bodySmall },
  dayModalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
  dayModalOptionText: { ...typography.body, fontWeight: '600', flex: 1 },
  dayModalCancel: { alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.xs },
  dayModalCancelText: { ...typography.body },

  // ── Delete confirmation bar ──
  deleteBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  deleteBarText: { ...typography.body },
  deleteBarError: { ...typography.bodySmall, color: colors.error },
  deleteBarButtons: { flexDirection: 'row', gap: spacing.sm },
  deleteCancelBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  deleteCancelText: { ...typography.body },
  deleteConfirmBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.error },
  deleteConfirmText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
