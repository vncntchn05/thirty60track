import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useClients } from '@/hooks/useClients';
import { bookSessionForClient } from '@/hooks/useSchedule';
import { supabase } from '@/lib/supabase';
import { DAY_ABBR, MONTH_ABBR } from '@/lib/dateFormat';
import type { ClientWithStats } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

type MonthItem = { key: string; year: number; month: number; label: string };

function getTrainerMonths(): MonthItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seen = new Set<string>();
  const months: MonthItem[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = getMonthKey(d);
    if (!seen.has(key)) {
      seen.add(key);
      months.push({ key, year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
  }
  return months;
}

function getDatesForTrainer(monthItem: MonthItem): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getFullYear() === monthItem.year && d.getMonth() === monthItem.month) dates.push(d);
  }
  return dates;
}

type TimeOption = { h: number; m: number };

function getAllTimeSlots(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let m = 6 * 60; m < 22 * 60; m += 15) {
    opts.push({ h: Math.floor(m / 60), m: m % 60 });
  }
  return opts;
}

// ─── Vertical scroll picker ───────────────────────────────────

const ITEM_H       = 52;
const VISIBLE_ROWS = 5;
const PICKER_H     = ITEM_H * VISIBLE_ROWS;

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

// ─── Client row ───────────────────────────────────────────────

function ClientRow({
  client,
  balance,
  onPress,
}: {
  client: ClientWithStats;
  balance: number | null;
  onPress: () => void;
}) {
  const t = useTheme();
  const initials = client.full_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <TouchableOpacity style={[styles.clientRow, { borderBottomColor: t.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.clientAvatar, { backgroundColor: colors.primary + '22' }]}>
        <Text style={[styles.clientInitials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={[styles.clientName, { color: t.textPrimary }]}>{client.full_name}</Text>
        {client.email ? <Text style={[styles.clientEmail, { color: t.textSecondary }]}>{client.email}</Text> : null}
      </View>
      {balance !== null && (
        <View style={[styles.creditBadge, { backgroundColor: balance > 0 ? colors.primary + '22' : colors.error + '22' }]}>
          <Text style={[styles.creditBadgeText, { color: balance > 0 ? colors.primary : colors.error }]}>
            {balance} cr
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
    </TouchableOpacity>
  );
}

// ─── Types / props ────────────────────────────────────────────

type Step = 'client' | 'month' | 'date' | 'time' | 'confirm';

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
  onBooked: () => void;
};

// ─── Main component ───────────────────────────────────────────

export function TrainerBookingSheet({ visible, trainerId, onClose, onBooked }: Props) {
  const t = useTheme();
  const { clients, loading: clientsLoading } = useClients();

  const [step, setStep]                         = useState<Step>('client');
  const [selectedClient, setSelectedClient]     = useState<ClientWithStats | null>(null);
  const [monthIdx, setMonthIdx]                 = useState(0);
  const [dateIdx, setDateIdx]                   = useState(0);
  const [timeIdx, setTimeIdx]                   = useState(0);
  const [duration, setDuration]                 = useState<30 | 60>(60);
  const [clientBalance, setClientBalance]       = useState<number | null>(null);
  const [allBalances, setAllBalances]           = useState<Record<string, number>>({});
  const [submitting, setSubmitting]             = useState(false);
  const [error, setError]                       = useState<string | null>(null);

  // Fetch selected client's balance
  useEffect(() => {
    if (!selectedClient) return;
    supabase
      .from('client_credits')
      .select('balance')
      .eq('client_id', selectedClient.id)
      .single()
      .then(({ data }) => setClientBalance(data?.balance ?? 0));
  }, [selectedClient]);

  // Batch fetch balances for client list
  useEffect(() => {
    if (!visible || !clients.length) return;
    supabase
      .from('client_credits')
      .select('client_id, balance')
      .in('client_id', clients.map((c) => c.id))
      .then(({ data }) => {
        const map: Record<string, number> = {};
        for (const row of data ?? []) map[row.client_id] = row.balance;
        setAllBalances(map);
      });
  }, [visible, clients]);

  const trainerMonths = useMemo(() => getTrainerMonths(), []);
  const selectedMonth = trainerMonths[monthIdx] ?? null;

  const datesInMonth = useMemo(
    () => (selectedMonth ? getDatesForTrainer(selectedMonth) : []),
    [selectedMonth],
  );
  const selectedDate = datesInMonth[dateIdx] ?? null;

  const allTimeSlots  = useMemo(() => getAllTimeSlots(), []);
  const selectedTimeSlot = allTimeSlots[timeIdx] ?? null;

  const creditCost         = duration === 30 ? 1 : 2;
  const balanceAfter       = clientBalance !== null ? clientBalance - creditCost : null;
  const insufficientCredits = clientBalance !== null && clientBalance < creditCost;

  function handleClose() {
    setStep('client'); setSelectedClient(null);
    setMonthIdx(0); setDateIdx(0); setTimeIdx(0);
    setDuration(60); setClientBalance(null); setError(null);
    onClose();
  }

  function goBack() {
    if (step === 'month')   setStep('client');
    if (step === 'date')    setStep('month');
    if (step === 'time')    setStep('date');
    if (step === 'confirm') setStep('time');
  }

  function selectClient(c: ClientWithStats) {
    setSelectedClient(c);
    setMonthIdx(0); setDateIdx(0); setTimeIdx(0);
    setStep('month');
  }

  function goToDate() { setDateIdx(0); setStep('date'); }
  function goToTime() { setTimeIdx(0); setStep('time'); }
  function goToConfirm() { setStep('confirm'); }

  async function handleBook() {
    if (!selectedClient || !selectedDate || !selectedTimeSlot) return;
    setSubmitting(true);
    setError(null);
    const dt = new Date(selectedDate);
    dt.setHours(selectedTimeSlot.h, selectedTimeSlot.m, 0, 0);
    const { error: err } = await bookSessionForClient(
      trainerId,
      selectedClient.id,
      dt.toISOString(),
      duration,
    );
    setSubmitting(false);
    if (err) { setError(err); return; }
    handleClose();
    onBooked();
  }

  const stepTitles: Record<Step, string> = {
    client:  'Select Client',
    month:   'Pick a Month',
    date:    'Pick a Date',
    time:    'Pick a Time',
    confirm: 'Confirm Booking',
  };

  // Picker item lists
  const monthItems: PickerItem[] = trainerMonths.map((m) => ({ key: m.key, label: m.label }));
  const dateItems: PickerItem[]  = datesInMonth.map((d) => ({
    key: toIso(d),
    label: `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`,
  }));
  const timeItems: PickerItem[]  = allTimeSlots.map((opt) => ({
    key: `${opt.h}:${opt.m}`,
    label: fmtTime(opt.h, opt.m),
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
      <View style={[styles.sheet, step === 'client' && styles.sheetTall, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.border }]}>
          <TouchableOpacity
            onPress={step === 'client' ? handleClose : goBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={step === 'client' ? 'close' : 'chevron-back'} size={22} color={t.textPrimary as string} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>{stepTitles[step]}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Context bar (shows selected client / date breadcrumb) */}
        {step !== 'client' && selectedClient && (
          <View style={[styles.contextBar, { backgroundColor: t.background, borderBottomColor: t.border }]}>
            <Text style={[styles.contextText, { color: t.textSecondary }]} numberOfLines={1}>
              {selectedClient.full_name}
              {selectedDate ? `  ·  ${DAY_ABBR[selectedDate.getDay()]} ${MONTH_ABBR[selectedDate.getMonth()]} ${selectedDate.getDate()}` : ''}
              {selectedTimeSlot && step === 'confirm' ? `  ·  ${fmtTime(selectedTimeSlot.h, selectedTimeSlot.m)}` : ''}
            </Text>
            {clientBalance !== null && (
              <Text style={[styles.contextBalance, { color: clientBalance > 0 ? colors.primary : colors.error }]}>
                {clientBalance} cr
              </Text>
            )}
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={[styles.errorRow, { backgroundColor: colors.error + '18' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Body */}
        <View style={[styles.body, step === 'client' && styles.bodyFlex]}>

          {/* ── Client step ── */}
          {step === 'client' && (
            clientsLoading ? (
              <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
            ) : (
              <FlatList
                data={clients}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => (
                  <ClientRow
                    client={item}
                    balance={allBalances[item.id] ?? null}
                    onPress={() => selectClient(item)}
                  />
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: t.textSecondary }]}>No clients found</Text>
                }
              />
            )
          )}

          {/* ── Month step ── */}
          {step === 'month' && (
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
          )}

          {/* ── Date step ── */}
          {step === 'date' && (
            datesInMonth.length === 0 ? (
              <Text style={[styles.emptyText, { color: t.textSecondary }]}>
                No dates available in {selectedMonth?.label}.
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
          {step === 'time' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timeContent}>
              <VerticalPicker
                key={`time-picker-${selectedDate ? toIso(selectedDate) : 'none'}`}
                items={timeItems}
                initialIdx={timeIdx}
                onSelect={setTimeIdx}
                t={t}
              />
              <View style={styles.durationSection}>
                <Text style={[styles.durationHint, { color: t.textSecondary }]}>Select duration</Text>
                <View style={styles.durationRow}>
                  {([30, 60] as const).map((dur) => {
                    const cost = dur === 30 ? 1 : 2;
                    const isSelected = duration === dur;
                    return (
                      <TouchableOpacity
                        key={dur}
                        style={[styles.durBtn, isSelected && styles.durBtnSelected]}
                        onPress={() => setDuration(dur)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.durBtnText, isSelected && { color: colors.textInverse }]}>
                          {dur}m
                        </Text>
                        <Text style={[styles.durBtnCredit, isSelected && { color: colors.textInverse + 'CC' }]}>
                          {cost} cr
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity style={styles.nextBtn} onPress={goToConfirm}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Confirm step ── */}
          {step === 'confirm' && selectedClient && selectedDate && selectedTimeSlot && (
            <ScrollView contentContainerStyle={styles.confirmContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.confirmCard, { backgroundColor: t.background, borderColor: t.border }]}>
                <View style={styles.confirmRow}>
                  <Ionicons name="person-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Client</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>{selectedClient.full_name}</Text>
                  </View>
                </View>
                <View style={styles.confirmRow}>
                  <Ionicons name="calendar-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Date</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>
                      {DAY_ABBR[selectedDate.getDay()]}, {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </Text>
                  </View>
                </View>
                <View style={styles.confirmRow}>
                  <Ionicons name="time-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Time</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>
                      {fmtTime(selectedTimeSlot.h, selectedTimeSlot.m)} · {duration} min
                    </Text>
                  </View>
                </View>
                <View style={[styles.confirmRow, styles.confirmRowLast]}>
                  <Ionicons name="wallet-outline" size={18} color={t.textSecondary as string} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Credits</Text>
                    <View style={styles.creditRow}>
                      <Text style={[styles.confirmValue, { color: t.textPrimary }]}>
                        {clientBalance ?? '—'} → {balanceAfter ?? '—'}
                      </Text>
                      <View style={[styles.costBadge, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.costBadgeText, { color: colors.primary }]}>-{creditCost} cr</Text>
                      </View>
                    </View>
                    {insufficientCredits && (
                      <Text style={[styles.creditWarning, { color: colors.error }]}>
                        Insufficient credits — balance will go negative
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.bookBtn, submitting && { opacity: 0.6 }]}
                onPress={handleBook}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color={colors.textInverse} />
                  : <Text style={styles.bookBtnText}>Confirm Booking</Text>
                }
              </TouchableOpacity>
            </ScrollView>
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
  sheetTall: { height: '80%' },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#444',
    alignSelf: 'center', marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.heading3 },
  contextBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextText:    { ...typography.bodySmall, flex: 1 },
  contextBalance: { ...typography.bodySmall, fontWeight: '700', marginLeft: spacing.sm },
  errorRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  errorText: { ...typography.bodySmall },

  body: { paddingBottom: spacing.lg },
  bodyFlex: { flex: 1, paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },

  // Client list
  clientRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  clientInitials: { ...typography.body, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName:  { ...typography.body, fontWeight: '600' },
  clientEmail: { ...typography.bodySmall },
  creditBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  creditBadgeText: { ...typography.label, fontWeight: '700' },
  emptyText: { ...typography.body, textAlign: 'center', padding: spacing.xl },

  // Picker steps (month / date)
  pickerStep: { gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md,
  },
  nextBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },

  // Time step
  timeContent: { gap: spacing.md, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  durationSection: { gap: spacing.sm },
  durationHint: { ...typography.bodySmall, textAlign: 'center' },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary,
  },
  durBtnSelected: { backgroundColor: colors.primary },
  durBtnText:   { fontSize: 16, fontWeight: '700', color: colors.primary },
  durBtnCredit: { fontSize: 12, color: colors.primary },

  // Confirm
  confirmContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  confirmCard: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  confirmRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  confirmRowLast: { borderBottomWidth: 0 },
  confirmLabel: { ...typography.label },
  confirmValue: { ...typography.body, fontWeight: '600' },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  costBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  costBadgeText: { ...typography.label, fontWeight: '700' },
  creditWarning: { ...typography.bodySmall, marginTop: spacing.xs },
  bookBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  bookBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
