import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { confirmSession, cancelSession, completeSession } from '@/hooks/useSchedule';
import type { ScheduledSessionWithDetails } from '@/types';

type Props = {
  session: ScheduledSessionWithDetails | null;
  role: 'trainer' | 'client';
  trainerId?: string; // required for trainer actions
  onClose: () => void;
  onChanged: () => void;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const bg =
    status === 'confirmed'  ? colors.primary :
    status === 'pending'    ? colors.warning  :
    status === 'cancelled'  ? colors.error    :
    colors.success;
  return (
    <View style={[styles.badge, { backgroundColor: bg + '33', borderColor: bg }]}>
      <Text style={[styles.badgeText, { color: bg }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

export function SessionSheet({ session, role, trainerId, onClose, onChanged }: Props) {
  const t = useTheme();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!session) return null;
  const s = session; // narrowed non-null alias for closures

  const creditCost = s.duration_minutes === 30 ? 1 : 2;
  const canConfirm = role === 'trainer' && s.status === 'pending';
  const canCancel  = (role === 'trainer' && (s.status === 'pending' || s.status === 'confirmed'))
                   || (role === 'client' && s.status === 'pending');
  const canComplete = role === 'trainer' && s.status === 'confirmed';

  async function handleConfirm() {
    if (!trainerId) return;
    setLoading(true); setErr(null);
    const { error } = await confirmSession(s.id, s.client_id, trainerId, s.duration_minutes);
    setLoading(false);
    if (error) { setErr(error); return; }
    onChanged();
    onClose();
  }

  async function handleCancel() {
    if (!trainerId && role === 'trainer') return;
    setLoading(true); setErr(null);
    const tid = trainerId ?? s.trainer_id;
    const { error } = await cancelSession(
      s.id, s.client_id, tid,
      role, s.status === 'confirmed', s.duration_minutes,
    );
    setLoading(false);
    if (error) { setErr(error); return; }
    onChanged();
    onClose();
  }

  async function handleComplete() {
    setLoading(true); setErr(null);
    const { error } = await completeSession(s.id);
    setLoading(false);
    if (error) { setErr(error); return; }
    onChanged();
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.handle} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Session Details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={t.textSecondary as string} />
            </TouchableOpacity>
          </View>

          <StatusBadge status={s.status} />

          <View style={styles.detail}>
            <Ionicons name="time-outline" size={16} color={t.textSecondary as string} />
            <Text style={[styles.detailText, { color: t.textPrimary }]}>
              {formatDateTime(s.scheduled_at)}
            </Text>
          </View>
          <View style={styles.detail}>
            <Ionicons name="timer-outline" size={16} color={t.textSecondary as string} />
            <Text style={[styles.detailText, { color: t.textPrimary }]}>
              {s.duration_minutes} min · {creditCost} credit{creditCost !== 1 ? 's' : ''}
            </Text>
          </View>

          {role === 'trainer' && s.client && (
            <View style={styles.detail}>
              <Ionicons name="person-outline" size={16} color={t.textSecondary as string} />
              <Text style={[styles.detailText, { color: t.textPrimary }]}>{s.client.full_name}</Text>
            </View>
          )}
          {role === 'client' && s.trainer && (
            <View style={styles.detail}>
              <Ionicons name="person-outline" size={16} color={t.textSecondary as string} />
              <Text style={[styles.detailText, { color: t.textPrimary }]}>{s.trainer.full_name}</Text>
            </View>
          )}

          {s.notes ? (
            <View style={[styles.notesBox, { backgroundColor: t.background, borderColor: t.border }]}>
              <Text style={[styles.notesLabel, { color: t.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: t.textPrimary }]}>{s.notes}</Text>
            </View>
          ) : null}

          {err ? <Text style={styles.errText}>{err}</Text> : null}

          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

          {!loading && (
            <View style={styles.actions}>
              {canConfirm && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.textInverse} />
                  <Text style={styles.confirmBtnText}>Confirm Session</Text>
                </TouchableOpacity>
              )}
              {canComplete && (
                <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
                  <Ionicons name="trophy-outline" size={18} color={colors.textInverse} />
                  <Text style={styles.confirmBtnText}>Mark Completed</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel Session</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0,
    maxHeight: '70%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#444',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.heading3 },
  badge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  badgeText: { ...typography.label },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailText: { ...typography.body, flex: 1 },
  notesBox: { borderRadius: radius.sm, borderWidth: 1, padding: spacing.sm, gap: 4 },
  notesLabel: { ...typography.label },
  notesText: { ...typography.bodySmall },
  errText: { ...typography.bodySmall, color: colors.error },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.success,
    borderRadius: radius.md, padding: spacing.md,
  },
  confirmBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  cancelBtn: {
    borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.error, alignItems: 'center',
  },
  cancelBtnText: { ...typography.body, fontWeight: '600', color: colors.error },
});
