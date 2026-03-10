import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { generateAndShare } from '@/lib/generateReportPdf';
import type { ReportWorkout, ReportExercisePR, BodyProgressPoint } from '@/lib/generateReportPdf';

// ─── Types ────────────────────────────────────────────────────────

type Period = 'week' | '4weeks' | '12weeks' | 'custom';
type State = 'idle' | 'selecting' | 'generating';

const PRESET_PERIODS: Period[] = ['week', '4weeks', '12weeks'];

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  '4weeks': 'Last 4 Weeks',
  '12weeks': 'Last 12 Weeks',
  custom: 'Custom',
};

type Props = {
  clientId: string;
  clientName?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────

function getPresetBounds(period: Exclude<Period, 'custom'>): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (period === 'week') {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (period === '4weeks') {
    start.setDate(start.getDate() - 27);
  } else {
    start.setDate(start.getDate() - 83);
  }
  return { start, end };
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtCustomLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

// ─── Component ────────────────────────────────────────────────────

export default function ReportCardButton({ clientId, clientName }: Props) {
  const t = useTheme();
  const { trainer } = useAuth();
  const [uiState, setUiState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  // Calendar state (custom period)
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [allWorkoutDates, setAllWorkoutDates] = useState<string[]>([]);
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [loadingDates, setLoadingDates] = useState(false);

  // ── Core generation logic ──────────────────────────────────────

  async function doGenerate(start: Date, end: Date, periodLabel: string) {
    setUiState('generating');
    setError(null);

    const startIso = toIso(start);
    const endIso = toIso(end);

    // Fetch workouts + sets for period
    const { data: rawWorkouts, error: wErr } = await supabase
      .from('workouts')
      .select(`
        id, performed_at, notes, body_weight_kg, body_fat_percent,
        workout_sets (
          set_number, reps, weight_kg, duration_seconds, exercise_id,
          exercise:exercises ( name )
        )
      `)
      .eq('client_id', clientId)
      .gte('performed_at', startIso)
      .lte('performed_at', endIso)
      .order('performed_at', { ascending: false });

    if (wErr) { setError(wErr.message); setUiState('selecting'); return; }

    // Fetch prior workout IDs for PR comparison
    const { data: priorWorkoutIds } = await supabase
      .from('workouts')
      .select('id')
      .eq('client_id', clientId)
      .lt('performed_at', startIso);

    const ids = (priorWorkoutIds ?? []).map((w) => w.id);
    const { data: priorSets } = ids.length > 0
      ? await supabase
          .from('workout_sets')
          .select('exercise_id, weight_kg, exercise:exercises ( name )')
          .in('workout_id', ids)
      : { data: [] };

    // Fetch client name
    const { data: clientRow } = await supabase
      .from('clients')
      .select('full_name')
      .eq('id', clientId)
      .single();

    // Build report workouts
    type RawSet = {
      set_number: number;
      reps: number | null;
      weight_kg: number | null;
      duration_seconds: number | null;
      exercise_id: string;
      exercise: { name: string } | null;
    };
    type RawWorkout = {
      performed_at: string;
      notes: string | null;
      body_weight_kg: number | null;
      body_fat_percent: number | null;
      workout_sets: RawSet[];
    };

    const workouts: ReportWorkout[] = ((rawWorkouts ?? []) as unknown as RawWorkout[]).map((w) => {
      const exerciseOrder: string[] = [];
      const byExercise = new Map<string, { name: string; sets: RawSet[] }>();
      for (const s of w.workout_sets) {
        if (!byExercise.has(s.exercise_id)) {
          exerciseOrder.push(s.exercise_id);
          byExercise.set(s.exercise_id, { name: s.exercise?.name ?? 'Unknown', sets: [] });
        }
        byExercise.get(s.exercise_id)!.sets.push(s);
      }
      return {
        performed_at: w.performed_at,
        notes: w.notes,
        exercises: exerciseOrder.map((eid) => {
          const ex = byExercise.get(eid)!;
          return {
            name: ex.name,
            sets: ex.sets
              .sort((a, b) => a.set_number - b.set_number)
              .map((s) => ({
                set_number: s.set_number,
                reps: s.reps,
                weight_kg: s.weight_kg,
                duration_seconds: s.duration_seconds,
              })),
          };
        }),
      };
    });

    // Period bests
    const periodBests = new Map<string, { maxWeight: number | null }>();
    for (const w of workouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const prev = periodBests.get(ex.name);
          if (!prev) {
            periodBests.set(ex.name, { maxWeight: s.weight_kg });
          } else if (s.weight_kg != null && (prev.maxWeight == null || s.weight_kg > prev.maxWeight)) {
            prev.maxWeight = s.weight_kg;
          }
        }
      }
    }

    // Prior bests
    const priorBests = new Map<string, number>();
    type PriorSet = { weight_kg: number | null; exercise: { name: string } | null };
    for (const ps of ((priorSets ?? []) as unknown as PriorSet[])) {
      if (ps.weight_kg == null || !ps.exercise?.name) continue;
      const name = ps.exercise.name;
      const prev = priorBests.get(name) ?? null;
      if (prev == null || ps.weight_kg > prev) priorBests.set(name, ps.weight_kg);
    }

    const exercisePRs: ReportExercisePR[] = Array.from(periodBests.entries()).map(([name, info]) => {
      const prevMax = priorBests.get(name) ?? null;
      return {
        name,
        maxWeight: info.maxWeight,
        prevMaxWeight: prevMax,
        isNew: info.maxWeight != null && (prevMax == null || info.maxWeight > prevMax),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Build body progress from period workouts (oldest first)
    const bodyProgress: BodyProgressPoint[] = ((rawWorkouts ?? []) as unknown as RawWorkout[])
      .slice()
      .reverse()
      .filter((w) => w.body_weight_kg != null || w.body_fat_percent != null)
      .map((w) => {
        const wt = w.body_weight_kg;
        const bf = w.body_fat_percent;
        const lbm = wt != null && bf != null ? Math.round(wt * (1 - bf / 100) * 10) / 10 : null;
        return { date: w.performed_at.split('T')[0], weight_kg: wt, bf_percent: bf, lbm_kg: lbm };
      });

    const { error: genErr } = await generateAndShare({
      clientName: clientName ?? clientRow?.full_name ?? 'Client',
      trainerName: trainer?.full_name ?? 'Your Trainer',
      periodLabel,
      periodStart: startIso,
      periodEnd: endIso,
      workouts,
      exercisePRs,
      bodyProgress,
      generatedAt: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    });

    if (genErr) setError(genErr);
    setUiState('idle');
  }

  // ── Period selection ───────────────────────────────────────────

  function handlePresetPress(period: Exclude<Period, 'custom'>) {
    const { start, end } = getPresetBounds(period);
    doGenerate(start, end, PERIOD_LABELS[period]);
  }

  async function handleCustomPress() {
    setLoadingDates(true);
    const { data } = await supabase
      .from('workouts')
      .select('performed_at')
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false });
    setAllWorkoutDates((data ?? []).map((w) => w.performed_at.split('T')[0]));
    setLoadingDates(false);
    setCalendarVisible(true);
  }

  function handleCalendarConfirm(start: Date, end: Date) {
    setCalendarVisible(false);
    setCustomStart(start);
    setCustomEnd(end);
    doGenerate(start, end, fmtCustomLabel(start, end));
  }

  // ── Render ────────────────────────────────────────────────────

  if (uiState === 'generating') {
    return (
      <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.generatingText, { color: t.textSecondary }]}>Generating report…</Text>
      </View>
    );
  }

  if (uiState === 'selecting') {
    return (
      <>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.selectTitle, { color: t.textPrimary }]}>Select Report Period</Text>

          {/* All period buttons in one row */}
          <View style={styles.periodRow}>
            {PRESET_PERIODS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, { borderColor: colors.primary }]}
                onPress={() => handlePresetPress(p as Exclude<Period, 'custom'>)}
                activeOpacity={0.7}
              >
                <Text style={styles.periodBtnText}>{PERIOD_LABELS[p]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.periodBtn, { borderColor: colors.primary }]}
              onPress={handleCustomPress}
              activeOpacity={0.7}
              disabled={loadingDates}
            >
              {loadingDates
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="calendar-outline" size={15} color={colors.primary} />
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setUiState('idle')} style={styles.cancelRow}>
            <Text style={[styles.cancelText, { color: t.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <DateRangePicker
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          onConfirm={handleCalendarConfirm}
          workoutDates={allWorkoutDates}
          initialStart={customStart}
          initialEnd={customEnd}
        />
      </>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.reportBtn, { borderColor: colors.primary }]}
        onPress={() => { setError(null); setUiState('selecting'); }}
        activeOpacity={0.7}
      >
        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
        <Text style={styles.reportBtnText}>Performance Report</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, borderWidth: 1, borderRadius: radius.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  reportBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  card: {
    borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  generatingText: { ...typography.body, textAlign: 'center' },
  selectTitle: { ...typography.body, fontWeight: '600', textAlign: 'center' },
  periodRow: { flexDirection: 'row', gap: spacing.sm },
  periodBtn: {
    flex: 1, borderWidth: 1, borderRadius: radius.sm,
    paddingVertical: spacing.sm, alignItems: 'center',
  },
periodBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  cancelRow: { alignItems: 'center', paddingTop: spacing.xs },
  cancelText: { ...typography.bodySmall },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
});
