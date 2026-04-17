import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator, Alert, BackHandler, Modal, Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { TemplatePicker } from '@/components/workout/TemplatePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { createWorkoutWithSets } from '@/hooks/useWorkouts';
import { createAssignedWorkout } from '@/hooks/useAssignedWorkouts';
import { checkAndSavePRs } from '@/hooks/usePersonalRecords';
import { useExercises } from '@/hooks/useExercises';
import { useClients, useClient } from '@/hooks/useClients';
import { useAuth } from '@/lib/auth';
import { useClientIntake } from '@/hooks/useClientIntake';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { estimateBlockKcal } from '@/lib/calorieEstimation';
import { parseWorkoutNotes } from '@/lib/workoutNotesAI';
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal';
import type { Exercise, NewPR } from '@/types';
import type { WorkoutTemplate } from '@/constants/workoutTemplates';

// ─── Template name normalisation ─────────────────────────────────
// Strips set/rep prescriptions embedded in clinical template exercise
// names (e.g. "Goblet Squat 3×12–15" → "goblet squat") so they can be
// matched against the exercises table which stores clean names only.
function normalizeExerciseName(name: string): string {
  return name
    .replace(/\s+\d+\s*[×x]\s*\S+.*/i, '')          // "3×12", "3×8/side"
    .replace(/\s+\d+[-–\d]*\s*(reps?|sets?|sec(onds?)?|min(utes?)?|yards?|rounds?|holds?|times?)\b.*/gi, '') // "10 reps", "45 sec"
    .replace(/\s*\([^)]+\)\s*$/g, '')                 // trailing "(warm-up)"
    .trim()
    .toLowerCase();
}

// ─── Injury contraindication rules ───────────────────────────────
type ContraindicationRule = {
  injuryKeywords: string[];
  exerciseKeywords: string[];
  label: string;
};

const CONTRAINDICATION_RULES: ContraindicationRule[] = [
  {
    injuryKeywords: ['knee', 'patellar', 'meniscus', 'acl', 'mcl', 'pcl', 'patella'],
    exerciseKeywords: ['squat', 'lunge', 'jump', 'box', 'step-up', 'split squat', 'leg press', 'leg extension', 'skater', 'run', 'sprint', 'plyometric'],
    label: 'knee',
  },
  {
    injuryKeywords: ['shoulder', 'rotator', 'cuff', 'impingement', 'labrum', 'ac joint'],
    exerciseKeywords: ['press', 'fly', 'overhead', 'lateral raise', 'front raise', 'dip', 'pull-up', 'pullup', 'pulldown', 'row', 'upright'],
    label: 'shoulder',
  },
  {
    injuryKeywords: ['lower back', 'lumbar', 'disc', 'herniated', 'sciatica', 'spondyl'],
    exerciseKeywords: ['deadlift', 'row', 'squat', 'good morning', 'hyperextension', 'back extension'],
    label: 'lower back',
  },
  {
    injuryKeywords: ['hip', 'hip flexor', 'hip bursitis', 'hip impingement', 'hip labrum'],
    exerciseKeywords: ['squat', 'lunge', 'hip thrust', 'deadlift', 'step-up', 'split squat'],
    label: 'hip',
  },
  {
    injuryKeywords: ['elbow', 'tennis elbow', 'golfer', 'epicondylitis'],
    exerciseKeywords: ['curl', 'extension', 'push-up', 'pushup', 'dip', 'row', 'pulldown', 'chin-up'],
    label: 'elbow',
  },
  {
    injuryKeywords: ['wrist', 'carpal', 'de quervain', 'wrist pain'],
    exerciseKeywords: ['curl', 'press', 'push-up', 'pushup', 'row', 'plank', 'wrist', 'grip', 'hang', 'pull-up', 'pullup'],
    label: 'wrist',
  },
  {
    injuryKeywords: ['finger', 'trigger finger', 'mallet', 'knuckle', 'thumb', 'dupuytren'],
    exerciseKeywords: ['grip', 'curl', 'pinch', 'squeeze', 'hang', 'pull-up', 'pullup', 'row', 'deadlift'],
    label: 'finger/hand',
  },
  {
    injuryKeywords: ['ankle', 'achilles', 'peroneal', 'lateral ankle'],
    exerciseKeywords: ['calf', 'jump', 'lunge', 'squat', 'run', 'sprint', 'agility', 'plyometric', 'box', 'hop'],
    label: 'ankle',
  },
  {
    injuryKeywords: ['plantar', 'plantar fasciitis', 'heel', 'heel spur'],
    exerciseKeywords: ['calf', 'jump', 'run', 'sprint', 'lunge', 'squat', 'step-up', 'box'],
    label: 'plantar/heel',
  },
  {
    injuryKeywords: ['foot', 'metatarsal', 'stress fracture', 'bunion', 'morton', 'toe'],
    exerciseKeywords: ['jump', 'run', 'sprint', 'lunge', 'squat', 'calf', 'agility', 'step-up'],
    label: 'foot/toe',
  },
  {
    injuryKeywords: ['neck', 'cervical'],
    exerciseKeywords: ['shrug', 'upright row', 'overhead', 'neck'],
    label: 'neck',
  },
];

function getInjuryWarning(
  exercise: Exercise,
  currentInjuries: string | null,
  pastInjuries: string | null,
): { message: string; isCurrent: boolean } | null {
  const currentText = (currentInjuries ?? '').toLowerCase();
  const pastText    = (pastInjuries   ?? '').toLowerCase();
  const exerciseText = `${exercise.name} ${exercise.muscle_group ?? ''}`.toLowerCase();

  for (const rule of CONTRAINDICATION_RULES) {
    const matchedCurrent = rule.injuryKeywords.find((k) => currentText.includes(k));
    const matchedPast    = rule.injuryKeywords.find((k) => pastText.includes(k));
    const injuryMatch = matchedCurrent ?? matchedPast;
    if (!injuryMatch) continue;

    const exerciseMatches = rule.exerciseKeywords.some((k) => exerciseText.includes(k));
    if (!exerciseMatches) continue;

    const isCurrent = Boolean(matchedCurrent);
    return {
      message: isCurrent
        ? `This client has a current ${rule.label} injury. "${exercise.name}" may aggravate it.`
        : `This client has a history of ${rule.label} issues. "${exercise.name}" may be risky.`,
      isCurrent,
    };
  }
  return null;
}

const SUPERSET_COLORS = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6'];
function getSupersetColor(group: number): string {
  return SUPERSET_COLORS[(group - 1) % SUPERSET_COLORS.length];
}

type Mode = 'log' | 'assign';
type WeightUnit = 'lbs' | 'kg' | 'secs';
type SetRow = { reps: string; amount: string; notes: string };
type ExerciseBlock = { exercise: Exercise; sets: SetRow[]; linkedToNext: boolean; unit: WeightUnit; restSecs: number };

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

const EMPTY_BLOCK = (exercise: Exercise): ExerciseBlock =>
  ({ exercise, sets: [{ ...EMPTY_SET }], linkedToNext: false, unit: 'lbs', restSecs: 120 });

function formatDate(iso: string) {
  // Avoid timezone shift by parsing as local date
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Rest timer ───────────────────────────────────────────────

type TimerEntry = { remaining: number; total: number; running: boolean };

/** Format seconds as M:SS */
function fmtCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format seconds as a human label, e.g. "1 min 30 sec" */
function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

const REST_PRESETS = [0, 30, 60, 90, 120, 150, 180] as const;


type WorkoutSummary = {
  workoutSeconds: number;
  restSeconds: number;
  tutSeconds: number;
  totalKcal: number;
  prs: NewPR[];
};

export default function NewWorkoutScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [isDirty, setIsDirty] = useState(false);
  const { user, role } = useAuth();
  const isLinkedClient = role === 'client';
  const t = useTheme();
  const { exercises: allExercises } = useExercises();
  const { clients } = useClients();
  const singleClientId = Array.isArray(clientId) ? clientId[0] : clientId;
  const { intake } = useClientIntake(singleClientId ?? '');
  // For linked clients: fetch the target client to get their trainer_id (required on workouts table)
  const { client: targetClient } = useClient(isLinkedClient ? (singleClientId ?? '') : '');
  // ── mode ──
  const [mode, setMode] = useState<Mode>('log');
  // ── log-now state ──
  const [workedOutWith, setWorkedOutWith] = useState<Set<string>>(new Set());
  const [showWorkedOutWith, setShowWorkedOutWith] = useState(false);
  const [showAssignTo, setShowAssignTo] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  // ── assign-for-later state ──
  const [scheduledDate, setScheduledDate] = useState(getTomorrow);
  const [showScheduledCalendar, setShowScheduledCalendar] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [assignedClients, setAssignedClients] = useState<Set<string>>(() => {
    const id = Array.isArray(clientId) ? clientId[0] : clientId;
    return id ? new Set([id]) : new Set();
  });
  // ── shared state ──
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null);
  const [injuryWarning, setInjuryWarning] = useState<{ message: string; isCurrent: boolean } | null>(null);

  // ── Notes parser state ────────────────────────────────────────
  const [showNotesPicker, setShowNotesPicker] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [parsingNotes, setParsingNotes] = useState(false);
  const [notesParseError, setNotesParseError] = useState<string | null>(null);

  // ── Rest timer state ──────────────────────────────────────────
  const [defaultRestSecs, setDefaultRestSecs] = useState(120);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [timers, setTimers] = useState<Record<string, TimerEntry>>({});
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);
  const workoutStartRef = useRef(Date.now());
  // Set to Date.now() the moment the first exercise block is added
  const firstExerciseTimeRef = useRef<number | null>(null);
  const [restToast, setRestToast] = useState<string | null>(null);
  const completionQueueRef = useRef<Array<{ total: number }>>([]);

  // ── Workout summary modal ─────────────────────────────────────
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);

  function addExercise(exercise: Exercise) {
    setIsDirty(true);
    if (firstExerciseTimeRef.current === null) {
      firstExerciseTimeRef.current = Date.now();
    }
    setBlocks((prev) => [...prev, EMPTY_BLOCK(exercise)]);
  }

  function removeBlock(bi: number) {
    setIsDirty(true);
    setBlocks((prev) => {
      const next = prev.filter((_, i) => i !== bi);
      // If the removed block was linked to next, unlink the previous block
      if (bi > 0 && prev[bi - 1].linkedToNext && bi === prev.length - 1) {
        return next.map((b, i) => i === bi - 1 ? { ...b, linkedToNext: false } : b);
      }
      return next;
    });
    // Remove all timer entries for this block
    setTimers((prev) => {
      const next = { ...prev };
      Object.keys(next).filter((k) => k.startsWith(`${bi}-`)).forEach((k) => delete next[k]);
      return next;
    });
  }

  function addSet(bi: number) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b)
    );
  }

  function updateBlockUnit(bi: number, unit: WeightUnit) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, unit } : b));
  }

  function updateBlockRestSecs(bi: number, secs: number) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, restSecs: secs } : b));
  }

  function updateSet(bi: number, si: number, field: keyof SetRow, value: string) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bi ? { ...b, sets: b.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) } : b
      )
    );
  }

  function removeSet(bi: number, si: number) {
    setIsDirty(true);
    setBlocks((prev) =>
      prev.map((b, i) => i === bi ? { ...b, sets: b.sets.filter((_, j) => j !== si) } : b)
    );
    setTimers((prev) => {
      const { [`${bi}-${si}`]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function toggleLink(bi: number) {
    setIsDirty(true);
    setBlocks((prev) => prev.map((b, i) => i === bi ? { ...b, linkedToNext: !b.linkedToNext } : b));
  }

  // ── Rest timer logic ──────────────────────────────────────────

  // Single interval ticking all running timers down every second
  useEffect(() => {
    const id = setInterval(() => {
      setTimers((prev) => {
        const keys = Object.keys(prev).filter((k) => prev[k].running);
        if (keys.length === 0) return prev;
        const next = { ...prev };
        for (const k of keys) {
          const entry = next[k];
          if (entry.remaining > 1) {
            next[k] = { ...entry, remaining: entry.remaining - 1 };
          } else {
            // Completed
            next[k] = { ...entry, remaining: 0, running: false };
            completionQueueRef.current.push({ total: entry.total });
          }
        }
        return next;
      });
      // Process completions outside setState
      if (completionQueueRef.current.length > 0) {
        const queue = completionQueueRef.current.splice(0);
        const totalAdded = queue.reduce((s, c) => s + c.total, 0);
        setTimeout(() => {
          Vibration.vibrate([0, 300, 150, 300]);
          setTotalRestSeconds((s) => s + totalAdded);
          setRestToast('Rest complete — ready for your next set!');
        }, 0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-dismiss rest toast after 3s
  useEffect(() => {
    if (!restToast) return;
    const id = setTimeout(() => setRestToast(null), 3000);
    return () => clearTimeout(id);
  }, [restToast]);

  function startTimer(key: string) {
    setTimers((prev) => ({
      ...prev,
      [key]: { remaining: defaultRestSecs, total: defaultRestSecs, running: true },
    }));
  }

  function cancelTimer(key: string) {
    setTimers((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function handleSelectTemplate(template: WorkoutTemplate) {
    const matched: ExerciseBlock[] = [];
    const skipped: string[] = [];

    for (const name of template.exerciseNames) {
      const exercise = allExercises.find(
        (e) => normalizeExerciseName(e.name) === normalizeExerciseName(name)
      );
      if (exercise) {
        matched.push(EMPTY_BLOCK(exercise));
      } else {
        skipped.push(name);
      }
    }

    const apply = () => {
      setIsDirty(true);
      setBlocks(matched);
      setShowTemplatePicker(false);
      if (skipped.length > 0) {
        Alert.alert(
          'Some exercises not found',
          `The following exercises aren't in your library yet and were skipped:\n\n${skipped.join('\n')}\n\nYou can add them manually.`,
          [{ text: 'OK' }],
        );
      }
    };

    if (blocks.length > 0) {
      Alert.alert(
        'Replace current workout?',
        `Loading "${template.name}" will replace the ${blocks.length} exercise${blocks.length !== 1 ? 's' : ''} you've already added.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: apply },
        ],
      );
    } else {
      apply();
    }
  }

  async function handleParseNotes() {
    if (!notesText.trim()) return;
    setParsingNotes(true);
    setNotesParseError(null);

    const { exercises, error } = await parseWorkoutNotes(notesText);
    setParsingNotes(false);

    if (error) { setNotesParseError(error); return; }

    if (exercises.length === 0) {
      setNotesParseError('No exercises found. Try: "Bench Press 3×8 185lbs, Squat 4×5 225kg"');
      return;
    }

    const matched: ExerciseBlock[] = [];
    const unmatched: string[] = [];

    for (const parsed of exercises) {
      const parsedNorm = parsed.exercise_name.trim().toLowerCase();
      const found = allExercises.find((e) => {
        const norm = normalizeExerciseName(e.name);
        return norm === parsedNorm || norm.includes(parsedNorm) || parsedNorm.includes(norm);
      });

      if (found) {
        const sets: SetRow[] = parsed.sets.map((s) => ({
          reps: s.reps != null ? String(s.reps) : '',
          amount: s.amount,
          notes: s.notes,
        }));
        matched.push({
          exercise: found,
          sets: sets.length > 0 ? sets : [{ ...EMPTY_SET }],
          linkedToNext: false,
          unit: parsed.sets[0]?.unit ?? 'lbs',
          restSecs: defaultRestSecs,
        });
      } else {
        unmatched.push(parsed.exercise_name);
      }
    }

    if (matched.length === 0) {
      setNotesParseError(
        `None matched your exercise library:\n${unmatched.join(', ')}\n\nCheck spelling or add them manually.`,
      );
      return;
    }

    const applyBlocks = () => {
      setIsDirty(true);
      setBlocks(matched);
      setShowNotesPicker(false);
      setNotesText('');
      setNotesParseError(null);
      if (unmatched.length > 0) {
        Alert.alert(
          'Some exercises not found',
          `These weren't in your library:\n\n${unmatched.join('\n')}\n\nYou can add them manually.`,
          [{ text: 'OK' }],
        );
      }
    };

    if (blocks.length > 0) {
      Alert.alert(
        'Replace current workout?',
        `This will replace the ${blocks.length} exercise${blocks.length !== 1 ? 's' : ''} already added.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace', style: 'destructive', onPress: applyBlocks },
        ],
      );
    } else {
      applyBlocks();
    }
  }

  const handleAssign = useCallback(async () => {
    if (!user) { Alert.alert('Not signed in', 'Please sign in to assign workouts.'); return; }
    if (assignedClients.size === 0) { Alert.alert('No clients selected', 'Select at least one client to assign this workout to.'); return; }
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before assigning.'); return; }

    let groupCounter = 0;
    const blockGroups: (number | null)[] = new Array(blocks.length).fill(null);
    for (let i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].linkedToNext) {
        if (blockGroups[i] === null) blockGroups[i] = ++groupCounter;
        blockGroups[i + 1] = blockGroups[i];
      }
    }

    const exercises = blocks.map((b, bi) => ({
      exercise_id: b.exercise.id,
      order_index: bi,
      superset_group: blockGroups[bi],
      rest_seconds: b.restSecs,
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
      const results = await Promise.all(
        [...assignedClients].map((cid) =>
          createAssignedWorkout(cid, user.id, {
            title: workoutTitle.trim() || null,
            scheduled_date: scheduledDate,
            notes: workoutNotes.trim() || null,
            exercises,
          })
        )
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) {
        Alert.alert('Error saving assigned workout', firstError);
      } else {
        setIsDirty(false);
        router.back();
      }
    } catch (e) {
      Alert.alert('Unexpected error', e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [user, assignedClients, blocks, workoutTitle, scheduledDate, workoutNotes, router]);

  const handleSave = useCallback(async () => {
    if (!user || !clientId) return;
    if (blocks.length === 0) { Alert.alert('No exercises', 'Add at least one exercise before saving.'); return; }

    // Linked clients use the target client's trainer_id (workouts.trainer_id is NOT NULL)
    const effectiveTrainerId = isLinkedClient ? (targetClient?.trainer_id ?? '') : user.id;
    if (!effectiveTrainerId) { Alert.alert('Error', 'Could not determine trainer. Try again.'); return; }

    // Compute superset_group per block using linkedToNext chain
    let groupCounter = 0;
    const blockGroups: (number | null)[] = new Array(blocks.length).fill(null);
    for (let i = 0; i < blocks.length - 1; i++) {
      if (blocks[i].linkedToNext) {
        if (blockGroups[i] === null) blockGroups[i] = ++groupCounter;
        blockGroups[i + 1] = blockGroups[i];
      }
    }

    const allSets = blocks.flatMap((b, bi) =>
      b.sets
        .filter((s) => s.reps.trim() !== '' || s.amount.trim() !== '')
        .map((s, si) => ({
          exercise_id: b.exercise.id,
          set_number: si + 1,
          superset_group: blockGroups[bi],
          reps: s.reps.trim() ? parseInt(s.reps, 10) : null,
          ...resolveAmount(s.amount, b.unit),
          notes: s.notes.trim() || null,
        }))
    );
    if (allSets.length === 0) { Alert.alert('No sets entered', 'Add at least one set with reps or weight.'); return; }

    const wVal = bodyWeight.trim() ? parseFloat(bodyWeight) : NaN;
    const bfVal = bodyFat.trim() ? parseFloat(bodyFat) : NaN;

    setSaving(true);
    const { error } = await createWorkoutWithSets(
      {
        client_id: clientId,
        trainer_id: effectiveTrainerId,
        performed_at: date,
        notes: workoutNotes.trim() || null,
        body_weight_kg: !isNaN(wVal) && wVal > 0 ? wVal : null,
        body_fat_percent: !isNaN(bfVal) && bfVal >= 0 && bfVal < 100 ? bfVal : null,
        logged_by_role: isLinkedClient ? 'client' : 'trainer',
        logged_by_user_id: user.id,
      },
      allSets,
      isLinkedClient ? [] : [...workedOutWith],
    );
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setIsDirty(false);

      // Compute workout stats
      const saveTime = Date.now();
      const workoutSeconds = Math.round((saveTime - workoutStartRef.current) / 1000);
      const tutSeconds = firstExerciseTimeRef.current !== null
        ? Math.max(0, Math.round((saveTime - firstExerciseTimeRef.current) / 1000) - totalRestSeconds)
        : 0;

      // Check for personal records (fail-safe: show summary even on error)
      const setsForPR = allSets
        .filter((s) => s.reps != null || s.weight_kg != null)
        .map((s) => ({
          exercise_id: s.exercise_id,
          exercise_name: blocks.find((b) => b.exercise.id === s.exercise_id)?.exercise.name ?? '',
          reps: s.reps ?? null,
          weight_kg: s.weight_kg ?? null,
        }));

      const prs = await checkAndSavePRs(
        Array.isArray(clientId) ? clientId[0] : clientId,
        date,
        setsForPR,
        'lbs',
      );

      const bwKg = bodyWeight.trim() ? parseFloat(bodyWeight) : null;
      const totalKcal = blocks.reduce((sum, b) =>
        sum + estimateBlockKcal(b.sets, b.unit, bwKg, b.exercise.name), 0,
      );

      setWorkoutSummary({
        workoutSeconds,
        restSeconds: totalRestSeconds,
        tutSeconds,
        totalKcal,
        prs,
      });
      setSummaryVisible(true);
    }
  }, [user, isLinkedClient, targetClient, clientId, blocks, date, workoutNotes, bodyWeight, bodyFat, workedOutWith, router]);

  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const handleBackPress = useCallback(() => {
    if (!isDirty) { router.back(); return; }
    setShowUnsavedModal(true);
  }, [isDirty, router]);

  // Keep header buttons and gesture guard in sync with dirty state
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isDirty,
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleBackPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="home-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [isDirty, handleBackPress, navigation]);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isDirty) return false;
      handleBackPress();
      return true;
    });
    return () => sub.remove();
  }, [isDirty, handleBackPress]);

  // ── Template picker ───────────────────────────────────────────────
  if (showTemplatePicker) {
    return (
      <TemplatePicker
        onSelect={handleSelectTemplate}
        onClose={() => setShowTemplatePicker(false)}
        clientIntake={intake}
        clientId={singleClientId}
        client={targetClient}
      />
    );
  }

  // ── Exercise picker ───────────────────────────────────────────────
  if (showPicker) {
    return (
      <ExercisePicker
        onSelect={(exercise) => {
          const warning = getInjuryWarning(
            exercise,
            intake?.current_injuries ?? null,
            intake?.past_injuries    ?? null,
          );
          setShowPicker(false);
          if (warning) {
            setPendingExercise(exercise);
            setInjuryWarning(warning);
          } else {
            addExercise(exercise);
          }
        }}
        onClose={() => setShowPicker(false)}
      />
    );
  }

  // Compute superset group numbers for display coloring
  const displayGroups: (number | null)[] = new Array(blocks.length).fill(null);
  let _gc = 0;
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].linkedToNext) {
      if (displayGroups[i] === null) displayGroups[i] = ++_gc;
      displayGroups[i + 1] = displayGroups[i];
    }
  }

  // ── Workout builder ───────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          title: mode === 'log' ? 'Log Workout' : 'Assign Workout',
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
          {/* ── Mode toggle (trainers only — linked clients can only log) ── */}
          {!isLinkedClient && (
            <View style={[styles.modeToggle, { backgroundColor: t.background, borderColor: t.border }]}>
              {(['log', 'assign'] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeBtn, active && styles.modeBtnActive]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modeBtnText, { color: active ? colors.textInverse : t.textSecondary }]}>
                      {m === 'log' ? 'Log Now' : 'Assign for Later'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {mode === 'log' ? (
            <>
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setShowCalendar((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{formatDate(date)}</Text>
                <Ionicons
                  name={showCalendar ? 'calendar' : 'calendar-outline'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
              {showCalendar && (
                <DatePicker
                  value={date}
                  onChange={(d) => { setIsDirty(true); setDate(d); setShowCalendar(false); }}
                />
              )}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body weight (kg)</Text>
                  <TextInput
                    style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                    placeholder="Optional"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="decimal-pad"
                    value={bodyWeight}
                    onChangeText={(v) => { setIsDirty(true); setBodyWeight(v); }}
                  />
                </View>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Body fat (%)</Text>
                  <TextInput
                    style={[styles.metricInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                    placeholder="Optional"
                    placeholderTextColor={t.textSecondary}
                    keyboardType="decimal-pad"
                    value={bodyFat}
                    onChangeText={(v) => { setIsDirty(true); setBodyFat(v); }}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Workout Title</Text>
              <TextInput
                style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
                placeholder="e.g. Upper Body A"
                placeholderTextColor={t.textSecondary}
                value={workoutTitle}
                onChangeText={(v) => { setIsDirty(true); setWorkoutTitle(v); }}
              />
              <TouchableOpacity
                style={styles.dateTouchable}
                onPress={() => setShowScheduledCalendar((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.metricLabel, { color: t.textSecondary }]}>Scheduled Date</Text>
                <View style={styles.dateTouchableRight}>
                  <Text style={[styles.dateLabel, { color: t.textPrimary }]}>{formatDate(scheduledDate)}</Text>
                  <Ionicons
                    name={showScheduledCalendar ? 'calendar' : 'calendar-outline'}
                    size={18}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
              {showScheduledCalendar && (
                <DatePicker
                  value={scheduledDate}
                  onChange={(d) => { setIsDirty(true); setScheduledDate(d); setShowScheduledCalendar(false); }}
                />
              )}
            </>
          )}

          {/* ── Rest timer default — log mode only ── */}
          {mode === 'log' && (
            <View style={styles.restRow}>
              <View style={styles.restRowLeft}>
                <Ionicons name="timer-outline" size={14} color={t.textSecondary as string} />
                <Text style={[styles.restRowLabel, { color: t.textSecondary }]}>Rest timer</Text>
              </View>
              <View style={styles.restPresets}>
                {REST_PRESETS.map((secs) => {
                  const active = defaultRestSecs === secs;
                  return (
                    <TouchableOpacity
                      key={secs}
                      style={[
                        styles.restPresetBtn,
                        { borderColor: active ? colors.primary : t.border },
                        active && styles.restPresetBtnActive,
                      ]}
                      onPress={() => setDefaultRestSecs(secs)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.restPresetText, { color: active ? colors.textInverse : t.textSecondary }]}>
                        {fmtCountdown(secs)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <TextInput
            style={[styles.notesInput, { borderColor: t.border, color: t.textPrimary }]}
            placeholder={mode === 'log' ? 'Workout notes (optional)' : 'Instructions for client (optional)'}
            placeholderTextColor={t.textSecondary}
            value={workoutNotes}
            onChangeText={(v) => { setIsDirty(true); setWorkoutNotes(v); }}
            multiline
          />
        </View>

        {/* Assign to — only shown in Assign mode */}
        {mode === 'assign' && (
          <View style={[styles.groupSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => setShowAssignTo(v => !v)} activeOpacity={0.7}>
              <Text style={[styles.groupLabel, { color: t.textSecondary }]}>
                Assign to{assignedClients.size > 0 ? ` (${assignedClients.size})` : ''}
              </Text>
              <Ionicons name={showAssignTo ? 'chevron-up' : 'chevron-down'} size={16} color={t.textSecondary as string} />
            </TouchableOpacity>
            {showAssignTo && (clients.length === 0 ? (
              <Text style={[styles.groupClientName, { color: t.textSecondary }]}>No clients found.</Text>
            ) : clients.map((c) => {
              const selected = assignedClients.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.groupRow}
                  onPress={() => { setIsDirty(true); setAssignedClients((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  }); }}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.primary : t.textSecondary as string}
                  />
                  <Text style={[styles.groupClientName, { color: t.textPrimary }]}>{c.full_name}</Text>
                </TouchableOpacity>
              );
            }))}
          </View>
        )}

        {/* Worked out with — trainers only, Log Now mode only */}
        {!isLinkedClient && mode === 'log' && clients.filter((c) => c.id !== clientId).length > 0 && (
          <View style={[styles.groupSection, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TouchableOpacity style={styles.groupHeader} onPress={() => setShowWorkedOutWith(v => !v)} activeOpacity={0.7}>
              <Text style={[styles.groupLabel, { color: t.textSecondary }]}>
                Worked out with{workedOutWith.size > 0 ? ` (${workedOutWith.size})` : ''}
              </Text>
              <Ionicons name={showWorkedOutWith ? 'chevron-up' : 'chevron-down'} size={16} color={t.textSecondary as string} />
            </TouchableOpacity>
            {showWorkedOutWith && clients.filter((c) => c.id !== clientId).map((c) => {
              const selected = workedOutWith.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.groupRow}
                  onPress={() => { setIsDirty(true); setWorkedOutWith((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  }); }}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.primary : t.textSecondary as string}
                  />
                  <Text style={[styles.groupClientName, { color: t.textPrimary }]}>{c.full_name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {blocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={44} color={t.textSecondary} />
            <Text style={[styles.emptyStateText, { color: t.textSecondary }]}>No exercises added yet</Text>
            <Text style={[styles.emptyStateHint, { color: t.textSecondary }]}>
              Load a template or add exercises manually below
            </Text>
          </View>
        )}

        {blocks.map((block, bi) => {
          const isLinkedToNext = block.linkedToNext;
          const isLinkedFromPrev = bi > 0 && blocks[bi - 1].linkedToNext;
          const group = displayGroups[bi];
          const supersetColor = group !== null ? getSupersetColor(group) : null;

          return (
            <View key={bi}>
              {/* Superset connector pill between blocks */}
              {isLinkedFromPrev && supersetColor && (
                <View style={styles.supersetConnector}>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                  <Text style={[styles.supersetBadge, { color: supersetColor }]}>SUPERSET</Text>
                  <View style={[styles.supersetLine, { backgroundColor: supersetColor }]} />
                </View>
              )}

              <View style={[
                styles.blockCard,
                { backgroundColor: t.surface, borderColor: t.border },
                supersetColor !== null && { borderLeftWidth: 3, borderLeftColor: supersetColor },
              ]}>
                <View style={[styles.blockHeader, { backgroundColor: t.background, borderBottomColor: t.border }]}>
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.blockName, { color: t.textPrimary }]}>{block.exercise.name}</Text>
                    {block.exercise.muscle_group ? <Text style={[styles.muscleGroup, { color: t.textSecondary }]}>{block.exercise.muscle_group}</Text> : null}
                  </View>
                  <View style={styles.blockHeaderActions}>
                    {/* Chain/link icon — available on all blocks except the last (linking "this to next") */}
                    {bi < blocks.length - 1 && (
                      <TouchableOpacity
                        onPress={() => toggleLink(bi)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={isLinkedToNext ? 'link' : 'link-outline'}
                          size={18}
                          color={isLinkedToNext && supersetColor ? supersetColor : t.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeBlock(bi)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.colHeader}>
                  <Text style={[styles.colLabel, styles.colSet, { color: t.textSecondary }]}>Set</Text>
                  <Text style={[styles.colLabel, styles.colReps, { color: t.textSecondary }]}>Reps</Text>
                  <TouchableOpacity style={[styles.colWeight, styles.unitToggle]} onPress={() => updateBlockUnit(bi, nextUnit(block.unit))}>
                    <Text style={[styles.colLabel, { color: colors.primary }]}>{block.unit} ⟳</Text>
                  </TouchableOpacity>
                  <Text style={[styles.colLabel, styles.colNotes, { color: t.textSecondary }]}>Notes</Text>
                  <View style={styles.colRemove} />
                  {mode === 'log' && (
                    <Text style={[styles.colLabel, styles.colTimer, { color: t.textSecondary }]}>Rest</Text>
                  )}
                </View>

                {block.sets.map((s, si) => {
                  const timerKey = `${bi}-${si}`;
                  const timer = timers[timerKey];
                  return (
                    <View key={si} style={styles.setRow}>
                      <Text style={[styles.setNumber, styles.colSet, { color: t.textSecondary }]}>{si + 1}</Text>
                      <TextInput
                        style={[styles.setInput, styles.colReps, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                        placeholder="0" placeholderTextColor={t.textSecondary}
                        keyboardType="number-pad" value={s.reps}
                        onChangeText={(v) => updateSet(bi, si, 'reps', v)}
                      />
                      <TextInput
                        style={[styles.setInput, styles.colWeight, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                        placeholder={block.unit === 'secs' ? '0' : '0.0'} placeholderTextColor={t.textSecondary}
                        keyboardType={block.unit === 'secs' ? 'number-pad' : 'decimal-pad'} value={s.amount}
                        onChangeText={(v) => updateSet(bi, si, 'amount', v)}
                      />
                      <TextInput
                        style={[styles.setInput, styles.colNotes, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.background }]}
                        placeholder="—" placeholderTextColor={t.textSecondary}
                        value={s.notes} onChangeText={(v) => updateSet(bi, si, 'notes', v)}
                      />
                      <TouchableOpacity
                        style={[styles.colRemove, block.sets.length === 1 && styles.invisible]}
                        onPress={() => removeSet(bi, si)}
                        disabled={block.sets.length === 1}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>

                      {/* Rest timer button — log mode only */}
                      {mode === 'log' && (
                        <TouchableOpacity
                          style={[
                            styles.colTimer,
                            styles.timerBtn,
                            timer?.running
                              ? [styles.timerBtnRunning, { borderColor: colors.primary }]
                              : timer && timer.remaining === 0
                                ? [styles.timerBtnDone, { borderColor: colors.success }]
                                : { borderColor: t.border },
                          ]}
                          onPress={() => {
                            if (timer?.running) {
                              cancelTimer(timerKey);
                            } else {
                              startTimer(timerKey);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          {timer?.running ? (
                            <Text style={[styles.timerCountdown, { color: colors.primary }]}>
                              {fmtCountdown(timer.remaining)}
                            </Text>
                          ) : timer && timer.remaining === 0 ? (
                            <Ionicons name="checkmark" size={14} color={colors.success} />
                          ) : (
                            <Ionicons name="timer-outline" size={16} color={t.textSecondary as string} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                <View style={styles.addSetRow}>
                  <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(bi)}>
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text style={styles.addSetBtnText}>Add Set</Text>
                  </TouchableOpacity>
                  {mode === 'log' && (() => {
                    const bwKg = bodyWeight.trim() ? parseFloat(bodyWeight) : null;
                    const kcal = estimateBlockKcal(block.sets, block.unit, bwKg, block.exercise.name);
                    return kcal > 0 ? (
                      <View style={styles.kcalBadge}>
                        <Ionicons name="flame-outline" size={12} color={colors.primary} />
                        <Text style={[styles.kcalBadgeText, { color: colors.primary }]}>~{kcal} kcal</Text>
                      </View>
                    ) : null;
                  })()}
                </View>

                {/* ── Rest timer prescription — assign mode only ── */}
                {mode === 'assign' && (
                  <View style={[styles.restRow, styles.blockRestRow]}>
                    <View style={styles.restRowLeft}>
                      <Ionicons name="timer-outline" size={14} color={t.textSecondary as string} />
                      <Text style={[styles.restRowLabel, { color: t.textSecondary }]}>Rest</Text>
                    </View>
                    <View style={styles.restPresets}>
                      {REST_PRESETS.map((secs) => {
                        const active = block.restSecs === secs;
                        return (
                          <TouchableOpacity
                            key={secs}
                            style={[
                              styles.restPresetBtn,
                              { borderColor: active ? colors.primary : t.border },
                              active && styles.restPresetBtnActive,
                            ]}
                            onPress={() => updateBlockRestSecs(bi, secs)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.restPresetText, { color: active ? colors.textInverse : t.textSecondary }]}>
                              {fmtCountdown(secs)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.addExerciseBtn, styles.actionFlex, { borderColor: colors.primary }]} onPress={() => setShowPicker(true)}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.templateBtn, styles.actionFlex]} onPress={() => setShowTemplatePicker(true)}>
            <Ionicons name="list-outline" size={20} color={colors.primary} />
            <Text style={styles.addExerciseBtnText}>Use Template</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.fromNotesBtn, { borderColor: colors.primary }]}
          onPress={() => setShowNotesPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.addExerciseBtnText}>Import from Notes</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={mode === 'log' ? handleSave : handleAssign}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color={colors.textInverse} />
          : <Text style={styles.saveBtnText}>{mode === 'log' ? 'Save Workout' : 'Assign Workout'}</Text>}
      </TouchableOpacity>

      {/* ── Injury risk confirmation modal ─────────────────────────── */}
      <Modal transparent animationType="fade" visible={pendingExercise !== null}>
        <View style={styles.overlay}>
          <View style={[styles.warnCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.warnCardHeader, { borderBottomColor: t.border }]}>
              <Ionicons name="warning" size={22} color={colors.warning} />
              <Text style={[styles.warnCardTitle, { color: t.textPrimary }]}>Injury Risk</Text>
            </View>
            <Text style={[styles.warnCardBody, { color: t.textSecondary }]}>
              {injuryWarning?.message}
            </Text>
            {injuryWarning?.isCurrent && (
              <View style={[styles.injuryBadge, { backgroundColor: colors.error + '18' }]}>
                <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
                <Text style={[styles.injuryBadgeText, { color: colors.error }]}>Current injury on file</Text>
              </View>
            )}
            <View style={styles.warnCardActions}>
              <TouchableOpacity
                style={[styles.warnBtn, { borderColor: t.border, backgroundColor: t.background }]}
                onPress={() => { setPendingExercise(null); setInjuryWarning(null); }}
              >
                <Text style={[styles.warnBtnCancelText, { color: t.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.warnBtn, styles.warnBtnAdd]}
                onPress={() => {
                  if (pendingExercise) addExercise(pendingExercise);
                  setPendingExercise(null);
                  setInjuryWarning(null);
                }}
              >
                <Text style={styles.warnBtnAddText}>Add Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Unsaved changes modal ────────────────────────────── */}
      <UnsavedChangesModal
        visible={showUnsavedModal}
        saveLabel={mode === 'log' ? 'Save Workout' : 'Assign Workout'}
        onDiscard={() => { setShowUnsavedModal(false); setIsDirty(false); router.back(); }}
        onSave={() => { setShowUnsavedModal(false); (mode === 'log' ? handleSave : handleAssign)(); }}
        onKeepEditing={() => setShowUnsavedModal(false)}
      />

      {/* ── Notes parser modal ───────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={showNotesPicker}
        onRequestClose={() => { setShowNotesPicker(false); setNotesText(''); setNotesParseError(null); }}
      >
        <View style={styles.notesOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => { setShowNotesPicker(false); setNotesText(''); setNotesParseError(null); }}
          />
          <View style={[styles.notesSheet, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={[styles.notesSheetHeader, { borderBottomColor: t.border }]}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={[styles.notesSheetTitle, { color: t.textPrimary }]}>Import from Notes</Text>
              <TouchableOpacity
                onPress={() => { setShowNotesPicker(false); setNotesText(''); setNotesParseError(null); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={t.textSecondary as string} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.notesSheetHint, { color: t.textSecondary }]}>
              Describe your workout in plain text — the AI will pre-fill the log for you to edit.
            </Text>
            <Text style={[styles.notesSheetExample, { color: t.textSecondary }]}>
              e.g. "Bench Press 3×8 185lbs, Squat 4×5 @ 225kg, Plank 3×60sec"
            </Text>
            <TextInput
              style={[
                styles.notesSheetInput,
                { borderColor: notesParseError ? colors.error : t.border, color: t.textPrimary, backgroundColor: t.background },
              ]}
              placeholder="Type or paste your workout notes here..."
              placeholderTextColor={t.textSecondary}
              value={notesText}
              onChangeText={(v) => { setNotesText(v); if (notesParseError) setNotesParseError(null); }}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            {notesParseError ? (
              <Text style={[styles.notesSheetError, { color: colors.error }]}>{notesParseError}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.notesSheetParseBtn, (!notesText.trim() || parsingNotes) && styles.saveBtnDisabled]}
              onPress={handleParseNotes}
              disabled={!notesText.trim() || parsingNotes}
              activeOpacity={0.85}
            >
              {parsingNotes ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={colors.textInverse} />
                  <Text style={styles.notesSheetParseBtnText}>Parse Workout</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Rest complete toast ───────────────────────────────── */}
      {restToast && (
        <View style={[styles.restToast, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.textInverse} />
          <Text style={styles.restToastText}>{restToast}</Text>
        </View>
      )}

      {/* ── Workout summary modal ─────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={summaryVisible}
        onRequestClose={() => { setSummaryVisible(false); router.back(); }}
      >
        <View style={styles.summaryOverlay}>
          <View style={[styles.summaryCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            {/* Header */}
            <View style={[styles.summaryHeader, { borderBottomColor: t.border }]}>
              <Text style={styles.summaryHeaderEmoji}>💪</Text>
              <View>
                <Text style={[styles.summaryTitle, { color: t.textPrimary }]}>Workout Complete!</Text>
                <Text style={[styles.summarySubtitle, { color: t.textSecondary }]}>Here's how it went</Text>
              </View>
            </View>

            {/* Stats row */}
            {workoutSummary && (
              <View style={[styles.summaryStatsRow, { borderBottomColor: t.border }]}>
                <View style={styles.summaryStat}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={[styles.summaryStatValue, { color: t.textPrimary }]}>
                    {fmtDuration(workoutSummary.workoutSeconds)}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: t.textSecondary }]}>Total time</Text>
                </View>
                <View style={[styles.summaryStatDivider, { backgroundColor: t.border }]} />
                <View style={styles.summaryStat}>
                  <Ionicons name="pause-circle-outline" size={20} color={colors.info} />
                  <Text style={[styles.summaryStatValue, { color: t.textPrimary }]}>
                    {workoutSummary.restSeconds > 0 ? fmtDuration(workoutSummary.restSeconds) : '—'}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: t.textSecondary }]}>Rest</Text>
                </View>
                <View style={[styles.summaryStatDivider, { backgroundColor: t.border }]} />
                <View style={styles.summaryStat}>
                  <Ionicons name="flash-outline" size={20} color={colors.warning} />
                  <Text style={[styles.summaryStatValue, { color: t.textPrimary }]}>
                    {workoutSummary.tutSeconds > 0 ? fmtDuration(workoutSummary.tutSeconds) : '—'}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: t.textSecondary }]}>Under tension</Text>
                </View>
              </View>
            )}

            {/* Calories row */}
            {workoutSummary && workoutSummary.totalKcal > 0 && (
              <View style={[styles.summaryKcalRow, { borderBottomColor: t.border }]}>
                <Ionicons name="flame" size={18} color={colors.primary} />
                <Text style={[styles.summaryKcalText, { color: t.textPrimary }]}>
                  ~{workoutSummary.totalKcal} kcal estimated
                </Text>
                <Text style={[styles.summaryKcalHint, { color: t.textSecondary }]}>
                  based on sets, weight {bodyWeight.trim() ? '& body weight' : '(75 kg assumed)'}
                </Text>
              </View>
            )}

            {/* Personal Records section */}
            {workoutSummary && workoutSummary.prs.length > 0 && (
              <View style={[styles.summaryPRSection, { borderBottomColor: t.border }]}>
                <View style={styles.summaryPRHeader}>
                  <Ionicons name="trophy" size={14} color={colors.primary} />
                  <Text style={[styles.summaryPRTitle, { color: colors.primary }]}>
                    {workoutSummary.prs.length === 1
                      ? 'New Personal Record!'
                      : `${workoutSummary.prs.length} New Personal Records!`}
                  </Text>
                </View>
                {workoutSummary.prs.map((pr, i) => (
                  <View
                    key={i}
                    style={[
                      styles.summaryPRRow,
                      { borderBottomColor: t.border },
                      i === workoutSummary.prs.length - 1 && styles.summaryPRRowLast,
                    ]}
                  >
                    <View style={styles.summaryPRIcon}>
                      <Ionicons
                        name={pr.type === 'weight' ? 'barbell-outline' : 'repeat-outline'}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.summaryPRText}>
                      <Text style={[styles.summaryPRName, { color: t.textPrimary }]}>{pr.exerciseName}</Text>
                      <Text style={[styles.summaryPRMeta, { color: t.textSecondary }]}>
                        {pr.type === 'weight' ? 'Best weight' : 'Most reps'}
                        {pr.previous != null
                          ? ` · prev ${pr.previous} ${pr.unit}`
                          : ' · first time!'}
                      </Text>
                    </View>
                    <View style={[styles.summaryPRBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
                      <Text style={[styles.summaryPRBadgeText, { color: colors.primary }]}>
                        {pr.value} {pr.unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.summaryDoneBtn}
              onPress={() => { setSummaryVisible(false); router.back(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.summaryDoneBtnText}>
                {workoutSummary && workoutSummary.prs.length > 0 ? 'Awesome! 🏆' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: { marginRight: spacing.sm },
  // ── Injury warning modal ──
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  warnCard: {
    width: '100%', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  warnCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  warnCardTitle: { ...typography.body, fontWeight: '700' },
  warnCardBody: { ...typography.body, padding: spacing.md, paddingBottom: spacing.sm },
  injuryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  injuryBadgeText: { ...typography.label, fontWeight: '600' },
  warnCardActions: {
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.md, paddingTop: spacing.sm,
  },
  warnBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  warnBtnAdd: { backgroundColor: colors.primary, borderColor: colors.primary },
  warnBtnCancelText: { ...typography.body, fontWeight: '600' },
  warnBtnAddText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  // ── Mode toggle ──
  modeToggle: {
    flexDirection: 'row', borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden', marginBottom: spacing.xs,
  },
  modeBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: colors.primary },
  modeBtnText: { ...typography.body, fontWeight: '600' },
  dateTouchableRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  loader: { marginTop: spacing.xl },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1,
  },
  backBtn: { padding: spacing.xs },
  searchInput: {
    ...typography.body, flex: 1, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 40,
  },
  exerciseList: { padding: spacing.md, gap: spacing.sm },
  exerciseRow: {
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { ...typography.body, fontWeight: '600' },
  muscleGroup: { ...typography.bodySmall, marginTop: 2 },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
  scroll: { gap: spacing.md, paddingBottom: spacing.xxl },
  header: { padding: spacing.md, gap: spacing.sm, borderBottomWidth: 1 },
  dateTouchable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { ...typography.body, fontWeight: '600' },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCol: {
    flex: 1,
    gap: 4,
  },
  metricLabel: {
    ...typography.label,
  },
  metricInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, height: 40,
  },
  notesInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 40,
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyStateText: { ...typography.heading3 },
  emptyStateHint: { ...typography.bodySmall },
  blockCard: {
    marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    overflow: 'hidden', gap: spacing.xs, paddingBottom: spacing.sm,
  },
  blockHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  blockHeaderActions: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  blockName: { ...typography.body, fontWeight: '600' },
  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.xs,
  },
  colLabel: { ...typography.label, textAlign: 'center' },
  colSet: { width: 32 }, colReps: { width: 56 }, colWeight: { width: 68 },
  unitToggle: { alignItems: 'center', justifyContent: 'center' },
  colNotes: { flex: 1 }, colRemove: { width: 28, alignItems: 'center' },
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.xs,
  },
  setNumber: { ...typography.label, textAlign: 'center' },
  setInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.xs,
    height: 40, textAlign: 'center',
  },
  invisible: { opacity: 0 },
  addSetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: spacing.xs,
  },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, gap: spacing.xs,
  },
  addSetBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  kcalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary + '44',
  },
  kcalBadgeText: { ...typography.label, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md,
  },
  actionFlex: { flex: 1, marginHorizontal: 0 },
  addExerciseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs,
  },
  templateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.primary, gap: spacing.xs,
  },
  addExerciseBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  saveBtn: { margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
  groupSection: {
    marginHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1,
    padding: spacing.md, gap: spacing.sm,
  },
  groupLabel: { ...typography.label, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  groupClientName: { ...typography.body },
  // Superset connector
  supersetConnector: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md + 3, // align with left border
    marginVertical: 2, gap: spacing.xs,
  },
  supersetLine: { flex: 1, height: 1 },
  supersetBadge: {
    ...typography.label, fontWeight: '700', letterSpacing: 1,
  },

  // ── Rest timer column ──
  colTimer: { width: 52, alignItems: 'center', justifyContent: 'center' },
  timerBtn: {
    width: 48, height: 36, borderRadius: radius.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  timerBtnRunning: { backgroundColor: colors.primary + '18' },
  timerBtnDone: { backgroundColor: colors.success + '18' },
  timerCountdown: { ...typography.label, fontWeight: '700' },

  // ── Rest timer customization row ──
  restRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap',
  },
  blockRestRow: {
    marginTop: spacing.xs, paddingTop: spacing.xs, paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'transparent',
  },
  restRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  restRowLabel: { ...typography.label },
  restPresets: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', flex: 1 },
  restPresetBtn: {
    paddingVertical: 3, paddingHorizontal: spacing.sm,
    borderRadius: radius.sm, borderWidth: 1,
  },
  restPresetBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  restPresetText: { ...typography.label, fontWeight: '600' },

  // ── Rest complete toast ──
  restToast: {
    position: 'absolute', bottom: 80, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  restToastText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600', flex: 1 },

  // ── Workout summary modal ──
  summaryOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  summaryCard: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden',
  },
  summaryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryHeaderEmoji: { fontSize: 36 },
  summaryTitle: { ...typography.heading3, fontWeight: '700' },
  summarySubtitle: { ...typography.bodySmall, marginTop: 2 },
  summaryStatsRow: {
    flexDirection: 'row', alignItems: 'stretch',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryStat: {
    flex: 1, alignItems: 'center', gap: spacing.xs,
  },
  summaryStatValue: { ...typography.heading3, fontWeight: '700' },
  summaryStatLabel: { ...typography.label },
  summaryStatDivider: { width: 1 },
  summaryKcalRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryKcalText: { ...typography.body, fontWeight: '700' },
  summaryKcalHint: { ...typography.label, flex: 1 },
  summaryPRSection: {
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryPRHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: spacing.sm,
  },
  summaryPRTitle: { ...typography.label, fontWeight: '700', letterSpacing: 0.5 },
  summaryPRRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryPRRowLast: { borderBottomWidth: 0 },
  summaryPRIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryPRText: { flex: 1, minWidth: 0 },
  summaryPRName: { ...typography.body, fontWeight: '600' },
  summaryPRMeta: { ...typography.bodySmall, marginTop: 1 },
  summaryPRBadge: {
    borderWidth: 1, borderRadius: radius.sm,
    paddingVertical: 3, paddingHorizontal: spacing.sm,
  },
  summaryPRBadgeText: { ...typography.label, fontWeight: '700' },
  summaryDoneBtn: {
    margin: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: spacing.md, alignItems: 'center',
  },
  summaryDoneBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },

  // ── From Notes button ──
  fromNotesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', gap: spacing.xs,
  },

  // ── Notes parser modal ──
  notesOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  notesSheet: {
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderWidth: 1, borderBottomWidth: 0,
    padding: spacing.lg, gap: spacing.sm,
  },
  notesSheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notesSheetTitle: { ...typography.heading3, flex: 1 },
  notesSheetHint: { ...typography.body },
  notesSheetExample: { ...typography.label, fontStyle: 'italic' },
  notesSheetInput: {
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, minHeight: 130,
    ...typography.body,
  },
  notesSheetError: { ...typography.bodySmall },
  notesSheetParseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.xs,
  },
  notesSheetParseBtnText: { ...typography.body, fontWeight: '700', color: colors.textInverse },
});
