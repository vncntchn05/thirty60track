/**
 * Proactive AI reminder hook for the client nutrition chat.
 *
 * On first mount (after messages finish loading) it checks several
 * conditions and injects assistant messages for any that are due.
 * AsyncStorage keyed by client + reminder type + date ensures each
 * daily reminder fires at most once per calendar day. The workout
 * suggestion uses a different cadence (every 3 days) tracked by
 * the actual last-sent date rather than a simple today-match.
 *
 * Reminder types:
 *  - cheat_meal         — cheat meal is due (based on nutrition settings cadence)
 *  - calorie_under      — logged < 80% of daily calorie goal after 1 PM
 *  - calorie_over       — logged > 120% of daily calorie goal
 *  - workout_today      — assigned workout(s) scheduled for today are still pending
 *  - workout_gap        — 3+ days since the last logged workout (no workout due today)
 *  - session_upcoming   — confirmed session today or tomorrow
 *  - workout_suggestion — muscle-group-aware suggestion, sent at most every 3 days
 */

import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { isCheatMealDue } from '@/lib/nutritionAI';

// ─── Types ────────────────────────────────────────────────────

type AddMessageFn = (
  role: 'user' | 'assistant',
  content: string,
) => Promise<{ error: string | null }>;

type ReminderType =
  | 'cheat_meal'
  | 'calorie_under'
  | 'calorie_over'
  | 'workout_today'
  | 'workout_gap'
  | 'session_upcoming'
  | 'workout_suggestion';

type PendingReminder = { type: ReminderType; message: string };

// ─── Date helpers ─────────────────────────────────────────────

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayIso(): string { return toIso(new Date()); }

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toIso(d);
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m} ${period}`;
}

// ─── AsyncStorage helpers ─────────────────────────────────────

function storageKey(clientId: string, type: ReminderType): string {
  return `ai_reminder_${clientId}_${type}`;
}

/** Returns true if this reminder was already sent today. */
async function wasRemindedToday(clientId: string, type: ReminderType): Promise<boolean> {
  const val = await AsyncStorage.getItem(storageKey(clientId, type));
  return val === todayIso();
}

/** Records that this reminder was sent today. */
async function markRemindedToday(clientId: string, type: ReminderType): Promise<void> {
  await AsyncStorage.setItem(storageKey(clientId, type), todayIso());
}

/**
 * Returns the number of calendar days since this reminder was last sent.
 * Returns Infinity if it has never been sent.
 */
async function daysSinceLastSent(clientId: string, type: ReminderType): Promise<number> {
  const val = await AsyncStorage.getItem(storageKey(clientId, type));
  if (!val) return Infinity;
  const last = new Date(val);
  const today = new Date(todayIso());
  return Math.floor((today.getTime() - last.getTime()) / 86_400_000);
}

// ─── Workout suggestion builder ───────────────────────────────
//
// Looks at the last 21 days of workouts, finds the muscle group
// that hasn't been trained longest, and returns a specific
// exercise suggestion for that group.

type WorkoutRow = { performed_at: string; workout_sets: { exercise: { muscle_group: string | null } | null }[] };

function buildSuggestion(firstName: string, workouts: WorkoutRow[]): string {
  // Map muscle group → most recent date trained
  const lastTrained = new Map<string, Date>();
  for (const w of workouts) {
    const date = new Date(w.performed_at);
    for (const s of w.workout_sets) {
      const mg = s.exercise?.muscle_group;
      if (!mg) continue;
      const prev = lastTrained.get(mg);
      if (!prev || date > prev) lastTrained.set(mg, date);
    }
  }

  // Primary muscle groups to consider
  const groups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
  const today = new Date(todayIso());

  // Find the group trained least recently (or never)
  let stalest: string | null = null;
  let stalestDays = -1;

  for (const g of groups) {
    const last = lastTrained.get(g);
    const days = last
      ? Math.floor((today.getTime() - last.getTime()) / 86_400_000)
      : 99;
    if (days > stalestDays) { stalestDays = days; stalest = g; }
  }

  // Muscle-group → suggested session copy
  const suggestions: Record<string, string> = {
    Chest:
      `**Push day** — your chest hasn't been hit in ${stalestDays} day${stalestDays !== 1 ? 's' : ''}:\n` +
      '• Flat bench press 4×8 (main strength work)\n' +
      '• Incline dumbbell press 3×10\n' +
      '• Cable flyes 3×12\n' +
      '• Overhead tricep extension 3×12\n' +
      '• Lateral raises 3×15\n\n' +
      'Aim for RPE 8 on the main lift — challenging but with 1–2 reps left in the tank.',
    Back:
      `**Pull day** — back work is ${stalestDays} day${stalestDays !== 1 ? 's' : ''} overdue:\n` +
      '• Deadlift or Romanian DL 4×6 (main strength work)\n' +
      '• Pull-up or lat pulldown 4×8\n' +
      '• Seated cable row 3×10\n' +
      '• Face pulls 3×15\n' +
      '• Dumbbell curl 3×12\n\n' +
      'Focus on the mind-muscle connection on rows — initiate with your elbows, not your hands.',
    Legs:
      `**Leg day** — you haven't trained legs in ${stalestDays} day${stalestDays !== 1 ? 's' : ''}:\n` +
      '• Back squat or leg press 4×8 (main strength work)\n' +
      '• Romanian deadlift 3×10\n' +
      '• Walking lunges 3×12 each leg\n' +
      '• Leg curl 3×12\n' +
      '• Calf raises 4×15\n\n' +
      'Don\'t skip the calf raises — they\'re the most trained muscle group that people consistently skip.',
    Shoulders:
      `**Shoulder session** — ${stalestDays} day${stalestDays !== 1 ? 's' : ''} since last shoulder work:\n` +
      '• Overhead press (barbell or dumbbell) 4×8\n' +
      '• Lateral raises 4×15 (keep these light and strict)\n' +
      '• Front raises 3×12\n' +
      '• Rear delt flyes or face pulls 3×15\n' +
      '• Shrugs 3×15\n\n' +
      'Lateral raises: elbows slightly bent, lead with the elbow not the wrist.',
    Arms:
      `**Arm day** — biceps & triceps are ${stalestDays} day${stalestDays !== 1 ? 's' : ''} out:\n` +
      '• Barbell or EZ-bar curl 4×10\n' +
      '• Hammer curl 3×12\n' +
      '• Close-grip bench or skull crusher 4×10\n' +
      '• Tricep pushdown 3×12\n' +
      '• Cable curl 3×15\n\n' +
      'Keep rest to 60–90s to maintain pump and maximise hypertrophic stimulus.',
    Core:
      `**Core session** — ${stalestDays} day${stalestDays !== 1 ? 's' : ''} since core work:\n` +
      '• Dead bug 3×10 each side (slow and controlled)\n' +
      '• Pallof press 3×12 each side\n' +
      '• Plank 3×45–60s\n' +
      '• Cable crunch 3×15\n' +
      '• Side plank 3×30s each side\n\n' +
      'Core training is about resisting movement, not just creating it. Focus on bracing throughout.',
  };

  const suggestion = stalest ? (suggestions[stalest] ?? suggestions['Legs']) : suggestions['Legs'];

  return (
    `🏋️ **Workout suggestion for today, ${firstName}:**\n\n` +
    suggestion +
    `\n\nLet me know if you want me to adjust the volume, swap any exercises, or add peri-workout nutrition timing for this session.`
  );
}

// ─── Condition checks ─────────────────────────────────────────

async function buildReminders(
  clientId: string,
  firstName: string,
): Promise<PendingReminder[]> {
  const today    = todayIso();
  const tomorrow = tomorrowIso();
  const hour     = new Date().getHours();
  const reminders: PendingReminder[] = [];

  // ── 1. Cheat meal ──────────────────────────────────────────
  const { data: settings } = await supabase
    .from('client_nutrition_settings')
    .select('cheat_meal_every_n_days, cheat_meal_last_date')
    .eq('client_id', clientId)
    .maybeSingle();

  if (settings && isCheatMealDue(settings.cheat_meal_last_date, settings.cheat_meal_every_n_days)) {
    if (!(await wasRemindedToday(clientId, 'cheat_meal'))) {
      reminders.push({
        type: 'cheat_meal',
        message:
          `🎉 ${firstName}, your cheat meal is ready — you've earned it! ` +
          `Enjoy whatever you've been craving, guilt-free. Keep it to one meal (not a full day), ` +
          `then get straight back on plan. Mark it done from the cheat meal banner when you're finished. ` +
          `What are you thinking of having?`,
      });
    }
  }

  // ── 2. Calorie tracking (only after 1 PM) ─────────────────
  if (hour >= 13) {
    const [logsRes, goalRes] = await Promise.all([
      supabase
        .from('nutrition_logs')
        .select('calories')
        .eq('client_id', clientId)
        .eq('logged_date', today),
      supabase
        .from('nutrition_goals')
        .select('calories')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (goalRes.data && logsRes.data && logsRes.data.length > 0) {
      const logged = logsRes.data.reduce((sum, l) => sum + (l.calories ?? 0), 0);
      const target = goalRes.data.calories;

      if (target > 0 && logged > 0) {
        const ratio = logged / target;

        if (ratio < 0.8 && hour < 20) {
          if (!(await wasRemindedToday(clientId, 'calorie_under'))) {
            const remaining = Math.round(target - logged);
            reminders.push({
              type: 'calorie_under',
              message:
                `📊 Nutrition check-in: you've logged ${Math.round(logged)} kcal today, ` +
                `about ${remaining} kcal short of your ${Math.round(target)} kcal goal. ` +
                `Under-eating — especially on training days — can slow your progress and increase muscle loss. ` +
                `A protein shake and a banana is a quick 300–400 kcal top-up. ` +
                `Want some ideas to hit your target before the end of the day?`,
            });
          }
        } else if (ratio > 1.2) {
          if (!(await wasRemindedToday(clientId, 'calorie_over'))) {
            const excess = Math.round(logged - target);
            reminders.push({
              type: 'calorie_over',
              message:
                `📊 You're about ${excess} kcal over your target today — it happens, don't stress it. ` +
                `The best move from here is a light, high-protein dinner and plenty of water. ` +
                `No need to compensate tomorrow — just return to your normal plan. ` +
                `Want some ideas for a lighter evening meal?`,
            });
          }
        }
      }
    }
  }

  // ── 3. Upcoming booked sessions (today or tomorrow) ───────
  if (!(await wasRemindedToday(clientId, 'session_upcoming'))) {
    const { data: allUpcoming } = await supabase
      .from('scheduled_sessions')
      .select('scheduled_at, duration_minutes')
      .eq('client_id', clientId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${tomorrow}T23:59:59`)
      .order('scheduled_at', { ascending: true })
      .limit(3);

    if (allUpcoming && allUpcoming.length > 0) {
      for (const session of allUpcoming) {
        const sessionDate = session.scheduled_at.slice(0, 10);
        const isToday    = sessionDate === today;
        const timeStr    = fmtTime(session.scheduled_at);
        const durLabel   = session.duration_minutes === 30 ? '30-minute' : '60-minute';

        reminders.push({
          type: 'session_upcoming',
          message: isToday
            ? `⏰ Reminder: you have a ${durLabel} session with your trainer **today at ${timeStr}**. ` +
              `Make sure you've had a proper pre-workout meal 1–2 hours before — some carbs and protein (e.g. rice + chicken or oats + eggs). ` +
              `Get your gear ready and warm up before you arrive. See you there!`
            : `📅 Heads up — you have a ${durLabel} session with your trainer **tomorrow at ${timeStr}**. ` +
              `Plan your meals today so you're properly fuelled going in. A good night's sleep tonight will make a real difference to your performance. ` +
              `Anything specific you want to focus on in the session?`,
        });
      }
      await markRemindedToday(clientId, 'session_upcoming');
    }
  }

  // ── 4. Assigned workout due today ─────────────────────────
  const { data: todayWorkouts } = await supabase
    .from('assigned_workouts')
    .select('id, title')
    .eq('client_id', clientId)
    .eq('status', 'assigned')
    .eq('scheduled_date', today)
    .limit(3);

  const hasAssignedToday = todayWorkouts && todayWorkouts.length > 0;

  if (hasAssignedToday) {
    if (!(await wasRemindedToday(clientId, 'workout_today'))) {
      const names = todayWorkouts.map(w => w.title ?? 'Workout').join(', ');
      const count = todayWorkouts.length;
      reminders.push({
        type: 'workout_today',
        message:
          `💪 You have ${count === 1 ? 'a workout' : `${count} workouts`} scheduled for today: **${names}**. ` +
          `Head to your Workouts tab when you're ready to start. ` +
          `Warm up properly, log every set, and enjoy the session. ` +
          `Need any pre-workout nutrition tips?`,
      });
    }
  } else {
    // ── 5. Days since last workout ─────────────────────────
    const { data: lastWorkout } = await supabase
      .from('workouts')
      .select('performed_at')
      .eq('client_id', clientId)
      .order('performed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastWorkout) {
      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastWorkout.performed_at.split('T')[0]).getTime()) / 86_400_000,
      );

      if (daysDiff >= 3 && !(await wasRemindedToday(clientId, 'workout_gap'))) {
        reminders.push({
          type: 'workout_gap',
          message:
            `👋 It's been ${daysDiff} day${daysDiff !== 1 ? 's' : ''} since your last workout. ` +
            `No judgment — life gets busy! Even a 30–45 minute session today can reset your momentum ` +
            `and boost your energy for the rest of the week. ` +
            `Check your Workouts tab to see what your trainer has lined up. ` +
            `Want me to suggest something you can do today?`,
        });
      }
    }
  }

  // ── 6. Periodic workout suggestion (every 3 days) ─────────
  // Only suggest when there's no assigned workout today, so we
  // don't double up on "here's what to do" messages.
  if (!hasAssignedToday) {
    const daysSince = await daysSinceLastSent(clientId, 'workout_suggestion');
    if (daysSince >= 3) {
      // Fetch last 21 days of workouts with muscle groups
      const cutoff = toIso(new Date(Date.now() - 21 * 86_400_000));
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select(`
          performed_at,
          workout_sets (
            exercise:exercises ( muscle_group )
          )
        `)
        .eq('client_id', clientId)
        .gte('performed_at', `${cutoff}T00:00:00`)
        .order('performed_at', { ascending: false })
        .limit(30);

      if (recentWorkouts && recentWorkouts.length > 0) {
        reminders.push({
          type: 'workout_suggestion',
          message: buildSuggestion(firstName, recentWorkouts as unknown as WorkoutRow[]),
        });
      }
    }
  }

  return reminders;
}

// ─── Hook ─────────────────────────────────────────────────────

type Options = {
  clientId: string;
  clientName: string;
  addMessage: AddMessageFn;
  /** Pass the loading state from useNutritionChat — reminders fire once loading becomes false */
  loading: boolean;
};

export function useAIReminders({ clientId, clientName, addMessage, loading }: Options): void {
  const hasRun = useRef(false);

  useEffect(() => {
    if (loading || hasRun.current || !clientId) return;
    hasRun.current = true;

    const firstName = clientName.split(' ')[0] ?? clientName;

    buildReminders(clientId, firstName).then(async (reminders) => {
      for (let i = 0; i < reminders.length; i++) {
        const { type, message } = reminders[i];
        const { error } = await addMessage('assistant', message);
        if (!error) {
          await markRemindedToday(clientId, type);
        }
        if (i < reminders.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    });
  }, [loading, clientId]);
}
