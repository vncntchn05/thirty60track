import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useClientIntake } from '@/hooks/useClientIntake';
import { IntakeForm } from '@/components/client/IntakeForm';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

const QR_SIZE = 200;

function MetricRow({ label, value }: { label: string; value: string | null }) {
  const t = useTheme();
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, { color: t.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: t.textPrimary }]}>{value ?? '—'}</Text>
    </View>
  );
}

export default function ClientProfileScreen() {
  const t = useTheme();
  const { signOut, clientId } = useAuth();
  const { client, loading, refresh } = useClientProfile();
  const { intake, saveIntake } = useClientIntake(clientId ?? '');
  const [editingIntake, setEditingIntake] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // QR payload: encode client DB id so trainer scanner can look it up
  const qrPayload = clientId
    ? JSON.stringify({ type: 'thirty60_checkin', clientId })
    : null;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.scroll}>
      {/* Check-in QR code */}
      {qrPayload && (
        <View style={[styles.card, styles.qrCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Check-In QR Code</Text>
          <Text style={[styles.qrHint, { color: t.textSecondary }]}>Show this to your trainer to check in</Text>
          <View style={[styles.qrWrap, { backgroundColor: '#fff' }]}>
            <QRCode value={qrPayload} size={QR_SIZE} color="#000" backgroundColor="#fff" />
          </View>
        </View>
      )}

      {/* Info card */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Personal Info</Text>
        <MetricRow label="Name" value={client?.full_name ?? null} />
        <MetricRow label="Email" value={client?.email ?? null} />
        <MetricRow label="Phone" value={client?.phone ?? null} />
      </View>

      {/* Body metrics card (read-only — trainer manages) */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Body Metrics</Text>
        <Text style={[styles.readOnlyNote, { color: t.textSecondary }]}>Managed by your trainer</Text>
        <MetricRow
          label="Weight"
          value={client?.weight_kg != null ? `${client.weight_kg} kg` : null}
        />
        <MetricRow
          label="Height"
          value={client?.height_cm != null ? `${client.height_cm} cm` : null}
        />
        <MetricRow
          label="Body Fat"
          value={client?.bf_percent != null ? `${client.bf_percent}%` : null}
        />
        <MetricRow
          label="BMI"
          value={client?.bmi != null ? String(client.bmi) : null}
        />
      </View>

      {/* Intake info card */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardTitle, { color: t.textSecondary }]}>Health &amp; Fitness Info</Text>
          <TouchableOpacity onPress={() => setEditingIntake(true)}>
            <Text style={[styles.editLink, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        <MetricRow label="Activity level" value={intake?.activity_level?.replace('_', ' ') ?? null} />
        <MetricRow label="Goals"          value={intake?.goals ?? null} />
        <MetricRow label="Timeframe"      value={intake?.goal_timeframe ?? null} />
        <MetricRow label="Occupation"     value={intake?.occupation ?? null} />
      </View>

      {/* Change password */}
      <TouchableOpacity
        style={[styles.resetBtn, { borderColor: t.border, backgroundColor: t.surface }]}
        onPress={() => setChangingPassword(true)}
      >
        <Text style={[styles.resetText, { color: colors.primary }]}>Change Password</Text>
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.error }]}
        onPress={signOut}
      >
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>

      <ChangePasswordModal
        visible={changingPassword}
        email={client?.email ?? ''}
        onClose={() => setChangingPassword(false)}
      />

      {/* Intake edit modal */}
      {client && (
        <Modal visible={editingIntake} animationType="slide" presentationStyle="pageSheet">
          <IntakeForm
            client={client}
            intake={intake}
            onSave={async (intakeData, clientData) => {
              const result = await saveIntake(intakeData, clientData, false);
              if (!result.error) { refresh(); setEditingIntake(false); }
              return result;
            }}
            onCancel={() => setEditingIntake(false)}
          />
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  cardTitle: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  qrCard: { alignItems: 'center', gap: spacing.md },
  qrHint: { ...typography.bodySmall, textAlign: 'center' },
  qrWrap: { padding: spacing.md, borderRadius: radius.md },
  readOnlyNote: { ...typography.bodySmall, fontStyle: 'italic', marginBottom: spacing.xs },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { ...typography.bodySmall, fontWeight: '600' },
  metricRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metricLabel: { ...typography.body },
  metricValue: { ...typography.body, fontWeight: '600' },
  resetBtn: {
    borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    marginTop: spacing.md,
  },
  resetText: { ...typography.body, fontWeight: '600' },
  signOutBtn: {
    borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  signOutText: { ...typography.body, fontWeight: '600' },
});
