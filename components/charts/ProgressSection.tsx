import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrequencyChart } from './FrequencyChart';
import { VolumeChart } from './VolumeChart';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { useClientProgress } from '@/hooks/useClientProgress';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';

type Range = '1M' | '3M' | '6M' | '1Y' | 'All';
const RANGES: Range[] = ['1M', '3M', '6M', '1Y', 'All'];
const DAYS_BACK: Record<Range, number | undefined> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'All': undefined,
};

type Props = { clientId: string };

export default function ProgressSection({ clientId }: Props) {
  const t = useTheme();
  const [range, setRange] = useState<Range>('All');
  const {
    frequencyData, frequencyStats, volumeData,
    bodyWeightData, bodyFatData,
    exercises, getExerciseProgress, getExerciseRepsProgress, loading, error,
  } = useClientProgress(clientId, DAYS_BACK[range]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');

  if (loading) return <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />;
  if (error) return null;

  const noData = frequencyStats.totalWorkouts === 0;
  const activeId = selectedExerciseId ?? exercises[0]?.id ?? null;
  const activeExercise = exercises.find((e) => e.id === activeId);
  const progressData = activeId ? getExerciseProgress(activeId) : [];
  const repsProgressData = activeId ? getExerciseRepsProgress(activeId) : [];

  const filteredExercises = query.trim()
    ? exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : exercises;

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setDropdownOpen(false);
    setQuery('');
  };

  return (
    <>
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
            onPress={() => setRange(r)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.rangeChipText,
              { color: t.textSecondary },
              r === range && styles.rangeChipTextActive,
            ]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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

              <ExerciseProgressChart data={progressData} unit="kg" title="Weight" />
              <View style={[styles.separator, { backgroundColor: t.border }]} />
              <ExerciseProgressChart data={repsProgressData} unit="reps" title="Reps" />
            </View>
          )}
        </View>
      )}

      {/* Volume Over Time — full width below */}
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <Text style={[styles.label, { color: t.textSecondary }]}>Volume Over Time</Text>
        <VolumeChart data={volumeData} />
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

  // Range selector
  rangeRow: { flexDirection: 'row', gap: spacing.xs },
  rangeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  rangeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rangeChipText: { ...typography.label, fontWeight: '600' },
  rangeChipTextActive: { color: colors.textInverse },
});
