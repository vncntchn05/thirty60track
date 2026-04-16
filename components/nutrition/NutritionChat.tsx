import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useNutritionChat, useNutritionSettings } from '@/hooks/useNutritionChat';
import {
  getNutritionChatResponse, isCheatMealDue, daysUntilCheatMeal, NUTRITION_AI_ENABLED,
  type WorkoutHistorySummary, type PersonalRecordSummary, type WorkoutStatsContext,
} from '@/lib/nutritionAI';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import type { NutritionGuideContent, Client, ClientIntake } from '@/types';

// ─── Cheat meal banner ────────────────────────────────────────

function CheatMealBanner({
  clientId,
  isClient,
  t,
}: {
  clientId: string;
  isClient: boolean;
  t: ReturnType<typeof useTheme>;
}) {
  const { settings, markCheatMealUsed } = useNutritionSettings(clientId);
  if (!settings) return null;

  const due = isCheatMealDue(settings.cheat_meal_last_date, settings.cheat_meal_every_n_days);
  const daysLeft = daysUntilCheatMeal(settings.cheat_meal_last_date, settings.cheat_meal_every_n_days);

  if (!due) return null;

  return (
    <View style={[styles.cheatBanner, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}>
      <Ionicons name="gift-outline" size={20} color={colors.primary} />
      <View style={styles.cheatBannerBody}>
        <Text style={[styles.cheatBannerTitle, { color: colors.primary }]}>
          {settings.cheat_meal_last_date === null ? '🎉 Time for your first cheat meal!' : '🎉 Cheat meal day!'}
        </Text>
        <Text style={[styles.cheatBannerSub, { color: t.textSecondary }]}>
          Every {settings.cheat_meal_every_n_days} days — enjoy it, then get back on plan.
        </Text>
      </View>
      {isClient && (
        <TouchableOpacity
          style={[styles.cheatDoneBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
            await markCheatMealUsed();
            Alert.alert('Marked!', 'Cheat meal logged. Next one in ' + settings.cheat_meal_every_n_days + ' days.');
          }}
        >
          <Text style={styles.cheatDoneBtnText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Quick prompts ────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: 'Breakfast ideas', prompt: 'What should I eat for breakfast today?' },
  { label: "McDonald's order", prompt: "What should I order from McDonald's?" },
  { label: 'Snack ideas', prompt: 'Give me some high-protein snack ideas' },
  { label: 'Workout today', prompt: 'What workout should I do today?' },
  { label: 'Exercise tips', prompt: 'What exercises should I focus on?' },
  { label: 'Recovery', prompt: 'How should I eat and recover on rest days?' },
  { label: 'Pre-workout meal', prompt: "What's the best pre-workout meal?" },
  { label: 'Supplements', prompt: 'When should I take my supplements?' },
];

// ─── Message bubble ───────────────────────────────────────────

type BubbleNavProps = {
  onNavigateToNutritionEncyclopedia?: (topicId: string) => void;
  onNavigateToExerciseEncyclopedia?: (muscleGroup: string) => void;
};

function MessageBubble({
  role, content, t,
  onNavigateToNutritionEncyclopedia,
  onNavigateToExerciseEncyclopedia,
}: {
  role: 'user' | 'assistant';
  content: string;
  t: ReturnType<typeof useTheme>;
} & BubbleNavProps) {
  const isUser = role === 'user';
  const textColor = isUser ? colors.textInverse : (t.textPrimary as string);
  const segments = parseMessage(content);

  return (
    <View style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
      {!isUser && (
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="nutrition-outline" size={14} color={colors.primary} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.bubbleUser, { backgroundColor: colors.primary }]
          : [styles.bubbleAssistant, { backgroundColor: t.surface, borderColor: t.border }],
      ]}>
        <Text style={[styles.bubbleText, { color: textColor }]}>
          {segments.map((seg, i) => {
            if (seg.kind === 'text') {
              return <Text key={i}>{seg.text}</Text>;
            }
            const onPress = seg.linkType === 'N'
              ? () => onNavigateToNutritionEncyclopedia?.(seg.linkId)
              : () => onNavigateToExerciseEncyclopedia?.(seg.linkId);
            const canNavigate = seg.linkType === 'N'
              ? !!onNavigateToNutritionEncyclopedia
              : !!onNavigateToExerciseEncyclopedia;
            return (
              <Text
                key={i}
                style={canNavigate ? styles.encLink : { color: textColor }}
                onPress={canNavigate ? onPress : undefined}
              >
                {seg.text}
              </Text>
            );
          })}
        </Text>
      </View>
    </View>
  );
}

// ─── Cheat meal settings (trainer) ────────────────────────────

function CheatMealSettings({
  clientId,
  t,
}: {
  clientId: string;
  t: ReturnType<typeof useTheme>;
}) {
  const { settings, saveSettings } = useNutritionSettings(clientId);
  const [editing, setEditing] = useState(false);
  const [cadenceInput, setCadenceInput] = useState('');

  if (!editing) {
    return (
      <TouchableOpacity
        style={[styles.settingsRow, { backgroundColor: t.surface, borderColor: t.border }]}
        onPress={() => { setCadenceInput(String(settings?.cheat_meal_every_n_days ?? 4)); setEditing(true); }}
        activeOpacity={0.7}
      >
        <Ionicons name="settings-outline" size={14} color={t.textSecondary as string} />
        <Text style={[styles.settingsText, { color: t.textSecondary }]}>
          Cheat meal every {settings?.cheat_meal_every_n_days ?? 4} days
          {settings?.cheat_meal_last_date ? ` · Last: ${settings.cheat_meal_last_date}` : ' · Not yet used'}
        </Text>
        <Ionicons name="pencil-outline" size={12} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.settingsEdit, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[styles.settingsEditLabel, { color: t.textSecondary }]}>Cheat meal every N days</Text>
      <View style={styles.settingsEditRow}>
        <TextInput
          style={[styles.settingsCadenceInput, { color: t.textPrimary, borderColor: t.border }]}
          value={cadenceInput}
          onChangeText={setCadenceInput}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <TouchableOpacity
          style={[styles.settingsSaveBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const n = parseInt(cadenceInput, 10);
            if (isNaN(n) || n < 1) return;
            await saveSettings(n, settings?.cheat_meal_last_date ?? null);
            setEditing(false);
          }}
        >
          <Text style={styles.settingsSaveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditing(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={t.textSecondary as string} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────

type Props = {
  clientId: string;
  client: Client;
  intake: ClientIntake | null;
  guide: NutritionGuideContent | null;
  isClient: boolean;
  isTrainer?: boolean;
  onNavigateToNutritionEncyclopedia?: (topicId: string) => void;
  onNavigateToExerciseEncyclopedia?: (muscleGroup: string) => void;
};

// ─── Inline encyclopedia reference parser ─────────────────────
//
// AI responses may embed [[N:topicId|label]] (Nutrition Encyclopedia)
// and [[E:muscleGroup|label]] (Exercise Encyclopedia) markers.
// parseMessage() splits text into plain and link segments so
// MessageBubble can render the labels as tappable gold links.

type ParsedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; linkType: 'N' | 'E'; linkId: string };

function parseMessage(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const re = /\[\[([NE]):([^\]|]+)\|([^\]]+)\]\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ kind: 'text', text: content.slice(lastIndex, m.index) });
    }
    segments.push({ kind: 'link', text: m[3], linkType: m[1] as 'N' | 'E', linkId: m[2] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ kind: 'text', text: content.slice(lastIndex) });
  }
  return segments;
}

// ─── Raw shapes for workout history fetch ─────────────────────

type RawSetForAI = {
  exercise_id: string;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  exercise: { id: string; name: string; muscle_group: string | null } | null;
};

type RawWorkoutForAI = {
  id: string;
  performed_at: string;
  workout_sets: RawSetForAI[];
};

// ─── Derive AI workout context from raw Supabase data ─────────

function buildWorkoutContext(workouts: RawWorkoutForAI[]): {
  recentWorkouts: WorkoutHistorySummary[];
  personalRecords: PersonalRecordSummary[];
  workoutStats: WorkoutStatsContext;
} {
  // Personal records — max weight and max reps per exercise across all workouts
  const prMap = new Map<string, { name: string; muscle_group: string | null; maxWeight: number; maxReps: number }>();
  for (const w of workouts) {
    for (const s of w.workout_sets) {
      if (!s.exercise) continue;
      const prev = prMap.get(s.exercise_id) ?? {
        name: s.exercise.name,
        muscle_group: s.exercise.muscle_group,
        maxWeight: 0,
        maxReps: 0,
      };
      prMap.set(s.exercise_id, {
        name: prev.name,
        muscle_group: prev.muscle_group,
        maxWeight: Math.max(prev.maxWeight, s.weight_kg ?? 0),
        maxReps: Math.max(prev.maxReps, s.reps ?? 0),
      });
    }
  }
  const personalRecords: PersonalRecordSummary[] = Array.from(prMap.values()).map((pr) => ({
    exercise_name: pr.name,
    muscle_group: pr.muscle_group,
    max_weight_kg: pr.maxWeight > 0 ? pr.maxWeight : null,
    max_reps: pr.maxReps > 0 ? pr.maxReps : null,
  }));

  // Recent workouts summary (last 20, most recent first)
  const recentWorkouts: WorkoutHistorySummary[] = workouts.slice(0, 20).map((w) => {
    const exerciseNames = [...new Set(w.workout_sets.map((s) => s.exercise?.name).filter(Boolean) as string[])];
    const muscleGroups = [...new Set(w.workout_sets.map((s) => s.exercise?.muscle_group).filter(Boolean) as string[])];
    const totalSets = w.workout_sets.length;
    const estimatedVolume = w.workout_sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0);
    return {
      performed_at: w.performed_at,
      exercises: exerciseNames,
      muscle_groups: muscleGroups,
      total_sets: totalSets,
      estimated_volume_kg: Math.round(estimatedVolume),
    };
  });

  // Aggregate muscle group frequency
  const muscleFreq = new Map<string, number>();
  for (const w of workouts) {
    const musclesThisSession = new Set(
      w.workout_sets.map((s) => s.exercise?.muscle_group).filter(Boolean) as string[],
    );
    for (const m of musclesThisSession) {
      muscleFreq.set(m, (muscleFreq.get(m) ?? 0) + 1);
    }
  }
  const sortedMuscles = Array.from(muscleFreq.entries()).sort((a, b) => b[1] - a[1]);
  const mostTrained = sortedMuscles.slice(0, 3).map(([m]) => m);
  const leastTrained = sortedMuscles.slice(-3).reverse().map(([m]) => m);

  // Days since last workout
  let daysSinceLast: number | null = null;
  if (workouts.length > 0) {
    const lastDate = new Date(workouts[0].performed_at.split('T')[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000);
  }

  // Avg per week across span
  let avgPerWeek = 0;
  let weeksTracked = 0;
  if (workouts.length >= 2) {
    const oldest = new Date(workouts[workouts.length - 1].performed_at);
    const newest = new Date(workouts[0].performed_at);
    weeksTracked = Math.max(1, Math.round((newest.getTime() - oldest.getTime()) / (7 * 86_400_000)));
    avgPerWeek = Math.round((workouts.length / weeksTracked) * 10) / 10;
  }

  const workoutStats: WorkoutStatsContext = {
    total_workouts: workouts.length,
    avg_per_week: avgPerWeek,
    weeks_tracked: weeksTracked,
    most_trained_muscles: mostTrained,
    least_trained_muscles: leastTrained,
    days_since_last_workout: daysSinceLast,
  };

  return { recentWorkouts, personalRecords, workoutStats };
}

// ─── Main component ───────────────────────────────────────────

export function NutritionChat({
  clientId, client, intake, guide, isClient, isTrainer,
  onNavigateToNutritionEncyclopedia, onNavigateToExerciseEncyclopedia,
}: Props) {
  const t = useTheme();
  const { messages, loading, addMessage, clearHistory } = useNutritionChat(clientId);
  const [input, setInput] = useState('');
  const [replying, setReplying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Workout history for AI context
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistorySummary[] | null>(null);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecordSummary[] | null>(null);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStatsContext | null>(null);

  const fetchWorkoutContext = useCallback(async () => {
    const { data } = await supabase
      .from('workouts')
      .select(`
        id,
        performed_at,
        workout_sets (
          exercise_id,
          reps,
          weight_kg,
          duration_seconds,
          exercise:exercises ( id, name, muscle_group )
        )
      `)
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false })
      .limit(60); // ~8 weeks at 7 sessions/week

    if (data && data.length > 0) {
      const { recentWorkouts: rw, personalRecords: pr, workoutStats: ws } =
        buildWorkoutContext(data as unknown as RawWorkoutForAI[]);
      setRecentWorkouts(rw);
      setPersonalRecords(pr);
      setWorkoutStats(ws);
    }
  }, [clientId]);

  useEffect(() => { fetchWorkoutContext(); }, [fetchWorkoutContext]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || replying) return;
    setInput('');

    // Save user message
    await addMessage('user', trimmed);

    // Get AI reply
    setReplying(true);
    const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
    const context = {
      full_name: client.full_name,
      gender: client.gender,
      age: client.date_of_birth
        ? Math.floor((Date.now() - new Date(client.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null,
      weight_kg: client.weight_kg,
      height_cm: client.height_cm,
      bf_percent: client.bf_percent,
      goals: intake?.goals ?? null,
      goal_timeframe: intake?.goal_timeframe ?? null,
      activity_level: intake?.activity_level ?? null,
      current_injuries: intake?.current_injuries ?? null,
      chronic_conditions: intake?.chronic_conditions ?? null,
      medications: intake?.medications ?? null,
      allergies: intake?.allergies ?? null,
      dietary_restrictions: intake?.dietary_restrictions ?? null,
      training_frequency_per_week: intake?.training_frequency_per_week ?? null,
      typical_session_length_minutes: intake?.typical_session_length_minutes ?? null,
      outside_gym_activity_level: intake?.outside_gym_activity_level ?? null,
      recent_workouts: recentWorkouts,
      personal_records: personalRecords,
      workout_stats: workoutStats,
    };

    const { reply, error } = await getNutritionChatResponse(trimmed, context, guide, history);
    setReplying(false);

    if (error || !reply) {
      await addMessage('assistant', 'Sorry, I couldn\'t process that. Please try again.');
      return;
    }
    await addMessage('assistant', reply);
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={160}
    >
      {/* Cheat meal banner — shown to the viewing client */}
      {isClient && <CheatMealBanner clientId={clientId} isClient={isClient} t={t} />}

      {/* AI status badge */}
      {!NUTRITION_AI_ENABLED && (
        <View style={[styles.devBadge, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="flask-outline" size={12} color={t.textSecondary as string} />
          <Text style={[styles.devBadgeText, { color: t.textSecondary }]}>Demo mode — mock responses</Text>
        </View>
      )}

      {/* Trainer: cheat meal settings */}
      {isTrainer && <CheatMealSettings clientId={clientId} t={t} />}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.welcomeWrap}>
            <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="nutrition-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: t.textPrimary }]}>Nutrition Assistant</Text>
            <Text style={[styles.welcomeBody, { color: t.textSecondary }]}>
              Ask me anything about meals, recipes, fast food choices, supplements, or workout and exercise recommendations.
            </Text>
            <View style={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((qp) => (
                <TouchableOpacity
                  key={qp.label}
                  style={[styles.quickPromptBtn, { backgroundColor: t.surface, borderColor: t.border }]}
                  onPress={() => sendMessage(qp.prompt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickPromptText, { color: t.textPrimary }]}>{qp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                t={t}
                onNavigateToNutritionEncyclopedia={onNavigateToNutritionEncyclopedia}
                onNavigateToExerciseEncyclopedia={onNavigateToExerciseEncyclopedia}
              />
            ))}
            {replying && (
              <View style={[styles.bubbleWrap]}>
                <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="nutrition-outline" size={14} color={colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={() => Alert.alert('Clear history', 'Delete all messages?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearHistory },
            ])}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[styles.textInput, { color: t.textPrimary, backgroundColor: t.background, borderColor: t.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about your nutrition…"
          placeholderTextColor={t.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(input)}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || replying) && styles.sendBtnDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || replying}
        >
          <Ionicons name="send" size={16} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  cheatBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1,
  },
  cheatBannerBody: { flex: 1 },
  cheatBannerTitle: { ...typography.body, fontWeight: '700' },
  cheatBannerSub: { ...typography.bodySmall, marginTop: 2 },
  cheatDoneBtn: { borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: spacing.md },
  cheatDoneBtnText: { ...typography.bodySmall, fontWeight: '700', color: colors.textInverse },

  devBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  devBadgeText: { ...typography.label, fontSize: 10 },

  messagesList: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },

  welcomeWrap: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  welcomeIcon: {
    width: 64, height: 64, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeTitle: { ...typography.heading3 },
  welcomeBody: { ...typography.body, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  quickPromptsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    justifyContent: 'center', marginTop: spacing.sm,
  },
  quickPromptBtn: {
    borderWidth: 1, borderRadius: radius.full,
    paddingVertical: 8, paddingHorizontal: spacing.md,
  },
  quickPromptText: { ...typography.bodySmall, fontWeight: '600' },

  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubbleWrapUser: { flexDirection: 'row-reverse' },
  avatarWrap: {
    width: 28, height: 28, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%', borderRadius: radius.lg,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleText: { ...typography.body, lineHeight: 22 },
  encLink: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.sm, paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearBtn: { paddingBottom: spacing.xs + 2 },
  textInput: {
    flex: 1, borderWidth: 1, borderRadius: radius.lg,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    ...typography.body, maxHeight: 100, lineHeight: 22,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: { opacity: 0.5 },

  // Trainer cheat meal settings
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1,
  },
  settingsText: { ...typography.bodySmall, flex: 1 },
  settingsEdit: {
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs,
  },
  settingsEditLabel: { ...typography.label },
  settingsEditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingsCadenceInput: {
    width: 60, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.xs, paddingHorizontal: spacing.sm,
    ...typography.body, textAlign: 'center',
  },
  settingsSaveBtn: {
    borderRadius: radius.md, paddingVertical: 6, paddingHorizontal: spacing.md,
  },
  settingsSaveBtnText: { ...typography.bodySmall, fontWeight: '700', color: colors.textInverse },
});
