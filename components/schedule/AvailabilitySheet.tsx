import { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { useTrainerAvailability } from '@/hooks/useSchedule';
import type { DayOfWeek, TrainerAvailability } from '@/types';

const DAYS    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS   = Array.from({ length: 18 }, (_, i) => i + 6); // 6–23
const MINUTES = [0, 15, 30, 45];

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function fmtHour(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12} ${period}`;
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

// ─── Vertical scroll picker ───────────────────────────────────

const ITEM_H = 52;

type PickerItem = { key: string; label: string };

function VerticalPicker({
  items,
  initialIdx,
  onSelect,
  visibleRows = 5,
  t,
}: {
  items: PickerItem[];
  initialIdx: number;
  onSelect: (idx: number) => void;
  visibleRows?: number;
  t: ReturnType<typeof useTheme>;
}) {
  const ref = useRef<ScrollView>(null);
  const pickerH = ITEM_H * visibleRows;

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

  const offset = Math.floor(visibleRows / 2);

  return (
    <View style={{ height: pickerH, overflow: 'hidden' }}>
      <View
        style={[pStyles.indicator, { top: ITEM_H * offset, borderColor: colors.primary }]}
        pointerEvents="none"
      />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ITEM_H * offset }}
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
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const pStyles = StyleSheet.create({
  indicator: {
    position: 'absolute', left: 16, right: 16,
    height: ITEM_H,
    borderTopWidth: 1.5, borderBottomWidth: 1.5,
    zIndex: 10,
  },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  itemLabel: { ...typography.body, fontWeight: '600', textAlign: 'center' },
});

// ─── Two-column time picker (hour | minute) ───────────────────

function TimePicker({
  label, h, m, onChangeH, onChangeM,
}: {
  label: string;
  h: number; m: number;
  onChangeH: (h: number) => void;
  onChangeM: (m: number) => void;
}) {
  const t = useTheme();

  const hourItems: PickerItem[] = HOURS.map((hr) => ({ key: String(hr), label: fmtHour(hr) }));
  const minItems:  PickerItem[] = MINUTES.map((mn) => ({ key: String(mn), label: `:${mn.toString().padStart(2, '0')}` }));

  const hourIdx = Math.max(0, HOURS.indexOf(h));
  const minIdx  = Math.max(0, MINUTES.indexOf(m));

  return (
    <View style={tpStyles.root}>
      <View style={tpStyles.labelRow}>
        <Text style={[tpStyles.label, { color: t.textSecondary }]}>{label}</Text>
        <Text style={[tpStyles.preview, { color: colors.primary }]}>{fmtTime(h, m)}</Text>
      </View>
      <View style={[tpStyles.columns, { borderColor: t.border }]}>
        {/* Hour column */}
        <View style={tpStyles.col}>
          <Text style={[tpStyles.colLabel, { color: t.textSecondary }]}>Hour</Text>
          <VerticalPicker
            key={`hour-${label}`}
            items={hourItems}
            initialIdx={hourIdx}
            onSelect={(i) => onChangeH(HOURS[i])}
            visibleRows={3}
            t={t}
          />
        </View>
        <View style={[tpStyles.divider, { backgroundColor: t.border }]} />
        {/* Minute column */}
        <View style={tpStyles.col}>
          <Text style={[tpStyles.colLabel, { color: t.textSecondary }]}>Min</Text>
          <VerticalPicker
            key={`min-${label}`}
            items={minItems}
            initialIdx={minIdx}
            onSelect={(i) => onChangeM(MINUTES[i])}
            visibleRows={3}
            t={t}
          />
        </View>
      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  root: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:   { ...typography.label },
  preview: { ...typography.body, fontWeight: '700' },
  columns: {
    flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, overflow: 'hidden',
  },
  col: { flex: 1, alignItems: 'center', paddingTop: spacing.xs },
  colLabel: { ...typography.label, marginBottom: spacing.xs },
  divider: { width: StyleSheet.hairlineWidth },
});

// ─── Main component ───────────────────────────────────────────

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
};

export function AvailabilitySheet({ visible, trainerId, onClose }: Props) {
  const t = useTheme();
  const { slots, loading, upsertSlot, updateSlot, deleteSlot } = useTrainerAvailability(trainerId);

  const [adding, setAdding]     = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slotType, setSlotType] = useState<SlotType>('weekly');

  const [day, setDay]               = useState<DayOfWeek>(1);
  const [specificDate, setSpecificDate] = useState(todayIso());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [endH,   setEndH]   = useState(10);
  const [endM,   setEndM]   = useState(0);

  const [saving, setSaving]   = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function resetForm() {
    setSlotType('weekly');
    setDay(1);
    setSpecificDate(todayIso());
    setStartH(9); setStartM(0);
    setEndH(10);  setEndM(0);
    setSaveErr(null);
    setEditingId(null);
  }

  function openEdit(slot: TrainerAvailability) {
    const start = parseTime(slot.start_time);
    const end   = parseTime(slot.end_time);
    setSlotType(slot.specific_date ? 'specific' : 'weekly');
    setDay((slot.day_of_week ?? 1) as DayOfWeek);
    setSpecificDate(slot.specific_date ?? todayIso());
    setStartH(start.h); setStartM(start.m);
    setEndH(end.h);     setEndM(end.m);
    setSaveErr(null);
    setEditingId(slot.id);
    setAdding(true);
  }

  async function handleSave() {
    const startTotal = startH * 60 + startM;
    const endTotal   = endH   * 60 + endM;
    if (endTotal <= startTotal) {
      setSaveErr('End time must be after start time');
      return;
    }
    setSaving(true); setSaveErr(null);
    const slotData = {
      trainer_id:    trainerId,
      day_of_week:   slotType === 'weekly' ? day : null,
      specific_date: slotType === 'specific' ? specificDate : null,
      start_time:    toTimeStr(startH, startM),
      end_time:      toTimeStr(endH, endM),
      is_active:     true,
    };
    const { error } = editingId
      ? await updateSlot(editingId, slotData)
      : await upsertSlot(slotData);
    setSaving(false);
    if (error) { setSaveErr(error); return; }
    setAdding(false);
    resetForm();
  }

  const weeklySlots   = slots.filter((s) => s.day_of_week !== null);
  const specificSlots = slots.filter((s) => s.specific_date !== null && s.specific_date >= todayIso());

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
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
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
                        <View style={styles.slotActions}>
                          <TouchableOpacity onPress={() => openEdit(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="pencil-outline" size={17} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteSlot(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="trash-outline" size={17} color={colors.error} />
                          </TouchableOpacity>
                        </View>
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
                        <View style={styles.slotActions}>
                          <TouchableOpacity onPress={() => openEdit(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="pencil-outline" size={17} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteSlot(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="trash-outline" size={17} color={colors.error} />
                          </TouchableOpacity>
                        </View>
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
          )}

          {/* ── Add slot form ── */}
          {adding && (
            <View style={[styles.addForm, { backgroundColor: t.background, borderColor: t.border }]}>

              <Text style={[styles.formTitle, { color: t.textPrimary }]}>
                {editingId ? 'Edit Slot' : 'Add Slot'}
              </Text>

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
  slotBadge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  slotBadgeText: { ...typography.label },
  slotTime: { ...typography.bodySmall },
  slotActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  addForm: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.md },
  formTitle: { ...typography.body, fontWeight: '700' },
  typeToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm,
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { ...typography.label },
  formLabel: { ...typography.label },
  chipRow: { gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
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
