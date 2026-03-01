import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClients } from '@/hooks/useClients';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type FormState = {
  full_name: string; email: string; phone: string; date_of_birth: string;
  notes: string; weight_kg: string; height_cm: string; bf_percent: string; lean_body_mass: string;
};

const EMPTY: FormState = {
  full_name: '', email: '', phone: '', date_of_birth: '',
  notes: '', weight_kg: '', height_cm: '', bf_percent: '', lean_body_mass: '',
};

function parseFloat_(v: string): number | null {
  const n = parseFloat(v);
  return v.trim() !== '' && !isNaN(n) ? n : null;
}

export default function NewClientScreen() {
  const router = useRouter();
  const t = useTheme();
  const { addClient } = useClients();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.full_name.trim()) { Alert.alert('Name required', "Please enter the client's full name."); return; }
    setSaving(true);
    const { error } = await addClient({
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      date_of_birth: form.date_of_birth.trim() || null,
      notes: form.notes.trim() || null,
      weight_kg: parseFloat_(form.weight_kg),
      height_cm: parseFloat_(form.height_cm),
      bf_percent: parseFloat_(form.bf_percent),
      lean_body_mass: parseFloat_(form.lean_body_mass),
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else router.back();
  }

  const cardStyle = [styles.card, { backgroundColor: t.surface, borderColor: t.border }];

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          title: 'New Client',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Basic Info</Text>
        <View style={cardStyle}>
          <Field label="Full name *" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="Jane Smith"
              placeholderTextColor={t.textSecondary} value={form.full_name}
              onChangeText={(v) => set('full_name', v)} autoCapitalize="words" />
          </Field>
          <Divider t={t} />
          <Field label="Email" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="jane@example.com"
              placeholderTextColor={t.textSecondary} value={form.email}
              onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Divider t={t} />
          <Field label="Phone" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="+1 555 000 0000"
              placeholderTextColor={t.textSecondary} value={form.phone}
              onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
          </Field>
          <Divider t={t} />
          <Field label="Date of birth" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="YYYY-MM-DD"
              placeholderTextColor={t.textSecondary} value={form.date_of_birth}
              onChangeText={(v) => set('date_of_birth', v)} />
          </Field>
        </View>

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Body Metrics</Text>
        <View style={cardStyle}>
          <Field label="Weight (kg)" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="70.0"
              placeholderTextColor={t.textSecondary} value={form.weight_kg}
              onChangeText={(v) => set('weight_kg', v)} keyboardType="decimal-pad" />
          </Field>
          <Divider t={t} />
          <Field label="Height (cm)" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="175.0"
              placeholderTextColor={t.textSecondary} value={form.height_cm}
              onChangeText={(v) => set('height_cm', v)} keyboardType="decimal-pad" />
          </Field>
          <Divider t={t} />
          <Field label="Body fat (%)" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="18.5"
              placeholderTextColor={t.textSecondary} value={form.bf_percent}
              onChangeText={(v) => set('bf_percent', v)} keyboardType="decimal-pad" />
          </Field>
          <Divider t={t} />
          <Field label="Lean body mass (kg)" t={t}>
            <TextInput style={[styles.input, { color: t.textPrimary }]} placeholder="57.2"
              placeholderTextColor={t.textSecondary} value={form.lean_body_mass}
              onChangeText={(v) => set('lean_body_mass', v)} keyboardType="decimal-pad" />
          </Field>
          <Divider t={t} />
          <View style={styles.bmiNote}>
            <Text style={[styles.bmiNoteText, { color: t.textSecondary }]}>
              BMI is calculated automatically from weight and height.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Notes</Text>
        <View style={cardStyle}>
          <TextInput
            style={[styles.notesInput, { color: t.textPrimary }]}
            placeholder="Goals, injuries, preferences…"
            placeholderTextColor={t.textSecondary}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveBtnText}>Add Client</Text>}
      </TouchableOpacity>
    </View>
  );
}

type Theme = ReturnType<typeof useTheme>;
function Field({ label, children, t }: { label: string; children: React.ReactNode; t: Theme }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.textPrimary }]}>{label}</Text>
      {children}
    </View>
  );
}
function Divider({ t }: { t: Theme }) {
  return <View style={[styles.divider, { backgroundColor: t.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginRight: spacing.sm },
  scroll: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  sectionLabel: {
    ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: spacing.sm, marginBottom: spacing.xs, paddingHorizontal: spacing.xs,
  },
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, minHeight: 48, gap: spacing.md },
  fieldLabel: { ...typography.body, width: 148 },
  input: { ...typography.body, flex: 1, paddingVertical: spacing.sm },
  divider: { height: 1, marginLeft: spacing.md },
  bmiNote: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bmiNoteText: { ...typography.bodySmall, fontStyle: 'italic' },
  notesInput: { ...typography.body, padding: spacing.md, minHeight: 100 },
  saveBtn: { margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
