import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrequencyChart } from './FrequencyChart';
import { VolumeChart } from './VolumeChart';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { useClientProgress } from '@/hooks/useClientProgress';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Range = '1M' | '3M' | '6M' | '1Y' | 'All' | 'Custom';
const RANGES: Range[] = ['1M', '3M', '6M', '1Y', 'All', 'Custom'];

const LAST_N_OPTIONS = [5, 10, 20, 'All'] as const;
type LastN = typeof LAST_N_OPTIONS[number];
const DAYS_BACK: Record<Range, number | undefined> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': undefined, 'Custom': undefined,
};

type Props = { clientId: string };

export default function ProgressSection({ clientId }: Props) {
  const t = useTheme();
  const [range, setRange] = useState<Range>('All');
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd]     = useState<Date | undefined>(undefined);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const customRange = range === 'Custom' && customStart && customEnd
    ? { start: customStart, end: customEnd }
    : undefined;

  const {
    frequencyData, frequencyStats, volumeData,
    bodyWeightData, bodyFatData,
    exercises, getExerciseProgress, getExerciseRepsProgress, getExerciseDurationProgress,
    allWorkoutDates, loading, error,
  } = useClientProgress(clientId, DAYS_BACK[range], customRange);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [lastN, setLastN] = useState<LastN>(10);
  const [prExpanded, setPrExpanded] = useState(false);
  const [prWeightUnit, setPrWeightUnit] = useState<'lbs' | 'kg'>('lbs');

  const { records: prRecords, loading: prLoading } = usePersonalRecords(clientId);

  function handleRangePress(r: Range) {
    if (r === 'Custom') {
      setCalendarVisible(true);
    } else {
      setRange(r);
      setCustomStart(undefined);
      setCustomEnd(undefined);
    }
  }

  function handleCalendarConfirm(start: Date, end: Date) {
    setCustomStart(start);
    setCustomEnd(end);
    setRange('Custom');
    setCalendarVisible(false);
  }

  function customLabel(): string {
    if (range === 'Custom' && customStart && customEnd) {
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(customStart)} – ${fmt(customEnd)}`;
    }
    return 'Custom';
  }

  if (loading) return <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />;
  if (error) return null;

  const noData = frequencyStats.totalWorkouts === 0;
  const activeId = selectedExerciseId ?? exercises[0]?.id ?? null;
  const activeExercise = exercises.find((e) => e.id === activeId);
  const hasWeight = activeExercise?.hasWeight ?? false;
  const hasDuration = activeExercise?.hasDuration ?? false;
  const rawProgressData = activeId ? getExerciseProgress(activeId) : [];
  const progressData = weightUnit === 'lbs'
    ? rawProgressData.map((p) => ({ ...p, y: p.y * 2.20462 }))
    : rawProgressData;
  const durationProgressData = activeId ? getExerciseDurationProgress(activeId) : [];
  const repsProgressData = activeId ? getExerciseRepsProgress(activeId) : [];

  const rawVolumeData = weightUnit === 'lbs'
    ? volumeData.map((p) => ({ ...p, y: p.y * 2.20462 }))
    : volumeData;
  const slicedVolumeData = (lastN === 'All' ? rawVolumeData : rawVolumeData.slice(-lastN))
    .map((p, i) => ({ ...p, x: i }));

  const filteredExercises = query.trim()
    ? exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : exercises;

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setDropdownOpen(false);
    setQuery('');
  };

  // PR records sorted by exercise name; weight converted for display unit
  const prRecordsWithWeight = prRecords.map((r) => ({
    ...r,
    displayWeight: r.max_weight_kg != null
      ? (prWeightUnit === 'lbs'
          ? Math.round(r.max_weight_kg * 2.20462 * 10) / 10
          : Math.round(r.max_weight_kg * 10) / 10)
      : null,
  }));
  const PREVIEW_COUNT = 5;
  const visiblePRs = prExpanded ? prRecordsWithWeight : prRecordsWithWeight.slice(0, PREVIEW_COUNT);

  return (
    <>
      {/* Personal Records card */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.prHeaderRow}>
          <View style={styles.prTitleRow}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={[styles.label, { color: t.textSecondary, marginLeft: 4 }]}>Personal Records</Text>
          </View>
          <View style={[styles.unitToggle, { borderColor: t.border, backgroundColor: t.background }]}>
            {(['lbs', 'kg'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, prWeightUnit === u && styles.unitBtnActive]}
                onPress={() => setPrWeightUnit(u)}
              >
                <Text style={[styles.unitBtnText, { color: prWeightUnit === u ? colors.textInverse : t.textSecondary }]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {prLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.sm }} />}

        {!prLoading && prRecords.length === 0 && (
          <Text style={[styles.prEmpty, { color: t.textSecondary }]}>
            No personal records yet. Log a workout to start tracking PRs.
          </Text>
        )}

        {!prLoading && visiblePRs.map((r) => (
          <View key={r.id} style={[styles.prRow, { borderBottomColor: t.border }]}>
            <View style={styles.prExerciseCol}>
              <Text style={[styles.prExerciseName, { color: t.textPrimary }]} numberOfLines={1}>
                {r.exercise.name}
              </Text>
              {r.exercise.muscle_group && (
                <Text style={[styles.prMuscle, { color: t.textSecondary }]} numberOfLines={1}>
                  {r.exercise.muscle_group}
                </Text>
              )}
            </View>
            <View style={styles.prBadgeCol}>
              {r.displayWeight != null && (
                <View style={[styles.prBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                  <Ionicons name="barbell-outline" size={11} color={colors.primary} />
                  <Text style={[styles.prBadgeText, { color: colors.primary }]}>
                    {r.displayWeight} {prWeightUnit}
                  </Text>
                </View>
              )}
              {r.max_reps != null && (
                <View style={[styles.prBadge, { backgroundColor: colors.info + '22', borderColor: colors.info + '44' }]}>
                  <Ionicons name="repeat-outline" size={11} color={colors.info} />
                  <Text style={[styles.prBadgeText, { color: colors.info }]}>
                    {r.max_reps} reps
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {!prLoading && prRecords.length > PREVIEW_COUNT && (
          <TouchableOpacity
            style={styles.prToggleBtn}
            onPress={() => setPrExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={[styles.prToggleText, { color: colors.primary }]}>
              {prExpanded ? 'Show less' : `Show all ${prRecords.length} records`}
            </Text>
            <Ionicons
              name={prExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Time range selector */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.rangeChip,
              { borderColor: t.border },
              r === range && styles.rangeChipActive,
            ]}
            onPress={() => handleRangePress(r)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.rangeChipText,
                { color: t.textSecondary },
                r === range && styles.rangeChipTextActive,
              ]}
              numberOfLines={1}
            >
              {r === 'Custom' ? customLabel() : r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom date range picker */}
      <DateRangePicker
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onConfirm={handleCalendarConfirm}
        workoutDates={allWorkoutDates}
        initialStart={customStart}
        initialEnd={customEnd}
      />

      {noData && (
        <View style={[styles.emptyState, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.emptyStateText, { color: t.textSecondary }]}>
            No workouts recorded in this period.
          </Text>
        </View>
      )}

      {!noData && (<>
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.label, { color: t.textSecondary }]}>Workout Frequency</Text>
        <FrequencyChart data={frequencyData} stats={frequencyStats} />
      </View>

      {/* Body Composition + Exercise Progress — side by side */}
      {(bodyWeightData.length >= 2 || bodyFatData.length >= 2 || exercises.length > 0) && (
        <View style={styles.sideRow}>
          {(bodyWeightData.length >= 2 || bodyFatData.length >= 2) && (
            <View style={[styles.card, styles.sideCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.label, { color: t.textSecondary }]}>Body Composition</Text>

              {bodyWeightData.length >= 2 && (
                <ExerciseProgressChart data={bodyWeightData} unit="kg" title="Body Weight" />
              )}

              {bodyWeightData.length >= 2 && bodyFatData.length >= 2 && (
                <View style={[styles.separator, { backgroundColor: t.border }]} />
              )}

              {bodyFatData.length >= 2 && (
                <ExerciseProgressChart data={bodyFatData} unit="%" title="Body Fat" />
              )}
            </View>
          )}

          {exercises.length > 0 && (
            <View style={[styles.card, styles.sideCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Text style={[styles.label, { color: t.textSecondary }]}>Exercise Progress</Text>

              <TouchableOpacity
                style={[styles.dropdownBtn, { borderColor: t.border, backgroundColor: t.background }]}
                onPress={() => setDropdownOpen((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownBtnText, { color: t.textPrimary }]} numberOfLines={1}>
                  {activeExercise?.name ?? 'Select exercise'}
                </Text>
                <Ionicons
                  name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={t.textSecondary as string}
                />
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={[styles.dropdownPanel, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <TextInput
                    style={[styles.searchInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                    placeholder="Search exercises…"
                    placeholderTextColor={t.textSecondary as string}
                    value={query}
                    onChangeText={setQuery}
                    autoFocus
                  />
                  <ScrollView style={styles.dropdownList} keyboardShouldPersistTaps="handled">
                    {filteredExercises.map((e, idx) => (
                      <TouchableOpacity
                        key={e.id}
                        style={[
                          styles.dropdownItem,
                          { borderBottomColor: t.border },
                          idx === filteredExercises.length - 1 && styles.dropdownItemLast,
                          e.id === activeId && styles.dropdownItemActive,
                        ]}
                        onPress={() => handleSelectExercise(e.id)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: t.textPrimary },
                            e.id === activeId && styles.dropdownItemTextActive,
                          ]}
                        >
                          {e.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {filteredExercises.length === 0 && (
                      <View style={styles.dropdownEmpty}>
                        <Text style={[styles.dropdownEmptyText, { color: t.textSecondary }]}>
                          No exercises found.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {hasWeight && (
                <>
                  <View style={styles.chartLabelRow}>
                    <Text style={[styles.chartSectionLabel, { color: t.textSecondary }]}>Weight</Text>
                    <View style={[styles.unitToggle, { borderColor: t.border, backgroundColor: t.background }]}>
                      {(['lbs', 'kg'] as const).map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                          onPress={() => setWeightUnit(u)}
                        >
                          <Text style={[styles.unitBtnText, { color: weightUnit === u ? colors.textInverse : t.textSecondary }]}>
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <ExerciseProgressChart data={progressData} unit={weightUnit} />
                </>
              )}
              {hasDuration && (
                <>
                  {hasWeight && <View style={[styles.separator, { backgroundColor: t.border }]} />}
                  <ExerciseProgressChart data={durationProgressData} unit="secs" title="Duration" />
                </>
              )}
              {(hasWeight || hasDuration) && repsProgressData.length >= 2 && (
                <View style={[styles.separator, { backgroundColor: t.border }]} />
              )}
              <ExerciseProgressChart data={repsProgressData} unit="reps" title="Reps" />
            </View>
          )}
        </View>
      )}

      {/* Volume Over Past Workouts — full width below */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.chartLabelRow}>
          <Text style={[styles.label, { color: t.textSecondary }]}>Volume Over Past Workouts</Text>
          <View style={[styles.unitToggle, { borderColor: t.border, backgroundColor: t.background }]}>
            {(['lbs', 'kg'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}
                onPress={() => setWeightUnit(u)}
              >
                <Text style={[styles.unitBtnText, { color: weightUnit === u ? colors.textInverse : t.textSecondary }]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.nPickerRow}>
          {LAST_N_OPTIONS.map((opt) => {
            const active = lastN === opt;
            return (
              <TouchableOpacity
                key={String(opt)}
                style={[styles.nPickerBtn, { borderColor: active ? colors.primary : t.border }, active && styles.nPickerBtnActive]}
                onPress={() => setLastN(opt)}
              >
                <Text style={[styles.nPickerText, { color: active ? colors.textInverse : t.textSecondary }]}>
                  {opt === 'All' ? 'All' : `Last ${opt}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <VolumeChart data={slicedVolumeData} unit={weightUnit} />
      </View>
      </>)}
    </>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.md },
  emptyState: {
    borderRadius: radius.md, borderWidth: 1,
    padding: spacing.lg, alignItems: 'center',
  },
  emptyStateText: { ...typography.bodySmall, textAlign: 'center' },
  card: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, gap: spacing.sm },
  sideRow: { flexDirection: 'column', gap: spacing.sm },
  sideCard: {},
  label: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Dropdown button
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dropdownBtnText: { ...typography.bodySmall, flex: 1, marginRight: spacing.xs },

  // Dropdown panel
  dropdownPanel: {
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  searchInput: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.bodySmall,
  },
  dropdownList: { maxHeight: 150 },
  dropdownItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemActive: { backgroundColor: colors.primary + '22' },
  dropdownItemText: { ...typography.bodySmall },
  dropdownItemTextActive: { color: colors.primary, fontWeight: '600' },
  dropdownEmpty: { padding: spacing.sm, alignItems: 'center' },
  dropdownEmptyText: { ...typography.bodySmall },

  // Separator between weight and reps charts
  separator: { height: 1, marginVertical: spacing.sm },

  // Weight unit toggle
  chartLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  chartSectionLabel: { ...typography.label },
  unitToggle: { flexDirection: 'row', borderRadius: radius.sm, borderWidth: 1, overflow: 'hidden' },
  unitBtn: { paddingVertical: 3, paddingHorizontal: spacing.sm },
  unitBtnActive: { backgroundColor: colors.primary },
  unitBtnText: { ...typography.label, fontWeight: '600' },

  // Last-N picker
  nPickerRow: { flexDirection: 'row', gap: spacing.xs },
  nPickerBtn: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
  },
  nPickerBtnActive: { backgroundColor: colors.primary },
  nPickerText: { ...typography.label, fontWeight: '600' },

  // Range selector
  rangeRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  rangeChip: {
    flex: 1,
    minWidth: 40,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  rangeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeChipText: { ...typography.label, fontWeight: '600', textAlign: 'center' },
  rangeChipTextActive: { color: colors.textInverse },

  // Personal Records card
  prHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prTitleRow: { flexDirection: 'row', alignItems: 'center' },
  prEmpty: { ...typography.bodySmall, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.sm },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  prExerciseCol: { flex: 1, minWidth: 0 },
  prExerciseName: { ...typography.bodySmall, fontWeight: '600' },
  prMuscle: { ...typography.label, marginTop: 1 },
  prBadgeCol: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0 },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  prBadgeText: { ...typography.label, fontWeight: '700' },
  prToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  prToggleText: { ...typography.bodySmall, fontWeight: '600' },
});
