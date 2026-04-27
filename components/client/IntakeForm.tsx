import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Client, ClientIntake, ActivityLevel, UpdateClientIntake } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

type IntakeFields = {
  // From clients table
  full_name: string;
  date_of_birth: string;
  phone: string;
  // From client_intake table
  address: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relation: string;
  occupation: string;
  current_injuries: string;
  past_injuries: string;
  chronic_conditions: string;
  medications: string;
  activity_level: ActivityLevel | '';
  goals: string;
  goal_timeframe: string;
  // M034 — health restrictions + training volume
  allergies: string;
  dietary_restrictions: string;
  training_frequency_per_week: string;
  typical_session_length_minutes: string;
  outside_gym_activity_level: ActivityLevel | '';
};

type ClientFields = { full_name: string; date_of_birth: string | null; phone: string | null };

type Props = {
  client: Client;
  intake: ClientIntake | null;
  /** Called after a successful save. In first-time mode, also marks intake complete. */
  onSave: (
    intakeData: UpdateClientIntake,
    clientData: ClientFields,
    markComplete: boolean,
  ) => Promise<{ error: string | null }>;
  onCancel?: () => void;
  /** When true the submit button says "Submit" and marks intake complete. */
  isFirstTime?: boolean;
};

// ─── Activity level options ───────────────────────────────────────

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary',  label: 'Sedentary' },
  { value: 'light',      label: 'Light' },
  { value: 'moderate',   label: 'Moderate' },
  { value: 'active',     label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

// ─── Helpers ──────────────────────────────────────────────────────

function buildInitialFields(client: Client, intake: ClientIntake | null): IntakeFields {
  return {
    full_name:          client.full_name,
    date_of_birth:      client.date_of_birth ?? '',
    phone:              client.phone ?? '',
    address:            intake?.address ?? '',
    emergency_name:     intake?.emergency_name ?? '',
    emergency_phone:    intake?.emergency_phone ?? '',
    emergency_relation: intake?.emergency_relation ?? '',
    occupation:         intake?.occupation ?? '',
    current_injuries:   intake?.current_injuries ?? '',
    past_injuries:      intake?.past_injuries ?? '',
    chronic_conditions: intake?.chronic_conditions ?? '',
    medications:        intake?.medications ?? '',
    activity_level:     intake?.activity_level ?? '',
    goals:              intake?.goals ?? '',
    goal_timeframe:     intake?.goal_timeframe ?? '',
    allergies:                      intake?.allergies ?? '',
    dietary_restrictions:           intake?.dietary_restrictions ?? '',
    training_frequency_per_week:    intake?.training_frequency_per_week != null ? String(intake.training_frequency_per_week) : '',
    typical_session_length_minutes: intake?.typical_session_length_minutes != null ? String(intake.typical_session_length_minutes) : '',
    outside_gym_activity_level:     intake?.outside_gym_activity_level ?? '',
  };
}

// ─── Sub-components ───────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  const t = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: t.textSecondary, borderBottomColor: t.border }]}>
      {title}
    </Text>
  );
}

function Field({
  label, value, onChange, placeholder, multiline, keyboardType, autoCapitalize, error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  error?: string | null;
}) {
  const t = useTheme();
  return (
    <View style={[styles.field, { borderBottomColor: t.border }]}>
      <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: t.textPrimary }, multiline && styles.fieldInputMulti, !!error && { color: colors.error }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? '—'}
        placeholderTextColor={t.textSecondary as string}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function IntakeForm({ client, intake, onSave, onCancel, isFirstTime = false }: Props) {
  const t = useTheme();
  const [fields, setFields] = useState<IntakeFields>(() => buildInitialFields(client, intake));
  const [saving, setSaving] = useState(false);
  const [dobError, setDobError] = useState<string | null>(null);

  function set(key: keyof IntakeFields, value: string) {
    if (key === 'date_of_birth') setDobError(null);
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!fields.full_name.trim()) {
      Alert.alert('Required', 'Full name is required.');
      return;
    }
    if (fields.date_of_birth.trim() && !ISO_DATE_RE.test(fields.date_of_birth.trim())) {
      setDobError('Use YYYY-MM-DD format (e.g. 1990-06-15)');
      return;
    }
    setSaving(true);
    const parseIntOrNull = (v: string): number | null => {
      const n = parseInt(v.trim(), 10);
      return v.trim() !== '' && !isNaN(n) && n > 0 ? n : null;
    };

    const intakeData: UpdateClientIntake = {
      address:            fields.address.trim() || null,
      emergency_name:     fields.emergency_name.trim() || null,
      emergency_phone:    fields.emergency_phone.trim() || null,
      emergency_relation: fields.emergency_relation.trim() || null,
      occupation:         fields.occupation.trim() || null,
      current_injuries:   fields.current_injuries.trim() || null,
      past_injuries:      fields.past_injuries.trim() || null,
      chronic_conditions: fields.chronic_conditions.trim() || null,
      medications:        fields.medications.trim() || null,
      activity_level:     (fields.activity_level || null) as ActivityLevel | null,
      goals:              fields.goals.trim() || null,
      goal_timeframe:     fields.goal_timeframe.trim() || null,
      // M034
      allergies:                      fields.allergies.trim() || null,
      dietary_restrictions:           fields.dietary_restrictions.trim() || null,
      training_frequency_per_week:    parseIntOrNull(fields.training_frequency_per_week),
      typical_session_length_minutes: parseIntOrNull(fields.typical_session_length_minutes),
      outside_gym_activity_level:     (fields.outside_gym_activity_level || null) as ActivityLevel | null,
    };
    const clientData: ClientFields = {
      full_name:     fields.full_name.trim(),
      date_of_birth: fields.date_of_birth.trim() || null,
      phone:         fields.phone.trim() || null,
    };
    const { error } = await onSave(intakeData, clientData, isFirstTime);
    setSaving(false);
    if (error) Alert.alert('Error', error);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {isFirstTime && (
        <View style={[styles.banner, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: t.textPrimary }]}>Welcome! Let's get started</Text>
            <Text style={[styles.bannerSub, { color: t.textSecondary }]}>
              Please complete this one-time intake form. Your trainer uses this to personalise your programme.
            </Text>
          </View>
        </View>
      )}

      {/* ── Personal ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Personal Information" />
        <Field label="Full name *"    value={fields.full_name}    onChange={(v) => set('full_name', v)}    autoCapitalize="words" />
        <Field label="Date of birth"  value={fields.date_of_birth} onChange={(v) => set('date_of_birth', v)} placeholder="YYYY-MM-DD" autoCapitalize="none" error={dobError} />
        <Field label="Phone"          value={fields.phone}         onChange={(v) => set('phone', v)}         keyboardType="phone-pad" autoCapitalize="none" />
        <Field label="Address"        value={fields.address}       onChange={(v) => set('address', v)}       multiline />
      </View>

      {/* ── Emergency contact ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Emergency Contact" />
        <Field label="Name"         value={fields.emergency_name}     onChange={(v) => set('emergency_name', v)}     autoCapitalize="words" />
        <Field label="Phone"        value={fields.emergency_phone}    onChange={(v) => set('emergency_phone', v)}    keyboardType="phone-pad" autoCapitalize="none" />
        <Field label="Relationship" value={fields.emergency_relation} onChange={(v) => set('emergency_relation', v)} autoCapitalize="words" placeholder="e.g. Spouse, Parent" />
      </View>

      {/* ── Occupation ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Occupation" />
        <Field label="Job / role" value={fields.occupation} onChange={(v) => set('occupation', v)} autoCapitalize="words" />
      </View>

      {/* ── Health history ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Health History" />
        <Field label="Current injuries"       value={fields.current_injuries}   onChange={(v) => set('current_injuries', v)}   multiline placeholder="Describe any current pain or injuries" />
        <Field label="Past injuries / surgery" value={fields.past_injuries}      onChange={(v) => set('past_injuries', v)}      multiline placeholder="Include dates if possible" />
        <Field label="Chronic conditions"      value={fields.chronic_conditions} onChange={(v) => set('chronic_conditions', v)} multiline placeholder="e.g. Asthma, Diabetes, Hypertension" />
        <Field label="Medications"             value={fields.medications}        onChange={(v) => set('medications', v)}        multiline placeholder="List any regular medications" />
      </View>

      {/* ── Fitness ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Fitness" />

        <Text style={[styles.fieldLabel, { color: t.textSecondary, marginBottom: spacing.xs, paddingHorizontal: spacing.sm }]}>
          Current activity level
        </Text>
        <View style={styles.activityRow}>
          {ACTIVITY_LEVELS.map(({ value, label }) => {
            const selected = fields.activity_level === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.activityChip, { borderColor: t.border }, selected && styles.activityChipSelected]}
                onPress={() => set('activity_level', selected ? '' : value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.activityChipText, { color: t.textSecondary }, selected && styles.activityChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Field label="Goals"     value={fields.goals}          onChange={(v) => set('goals', v)}          multiline placeholder="What do you want to achieve?" />
        <Field label="Timeframe" value={fields.goal_timeframe} onChange={(v) => set('goal_timeframe', v)} placeholder="e.g. 3 months, 1 year" />
      </View>

      {/* ── Health Restrictions (M034) ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Health Restrictions" />
        <Field label="Allergies"             value={fields.allergies}             onChange={(v) => set('allergies', v)}             multiline placeholder="e.g. peanuts, shellfish" />
        <Field label="Dietary restrictions"  value={fields.dietary_restrictions}  onChange={(v) => set('dietary_restrictions', v)}  multiline placeholder="e.g. no gluten, lactose intolerant" />
      </View>

      {/* ── Training Volume (M034) ── */}
      <View style={[styles.section, { backgroundColor: t.surface, borderColor: t.border }]}>
        <SectionHeader title="Training Volume" />
        <Field label="Sessions / week"    value={fields.training_frequency_per_week}    onChange={(v) => set('training_frequency_per_week', v)}    keyboardType="number-pad" placeholder="e.g. 4" />
        <Field label="Session length (min)" value={fields.typical_session_length_minutes} onChange={(v) => set('typical_session_length_minutes', v)} keyboardType="number-pad" placeholder="e.g. 60" />

        <Text style={[styles.fieldLabel, { color: t.textSecondary, marginBottom: spacing.xs, paddingHorizontal: spacing.sm, marginTop: spacing.sm }]}>
          Outside gym activity
        </Text>
        <View style={styles.activityRow}>
          {ACTIVITY_LEVELS.map(({ value, label }) => {
            const selected = fields.outside_gym_activity_level === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.activityChip, { borderColor: t.border }, selected && styles.activityChipSelected]}
                onPress={() => set('outside_gym_activity_level', selected ? '' : value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.activityChipText, { color: t.textSecondary }, selected && styles.activityChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: t.border }]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.disabledBtn, onCancel ? { flex: 1 } : styles.submitBtnFull]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.submitBtnText}>{isFirstTime ? 'Submit' : 'Save Changes'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm, padding: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  bannerTitle: { ...typography.body, fontWeight: '700', marginBottom: 2 },
  bannerSub:   { ...typography.bodySmall },

  section: {
    borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },

  field: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
  },
  fieldLabel: { ...typography.label, marginBottom: 2 },
  fieldInput: { ...typography.body, paddingVertical: spacing.xs },
  fieldInputMulti: { minHeight: 72, paddingTop: spacing.xs },
  fieldError: { ...typography.bodySmall, color: colors.error, marginTop: 2 },

  activityRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.xs, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm,
  },
  activityChip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  activityChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityChipText: { ...typography.label },
  activityChipTextSelected: { color: colors.textInverse },

  actions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  cancelBtnText: { ...typography.body, fontWeight: '600' },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitBtnFull: { flex: 1 },
  submitBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  disabledBtn: { opacity: 0.6 },
});
