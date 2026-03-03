import { useState, lazy, Suspense, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClient } from '@/hooks/useClients';
import { useWorkouts } from '@/hooks/useWorkouts';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, WorkoutWithTrainer, UpdateClient } from '@/types';

const ProgressSection = lazy(() => import('@/components/charts/ProgressSection'));

// ─── Helpers ──────────────────────────────────────────────────────

function parseOptionalFloat(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

function fmt(v: number | null, unit: string): string {
  return v != null ? `${v}${unit}` : '—';
}

type Tab = 'progress' | 'workouts';
type Theme = ReturnType<typeof useTheme>;

// ─── Screen ───────────────────────────────────────────────────────

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('progress');

  const { client, loading: clientLoading, error: clientError, updateClient, deleteClient } = useClient(id);
  const { workouts, loading: workoutsLoading, error: workoutsError, refetch: refetchWorkouts } = useWorkouts(id);

  useFocusEffect(useCallback(() => { refetchWorkouts(); }, [refetchWorkouts]));

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
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => { setConfirmingDelete(true); setDeleteError(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['progress', 'workouts'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : t.textSecondary }]}>
                {tab === 'progress' ? 'Progress' : `Workouts${workouts.length ? ` (${workouts.length})` : ''}`}
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── Progress tab ── */}
      {activeTab === 'progress' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          <ClientInfoCard client={client} onUpdate={updateClient} t={t} />
          <MetricsCard client={client} onUpdate={updateClient} t={t} />
          <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} style={styles.progressLoader} />}>
            <ProgressSection clientId={id} />
          </Suspense>
        </ScrollView>
      )}

      {/* ── Workouts tab ── */}
      {activeTab === 'workouts' && (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabContent}
          renderItem={({ item }) => <WorkoutRow workout={item as WorkoutWithTrainer} t={t} />}
          ListHeaderComponent={
            workoutsLoading
              ? <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: spacing.sm }} />
              : workoutsError
                ? <Text style={styles.errorText}>{workoutsError}</Text>
                : null
          }
          ListEmptyComponent={
            !workoutsLoading
              ? <Text style={[styles.emptyText, { color: t.textSecondary }]}>No workouts logged yet.</Text>
              : null
          }
        />
      )}

      {/* ── Delete confirmation bar ── */}
      {confirmingDelete && (
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

      {/* ── FAB ── */}
      {!confirmingDelete && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: '/workout/new', params: { clientId: id } } as never)}
          accessibilityLabel="Log workout"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Log Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Client info card (view + inline edit) ────────────────────────

type InfoForm = { full_name: string; email: string; phone: string; date_of_birth: string; notes: string };

function infoFormFromClient(c: Client): InfoForm {
  return {
    full_name: c.full_name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    date_of_birth: c.date_of_birth ?? '',
    notes: c.notes ?? '',
  };
}

function ClientInfoCard({ client, onUpdate, t }: { client: Client; onUpdate: (p: UpdateClient) => Promise<{ error: string | null }>; t: Theme }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InfoForm>(() => infoFormFromClient(client));

  function startEdit() { setForm(infoFormFromClient(client)); setEditing(true); }

  async function handleSave() {
    if (!form.full_name.trim()) { Alert.alert('Name required', "Full name cannot be empty."); return; }
    setSaving(true);
    const { error } = await onUpdate({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      date_of_birth: form.date_of_birth.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

  const initials = client.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (editing) {
    return (
      <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
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
        {([ ['Full name *', 'full_name', 'words', 'default'],
             ['Email', 'email', 'none', 'email-address'],
             ['Phone', 'phone', 'none', 'phone-pad'],
             ['Date of birth', 'date_of_birth', 'none', 'default'],
        ] as const).map(([label, field, cap, kb]) => (
          <View key={field} style={[styles.infoEditRow, { borderBottomColor: t.border }]}>
            <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>{label}</Text>
            <TextInput
              style={[styles.infoEditInput, { color: t.textPrimary }]}
              value={form[field]}
              onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
              autoCapitalize={cap}
              keyboardType={kb as never}
              placeholder="—"
              placeholderTextColor={t.textSecondary}
            />
          </View>
        ))}
        <View style={styles.infoEditRow}>
          <Text style={[styles.infoEditLabel, { color: t.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.infoEditInput, { color: t.textPrimary }]}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="—"
            placeholderTextColor={t.textSecondary}
            multiline
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.infoDetails}>
        <Text style={[styles.clientName, { color: t.textPrimary }]}>{client.full_name}</Text>
        {client.email ? <Text style={[styles.clientMeta, { color: t.textSecondary }]}>{client.email}</Text> : null}
        {client.phone ? <Text style={[styles.clientMeta, { color: t.textSecondary }]}>{client.phone}</Text> : null}
        {client.date_of_birth ? (
          <Text style={[styles.clientMeta, { color: t.textSecondary }]}>
            Born {new Date(client.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        ) : null}
        {client.notes ? <Text style={[styles.clientNotes, { color: t.textSecondary }]} numberOfLines={2}>{client.notes}</Text> : null}
      </View>
      <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="pencil" size={16} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Body metrics card ────────────────────────────────────────────

type MetricsForm = { weight_kg: string; height_cm: string; bf_percent: string; lean_body_mass: string };

function formFromClient(c: Client): MetricsForm {
  return {
    weight_kg: c.weight_kg != null ? String(c.weight_kg) : '',
    height_cm: c.height_cm != null ? String(c.height_cm) : '',
    bf_percent: c.bf_percent != null ? String(c.bf_percent) : '',
    lean_body_mass: c.lean_body_mass != null ? String(c.lean_body_mass) : '',
  };
}

function MetricsCard({ client, onUpdate, t }: { client: Client; onUpdate: (p: UpdateClient) => Promise<{ error: string | null }>; t: Theme }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MetricsForm>(() => formFromClient(client));

  function startEdit() { setForm(formFromClient(client)); setEditing(true); }

  async function handleSave() {
    setSaving(true);
    const { error } = await onUpdate({
      weight_kg: parseOptionalFloat(form.weight_kg),
      height_cm: parseOptionalFloat(form.height_cm),
      bf_percent: parseOptionalFloat(form.bf_percent),
      lean_body_mass: parseOptionalFloat(form.lean_body_mass),
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else setEditing(false);
  }

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
        {([['Weight (kg)', 'weight_kg'], ['Height (cm)', 'height_cm'], ['Body fat (%)', 'bf_percent'], ['Lean mass (kg)', 'lean_body_mass']] as const).map(([label, field]) => (
          <View key={field} style={[styles.metricRow, { borderBottomColor: t.border }]}>
            <Text style={[styles.metricRowLabel, { color: t.textPrimary }]}>{label}</Text>
            <TextInput
              style={[styles.metricInput, { color: t.textPrimary }]}
              value={form[field]}
              onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={t.textSecondary}
            />
          </View>
        ))}
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
        <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="pencil" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {hasMetrics ? (
        <>
          <View style={styles.metricsGrid}>
            {[['Weight', fmt(client.weight_kg, ' kg')], ['Height', fmt(client.height_cm, ' cm')], ['BMI', fmt(client.bmi, '')], ['Body fat', fmt(client.bf_percent, '%')]].map(([label, value]) => (
              <View key={label} style={[styles.metricChip, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.metricChipValue, { color: t.textPrimary }]}>{value}</Text>
                <Text style={[styles.metricChipLabel, { color: t.textSecondary }]}>{label}</Text>
              </View>
            ))}
          </View>
          {client.lean_body_mass != null ? (
            <View style={[styles.leanMassRow, { borderTopColor: t.border }]}>
              <Text style={[styles.leanMassLabel, { color: t.textSecondary }]}>Lean body mass</Text>
              <Text style={[styles.leanMassValue, { color: t.textPrimary }]}>{client.lean_body_mass} kg</Text>
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

// ─── Workout row ──────────────────────────────────────────────────

function WorkoutRow({ workout, t }: { workout: WorkoutWithTrainer; t: Theme }) {
  const router = useRouter();
  const date = new Date(workout.performed_at).toLocaleDateString('en-US', {
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
        {workout.trainer?.full_name ? <Text style={[styles.trainerText, { color: t.textSecondary }]}>Logged by {workout.trainer.full_name}</Text> : null}
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
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  tabLabel: { ...typography.body, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: spacing.lg, right: spacing.lg,
    height: 2, borderRadius: 1, backgroundColor: colors.primary,
  },

  // ── Shared tab content ──
  tabContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl + 56 },

  // ── Info card ──
  infoCard: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
  },
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
  infoEditLabel: { ...typography.bodySmall, width: 110 },
  infoEditInput: { ...typography.body, flex: 1, paddingVertical: spacing.xs },

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
  metricInput: { ...typography.body, width: 110, textAlign: 'right', paddingVertical: spacing.xs },
  bmiReadOnly: { ...typography.body, fontStyle: 'italic' },

  // ── Progress ──
  progressLoader: { marginVertical: spacing.md },

  // ── Workouts tab ──
  row: { borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1 },
  rowMain: { flex: 1, gap: 2 },
  dateText: { ...typography.body, fontWeight: '600' },
  trainerText: { ...typography.bodySmall, fontStyle: 'italic' },
  notesText: { ...typography.bodySmall },
  rowMetricText: { ...typography.bodySmall },

  // ── Header buttons ──
  headerBtn: { marginRight: spacing.sm },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

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
  disabledBtn: { opacity: 0.6 },
});
