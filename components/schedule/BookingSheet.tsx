import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useAvailabilityForClient, requestSession } from '@/hooks/useSchedule';
import { useClientCredits } from '@/hooks/useCredits';
import type { TrainerAvailability } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

const DAY_ABBR    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_ABBR  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUpcomingDates(slots: TrainerAvailability[]): Date[] {
  const weeklyDays   = new Set(slots.filter((s) => s.day_of_week !== null).map((s) => s.day_of_week as number));
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

type TimeOption = { h: number; m: number; durations: (30 | 60)[] };

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

type MonthItem = { key: string; year: number; month: number; label: string };

function getAvailableMonths(dates: Date[]): MonthItem[] {
  const seen = new Set<string>();
  const months: MonthItem[] = [];
  for (const d of dates) {
    const key = getMonthKey(d);
    if (!seen.has(key)) {
      seen.add(key);
      months.push({ key, year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
  }
  return months;
}

// ─── Vertical scroll picker ───────────────────────────────────

const ITEM_H      = 52;
const VISIBLE_ROWS = 5;
const PICKER_H    = ITEM_H * VISIBLE_ROWS;

type PickerItem = { key: string; label: string; sublabel?: string };

function VerticalPicker({
  items,
  initialIdx,
  onSelect,
  t,
}: {
  items: PickerItem[];
  initialIdx: number;
  onSelect: (idx: number) => void;
  t: ReturnType<typeof useTheme>;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: initialIdx * ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function snap(e: { nativeEvent: { contentOffset: { y: number } } }) {
    const i = Math.max(0, Math.min(Math.round(e.nativeEvent.contentOffset.y / ITEM_H), items.length - 1));
    onSelect(i);
  }

  return (
    <View style={pStyles.wrap}>
      <View style={[pStyles.indicator, { borderColor: colors.primary }]} pointerEvents="none" />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={snap}
        onScrollEndDrag={snap}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.key}
            style={pStyles.item}
            onPress={() => {
              ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
              onSelect(i);
            }}
            activeOpacity={0.6}
          >
            <Text style={[pStyles.itemLabel, { color: t.textPrimary }]}>{item.label}</Text>
            {item.sublabel ? (
              <Text style={[pStyles.itemSublabel, { color: t.textSecondary }]}>{item.sublabel}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const pStyles = StyleSheet.create({
  wrap: { height: PICKER_H, overflow: 'hidden' },
  indicator: {
    position: 'absolute', left: 32, right: 32,
    top: ITEM_H * 2, height: ITEM_H,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    zIndex: 10,
  },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemLabel:    { ...typography.body, fontWeight: '600', textAlign: 'center' },
  itemSublabel: { ...typography.bodySmall, textAlign: 'center' },
});

// ─── Types ────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  clientId: string;
  onClose: () => void;
  onBooked: () => void;
};

type Step = 'month' | 'date' | 'time' | 'confirm';

// ─── Component ───────────────────────────────────────────────

export function BookingSheet({ visible, clientId, onClose, onBooked }: Props) {
  const t = useTheme();
  const { slots, trainerId, loading: slotsLoading } = useAvailabilityForClient(clientId);
  const { balance } = useClientCredits(clientId);

  const [step, setStep]         = useState<Step>('month');
  const [monthIdx, setMonthIdx] = useState(0);
  const [dateIdx, setDateIdx]   = useState(0);
  const [timeIdx, setTimeIdx]   = useState(0);
  const [duration, setDuration] = useState<30 | 60 | null>(null);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const upcomingDates   = useMemo(() => getUpcomingDates(slots), [slots]);
  const availableMonths = useMemo(() => getAvailableMonths(upcomingDates), [upcomingDates]);
  const selectedMonth   = availableMonths[monthIdx] ?? null;

  const datesInMonth = useMemo(
    () => (selectedMonth ? upcomingDates.filter((d) => getMonthKey(d) === selectedMonth.key) : []),
    [upcomingDates, selectedMonth],
  );
  const selectedDate = datesInMonth[dateIdx] ?? null;

  const timeOptions     = useMemo(() => (selectedDate ? getTimeOptions(slots, selectedDate) : []), [slots, selectedDate]);
  const selectedTimeOpt = timeOptions[timeIdx] ?? null;

  const creditCost = duration ? (duration === 30 ? 1 : 2) : 0;
  const canAfford  = balance >= creditCost;

  function handleClose() {
    setStep('month'); setMonthIdx(0); setDateIdx(0); setTimeIdx(0);
    setDuration(null); setErr(null);
    onClose();
  }

  function goBack() {
    if (step === 'date')    setStep('month');
    if (step === 'time')    setStep('date');
    if (step === 'confirm') setStep('time');
  }

  function goToDate() { setDateIdx(0); setStep('date'); }
  function goToTime() { setTimeIdx(0); setDuration(null); setStep('time'); }

  function handleSelectDuration(dur: 30 | 60) {
    setDuration(dur);
    setStep('confirm');
  }

  async function handleBook() {
    if (!selectedDate || !selectedTimeOpt || !duration || !trainerId) return;
    if (!canAfford) { setErr(`Insufficient credits. Need ${creditCost}, have ${balance}.`); return; }
    setSaving(true); setErr(null);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(selectedTimeOpt.h, selectedTimeOpt.m, 0, 0);
    const { error } = await requestSession({
      trainer_id:       trainerId,
      client_id:        clientId,
      availability_id:  null,
      scheduled_at:     scheduledAt.toISOString(),
      duration_minutes: duration,
    });
    setSaving(false);
    if (error) { setErr(error); return; }
    onBooked();
    handleClose();
  }

  const titleMap: Record<Step, string> = {
    month:   'Pick a Month',
    date:    'Pick a Date',
    time:    'Pick a Time',
    confirm: 'Confirm Booking',
  };

  const monthItems: PickerItem[] = availableMonths.map((m) => ({ key: m.key, label: m.label }));
  const dateItems: PickerItem[]  = datesInMonth.map((d) => ({
    key: toIso(d),
    label: `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`,
  }));
  const timeItems: PickerItem[]  = timeOptions.map((opt) => ({
    key: `${opt.h}:${opt.m}`,
    label: fmtTime(opt.h, opt.m),
    sublabel: opt.durations.map((d) => `${d}m`).join('  ·  '),
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {step !== 'month' && (
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: t.textPrimary }]}>{titleMap[step]}</Text>
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

        {/* Body */}
        <View style={styles.body}>
          {slotsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <>
              {/* ── Month step ── */}
              {step === 'month' && (
                availableMonths.length === 0 ? (
                  <Text style={[styles.empty, { color: t.textSecondary }]}>
                    Your trainer has no availability in the next 30 days.
                  </Text>
                ) : (
                  <View style={styles.pickerStep}>
                    <VerticalPicker
                      key="month-picker"
                      items={monthItems}
                      initialIdx={monthIdx}
                      onSelect={setMonthIdx}
                      t={t}
                    />
                    <TouchableOpacity style={styles.nextBtn} onPress={goToDate}>
                      <Text style={styles.nextBtnText}>Continue</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* ── Date step ── */}
              {step === 'date' && (
                datesInMonth.length === 0 ? (
                  <Text style={[styles.empty, { color: t.textSecondary }]}>
                    No availability in {selectedMonth?.label}.
                  </Text>
                ) : (
                  <View style={styles.pickerStep}>
                    <VerticalPicker
                      key={`date-picker-${selectedMonth?.key}`}
                      items={dateItems}
                      initialIdx={dateIdx}
                      onSelect={setDateIdx}
                      t={t}
                    />
                    <TouchableOpacity style={styles.nextBtn} onPress={goToTime}>
                      <Text style={styles.nextBtnText}>Continue</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
                    </TouchableOpacity>
                  </View>
                )
              )}

              {/* ── Time step ── */}
              {step === 'time' && selectedDate && (
                timeOptions.length === 0 ? (
                  <Text style={[styles.empty, { color: t.textSecondary }]}>
                    No available times on this day.
                  </Text>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeContent}>
                    <VerticalPicker
                      key={`time-picker-${toIso(selectedDate)}`}
                      items={timeItems}
                      initialIdx={timeIdx}
                      onSelect={setTimeIdx}
                      t={t}
                    />
                    {selectedTimeOpt && (
                      <View style={styles.durationSection}>
                        <Text style={[styles.durationHint, { color: t.textSecondary }]}>Select duration</Text>
                        <View style={styles.durationRow}>
                          {([30, 60] as const).map((dur) => {
                            const available = selectedTimeOpt.durations.includes(dur);
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
                                onPress={() => available && handleSelectDuration(dur)}
                                disabled={!available}
                                activeOpacity={0.7}
                              >
                                <Text style={[
                                  styles.durBtnText,
                                  available && affordable  && { color: colors.textInverse },
                                  available && !affordable && { color: colors.warning },
                                  !available               && { color: '#555' },
                                ]}>
                                  {dur}m
                                </Text>
                                <Text style={[
                                  styles.durBtnCredit,
                                  available && affordable  && { color: colors.textInverse + 'CC' },
                                  available && !affordable && { color: colors.warning + 'BB' },
                                  !available               && { color: '#555' },
                                ]}>
                                  {cost} cr
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </ScrollView>
                )
              )}

              {/* ── Confirm step ── */}
              {step === 'confirm' && selectedDate && selectedTimeOpt && duration && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.confirmContent}>
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
                        {fmtTime(selectedTimeOpt.h, selectedTimeOpt.m)} · {duration} min
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
                    {saving ? (
                      <ActivityIndicator color={colors.textInverse} />
                    ) : (
                      <>
                        <Ionicons name="calendar-outline" size={18} color={colors.textInverse} />
                        <Text style={styles.bookBtnText}>Request Session</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.pendingHint, { color: t.textSecondary }]}>
                    Your trainer will confirm the session.
                  </Text>
                </ScrollView>
              )}
            </>
          )}
        </View>
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
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, padding: spacing.xs,
  },
  creditText: { ...typography.bodySmall },
  creditBold: { ...typography.bodySmall, fontWeight: '700' },

  body: { paddingBottom: spacing.lg },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  empty: {
    ...typography.bodySmall, textAlign: 'center',
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },

  // Picker steps (month / date)
  pickerStep: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  nextBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },

  // Time step
  timeContent: { gap: spacing.md, paddingBottom: spacing.md },
  durationSection: { paddingHorizontal: spacing.md, gap: spacing.sm },
  durationHint: { ...typography.bodySmall, textAlign: 'center' },
  durationRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  durBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  durBtnAvail:    { backgroundColor: colors.primary, borderColor: colors.primary },
  durBtnLow:      { borderColor: colors.warning, backgroundColor: 'transparent' },
  durBtnDisabled: { borderColor: '#333', opacity: 0.35 },
  durBtnText:     { fontSize: 16, fontWeight: '700' },
  durBtnCredit:   { fontSize: 12 },

  // Confirm step
  confirmContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  summaryBox: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
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
