import { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useTrainerAvailability } from '@/hooks/useSchedule';
import type { DayOfWeek } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hours 6am–9pm for the picker
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21
const MINUTES = [0, 30];

function fmtTime(h: number, m: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
}

function toTimeString(h: number, m: number): string {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

type Props = {
  visible: boolean;
  trainerId: string;
  onClose: () => void;
};

export function AvailabilitySheet({ visible, trainerId, onClose }: Props) {
  const t = useTheme();
  const { slots, loading, upsertSlot, deleteSlot } = useTrainerAvailability(trainerId);

  const [adding, setAdding] = useState(false);
  const [day, setDay] = useState<DayOfWeek>(1);
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [duration, setDuration] = useState<30 | 60>(60);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true); setSaveErr(null);
    const endH = startH + Math.floor((startM + duration) / 60);
    const endM = (startM + duration) % 60;
    const { error } = await upsertSlot({
      trainer_id: trainerId,
      day_of_week: day,
      start_time: toTimeString(startH, startM),
      end_time: toTimeString(endH, endM),
      is_active: true,
    });
    setSaving(false);
    if (error) { setSaveErr(error); return; }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    await deleteSlot(id);
  }

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
            : slots.length === 0 && !adding
              ? (
                <Text style={[styles.empty, { color: t.textSecondary }]}>
                  No recurring slots set. Add your first availability window.
                </Text>
              )
              : slots.map((s) => {
                  const start = parseTime(s.start_time);
                  const end   = parseTime(s.end_time);
                  return (
                    <View key={s.id} style={[styles.slotRow, { borderColor: t.border }]}>
                      <View style={styles.slotInfo}>
                        <Text style={[styles.slotDay, { color: t.textPrimary }]}>{DAYS[s.day_of_week]}</Text>
                        <Text style={[styles.slotTime, { color: t.textSecondary }]}>
                          {fmtTime(start.h, start.m)} – {fmtTime(end.h, end.m)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(s.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })
          }

          {adding && (
            <View style={[styles.addForm, { backgroundColor: t.background, borderColor: t.border }]}>
              <Text style={[styles.formLabel, { color: t.textSecondary }]}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPicker}>
                {DAYS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, day === i && styles.dayChipActive]}
                    onPress={() => setDay(i as DayOfWeek)}
                  >
                    <Text style={[styles.dayChipText, { color: day === i ? colors.textInverse : t.textSecondary }]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.formLabel, { color: t.textSecondary }]}>Start time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePicker}>
                {HOURS.map((h) => MINUTES.map((m) => (
                  <TouchableOpacity
                    key={`${h}:${m}`}
                    style={[styles.timeChip, startH === h && startM === m && styles.timeChipActive]}
                    onPress={() => { setStartH(h); setStartM(m); }}
                  >
                    <Text style={[styles.timeChipText, { color: startH === h && startM === m ? colors.textInverse : t.textSecondary }]}>
                      {fmtTime(h, m)}
                    </Text>
                  </TouchableOpacity>
                )))}
              </ScrollView>

              <Text style={[styles.formLabel, { color: t.textSecondary }]}>Duration</Text>
              <View style={styles.durationRow}>
                {([30, 60] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.durationChip, duration === d && styles.durationChipActive]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[styles.durationText, { color: duration === d ? colors.textInverse : t.textSecondary }]}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {saveErr ? <Text style={styles.errText}>{saveErr}</Text> : null}

              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelChip} onPress={() => setAdding(false)}>
                  <Text style={[styles.cancelChipText, { color: t.textSecondary }]}>Cancel</Text>
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
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  title: { ...typography.heading3 },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { ...typography.bodySmall, textAlign: 'center', paddingVertical: spacing.lg },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
  },
  slotInfo: { gap: 2 },
  slotDay: { ...typography.body, fontWeight: '600' },
  slotTime: { ...typography.bodySmall },
  addForm: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  formLabel: { ...typography.label },
  dayPicker: { gap: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1, borderColor: '#2E2E2E',
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { ...typography.label },
  timePicker: { gap: spacing.xs, flexWrap: 'nowrap' },
  timeChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm, borderWidth: 1, borderColor: '#2E2E2E',
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeChipText: { ...typography.label },
  durationRow: { flexDirection: 'row', gap: spacing.sm },
  durationChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: '#2E2E2E',
  },
  durationChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durationText: { ...typography.body, fontWeight: '600' },
  errText: { ...typography.bodySmall, color: colors.error },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelChip: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderColor: '#2E2E2E',
  },
  cancelChipText: { ...typography.body, fontWeight: '600' },
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
