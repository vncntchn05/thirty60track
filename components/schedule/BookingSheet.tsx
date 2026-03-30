import { useState, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useAvailabilityForClient, requestSession } from '@/hooks/useSchedule';
import { useClientCredits } from '@/hooks/useCredits';
import type { TrainerAvailability } from '@/types';

const DAY_ABBR   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseHHMM(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ─── Dates that have at least one availability window ─────────

function getUpcomingDates(slots: TrainerAvailability[]): Date[] {
  const weeklyDays  = new Set(slots.filter((s) => s.day_of_week !== null).map((s) => s.day_of_week as number));
  const specificIsos = new Set(slots.filter((s) => s.specific_date !== null).map((s) => s.specific_date as string));
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (weeklyDays.has(d.getDay()) || specificIsos.has(toIso(d))) dates.push(d);
  }
  return dates;
}

// ─── 15-min bookable increments within availability windows ───

type TimeOption = {
  h: number;
  m: number;
  /** Durations that fit entirely within the available window. */
  durations: (30 | 60)[];
};

function getTimeOptions(slots: TrainerAvailability[], date: Date): TimeOption[] {
  const dayIso  = toIso(date);
  const windows = slots.filter((s) =>
    (s.day_of_week !== null && s.day_of_week === date.getDay()) ||
    (s.specific_date !== null && s.specific_date === dayIso),
  );

  const map = new Map<number, Set<30 | 60>>();

  for (const w of windows) {
    const winStart = parseHHMM(w.start_time);
    const winEnd   = parseHHMM(w.end_time);
    // 15-min increments; last valid start = winEnd - 30 (need at least 30 min)
    for (let mins = winStart; mins + 30 <= winEnd; mins += 15) {
      const entry = map.get(mins) ?? new Set<30 | 60>();
      if (mins + 30 <= winEnd) entry.add(30);
      if (mins + 60 <= winEnd) entry.add(60);
      map.set(mins, entry);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([mins, set]) => ({
      h: Math.floor(mins / 60),
      m: mins % 60,
      durations: Array.from(set).sort() as (30 | 60)[],
    }));
}

// ─── Types / props ────────────────────────────────────────────

type Props = {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onBooked: () => void;
};

type Step = 'date' | 'time' | 'confirm';

type Selection = {
  date: Date;
  h: number;
  m: number;
  duration: 30 | 60;
};

// ─── Component ───────────────────────────────────────────────

export function BookingSheet({ visible, clientId, onClose, onBooked }: Props) {
  const t = useTheme();
  const { slots, trainerId, loading: slotsLoading } = useAvailabilityForClient(clientId);
  const { balance } = useClientCredits(clientId);

  const [step, setStep]         = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const upcomingDates = useMemo(() => getUpcomingDates(slots), [slots]);
  const timeOptions   = useMemo(
    () => selectedDate ? getTimeOptions(slots, selectedDate) : [],
    [slots, selectedDate],
  );

  const creditCost = selection ? (selection.duration === 30 ? 1 : 2) : 0;
  const canAfford  = balance >= creditCost;

  function handleClose() {
    setStep('date');
    setSelectedDate(null);
    setSelection(null);
    setErr(null);
    onClose();
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelection(null);
    setStep('time');
  }

  function handleSelectTime(h: number, m: number, duration: 30 | 60) {
    if (!selectedDate) return;
    setSelection({ date: selectedDate, h, m, duration });
    setStep('confirm');
  }

  async function handleBook() {
    if (!selection || !trainerId) return;
    if (!canAfford) {
      setErr(`Insufficient credits. Need ${creditCost}, have ${balance}.`);
      return;
    }
    setSaving(true); setErr(null);

    const scheduledAt = new Date(selection.date);
    scheduledAt.setHours(selection.h, selection.m, 0, 0);

    const { error } = await requestSession({
      trainer_id:       trainerId,
      client_id:        clientId,
      availability_id:  null,
      scheduled_at:     scheduledAt.toISOString(),
      duration_minutes: selection.duration,
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {step !== 'date' && (
              <TouchableOpacity
                onPress={() => setStep(step === 'confirm' ? 'time' : 'date')}
                style={styles.backBtn}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: t.textPrimary }]}>
              {step === 'date' ? 'Pick a Date' : step === 'time' ? 'Pick a Time' : 'Confirm Booking'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color={t.textSecondary as string} />
          </TouchableOpacity>
        </View>

        {/* Credit bar */}
        <View style={[styles.creditBar, { backgroundColor: t.background, borderColor: t.border }]}>
          <Ionicons name="wallet-outline" size={14} color={t.textSecondary as string} />
          <Text style={[styles.creditText, { color: t.textSecondary }]}>Balance: </Text>
          <Text style={[styles.creditBold, { color: t.textPrimary }]}>
            {balance} credit{balance !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {slotsLoading && <ActivityIndicator color={colors.primary} />}

          {/* ── Step 1: Date ── */}
          {!slotsLoading && step === 'date' && (
            upcomingDates.length === 0
              ? <Text style={[styles.empty, { color: t.textSecondary }]}>
                  Your trainer has no availability in the next 30 days.
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

          {/* ── Step 2: Time + duration ── */}
          {!slotsLoading && step === 'time' && selectedDate && (
            timeOptions.length === 0
              ? <Text style={[styles.empty, { color: t.textSecondary }]}>No available times on this day.</Text>
              : <>
                  <Text style={[styles.timeHint, { color: t.textSecondary }]}>
                    Select a start time and duration
                  </Text>
                  {timeOptions.map(({ h, m, durations }) => (
                    <View key={`${h}:${m}`} style={[styles.timeRow, { borderColor: t.border }]}>
                      <Text style={[styles.timeLabel, { color: t.textPrimary }]}>
                        {fmtTime(h, m)}
                      </Text>
                      <View style={styles.durationBtns}>
                        {([30, 60] as const).map((dur) => {
                          const available = durations.includes(dur);
                          const cost = dur === 30 ? 1 : 2;
                          const affordable = balance >= cost;
                          return (
                            <TouchableOpacity
                              key={dur}
                              style={[
                                styles.durBtn,
                                available && affordable  && styles.durBtnAvail,
                                available && !affordable && styles.durBtnLow,
                                !available               && styles.durBtnDisabled,
                              ]}
                              onPress={() => available && handleSelectTime(h, m, dur)}
                              disabled={!available}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.durBtnText,
                                available && affordable  && styles.durBtnTextAvail,
                                available && !affordable && { color: colors.warning },
                                !available               && styles.durBtnTextDisabled,
                              ]}>
                                {dur}m
                              </Text>
                              <Text style={[
                                styles.durBtnCredit,
                                available && affordable  && { color: colors.textInverse + 'CC' },
                                available && !affordable && { color: colors.warning + 'BB' },
                                !available               && styles.durBtnTextDisabled,
                              ]}>
                                {cost}cr
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </>
          )}

          {/* ── Step 3: Confirm ── */}
          {!slotsLoading && step === 'confirm' && selection && (
            <View style={styles.confirmContent}>
              <View style={[styles.summaryBox, { backgroundColor: t.background, borderColor: t.border }]}>
                <Text style={[styles.summaryTitle, { color: t.textPrimary }]}>Session Summary</Text>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={16} color={t.textSecondary as string} />
                  <Text style={[styles.summaryText, { color: t.textPrimary }]}>
                    {DAY_ABBR[selection.date.getDay()]}, {MONTH_ABBR[selection.date.getMonth()]} {selection.date.getDate()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={16} color={t.textSecondary as string} />
                  <Text style={[styles.summaryText, { color: t.textPrimary }]}>
                    {fmtTime(selection.h, selection.m)} · {selection.duration} min
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
    borderWidth: 1, borderBottomWidth: 0, maxHeight: '85%',
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

  // Date step
  dateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.md,
  },
  dateDow:   { ...typography.body, fontWeight: '600' },
  dateLabel: { ...typography.bodySmall },

  // Time step
  timeHint: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xs },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  timeLabel: { ...typography.body, fontWeight: '600', flex: 1 },
  durationBtns: { flexDirection: 'row', gap: spacing.xs },
  durBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1,
  },
  durBtnAvail:    { backgroundColor: colors.primary, borderColor: colors.primary },
  durBtnLow:      { borderColor: colors.warning, backgroundColor: 'transparent' },
  durBtnDisabled: { borderColor: '#333', opacity: 0.35 },
  durBtnText:     { fontSize: 12, fontWeight: '700', lineHeight: 15 },
  durBtnTextAvail:    { color: colors.textInverse },
  durBtnTextDisabled: { color: '#555' },
  durBtnCredit:   { fontSize: 10, lineHeight: 13 },

  // Confirm step
  confirmContent: { gap: spacing.sm },
  summaryBox: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  summaryTitle: { ...typography.body, fontWeight: '700' },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  summaryText:  { ...typography.body },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs,
  },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText:  { ...typography.body, fontWeight: '700', color: colors.textInverse },
  pendingHint:  { ...typography.bodySmall, textAlign: 'center' },
  errText:      { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
});
