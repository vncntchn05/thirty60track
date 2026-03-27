import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useAvailabilityForClient, requestSession } from '@/hooks/useSchedule';
import { useClientCredits } from '@/hooks/useCredits';
import type { TrainerAvailability } from '@/types';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function slotDuration(slot: TrainerAvailability): 30 | 60 {
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins <= 30 ? 30 : 60;
}

/** Next 14 days (including today), grouped by matching availability */
function getUpcomingDates(slots: TrainerAvailability[]): Date[] {
  const available = new Set(slots.map((s) => s.day_of_week));
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (available.has(d.getDay() as 0|1|2|3|4|5|6)) dates.push(d);
  }
  return dates;
}

type Props = {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onBooked: () => void;
};

type Step = 'date' | 'slot' | 'confirm';

export function BookingSheet({ visible, clientId, onClose, onBooked }: Props) {
  const t = useTheme();
  const { slots, trainerId, loading: slotsLoading } = useAvailabilityForClient(clientId);
  const { balance } = useClientCredits(clientId);

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TrainerAvailability | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upcomingDates = getUpcomingDates(slots);
  const daySlots = selectedDate
    ? slots.filter((s) => s.day_of_week === selectedDate.getDay())
    : [];

  const creditCost = selectedSlot ? (slotDuration(selectedSlot) === 30 ? 1 : 2) : 0;
  const canAfford = balance >= creditCost;

  function handleClose() {
    setStep('date');
    setSelectedDate(null);
    setSelectedSlot(null);
    setErr(null);
    onClose();
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('slot');
  }

  function handleSelectSlot(slot: TrainerAvailability) {
    setSelectedSlot(slot);
    setStep('confirm');
  }

  async function handleBook() {
    if (!selectedDate || !selectedSlot || !trainerId) return;
    if (!canAfford) { setErr(`Insufficient credits. You need ${creditCost} credit(s) but have ${balance}.`); return; }
    setSaving(true); setErr(null);

    // Build scheduled_at from selectedDate + slot start_time
    const [h, m] = selectedSlot.start_time.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(h, m, 0, 0);

    const { error } = await requestSession({
      trainer_id: trainerId,
      client_id: clientId,
      availability_id: selectedSlot.id,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: slotDuration(selectedSlot),
    });
    setSaving(false);
    if (error) { setErr(error); return; }
    onBooked();
    handleClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {step !== 'date' && (
              <TouchableOpacity onPress={() => setStep(step === 'confirm' ? 'slot' : 'date')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: t.textPrimary }]}>
              {step === 'date' ? 'Pick a Date' : step === 'slot' ? 'Pick a Time' : 'Confirm Booking'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color={t.textSecondary as string} />
          </TouchableOpacity>
        </View>

        <View style={[styles.creditBar, { backgroundColor: t.background, borderColor: t.border }]}>
          <Ionicons name="wallet-outline" size={14} color={t.textSecondary as string} />
          <Text style={[styles.creditText, { color: t.textSecondary }]}>Balance: </Text>
          <Text style={[styles.creditBold, { color: t.textPrimary }]}>{balance} credit{balance !== 1 ? 's' : ''}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {slotsLoading && <ActivityIndicator color={colors.primary} />}

          {!slotsLoading && step === 'date' && (
            upcomingDates.length === 0
              ? <Text style={[styles.empty, { color: t.textSecondary }]}>
                  Your trainer has no availability set in the next 14 days.
                </Text>
              : upcomingDates.map((date) => (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[styles.dateRow, { borderColor: t.border }]}
                  onPress={() => handleSelectDate(date)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={[styles.dateDow, { color: t.textPrimary }]}>{DAY_ABBR[date.getDay()]}</Text>
                    <Text style={[styles.dateLabel, { color: t.textSecondary }]}>
                      {MONTH_ABBR[date.getMonth()]} {date.getDate()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
                </TouchableOpacity>
              ))
          )}

          {!slotsLoading && step === 'slot' && selectedDate && (
            daySlots.length === 0
              ? <Text style={[styles.empty, { color: t.textSecondary }]}>No slots on this day.</Text>
              : daySlots.map((slot) => {
                  const dur = slotDuration(slot);
                  const cost = dur === 30 ? 1 : 2;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotRow, { borderColor: t.border }]}
                      onPress={() => handleSelectSlot(slot)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.slotTime, { color: t.textPrimary }]}>
                          {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                        </Text>
                        <Text style={[styles.slotMeta, { color: t.textSecondary }]}>
                          {dur} min · {cost} credit{cost !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={t.textSecondary as string} />
                    </TouchableOpacity>
                  );
                })
          )}

          {!slotsLoading && step === 'confirm' && selectedDate && selectedSlot && (
            <View style={styles.confirmContent}>
              <View style={[styles.summaryBox, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.summaryTitle, { color: t.textPrimary }]}>Session Summary</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={16} color={t.textSecondary as string} />
                  <Text style={[styles.summaryText, { color: t.textPrimary }]}>
                    {DAY_ABBR[selectedDate.getDay()]}, {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getDate()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={16} color={t.textSecondary as string} />
                  <Text style={[styles.summaryText, { color: t.textPrimary }]}>
                    {fmtTime(selectedSlot.start_time)} – {fmtTime(selectedSlot.end_time)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="wallet-outline" size={16} color={t.textSecondary as string} />
                  <Text style={[styles.summaryText, { color: canAfford ? t.textPrimary : colors.error }]}>
                    Cost: {creditCost} credit{creditCost !== 1 ? 's' : ''} (balance: {balance})
                  </Text>
                </View>
              </View>

              {!canAfford && (
                <Text style={styles.errText}>
                  Insufficient credits. Ask your trainer to grant more credits.
                </Text>
              )}
              {err ? <Text style={styles.errText}>{err}</Text> : null}

              <TouchableOpacity
                style={[styles.bookBtn, !canAfford && styles.bookBtnDisabled]}
                onPress={handleBook}
                disabled={saving || !canAfford}
              >
                {saving
                  ? <ActivityIndicator color={colors.textInverse} />
                  : <>
                      <Ionicons name="calendar-outline" size={18} color={colors.textInverse} />
                      <Text style={styles.bookBtnText}>Request Session</Text>
                    </>
                }
              </TouchableOpacity>
              <Text style={[styles.pendingHint, { color: t.textSecondary }]}>
                Your trainer will confirm the session.
              </Text>
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
    borderWidth: 1, borderBottomWidth: 0, maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#444',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backBtn: { padding: 2 },
  title: { ...typography.heading3 },
  creditBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1, padding: spacing.xs,
  },
  creditText: { ...typography.bodySmall },
  creditBold: { ...typography.bodySmall, fontWeight: '700' },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { ...typography.bodySmall, textAlign: 'center', paddingVertical: spacing.lg },
  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.md,
  },
  dateDow: { ...typography.body, fontWeight: '600' },
  dateLabel: { ...typography.bodySmall },
  slotRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.md,
  },
  slotTime: { ...typography.body, fontWeight: '600' },
  slotMeta: { ...typography.bodySmall },
  confirmContent: { gap: spacing.sm },
  summaryBox: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  summaryTitle: { ...typography.body, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  summaryText: { ...typography.body },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs,
  },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  pendingHint: { ...typography.bodySmall, textAlign: 'center' },
  errText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
});
