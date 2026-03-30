import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { useTrainerAvailability } from '@/hooks/useSchedule';
import type { DayOfWeek } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hours available for selection: 6 AM (6) to 11 PM (23)
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const MINUTES = [0, 15, 30, 45];

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function fmtHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}${period}`;
}

function toTimeStr(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

type SlotType = 'weekly' | 'specific';

// ─── Inline time picker (hour row + minute row) ───────────────

function TimePicker({
  label, h, m, onChangeH, onChangeM,
}: {
  label: string;
  h: number; m: number;
  onChangeH: (h: number) => void;
  onChangeM: (m: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={tpStyles.root}>
      <Text style={[tpStyles.label, { color: t.textSecondary }]}>{label}</Text>
      <Text style={[tpStyles.preview, { color: colors.primary }]}>{fmtTime(h, m)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tpStyles.row}>
        {HOURS.map((hr) => {
          const active = h === hr;
          return (
            <TouchableOpacity
              key={hr}
              style={[tpStyles.chip, { borderColor: active ? colors.primary : t.border }, active && tpStyles.chipActive]}
              onPress={() => onChangeH(hr)}
            >
              <Text style={[tpStyles.chipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                {fmtHour(hr)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tpStyles.row}>
        {MINUTES.map((mn) => {
          const active = m === mn;
          return (
            <TouchableOpacity
              key={mn}
              style={[tpStyles.chip, { borderColor: active ? colors.primary : t.border }, active && tpStyles.chipActive]}
              onPress={() => onChangeM(mn)}
            >
              <Text style={[tpStyles.chipText, { color: active ? colors.textInverse : t.textSecondary }]}>
                :{mn.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  root: { gap: 6 },
  label: { ...typography.label },
  preview: { ...typography.body, fontWeight: '700' },
  row: { gap: spacing.xs, flexDirection: 'row' },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderRadius: radius.sm, borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.label },
});

// ─── Main component ───────────────────────────────────────────

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
};

export function AvailabilitySheet({ visible, trainerId, onClose }: Props) {
  const t = useTheme();
  const { slots, loading, upsertSlot, deleteSlot } = useTrainerAvailability(trainerId);

  const [adding, setAdding] = useState(false);
  const [slotType, setSlotType] = useState<SlotType>('weekly');

  // Weekly fields
  const [day, setDay] = useState<DayOfWeek>(1);
  // Specific date fields
  const [specificDate, setSpecificDate] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Arbitrary start + end time
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [endH,   setEndH]   = useState(10);
  const [endM,   setEndM]   = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function resetForm() {
    setSlotType('weekly');
    setDay(1);
    setSpecificDate(todayIso());
    setStartH(9); setStartM(0);
    setEndH(10);  setEndM(0);
    setSaveErr(null);
  }

  async function handleSave() {
    const startTotal = startH * 60 + startM;
    const endTotal   = endH   * 60 + endM;
    if (endTotal <= startTotal) {
      setSaveErr('End time must be after start time');
      return;
    }
    setSaving(true); setSaveErr(null);
    const { error } = await upsertSlot({
      trainer_id:    trainerId,
      day_of_week:   slotType === 'weekly' ? day : null,
      specific_date: slotType === 'specific' ? specificDate : null,
      start_time:    toTimeStr(startH, startM),
      end_time:      toTimeStr(endH, endM),
      is_active:     true,
    });
    setSaving(false);
    if (error) { setSaveErr(error); return; }
    setAdding(false);
    resetForm();
  }

  const weeklySlots   = slots.filter((s) => s.day_of_week !== null);
  const specificSlots = slots.filter((s) => s.specific_date !== null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Availability</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={t.textSecondary as string} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <>
                {weeklySlots.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>WEEKLY</Text>
                    {weeklySlots.map((s) => {
                      const start = parseTime(s.start_time);
                      const end   = parseTime(s.end_time);
                      return (
                        <View key={s.id} style={[styles.slotRow, { borderColor: t.border }]}>
                          <View style={styles.slotInfo}>
                            <View style={styles.slotBadgeRow}>
                              <View style={[styles.slotBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                                <Text style={[styles.slotBadgeText, { color: colors.primary }]}>
                                  {DAYS[s.day_of_week!]}
                                </Text>
                              </View>
                              <Text style={[styles.slotTime, { color: t.textPrimary }]}>
                                {fmtTime(start.h, start.m)} – {fmtTime(end.h, end.m)}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => deleteSlot(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </>
                )}

                {specificSlots.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>SPECIFIC DATES</Text>
                    {specificSlots.map((s) => {
                      const start = parseTime(s.start_time);
                      const end   = parseTime(s.end_time);
                      return (
                        <View key={s.id} style={[styles.slotRow, { borderColor: t.border }]}>
                          <View style={styles.slotInfo}>
                            <View style={styles.slotBadgeRow}>
                              <View style={[styles.slotBadge, { backgroundColor: colors.info + '22', borderColor: colors.info }]}>
                                <Text style={[styles.slotBadgeText, { color: colors.info }]}>
                                  {fmtDate(s.specific_date!)}
                                </Text>
                              </View>
                              <Text style={[styles.slotTime, { color: t.textPrimary }]}>
                                {fmtTime(start.h, start.m)} – {fmtTime(end.h, end.m)}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => deleteSlot(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </>
                )}

                {slots.length === 0 && !adding && (
                  <Text style={[styles.empty, { color: t.textSecondary }]}>
                    No availability set. Add a weekly recurring slot or a one-off date.
                  </Text>
                )}
              </>
          }

          {/* ── Add slot form ── */}
          {adding && (
            <View style={[styles.addForm, { backgroundColor: t.background, borderColor: t.border }]}>

              {/* Type toggle */}
              <View style={[styles.typeToggle, { borderColor: t.border }]}>
                {(['weekly', 'specific'] as SlotType[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.typeBtn, slotType === st && styles.typeBtnActive]}
                    onPress={() => setSlotType(st)}
                  >
                    <Ionicons
                      name={st === 'weekly' ? 'repeat-outline' : 'calendar-outline'}
                      size={14}
                      color={slotType === st ? colors.textInverse : (t.textSecondary as string)}
                    />
                    <Text style={[styles.typeBtnText, { color: slotType === st ? colors.textInverse : t.textSecondary }]}>
                      {st === 'weekly' ? 'Weekly' : 'Specific Date'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Weekly: day chips */}
              {slotType === 'weekly' && (
                <>
                  <Text style={[styles.formLabel, { color: t.textSecondary }]}>Day of week</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {DAYS.map((d, i) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.chip, { borderColor: day === i ? colors.primary : t.border }, day === i && styles.chipActive]}
                        onPress={() => setDay(i as DayOfWeek)}
                      >
                        <Text style={[styles.chipText, { color: day === i ? colors.textInverse : t.textSecondary }]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Specific date */}
              {slotType === 'specific' && (
                <>
                  <Text style={[styles.formLabel, { color: t.textSecondary }]}>Date</Text>
                  <TouchableOpacity
                    style={[styles.datePicker, { borderColor: t.border, backgroundColor: t.surface }]}
                    onPress={() => setDatePickerOpen(true)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={[styles.datePickerText, { color: t.textPrimary }]}>{fmtDate(specificDate)}</Text>
                    <Ionicons name="chevron-down" size={14} color={t.textSecondary as string} />
                  </TouchableOpacity>
                </>
              )}

              {/* Start time */}
              <TimePicker
                label="Start time"
                h={startH} m={startM}
                onChangeH={setStartH}
                onChangeM={setStartM}
              />

              {/* End time */}
              <TimePicker
                label="End time"
                h={endH} m={endM}
                onChangeH={setEndH}
                onChangeM={setEndM}
              />

              {saveErr ? <Text style={styles.errText}>{saveErr}</Text> : null}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: t.border }]}
                  onPress={() => { setAdding(false); resetForm(); }}
                >
                  <Text style={[styles.cancelBtnText, { color: t.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator size="small" color={colors.textInverse} />
                    : <Text style={styles.saveBtnText}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!adding && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
              <Ionicons name="add" size={18} color={colors.textInverse} />
              <Text style={styles.addBtnText}>Add Slot</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <DatePickerModal
        visible={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(iso) => { setSpecificDate(iso); setDatePickerOpen(false); }}
        value={specificDate}
        logDates={[]}
        maxDate="2099-12-31"
      />
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
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  title: { ...typography.heading3 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  sectionLabel: { ...typography.label, marginTop: spacing.xs },
  empty: { ...typography.bodySmall, textAlign: 'center', paddingVertical: spacing.lg },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
  },
  slotInfo: { flex: 1 },
  slotBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  slotBadge: {
    borderWidth: 1, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  slotBadgeText: { ...typography.label },
  slotTime: { ...typography.bodySmall },
  addForm: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.md,
  },
  typeToggle: {
    flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, overflow: 'hidden',
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { ...typography.label },
  formLabel: { ...typography.label },
  chipRow: { gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: 5,
    borderRadius: radius.sm, borderWidth: 1,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.label },
  datePicker: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  datePickerText: { ...typography.body, flex: 1 },
  errText: { ...typography.bodySmall, color: colors.error },
  formActions: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1,
  },
  cancelBtnText: { ...typography.body, fontWeight: '600' },
  saveBtn: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.primary,
  },
  saveBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xs,
  },
  addBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
