import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuth } from '@/lib/auth';
import { createRecurringPlan, generateOccurrenceDates } from '@/hooks/useRecurringPlans';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { Exercise } from '@/types';

// ExercisePicker is full-screen (no visible prop) — rendered conditionally below

// Stored as end_date in the DB when the series has no end date
const INDEFINITE_SENTINEL = '9999-12-31';

// ─── Types ───────────────────────────────────────────────────

type WeightUnit = 'lbs' | 'kg' | 'secs';
type SetRow = { reps: string; amount: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[]; unit: WeightUnit };

// ─── Helpers ─────────────────────────────────────────────────

const UNITS: WeightUnit[] = ['lbs', 'kg', 'secs'];
function nextUnit(u: WeightUnit): WeightUnit { return UNITS[(UNITS.indexOf(u) + 1) % UNITS.length]; }

function resolveAmount(raw: string, unit: WeightUnit): { weight_kg: number | null; duration_seconds: number | null } {
  if (!raw.trim()) return { weight_kg: null, duration_seconds: null };
  const n = parseFloat(raw);
  if (isNaN(n)) return { weight_kg: null, duration_seconds: null };
  if (unit === 'secs') return { weight_kg: null, duration_seconds: Math.round(n) };
  return { weight_kg: unit === 'lbs' ? n * 0.453592 : n, duration_seconds: null };
}

const EMPTY_SET: SetRow = { reps: '', amount: '', notes: '' };
const EMPTY_BLOCK = (ex: Exercise): ExerciseBlock => ({ exercise: ex, sets: [{ ...EMPTY_SET }], unit: 'lbs' });

// 0=Sun 1=Mon … 6=Sat; displayed Mon–Sun
const DOW_LABELS: { label: string; value: number }[] = [
  { label: 'Mo', value: 1 },
  { label: 'Tu', value: 2 },
  { label: 'We', value: 3 },
  { label: 'Th', value: 4 },
  { label: 'Fr', value: 5 },
  { label: 'Sa', value: 6 },
  { label: 'Su', value: 0 },
];

function getTomorrow(): string {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addWeeks(iso: string, weeks: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Screen ──────────────────────────────────────────────────

export default function RecurringNewScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const t = useTheme();
  const { user } = useAuth();

  const singleClientId = Array.isArray(clientId) ? clientId[0] : clientId ?? '';

  // ── Schedule state ──
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([1, 3, 5])); // Mon/Wed/Fri
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly');
  const startDefault = getTomorrow();
  const [startDate, setStartDate] = useState(startDefault);
  const [endDate, setEndDate] = useState(addWeeks(startDefault, 4));
  const [indefinite, setIndefinite] = useState(false);
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  // ── Exercise state ──
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleDay(dow: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dow)) next.delete(dow);
      else next.add(dow);
      return next;
    });
  }

  function addExercise(ex: Exercise) {
    setBlocks((prev) => [...prev, EMPTY_BLOCK(ex)]);
  }

  function removeBlock(bi: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== bi));
  }

  function addSet(bi: number) {
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b));
  }

  function updateSet(bi: number, si: number, field: keyof SetRow, value: string) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b,
      ),
    );
  }

  function removeSet(bi: number, si: number) {
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b),
    );
  }

  // For indefinite plans, generate the first year of occurrences upfront
  const effectiveEnd = indefinite ? addWeeks(startDate, 52) : endDate;

  // Preview how many instances will be generated
  const occurrenceCount = selectedDays.size > 0 && startDate <= effectiveEnd
    ? generateOccurrenceDates(startDate, effectiveEnd, Array.from(selectedDays), frequency).length
    : 0;

  const handleSave = useCallback(async () => {
    if (!user) { Alert.alert('Not signed in'); return; }
    if (!singleClientId) { Alert.alert('No client selected'); return; }
    if (!title.trim()) { Alert.alert('Title required', 'Give this recurring series a name.'); return; }
    if (selectedDays.size === 0) { Alert.alert('No days selected', 'Choose at least one day of the week.'); return; }
    if (!indefinite && startDate > endDate) { Alert.alert('Invalid dates', 'End date must be after start date.'); return; }
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise.'); return; }
    if (occurrenceCount === 0) { Alert.alert('No occurrences', 'The selected days don\'t fall between the start and end dates.'); return; }

    const exercises = blocks.map((b, bi) => ({
      exercise_id: b.exercise.id,
      order_index: bi,
      superset_group: null,
      sets: b.sets
        .filter((s) => s.reps.trim() !== '' || s.amount.trim() !== '')
        .map((s, si) => ({
          set_number: si + 1,
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          ...resolveAmount(s.amount, b.unit),
          notes: s.notes.trim() || null,
        })),
    }));

    setSaving(true);
    try {
      const { count, error } = await createRecurringPlan(singleClientId, user.id, {
        title: title.trim(),
        notes: notes.trim() || null,
        days_of_week: Array.from(selectedDays),
        frequency,
        start_date: startDate,
        end_date: indefinite ? INDEFINITE_SENTINEL : endDate,
        exercises,
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert(
          'Recurring series created',
          `${count} workout${count !== 1 ? 's' : ''} scheduled.`,
          [{ text: 'Done', onPress: () => router.back() }],
        );
      }
    } catch (e) {
      Alert.alert('Unexpected error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [user, singleClientId, title, notes, selectedDays, frequency, startDate, endDate, blocks, occurrenceCount, router]);

  // ExercisePicker is full-screen — render it instead of the form
  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={(ex) => { addExercise(ex); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Recurring Series', headerShown: true }} />
      <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={s.scroll}>

        {/* Title */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.sectionLabel, { color: t.textSecondary }]}>SERIES TITLE</Text>
          <TextInput
            style={[s.titleInput, { color: t.textPrimary, borderColor: t.border }]}
            placeholder="e.g. Morning Strength"
            placeholderTextColor={t.textSecondary as string}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[s.notesInput, { color: t.textPrimary, borderColor: t.border }]}
            placeholder="Notes (optional)"
            placeholderTextColor={t.textSecondary as string}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Days of week */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.sectionLabel, { color: t.textSecondary }]}>DAYS OF WEEK</Text>
          <View style={s.dowRow}>
            {DOW_LABELS.map(({ label, value }) => {
              const active = selectedDays.has(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[s.dowPill, active && { backgroundColor: colors.primary }]}
                  onPress={() => toggleDay(value)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dowLabel, { color: active ? colors.textInverse : t.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Frequency */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.sectionLabel, { color: t.textSecondary }]}>FREQUENCY</Text>
          <View style={s.freqRow}>
            {(['weekly', 'biweekly'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.freqBtn, frequency === f && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setFrequency(f)}
                activeOpacity={0.8}
              >
                <Text style={[s.freqLabel, { color: frequency === f ? colors.textInverse : t.textSecondary }]}>
                  {f === 'weekly' ? 'Weekly' : 'Biweekly'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dates */}
        <View style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[s.sectionLabel, { color: t.textSecondary }]}>SCHEDULE DATES</Text>

          <TouchableOpacity
            style={[s.dateBtn, { borderColor: t.border }]}
            onPress={() => { setShowStartCal((v) => !v); setShowEndCal(false); }}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[s.dateBtnText, { color: t.textPrimary }]}>Start: {formatDate(startDate)}</Text>
          </TouchableOpacity>
          {showStartCal && (
            <View style={s.calWrap}>
              <DatePicker value={startDate} onChange={(d) => { setStartDate(d); setShowStartCal(false); }} />
            </View>
          )}

          {/* Indefinite toggle */}
          <TouchableOpacity
            style={s.indefiniteRow}
            onPress={() => { setIndefinite((v) => !v); setShowEndCal(false); }}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, indefinite && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {indefinite && <Ionicons name="checkmark" size={13} color={colors.textInverse} />}
            </View>
            <Text style={[s.indefiniteLabel, { color: t.textPrimary }]}>No end date</Text>
            <Text style={[s.indefiniteHint, { color: t.textSecondary }]}>· schedules 1 year upfront</Text>
          </TouchableOpacity>

          {!indefinite && (
            <>
              <TouchableOpacity
                style={[s.dateBtn, { borderColor: t.border }]}
                onPress={() => { setShowEndCal((v) => !v); setShowStartCal(false); }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[s.dateBtnText, { color: t.textPrimary }]}>End: {formatDate(endDate)}</Text>
              </TouchableOpacity>
              {showEndCal && (
                <View style={s.calWrap}>
                  <DatePicker value={endDate} onChange={(d) => { setEndDate(d); setShowEndCal(false); }} />
                </View>
              )}
            </>
          )}

          {occurrenceCount > 0 && (
            <Text style={[s.occurrenceHint, { color: colors.primary }]}>
              {occurrenceCount} workout{occurrenceCount !== 1 ? 's' : ''} will be scheduled
              {indefinite ? ' (first year)' : ''}
            </Text>
          )}
        </View>

        {/* Exercise blocks */}
        {blocks.map((block, bi) => (
          <View key={block.exercise.id + bi} style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            {/* Block header */}
            <View style={s.blockHeader}>
              <Text style={[s.blockName, { color: t.textPrimary }]} numberOfLines={1}>{block.exercise.name}</Text>
              <View style={s.blockHeaderRight}>
                <TouchableOpacity
                  onPress={() => {
                    const next = nextUnit(block.unit);
                    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, unit: next } : b));
                  }}
                  style={[s.unitToggle, { borderColor: t.border }]}
                >
                  <Text style={[s.unitToggleText, { color: colors.primary }]}>{block.unit}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeBlock(bi)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Set rows */}
            <View style={s.setHeader}>
              <Text style={[s.setHeaderCell, s.setColSet, { color: t.textSecondary }]}>SET</Text>
              <Text style={[s.setHeaderCell, s.setColReps, { color: t.textSecondary }]}>REPS</Text>
              <Text style={[s.setHeaderCell, s.setColAmt, { color: t.textSecondary }]}>{block.unit.toUpperCase()}</Text>
              <View style={s.setColDel} />
            </View>

            {block.sets.map((set, si) => (
              <View key={si} style={s.setRow}>
                <Text style={[s.setNum, { color: t.textSecondary }]}>{si + 1}</Text>
                <TextInput
                  style={[s.setInput, s.setColReps, { borderColor: t.border, color: t.textPrimary }]}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={t.textSecondary as string}
                  value={set.reps}
                  onChangeText={(v) => updateSet(bi, si, 'reps', v)}
                />
                <TextInput
                  style={[s.setInput, s.setColAmt, { borderColor: t.border, color: t.textPrimary }]}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={t.textSecondary as string}
                  value={set.amount}
                  onChangeText={(v) => updateSet(bi, si, 'amount', v)}
                />
                <TouchableOpacity
                  style={s.setColDel}
                  onPress={() => block.sets.length > 1 ? removeSet(bi, si) : undefined}
                  disabled={block.sets.length <= 1}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={18}
                    color={block.sets.length > 1 ? colors.error : t.border as string}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={s.addSetBtn} onPress={() => addSet(bi)}>
              <Ionicons name="add" size={14} color={colors.primary} />
              <Text style={[s.addSetText, { color: colors.primary }]}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise button */}
        <TouchableOpacity
          style={[s.addExBtn, { borderColor: colors.primary }]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons name="barbell-outline" size={16} color={colors.primary} />
          <Text style={[s.addExText, { color: colors.primary }]}>Add Exercise</Text>
        </TouchableOpacity>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.textInverse} />
            : <Text style={s.saveBtnText}>Create Recurring Series</Text>}
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  card: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.md, gap: spacing.sm,
  },
  sectionLabel: { ...typography.label, letterSpacing: 1, marginBottom: 2 },

  // Title / Notes
  titleInput: {
    ...typography.body, borderBottomWidth: 1, paddingVertical: spacing.xs,
    fontSize: 17, fontWeight: '600',
  },
  notesInput: {
    ...typography.bodySmall, borderBottomWidth: 1, paddingVertical: spacing.xs, minHeight: 40,
  },

  // Days of week
  dowRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  dowPill: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  dowLabel: { ...typography.label, fontSize: 11 },

  // Frequency
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1, borderColor: '#555',
  },
  freqLabel: { ...typography.body, fontWeight: '600' },

  // Dates
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.md, padding: spacing.sm,
  },
  dateBtnText: { ...typography.body },
  calWrap: { marginTop: spacing.xs },
  indefiniteRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 2,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  indefiniteLabel: { ...typography.body },
  indefiniteHint: { ...typography.bodySmall },
  occurrenceHint: { ...typography.bodySmall, fontWeight: '600', textAlign: 'center' },

  // Exercise block
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
  },
  blockName: { ...typography.body, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  blockHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitToggle: {
    borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2,
  },
  unitToggleText: { ...typography.label, fontSize: 11 },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  setHeaderCell: { ...typography.label, fontSize: 10, letterSpacing: 0.5, textAlign: 'center' },
  setColSet: { width: 28 },
  setColReps: { flex: 1 },
  setColAmt: { flex: 1 },
  setColDel: { width: 28, alignItems: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  setNum: { ...typography.label, width: 28, textAlign: 'center' },
  setInput: {
    borderWidth: 1, borderRadius: radius.sm, textAlign: 'center',
    paddingVertical: 6, ...typography.body,
  },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.xs,
  },
  addSetText: { ...typography.bodySmall, fontWeight: '600' },

  // Add exercise / Save
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  addExText: { ...typography.body, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
