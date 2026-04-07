import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useClients } from '@/hooks/useClients';
import { useClientCredits } from '@/hooks/useCredits';
import { bookSessionForClient } from '@/hooks/useSchedule';
import { supabase } from '@/lib/supabase';
import type { ClientWithStats } from '@/types';

// ─── Shared date/time helpers (mirrors BookingSheet) ──────────

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


// Trainers can book on any day — return all dates for the next 60 days.
function getUpcomingDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

type TimeOption = { h: number; m: number; durations: (30 | 60)[] };

// Trainers can book at any time — return all 15-min slots from 6 AM to 10 PM.
function getTimeOptions(): TimeOption[] {
  const options: TimeOption[] = [];
  const startMin = 6 * 60;   // 6:00 AM
  const endMin   = 22 * 60;  // 10:00 PM
  for (let m = startMin; m < endMin; m += 15) {
    options.push({ h: Math.floor(m / 60), m: m % 60, durations: [30, 60] });
  }
  return options;
}

// ─── Step types ───────────────────────────────────────────────

type Step = 'client' | 'date' | 'time' | 'confirm';

// ─── Props ────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
  onBooked: () => void;
};

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

// ─── Main component ───────────────────────────────────────────

export function TrainerBookingSheet({ visible, trainerId, onClose, onBooked }: Props) {
  const t = useTheme();
  const { clients, loading: clientsLoading } = useClients();

  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null);
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null);
  const [selectedTime, setSelectedTime]   = useState<TimeOption | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);
  const [clientBalance, setClientBalance] = useState<number | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Fetch selected client's credit balance when they're chosen
  useEffect(() => {
    if (!selectedClient) return;
    supabase
      .from('client_credits')
      .select('balance')
      .eq('client_id', selectedClient.id)
      .single()
      .then(({ data }) => setClientBalance(data?.balance ?? 0));
  }, [selectedClient]);

  // All client balances for the list (batch fetch)
  const [allBalances, setAllBalances] = useState<Record<string, number>>({});
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

  const upcomingDates = getUpcomingDates();
  const timeOptions   = selectedDate ? getTimeOptions() : [];

  function handleClose() {
    setStep('client');
    setSelectedClient(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedDuration(60);
    setClientBalance(null);
    setError(null);
    onClose();
  }

  function selectClient(c: ClientWithStats) {
    setSelectedClient(c);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep('date');
  }

  function selectDate(d: Date) {
    setSelectedDate(d);
    setSelectedTime(null);
    setStep('time');
  }

  function selectTime(opt: TimeOption, dur: 30 | 60) {
    setSelectedTime(opt);
    setSelectedDuration(dur);
    setStep('confirm');
  }

  async function handleBook() {
    if (!selectedClient || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);

    const dt = new Date(selectedDate);
    dt.setHours(selectedTime.h, selectedTime.m, 0, 0);

    const { error: err } = await bookSessionForClient(
      trainerId,
      selectedClient.id,
      dt.toISOString(),
      selectedDuration,
    );

    setSubmitting(false);
    if (err) { setError(err); return; }
    handleClose();
    onBooked();
  }

  const creditCost    = selectedDuration === 30 ? 1 : 2;
  const balanceAfter  = clientBalance !== null ? clientBalance - creditCost : null;
  const insufficientCredits = clientBalance !== null && clientBalance < creditCost;

  // ─── Step header ───────────────────────────────────────────

  const stepTitles: Record<Step, string> = {
    client:  'Select Client',
    date:    'Select Date',
    time:    'Select Time',
    confirm: 'Confirm Booking',
  };

  function goBack() {
    if (step === 'date')    setStep('client');
    if (step === 'time')    setStep('date');
    if (step === 'confirm') setStep('time');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { backgroundColor: t.background }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: t.border }]}>
            <TouchableOpacity
              onPress={step === 'client' ? handleClose : goBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={step === 'client' ? 'close' : 'chevron-back'} size={24} color={t.textPrimary as string} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: t.textPrimary }]}>{stepTitles[step]}</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Context pill showing selected items */}
          {step !== 'client' && (
            <View style={[styles.contextBar, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
              {selectedClient && (
                <Text style={[styles.contextText, { color: t.textSecondary }]}>
                  {selectedClient.full_name}
                  {selectedDate ? `  ·  ${DAY_ABBR[selectedDate.getDay()]} ${MONTH_ABBR[selectedDate.getMonth()]} ${selectedDate.getDate()}` : ''}
                  {selectedTime ? `  ·  ${fmtTime(selectedTime.h, selectedTime.m)}` : ''}
                </Text>
              )}
              {clientBalance !== null && (
                <Text style={[styles.contextBalance, { color: clientBalance > 0 ? colors.primary : colors.error }]}>
                  {clientBalance} credits
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

          {/* ── Step: Client ── */}
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

          {/* ── Step: Date ── */}
          {step === 'date' && (
            <ScrollView contentContainerStyle={styles.dateGrid}>
              {upcomingDates.map((d) => {
                const iso = toIso(d);
                const isSelected = selectedDate && toIso(selectedDate) === iso;
                return (
                  <TouchableOpacity
                    key={iso}
                    style={[
                      styles.dateCard,
                      { borderColor: t.border, backgroundColor: t.surface },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => selectDate(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateDow, { color: isSelected ? colors.primary : t.textSecondary }]}>
                      {DAY_ABBR[d.getDay()]}
                    </Text>
                    <Text style={[styles.dateDay, { color: isSelected ? colors.primary : t.textPrimary }]}>
                      {d.getDate()}
                    </Text>
                    <Text style={[styles.dateMon, { color: isSelected ? colors.primary : t.textSecondary }]}>
                      {MONTH_ABBR[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ── Step: Time ── */}
          {step === 'time' && (
            <ScrollView contentContainerStyle={styles.timeList}>
              {timeOptions.map((opt) => (
                opt.durations.map((dur) => {
                  const isSelected = selectedTime?.h === opt.h && selectedTime?.m === opt.m && selectedDuration === dur;
                  return (
                    <TouchableOpacity
                      key={`${opt.h}:${opt.m}-${dur}`}
                      style={[
                        styles.timeRow,
                        { borderColor: t.border, backgroundColor: t.surface },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
                      ]}
                      onPress={() => selectTime(opt, dur)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timeText, { color: isSelected ? colors.primary : t.textPrimary }]}>
                        {fmtTime(opt.h, opt.m)}
                      </Text>
                      <View style={[styles.durBadge, { backgroundColor: isSelected ? colors.primary : t.background }]}>
                        <Text style={[styles.durText, { color: isSelected ? colors.textInverse : t.textSecondary }]}>
                          {dur}min · {dur === 30 ? 1 : 2} cr
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })
              ))}
            </ScrollView>
          )}

          {/* ── Step: Confirm ── */}
          {step === 'confirm' && selectedClient && selectedDate && selectedTime && (
            <ScrollView contentContainerStyle={styles.confirmContent}>
              <View style={[styles.confirmCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                {/* Client */}
                <View style={styles.confirmRow}>
                  <Ionicons name="person-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Client</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>{selectedClient.full_name}</Text>
                  </View>
                </View>
                {/* Date */}
                <View style={styles.confirmRow}>
                  <Ionicons name="calendar-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Date</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>
                      {DAY_ABBR[selectedDate.getDay()]}, {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </Text>
                  </View>
                </View>
                {/* Time */}
                <View style={styles.confirmRow}>
                  <Ionicons name="time-outline" size={18} color={t.textSecondary as string} />
                  <View>
                    <Text style={[styles.confirmLabel, { color: t.textSecondary }]}>Time</Text>
                    <Text style={[styles.confirmValue, { color: t.textPrimary }]}>
                      {fmtTime(selectedTime.h, selectedTime.m)} · {selectedDuration} min
                    </Text>
                  </View>
                </View>
                {/* Credits */}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { ...typography.heading3 },
  contextBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextText:    { ...typography.bodySmall, flex: 1 },
  contextBalance: { ...typography.bodySmall, fontWeight: '700' },
  errorRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  errorText: { ...typography.bodySmall },

  // Client list
  clientRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clientAvatar: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  clientInitials: { ...typography.body, fontWeight: '700' },
  clientInfo: { flex: 1 },
  clientName:  { ...typography.body, fontWeight: '600' },
  clientEmail: { ...typography.bodySmall },
  creditBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full,
  },
  creditBadgeText: { ...typography.label, fontWeight: '700' },

  // Date grid
  dateGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    padding: spacing.md,
  },
  dateCard: {
    width: 72, alignItems: 'center', paddingVertical: spacing.sm,
    borderWidth: 1, borderRadius: radius.md, gap: 2,
  },
  dateDow:  { ...typography.label },
  dateDay:  { ...typography.heading3 },
  dateMon:  { ...typography.label },

  // Time list
  timeList: { padding: spacing.md, gap: spacing.sm },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderWidth: 1, borderRadius: radius.md,
  },
  timeText:  { ...typography.body, fontWeight: '600', flex: 1 },
  durBadge:  { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full },
  durText:   { ...typography.bodySmall, fontWeight: '600' },

  // Confirm
  confirmContent: { padding: spacing.md, gap: spacing.md },
  confirmCard: {
    borderWidth: 1, borderRadius: radius.md, overflow: 'hidden',
  },
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
  emptyText: { ...typography.body, textAlign: 'center' },
  emptyHint: { ...typography.bodySmall, textAlign: 'center' },
});
