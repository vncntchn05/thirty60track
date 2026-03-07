import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth';
import { useClientProfile } from '@/hooks/useClientProfile';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

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
  const { signOut } = useAuth();
  const { client, loading } = useClientProfile();

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.scroll}>
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

      {/* Sign out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: colors.error }]}
        onPress={signOut}
      >
        <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
      </TouchableOpacity>
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
  readOnlyNote: { ...typography.bodySmall, fontStyle: 'italic', marginBottom: spacing.xs },
  metricRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metricLabel: { ...typography.body },
  metricValue: { ...typography.body, fontWeight: '600' },
  signOutBtn: {
    borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
    marginTop: spacing.md,
  },
  signOutText: { ...typography.body, fontWeight: '600' },
});
