import { useState, lazy, Suspense, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClient } from '@/hooks/useClients';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useClientIntake } from '@/hooks/useClientIntake';
import { useAssignedWorkoutsForClient } from '@/hooks/useAssignedWorkouts';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, ClientIntake, WorkoutWithTrainer, UpdateClient, UpdateClientIntake, AssignedWorkoutWithDetails } from '@/types';
import { MediaGallery } from '@/components/client/MediaGallery';

const ProgressSection = lazy(() => import('@/components/charts/ProgressSection'));

// ─── Helpers ──────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string as local midnight to avoid UTC offset shifting the day. */
function isoToLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseOptionalFloat(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

function fmt(v: number | null, unit: string): string {
  return v != null ? `${v}${unit}` : '—';
}

type Tab = 'progress' | 'workouts' | 'media';
type Theme = ReturnType<typeof useTheme>;

// ─── Screen ───────────────────────────────────────────────────────

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('progress');

  const { client, loading: clientLoading, error: clientError, updateClient, deleteClient } = useClient(id);
  const { workouts, loading: workoutsLoading, error: workoutsError, refetch: refetchWorkouts } = useWorkouts(client?.id ?? '');
  const { intake, saveIntake } = useClientIntake(client?.id ?? '');
  const { assignedWorkouts, refetch: refetchAssigned } = useAssignedWorkoutsForClient(client?.id ?? '');

  useFocusEffect(useCallback(() => { refetchWorkouts(); refetchAssigned(); }, [refetchWorkouts, refetchAssigned]));

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

      {/* ── Health warning banner ── */}
      {(intake?.current_injuries || intake?.chronic_conditions) && (
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
          </View>
        </View>
      )}

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        {(['progress', 'workouts', 'media'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === 'progress' ? 'Progress'
            : tab === 'workouts' ? `Workouts${workouts.length ? ` (${workouts.length})` : ''}`
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
      </View>

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
          <Suspense fallback={<ActivityIndicator size="small" color={colors.primary} style={styles.progressLoader} />}>
            <ProgressSection clientId={client.id} />
          </Suspense>
        </ScrollView>
      )}

      {/* ── Workouts tab ── */}
      {activeTab === 'workouts' && (
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
              {/* Pending assigned workouts shown at the top with green outline */}
              {assignedWorkouts.filter((a) => a.status === 'assigned').map((item) => (
                <UpcomingWorkoutRow
                  key={item.id}
                  item={item}
                  t={t}
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

      {/* ── Media tab ── */}
      {activeTab === 'media' && <MediaGallery clientId={client.id} />}

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

      {/* ── FAB (Log Workout — hidden on media tab) ── */}
      {!confirmingDelete && activeTab !== 'media' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: '/workout/new', params: { clientId: client.id } } as never)}
          accessibilityLabel="Log workout"
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={styles.fabLabel}>Log Workout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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

// ─── Upcoming assigned workout row (green outline, shown in Workouts tab) ────

function UpcomingWorkoutRow({ item, t }: { item: AssignedWorkoutWithDetails; t: Theme }) {
  const router = useRouter();
  const [y, m, d] = item.scheduled_date.split('-').map(Number);
  const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const exerciseCount = item.exercises.length;

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
      <Ionicons name="chevron-forward" size={18} color={t.textSecondary} />
    </TouchableOpacity>
  );
}

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
  metricInput: { ...typography.body, width: 110, textAlign: 'right', paddingVertical: spacing.xs },
  bmiReadOnly: { ...typography.body, fontStyle: 'italic' },

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
