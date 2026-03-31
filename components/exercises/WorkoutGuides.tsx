import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radius, useTheme } from '@/constants/theme';
import { useWorkoutGuides } from '@/hooks/useWorkoutGuides';

// ─── Types ────────────────────────────────────────────────────

type Seg = string | { t: string; url: string };

type GuideSection = { key: string; label: string; icon: string };
type GuideTopic = {
  key: string;
  label: string;
  icon: string;
  subtitle: string;
  forWho: string;
  sections: GuideSection[];
};

type Props = {
  selectedMuscle: string | null;
  onSelectMuscle: (m: string | null) => void;
  isTrainer: boolean;
};

// ─── Inline-link renderer ─────────────────────────────────────

function RichText({ segs, style }: { segs: Seg[]; style?: object }) {
  return (
    <Text style={style as never}>
      {segs.map((seg, i) =>
        typeof seg === 'string' ? (
          <Text key={i}>{seg}</Text>
        ) : (
          <Text key={i} style={styles.link} onPress={() => Linking.openURL(seg.url)}>
            {seg.t}
          </Text>
        ),
      )}
    </Text>
  );
}

// ─── Guide topics ─────────────────────────────────────────────

const TOPICS: GuideTopic[] = [
  {
    key: 'getting_started',
    label: 'Getting Started',
    icon: 'rocket-outline',
    subtitle: 'What resistance training is and how to begin',
    forWho: 'Complete beginners',
    sections: [
      { key: 'what_is_training',  label: 'What Is Resistance Training?', icon: 'barbell-outline' },
      { key: 'consistency',       label: 'The #1 Rule: Consistency',      icon: 'calendar-outline' },
      { key: 'first_program',     label: 'Choosing Your First Program',   icon: 'list-outline' },
      { key: 'expectations',      label: 'What to Expect',                icon: 'trending-up-outline' },
    ],
  },
  {
    key: 'full_body',
    label: 'Full Body Training',
    icon: 'body-outline',
    subtitle: '3 days/week — the ideal beginner split',
    forWho: 'Beginners (0–6 months)',
    sections: [
      { key: 'overview',           label: 'Overview',           icon: 'information-circle-outline' },
      { key: 'schedule',           label: 'Example Schedule',   icon: 'calendar-outline' },
      { key: 'exercise_selection', label: 'Exercise Selection', icon: 'fitness-outline' },
      { key: 'progression',        label: 'Progression',        icon: 'trending-up-outline' },
    ],
  },
  {
    key: 'upper_lower',
    label: 'Upper / Lower Split',
    icon: 'git-branch-outline',
    subtitle: '4 days/week — upper body & lower body days',
    forWho: 'Early intermediate (6–18 months)',
    sections: [
      { key: 'overview',           label: 'Overview',           icon: 'information-circle-outline' },
      { key: 'schedule',           label: 'Example Schedule',   icon: 'calendar-outline' },
      { key: 'exercise_selection', label: 'Exercise Selection', icon: 'fitness-outline' },
      { key: 'progression',        label: 'Progression',        icon: 'trending-up-outline' },
    ],
  },
  {
    key: 'push_pull_legs',
    label: 'Push / Pull / Legs',
    icon: 'refresh-outline',
    subtitle: '6 days/week — the classic intermediate split',
    forWho: 'Intermediate (1+ years)',
    sections: [
      { key: 'overview',           label: 'Overview',           icon: 'information-circle-outline' },
      { key: 'schedule',           label: 'Example Schedule',   icon: 'calendar-outline' },
      { key: 'exercise_selection', label: 'Exercise Selection', icon: 'fitness-outline' },
      { key: 'progression',        label: 'Progression',        icon: 'trending-up-outline' },
    ],
  },
  {
    key: 'exercise_selection',
    label: 'Exercise Selection',
    icon: 'search-outline',
    subtitle: 'How to build effective workouts from scratch',
    forWho: 'All levels',
    sections: [
      { key: 'compounds_first',  label: 'Compound Exercises First',  icon: 'barbell-outline' },
      { key: 'isolation',        label: 'Isolation Exercises',       icon: 'hand-left-outline' },
      { key: 'exercise_order',   label: 'Exercise Order',            icon: 'swap-vertical-outline' },
      { key: 'weight_selection', label: 'Choosing the Right Weight', icon: 'scale-outline' },
    ],
  },
  {
    key: 'progressive_overload',
    label: 'Progressive Overload',
    icon: 'arrow-up-circle-outline',
    subtitle: 'The fundamental law of getting stronger',
    forWho: 'All levels',
    sections: [
      { key: 'what_is_it',           label: 'What Is Progressive Overload?', icon: 'bulb-outline' },
      { key: 'linear_progression',   label: 'Linear Progression',            icon: 'trending-up-outline' },
      { key: 'double_progression',   label: 'Double Progression',            icon: 'layers-outline' },
      { key: 'tracking',             label: 'Tracking Your Progress',        icon: 'pencil-outline' },
    ],
  },
  {
    key: 'sets_reps',
    label: 'Sets, Reps & Intensity',
    icon: 'stats-chart-outline',
    subtitle: 'Rep ranges, volume, rest periods and RPE',
    forWho: 'All levels',
    sections: [
      { key: 'rep_ranges',   label: 'Rep Ranges Explained',    icon: 'repeat-outline' },
      { key: 'sets_volume',  label: 'Sets & Weekly Volume',    icon: 'layers-outline' },
      { key: 'rest_periods', label: 'Rest Between Sets',       icon: 'timer-outline' },
      { key: 'rpe',          label: 'RPE — Rating Your Effort', icon: 'thermometer-outline' },
    ],
  },
  {
    key: 'warmup',
    label: 'Warm-Up & Cool-Down',
    icon: 'flame-outline',
    subtitle: 'Prepare your body and recover smarter',
    forWho: 'All levels',
    sections: [
      { key: 'why_warmup',     label: 'Why Warm Up?',             icon: 'help-circle-outline' },
      { key: 'general_warmup', label: 'General Warm-Up',          icon: 'walk-outline' },
      { key: 'specific_sets',  label: 'Specific Warm-Up Sets',    icon: 'barbell-outline' },
      { key: 'cooldown',       label: 'Cool-Down',                icon: 'snow-outline' },
    ],
  },
  {
    key: 'deload',
    label: 'Deload Weeks',
    icon: 'battery-charging-outline',
    subtitle: 'Programmed recovery to keep progress going',
    forWho: 'Intermediate+',
    sections: [
      { key: 'what_is_it',    label: 'What Is a Deload?',          icon: 'information-circle-outline' },
      { key: 'when_to_deload', label: 'When to Deload',            icon: 'calendar-outline' },
      { key: 'how_to_deload', label: 'How to Deload',              icon: 'options-outline' },
      { key: 'signs',         label: 'Signs You Need One',         icon: 'warning-outline' },
    ],
  },
];

// ─── Muscle spotlight data ────────────────────────────────────

type MuscleSpotlight = {
  pplDay: string;
  upperLowerDay: string;
  fullBodyNote: string;
  primaryExercises: string[];
};

const MUSCLE_SPOTLIGHT: Record<string, MuscleSpotlight> = {
  Chest: {
    pplDay: 'Push day',
    upperLowerDay: 'Upper day',
    fullBodyNote: 'Included every full-body session via horizontal push pattern',
    primaryExercises: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Push-Up'],
  },
  Shoulders: {
    pplDay: 'Push day',
    upperLowerDay: 'Upper day',
    fullBodyNote: 'Included every session via vertical push (Overhead Press)',
    primaryExercises: ['Overhead Press', 'Lateral Raise', 'Face Pull', 'Arnold Press'],
  },
  Arms: {
    pplDay: 'Push (triceps) + Pull (biceps)',
    upperLowerDay: 'Upper day (both)',
    fullBodyNote: 'Arms get indirect work from all pressing and pulling; add curls/extensions as finishers',
    primaryExercises: ['Barbell Curl', 'Hammer Curl', 'Tricep Pushdown', 'Close-Grip Bench Press'],
  },
  Core: {
    pplDay: 'Leg day + end of every session',
    upperLowerDay: 'Both upper and lower days',
    fullBodyNote: 'Core is braced and engaged on every compound lift — add direct work at end of sessions',
    primaryExercises: ['Plank', 'Dead Bug', 'Pallof Press', 'Ab Wheel Rollout', 'Hanging Leg Raise'],
  },
  Hips: {
    pplDay: 'Leg day',
    upperLowerDay: 'Lower day',
    fullBodyNote: 'Hip hinge pattern (deadlift, RDL) and squat pattern in every session',
    primaryExercises: ['Hip Thrust', 'Romanian Deadlift', 'Goblet Squat', 'Bulgarian Split Squat'],
  },
  Back: {
    pplDay: 'Pull day',
    upperLowerDay: 'Upper day',
    fullBodyNote: 'Horizontal pull (row) and vertical pull (lat pulldown) in every session',
    primaryExercises: ['Barbell Row', 'Lat Pulldown', 'Deadlift', 'Cable Row', 'Face Pull'],
  },
  Glutes: {
    pplDay: 'Leg day',
    upperLowerDay: 'Lower day',
    fullBodyNote: 'Squats and hip hinges in every session; add hip thrusts for direct work',
    primaryExercises: ['Hip Thrust', 'Romanian Deadlift', 'Squat', 'Glute Bridge', 'Step-Up'],
  },
  Legs: {
    pplDay: 'Leg day',
    upperLowerDay: 'Lower day',
    fullBodyNote: 'Squats and deadlifts are the foundation of every full-body session',
    primaryExercises: ['Barbell Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raise'],
  },
};

// ─── Default content (plain text, trainer edit baseline) ──────

type SectionContent = Record<string, string>;
const DEFAULT_CONTENT: Record<string, SectionContent> = {
  getting_started: {
    what_is_training:
      'Resistance training (also called strength or weight training) is any exercise where your muscles work against an external resistance — barbells, dumbbells, cables, machines, or even your own bodyweight. When you lift a weight, you create microscopic tears in your muscle fibres. During the rest periods between sessions, your body repairs these tears, making the fibres slightly thicker and stronger — a process called muscle protein synthesis. Over months and years, this leads to measurable increases in muscle size (hypertrophy) and maximal strength.\n\nResistance training is one of the most studied health interventions in medicine. Regular practice improves metabolic health (insulin sensitivity, blood sugar regulation), increases bone mineral density (protecting against osteoporosis), reduces all-cause mortality risk, and improves mood, sleep quality, and cognitive function. You do not need to be athletic, young, or already fit to begin. Studies consistently show benefits across all ages and fitness levels, including elderly populations.',
    consistency:
      'No training variable — not split choice, not exercise selection, not nutrition timing — matters more than simply showing up consistently over months and years. A mediocre program followed for 3 years beats a perfect program followed for 3 weeks.\n\nTarget 3 sessions per week to start. This is enough stimulus for substantial progress and leaves enough recovery time. Most beginners make the mistake of going every day when motivation is high, burning out, then stopping entirely. Sustainable beats optimal every time.\n\nA useful rule: missing one session is fine; missing two in a row is a warning sign; missing three is a habit of not training. Protect your schedule by training at a consistent time each day — research on habit formation shows time-of-day consistency significantly improves long-term adherence.',
    first_program:
      'As a beginner, nearly any structured program will produce results because your body has never been exposed to this kind of stress. The best program is the one you will actually follow. That said, a good beginner program shares these traits: (1) full-body training 3 times per week, (2) built around barbell or dumbbell compound exercises, (3) includes linear progression (adding weight each session), and (4) is simple enough to learn quickly.\n\nHighly recommended beginner programs: StrongLifts 5×5 (3 lifts per session, easy to start), Starting Strength by Mark Rippetoe (barbell-focused, great technique instruction), and GZCLP by Cody LeFever (adds more upper-body pulling and accessories than the others). Avoid highly specialised bodybuilder splits — training each muscle only once per week is poorly suited to beginners who benefit most from high frequency.',
    expectations:
      'In the first 4–8 weeks, the majority of your strength gains will be neurological, not structural. Your brain becomes better at recruiting motor units and coordinating inter-muscular activation — you get stronger without visibly bigger muscles. This is completely normal and expected.\n\nVisible muscle growth (hypertrophy) typically becomes noticeable around weeks 8–12 of consistent training. Do not compare your 6-week physique to someone who has trained for 3 years. Progress photos taken every 4 weeks are far more motivating than daily mirror checks.\n\nYou will likely experience Delayed Onset Muscle Soreness (DOMS) after early sessions — a dull, achy feeling in trained muscles that peaks 24–72 hours after training. This is normal and reduces significantly as your body adapts. Soreness is not a reliable indicator of a good workout; the absence of soreness does not mean you are not progressing.',
  },

  full_body: {
    overview:
      'A full body routine trains all major muscle groups in every session. Most beginners follow a 3-day schedule on non-consecutive days (Monday, Wednesday, Friday), with 48 hours of rest between sessions. This gives each muscle group 3 training stimuli per week, which research identifies as highly effective for beginners and is more than most single-muscle-day splits provide.\n\nThe full body approach is ideal if you have 3 days per week available and are in your first year of training. If you miss a session, you lose one third of your weekly volume — not an entire muscle group\'s week as with body part splits. This makes full body training more robust to life disruptions. Most elite strength coaches recommend full-body training as the foundational approach for all beginners before transitioning to more specialised splits.',
    schedule:
      'A classic 3-day full body week: Monday (Session A), Wednesday (Session B), Friday (Session C). Each session covers the same movement patterns but can rotate exercises.\n\nSession A example: Back Squat 3×5, Bench Press 3×5, Bent-Over Row 3×5, Overhead Press 2×8, Plank 3×30s.\nSession B example: Goblet Squat 3×8, Romanian Deadlift 3×8, Incline Dumbbell Press 3×8, Lat Pulldown 3×10, Dead Bug 3×8.\nSession C example: Deadlift 1×5, Front Squat or Pause Squat 3×5, Push-Up 3×15, Cable Row 3×10, Pallof Press 3×10.\n\nRest at least 48 hours between sessions to allow full recovery. Each session should take 45–60 minutes.',
    exercise_selection:
      'Build every session around the six fundamental movement patterns. You need one exercise per pattern per session:\n\n1. Squat (quads, glutes, core) — back squat, goblet squat, front squat, leg press\n2. Hip hinge (hamstrings, glutes, lower back) — deadlift, Romanian deadlift, hip thrust, good morning\n3. Horizontal push (chest, shoulders, triceps) — bench press, push-up, dumbbell press\n4. Vertical push (shoulders, triceps) — overhead press, dumbbell shoulder press, pike push-up\n5. Horizontal pull (back, biceps) — barbell row, dumbbell row, cable row, inverted row\n6. Vertical pull (lats, biceps) — lat pulldown, pull-up, chin-up, cable pullover\n\nAdd 1–2 isolation exercises at the end if time allows: bicep curls, tricep extensions, lateral raises, calf raises, or core work. Keep total sets per session to 15–20 for beginners.',
    progression:
      'As a beginner, you can and should add weight to your main lifts every single session — this is called linear progression, and it is one of the most powerful advantages you have. Your nervous system is adapting so rapidly that you can recover and progress in 48 hours.\n\nSimple rule: if you complete all prescribed reps with good form, add weight next session. Upper body lifts: add 2.5 kg (5 lbs). Lower body lifts (squat, deadlift): add 5 kg (10 lbs). If you fail to complete all reps, repeat the same weight next session. If you fail the same weight twice in a row, it is time to reassess recovery (sleep, food, stress).\n\nLinear progression can continue for 3–6 months in most beginners before progress slows. Do not skip ahead to more complex progression methods — use every possible session of linear gains before switching.',
  },

  upper_lower: {
    overview:
      'The upper/lower split divides training into upper body days (chest, back, shoulders, biceps, triceps) and lower body days (quads, hamstrings, glutes, calves). A typical week runs 4 days: Upper–Lower–Rest–Upper–Lower–Rest–Rest. Each muscle group is trained twice per week, which a landmark 2016 meta-analysis by Schoenfeld et al. identified as significantly superior for muscle growth compared to once-per-week frequency when volume is equated.\n\nThis split is an excellent step up from full-body training once you have 6–12 months of consistent training and want more volume per session. It also allows more exercise variety — you can include more chest work, more back work, and more leg work in dedicated sessions without sessions becoming too long.',
    schedule:
      'Standard 4-day upper/lower week:\nDay 1 (Upper A — Strength focus): Bench Press 4×5, Barbell Row 4×5, Overhead Press 3×8, Lat Pulldown 3×8, Barbell Curl 3×10, Tricep Pushdown 3×10.\nDay 2 (Lower A — Strength focus): Barbell Squat 4×5, Romanian Deadlift 3×8, Leg Press 3×10, Leg Curl 3×10, Calf Raise 4×15.\nDay 3: Rest.\nDay 4 (Upper B — Volume focus): Incline DB Press 4×10, Cable Row 4×10, Dumbbell Shoulder Press 3×12, Chest-Supported Row 3×12, Hammer Curl 3×12, Overhead Tricep Extension 3×12.\nDay 5 (Lower B — Volume focus): Deadlift 3×5, Front Squat or Split Squat 3×10, Leg Press 3×12, Nordic Curl or Leg Curl 3×12, Hip Thrust 3×12.\nDays 6–7: Rest.',
    exercise_selection:
      'Upper days should cover all four upper body movement patterns: horizontal push, vertical push, horizontal pull, and vertical pull. A and B variations use the same patterns but different rep ranges — A sessions are heavier and strength-focused (3–6 reps on main lifts), B sessions are lighter and volume-focused (8–15 reps).\n\nLower days should cover the squat pattern and hip hinge pattern as primary movements, followed by isolation work for quads (leg press, leg extension), hamstrings (leg curl, Nordic curl), glutes (hip thrust), and calves. Lower A typically uses the squat as the main strength exercise; Lower B elevates the deadlift.\n\nInclude direct arm work (2–3 sets of curls, 2–3 sets of tricep work) on both upper days. Arms receive indirect volume from pressing (triceps) and pulling (biceps), but direct sets accelerate arm development.',
    progression:
      'At this stage, linear progression (adding weight every session) will begin to slow. Transition to double progression: for each exercise, set a rep range (e.g., 3×8–12). Train at a fixed weight until you can complete all sets at the top of the range (3×12). Then increase the weight by 2.5–5 kg and reset to the bottom of the range (3×8). You progress in two stages: first reps, then load.\n\nA popular beginner-to-intermediate program for upper/lower training is GZCLP by powerlifter Cody LeFever. It uses a 3-tier system: T1 heavy compound (5×3+), T2 secondary compound (3×10), T3 accessories (3×15+). Progression is built in: when you fail a T1 weight, advance through stages (5×3 → 6×2 → 10×1) before resetting with a 10% weight increase.',
  },

  push_pull_legs: {
    overview:
      'Push/Pull/Legs (PPL) organises training by movement pattern rather than body part. Push days train muscles that push (chest, anterior and lateral deltoids, triceps). Pull days train muscles that pull (lats, rhomboids, traps, rear delts, biceps). Leg days train the lower body (quads, hamstrings, glutes, calves). In the 6-day version (running the full cycle twice per week), each muscle receives two training sessions weekly — matching the optimal frequency from the research literature.\n\nPPL is considered an intermediate-to-advanced split. As a true beginner, the 6-day frequency and volume will be difficult to recover from. If you have been training consistently for 12+ months, have plateaued on full-body or upper/lower, and can dedicate 6 days per week, PPL is a powerful choice.',
    schedule:
      'Six-day PPL schedule: Mon = Push, Tue = Pull, Wed = Legs, Thu = Push, Fri = Pull, Sat = Legs, Sun = Rest.\n\nPush day: Bench Press 5×5 (AMRAP last set), Overhead Press 3×8, Incline DB Press 3×10, Cable Lateral Raise 3×15, Tricep Pushdown 3×12, Overhead Tricep Extension 3×12.\nPull day: Barbell Row 5×5 (or Deadlift 3×5), Lat Pulldown 4×10, Cable Row 3×12, Face Pull 3×15, Barbell Curl 3×12, Hammer Curl 3×12.\nLeg day: Squat 4×5 (AMRAP last set), Romanian Deadlift 3×10, Leg Press 3×12, Leg Curl 3×12, Calf Raise 4×15, Abs (plank, hanging leg raise).\n\nThursday through Saturday repeats the cycle with slightly different rep ranges or exercise variations for variety.',
    exercise_selection:
      'Lead each day with the primary compound movement: bench press or overhead press for push, barbell row or deadlift for pull, squat for legs. This is where you place your heaviest, most technically demanding work when energy is highest.\n\nSecondary exercises on each day provide additional volume at a moderate intensity. On push: incline press, dip, cable fly. On pull: lat pulldown, cable row, chest-supported row. On legs: Romanian deadlift, leg press, split squat.\n\nFinish with isolation exercises that target specific muscles needing extra attention. Push isolation: lateral raises, tricep extensions. Pull isolation: face pulls (critical for shoulder health), curls. Leg isolation: leg curls, hip thrusts, calf raises.\n\nTotal sets per session: 18–25. If sessions feel too long, trim isolation work — never the compound movements.',
    progression:
      'At the intermediate level, adding weight every session is no longer possible. Your nervous system has fully adapted and muscle protein synthesis rates are lower than in the beginner phase. Progression slows — this is normal, not failure.\n\nUse double progression on secondary exercises (see the dedicated guide). For your main compound lifts, the Reddit PPL protocol works well: sets of 5 with an AMRAP ("as many reps as possible") last set. If you achieve 8+ reps on the AMRAP set consistently across two sessions, add weight next session. Track every AMRAP set.\n\nIf a main lift stalls (no AMRAP set improvement in 3 weeks), investigate recovery: are you sleeping 7–9 hours? Eating enough protein (1.6–2.2 g/kg bodyweight)? Managing stress? A deload week every 6–8 weeks can break plateaus by clearing accumulated fatigue and allowing super-compensation.',
  },

  exercise_selection: {
    compounds_first:
      'Compound exercises are multi-joint movements that engage multiple muscle groups simultaneously. They produce the greatest hormonal response (growth hormone, testosterone), develop the most functional strength, burn the most calories, and give you the highest return on training time. The "Big Five" compound movements are the foundation of every effective resistance training program:\n\n1. Squat — quads, glutes, hamstrings, core, erectors\n2. Deadlift — entire posterior chain (hamstrings, glutes, back), grip, core\n3. Bench Press — chest, anterior deltoids, triceps\n4. Overhead Press — deltoids, triceps, upper traps, core stabilisers\n5. Row (Barbell or Dumbbell) — lats, rhomboids, traps, rear delts, biceps\n\nEvery session should begin with one or two of these. Beginners do not need dozens of exercises — getting strong at the Big Five produces a powerful, well-developed physique.',
    isolation:
      'Isolation exercises target a single muscle group by movement across one joint. Examples: bicep curls (elbow flexion only), tricep pushdowns (elbow extension only), lateral raises (shoulder abduction only), leg curls (knee flexion only).\n\nIsolation exercises are valuable for: (1) directly developing muscles that receive insufficient volume from compounds (lateral delts, biceps, calves, tibialis anterior), (2) addressing muscle imbalances or weaknesses, (3) adding volume when your body is too fatigued to safely perform another heavy compound set.\n\nAs a beginner, limit yourself to 2–4 isolation exercises per session, placed at the end. A common beginner mistake is spending 30 minutes doing curls while neglecting squats and rows. Isolation work adds the finishing details to a physique that is built primarily by compounds.',
    exercise_order:
      'The order of exercises within a session directly affects performance. Fatigue is cumulative — each set reduces your capacity for the next. Therefore: always perform your most demanding, technically complex, and heaviest exercises first.\n\nRecommended order within a session:\n1. Heavy compound lift (squat, deadlift, bench, row, overhead press) — highest neurological demand\n2. Secondary compound (lunge, dip, incline press, Romanian deadlift) — similar demand, slightly less weight\n3. Accessory compound or complex isolation (cable fly, leg press, lat pulldown, cable row)\n4. Isolation exercises (curls, tricep extensions, lateral raises, leg curls)\n5. Core exercises (plank, ab wheel, pallof press) and carries\n\nExample of what NOT to do: performing bicep curls before rows, or leg press before squats. Your main movements should receive your freshest state. Prioritising isolation first undermines the entire session.',
    weight_selection:
      'Choosing the right starting weight is one of the most common challenges for beginners. Most beginners start too heavy, sacrificing form and risking injury. The correct approach:\n\nFor compound lifts: start with just the empty bar (20 kg / 45 lbs) for at least your first session. Learn the movement pattern without load pressure. Add weight each session from there.\n\nFor isolation exercises: pick a weight you could comfortably do for 20 reps, then perform your prescribed 10–15 reps. It will feel easy at first — that is fine. You will progress quickly.\n\nA useful test: if you cannot maintain perfect form for every rep, the weight is too heavy. Reduce by 10–20% and continue. The ego cost of lifting lighter is far less than the time cost of an injury.\n\nAs you advance, learn to estimate your 1-repetition maximum (1RM) from your working sets using the Epley formula: 1RM ≈ weight × (1 + reps / 30). Many programmes prescribe percentages of your 1RM for working weights.',
  },

  progressive_overload: {
    what_is_it:
      'Progressive overload is the fundamental principle of all adaptation in resistance training: you must continually increase the stress placed on your body to keep forcing it to adapt. Your body is extremely efficient — it adapts to a given stimulus and then stops changing. If you do the same weights, same sets, and same reps every session for months, you will maintain your current fitness level but make zero progress.\n\nThere are several ways to progressively overload a training programme: (1) Increase load — add weight to the bar, (2) Increase volume — add sets or reps at the same weight, (3) Increase frequency — train the movement more times per week, (4) Increase density — do the same work in less time, (5) Increase range of motion or improve technique. For beginners, load progression is the primary and simplest method. Track at least one metric improving over time.',
    linear_progression:
      'Linear progression means adding a fixed amount of weight to a lift every single session. It is the hallmark of beginner programs and represents the fastest possible rate of strength development. Beginners can linear progress because their nervous system adapts within 48 hours — you literally get stronger between sessions.\n\nStandard increments: upper body lifts (bench, overhead press, row) — add 2.5 kg (5 lbs) per session. Lower body lifts (squat) — add 5 kg (10 lbs) per session. Deadlift — add 5–10 kg per session initially, slowing to 5 kg once weights get challenging.\n\nIf you complete all prescribed sets and reps: add weight next session. If you miss reps: repeat the same weight. If you fail the same weight twice: check sleep and nutrition before changing the programme. Most beginner failures are a nutrition or sleep deficit, not a programming problem.\n\nDo not waste this window. A beginner who starts linear progression at a sensible weight and follows it diligently for 6 months will have a foundation most people never build.',
    double_progression:
      'When linear progression slows (you can no longer add weight every session), transition to double progression. This method assigns each exercise a rep range — for example, 3 sets of 8–12 reps.\n\nHow it works: Train at a fixed weight. Keep the weight the same every session until you can complete all 3 sets at the top of the range (3×12). Once you achieve that, add 2.5–5 kg (5–10 lbs) to the bar and reset to the bottom of the range (3×8). You have now made two types of progress: first more reps, then more weight.\n\nExample: Week 1 — 3×8 @ 60 kg. Week 2 — 3×9 @ 60 kg. Week 3 — 3×11 @ 60 kg. Week 4 — 3×12 @ 60 kg → increase to 62.5 kg. Week 5 — 3×8 @ 62.5 kg. This simple method can drive continuous progress for years.',
    tracking:
      'You cannot manage what you cannot measure. Keeping a training log is non-negotiable for long-term progress. Without records, you cannot confirm whether you are actually progressing, making it easy to delude yourself that you are doing more than you are — or to forget what weights you used last session.\n\nRecord for every set: exercise name, weight, and reps completed. Optionally note RPE (see Sets & Reps guide), technique notes, and how you felt. Review your log before each session to set clear targets: "Last Wednesday I did 3×8 @ 80 kg on bench. Today I will aim for 3×9 or 3×10."\n\nReview monthly: are your compound lifts going up over a 4-week span? If any main lift has not progressed in 4 weeks, investigate sleep, nutrition, and stress before making programme changes. Tracking transforms training from random activity into structured skill development.',
  },

  sets_reps: {
    rep_ranges:
      'The traditional rep range model divides training into three zones: 1–5 reps (maximal strength), 6–12 reps (hypertrophy / muscle building), and 12–20+ reps (muscular endurance). This is still a useful framework for building programmes, but modern research has refined the picture.\n\nA major 2021 re-examination of the repetition continuum by Schoenfeld et al. found that for muscle growth (hypertrophy), nearly any rep range from approximately 6 to 30 reps can be effective — provided you train close to muscular failure. The critical variable for hypertrophy is effort level, not the specific load or rep count. Practically: you can build muscle doing sets of 5 or sets of 30, as long as you push hard enough.\n\nFor maximal strength (your 1-repetition maximum), heavier loads (1–5 reps at 85%+ of 1RM) retain an advantage due to specificity — you get better at what you train. For beginners, working in the 5–12 rep range for compounds and 10–20 reps for isolation exercises is a reliable, well-tested approach.',
    sets_volume:
      'The total number of hard sets you perform per muscle group per week (weekly volume) is one of the primary drivers of hypertrophy. Research suggests 10–20 sets per muscle per week is the effective range for most trained individuals.\n\nBeginners can make excellent progress with as few as 6–10 sets per muscle group per week — your body is so sensitive to the new stress that a low dose goes a long way. Starting with high volume is counterproductive: you accumulate excessive soreness, cannot recover between sessions, and progress stalls.\n\nGeneral beginner guidelines: 6–10 sets/week per major muscle group (chest, back, legs, shoulders). 4–6 sets/week for smaller muscles (biceps, triceps, calves). As you advance over 6–12 months, gradually increase to the 10–15 sets/week range. Only add volume when recovery allows — if you are consistently sore, sleeping poorly, or stalling, you are doing too much.',
    rest_periods:
      'How long you rest between sets significantly impacts training outcomes. A landmark 2016 study by Schoenfeld et al. directly compared 1-minute versus 3-minute rest periods across an 8-week programme. The 3-minute group produced significantly greater gains in both maximal strength and muscle thickness than the 1-minute group — because longer rest allows more complete neuromuscular recovery, enabling higher quality subsequent sets and greater total volume per session.\n\nThe old guideline of "60–90 seconds for hypertrophy" is not supported by this evidence. Take enough rest to perform your next set with full effort.\n\nPractical guidelines:\n• Heavy compounds (squat, deadlift, bench at 80%+ 1RM): 3–5 minutes rest\n• Moderate compounds and accessory work: 2–3 minutes rest\n• Isolation finishers and high-rep sets: 60–90 seconds rest\n\nUsing a timer removes the temptation to rush between sets when tired or to take too long when distracted.',
    rpe:
      'RPE (Rating of Perceived Exertion) is a 1–10 scale that quantifies how hard a set felt, where 10 = you could not have done one more rep (complete failure), and the number of reps remaining in the tank = 10 minus RPE. So RPE 8 means you had 2 reps left; RPE 7 means 3 reps left; RPE 9 means 1 rep left.\n\nFor beginners, training the main compound lifts at RPE 7–8 (2–3 reps in reserve) is appropriate. This is hard enough to drive adaptation but not so close to failure that form breaks down and injury risk increases.\n\nFor intermediate lifters, tracking RPE alongside weight and reps gives a richer picture of training quality. If you did 80 kg × 5 at RPE 8 last month, and today 80 kg × 5 feels like RPE 6, your strength has improved even though the weight is the same. RPE-based programming (used by Barbell Medicine and many strength coaches) uses this to autoregulate load — you only increase weight when RPE drops for a given performance, indicating true adaptation.',
  },

  warmup: {
    why_warmup:
      'A proper warm-up serves several critical physiological functions: it raises your core body temperature (improving enzymatic reaction rates and nerve conduction speed), increases blood flow to working muscles (improving oxygen delivery and metabolic waste removal), lubricates synovial joints (reducing friction and injury risk), and activates neuromuscular pathways specific to the movements you are about to perform.\n\nResearch consistently shows that a structured warm-up improves performance on subsequent exercises: greater force output, faster rate of force development, and improved movement co-ordination. It also reduces injury risk — particularly for connective tissue (tendons and ligaments) which have a lower blood supply and take longer to reach optimal temperature and pliability than muscle.\n\nSkipping the warm-up to save time is one of the most common mistakes beginners make. The 10 minutes invested in warming up protects the 50 minutes of hard training that follows.',
    general_warmup:
      'A general warm-up raises your heart rate and body temperature before you start lifting. Spend 5–10 minutes on low-to-moderate intensity cardiovascular activity: brisk walking, light jogging, cycling, rowing, or skipping rope. The goal is to begin sweating slightly and feel warm throughout your body.\n\nFollow this with 3–5 minutes of dynamic stretching — controlled, rhythmic movements that take your joints through their full range of motion: leg swings (front-to-back and side-to-side), hip circles, arm circles, thoracic rotations, walking lunges, inchworms (walk hands out to plank position, then walk feet to hands), and cat-cow stretches for the spine.\n\nDynamic stretching is preferred over static stretching (holding a stretch for 30+ seconds) before lifting. Research confirms that static stretching immediately before a session can acutely reduce maximal strength and power — the opposite of what you want. Static stretching is best saved for after your workout.',
    specific_sets:
      'After your general warm-up, perform 2–4 progressively heavier warm-up sets for your first main exercise. These sets prepare the specific neuromuscular pathways, reinforce technique, and help you gauge how the weight feels today.\n\nExample for a working weight of 100 kg (220 lbs) on the back squat:\nSet 1: Empty bar (20 kg) × 8–10 reps — focus on perfect technique, full depth\nSet 2: 50 kg × 5 reps\nSet 3: 75 kg × 3 reps\nSet 4: 90 kg × 1 rep\nThen: Working sets at 100 kg\n\nDo not rush through warm-up sets or make them sloppy — each set is a technique rehearsal. You can skip the specific warm-up for your secondary and isolation exercises; by that point your body is already activated from the first exercise.',
    cooldown:
      'After your main workout, spending 5–10 minutes cooling down enhances recovery and improves long-term flexibility. Unlike the warm-up, static stretching (holding each position for 30–60 seconds) is excellent here — muscles are warm, pliable, and receptive to lengthening.\n\nFocus on the muscles you just trained: if it was a leg day, stretch hip flexors, quads, hamstrings, and calves. If it was an upper day, stretch chest, lats, shoulders, and forearms. Hold each stretch for 30–60 seconds, breathing deeply and relaxing into the position — never force a stretch to the point of sharp pain.\n\nConsider adding 5 minutes of foam rolling (self-myofascial release) for muscles that feel tight. While the research on foam rolling is mixed, many trainees find it reduces post-training soreness and improves recovery sensation.\n\nEnding with slow, deliberate breathing and a gradual walk-out helps shift your nervous system from its activated "fight-or-flight" state back toward parasympathetic ("rest and digest") dominance — improving post-workout recovery hormone dynamics.',
  },

  deload: {
    what_is_it:
      'A deload is a planned period — typically 5–7 days — of reduced training stress. You still go to the gym; you simply train at a significantly lower intensity and/or volume than normal. The goal is to allow accumulated fatigue (physical and psychological) to dissipate while retaining the strength and muscle adaptations you have built. Think of a deload as a strategic pause, not a setback.\n\nThis concept comes from periodisation theory — the science of structuring training over time to balance stress and recovery. You cannot keep pushing harder indefinitely without a planned recovery phase. The body supercompensates (comes back stronger) after a period of reduced stress, provided the stimulus was sufficient beforehand.\n\nDeloads are often misunderstood as "taking a week off." The key difference: a deload involves maintained movement patterns and enough stimulus to avoid detraining, whereas a full rest week provides no training stimulus. Both have their place depending on the situation.',
    when_to_deload:
      'Most coaches recommend deloading every 4–8 weeks for intermediate and advanced trainees. A 2023 study surveying coaches found an average deload frequency of every 4–6 weeks, with a range of 3–12 weeks depending on athlete needs, training intensity, and lifestyle stressors.\n\nBeginners in their first 3–6 months typically do not need formal deloads — training intensity is not yet high enough to accumulate significant fatigue, and simply taking weekends off provides adequate recovery.\n\nThe right time is highly individual. Factors that warrant earlier deloads: training at very high intensity (RPE 9+ most sessions), poor sleep quality, high life stress (work, illness, travel), competition preparation, or prolonged muscle soreness. If your performance in the gym has been declining consistently for 2 or more weeks, a deload is likely appropriate immediately.',
    how_to_deload:
      'There are three common approaches to deloading. Choose based on whether fatigue is primarily physical or psychological:\n\n1. Volume Deload (most common): Reduce total working sets by 40–50%. Keep the weight the same and maintain technique. Example: normally 4×5 squats → deload with 2×5 squats at the same weight.\n\n2. Intensity Deload: Maintain normal set and rep counts but reduce load to 60–70% of your usual weights. This keeps the movement pattern fresh without stressing the joints and central nervous system heavily.\n\n3. Active Recovery Week: Replace all structured lifting with low-intensity activity — walking, swimming, yoga, cycling, mobility work. Use this when psychological fatigue (dreading the gym, motivation near zero) is the dominant issue.\n\nRegardless of method: no maximal efforts, no testing personal records, no guilt about lifting less. The purpose is recovery. You will return the following week feeling stronger, not weaker.',
    signs:
      'Your body sends clear signals when accumulated fatigue has exceeded your recovery capacity. Learn to recognise these signs and take a deload proactively rather than training through progressive decline:\n\n1. Declining performance: Working weights that were comfortable now feel harder, or you are missing reps you previously completed. If this lasts more than 2 weeks, it is not a bad day — it is a recovery deficit.\n2. Persistent joint pain: Aching knees, sore elbows, painful shoulders that do not resolve after a weekend. Tendons and ligaments take much longer to recover than muscles.\n3. Mood and motivation: Dreading training sessions, irritability, reduced enjoyment of the gym. Psychological fatigue is as real as physical fatigue.\n4. Disrupted sleep: Paradoxically, overtraining often causes poor sleep quality despite physical exhaustion — high cortisol levels disrupt sleep architecture.\n5. Frequent illness: Chronic high cortisol from inadequate recovery suppresses immune function. Getting sick more often than usual is a classic overtraining sign.\n\nIf three or more of these apply simultaneously, deload now rather than waiting for your scheduled week.',
  },
};

// ─── Rich content (Seg[] with inline links) ───────────────────

const RICH_CONTENT: Record<string, Record<string, Seg[]>> = {
  getting_started: {
    what_is_training: [
      { t: 'Resistance training', url: 'https://en.wikipedia.org/wiki/Strength_training' },
      ' (also called strength or weight training) is any exercise where your muscles work against an external resistance — barbells, dumbbells, cables, machines, or even your own bodyweight. When you lift a weight, you create microscopic tears in your muscle fibres. During rest, your body repairs them slightly thicker and stronger — a process called ',
      { t: 'muscle protein synthesis', url: 'https://en.wikipedia.org/wiki/Protein_biosynthesis' },
      '. Over months and years this leads to measurable increases in muscle size (',
      { t: 'hypertrophy', url: 'https://en.wikipedia.org/wiki/Muscle_hypertrophy' },
      ') and maximal strength.\n\nResistance training is one of the most studied health interventions in medicine. Regular practice improves ',
      { t: 'insulin sensitivity', url: 'https://en.wikipedia.org/wiki/Insulin_resistance' },
      ', increases ',
      { t: 'bone mineral density', url: 'https://en.wikipedia.org/wiki/Bone_density' },
      ' (protecting against ',
      { t: 'osteoporosis', url: 'https://en.wikipedia.org/wiki/Osteoporosis' },
      '), reduces all-cause mortality risk, and improves mood, sleep quality, and cognitive function. You do not need to be athletic or already fit to begin — studies consistently show benefits across all ages and fitness levels.',
    ],
    consistency: [
      'No training variable — not split choice, not exercise selection, not nutrition timing — matters more than simply showing up consistently over months and years. A mediocre programme followed for 3 years beats a perfect programme followed for 3 weeks.\n\nTarget 3 sessions per week to start. Most beginners make the mistake of training every day when motivation is high, burning out, then stopping entirely. Research on ',
      { t: 'habit formation', url: 'https://en.wikipedia.org/wiki/Habit' },
      ' shows that training at a consistent time of day significantly improves long-term adherence. A useful rule: missing one session is fine; missing two in a row is a warning sign; missing three is a habit of not training.',
    ],
    first_program: [
      'As a beginner, nearly any structured programme will produce results. The best programme is the one you will actually follow. A good beginner programme: (1) trains the whole body 3 times per week, (2) uses compound barbell or dumbbell exercises, (3) includes ',
      { t: 'linear progression', url: 'https://en.wikipedia.org/wiki/Progressive_overload' },
      ' (adding weight each session), and (4) is simple enough to learn quickly.\n\nHighly recommended options: ',
      { t: 'StrongLifts 5×5', url: 'https://stronglifts.com/stronglifts-5x5/workout-program/' },
      ' (3 lifts per session, easy to follow), ',
      { t: 'Starting Strength', url: 'https://startingstrength.com/get-started/programs' },
      ' (barbell-focused, excellent technique instruction), and ',
      { t: 'GZCLP', url: 'https://thefitness.wiki/routines/gzclp/' },
      ' (adds more upper-body pulling and accessories). Avoid highly specialised bodybuilder splits — training each muscle only once per week is poorly suited to beginners.',
    ],
    expectations: [
      'In the first 4–8 weeks, most strength gains are neurological — your brain gets better at recruiting ',
      { t: 'motor units', url: 'https://en.wikipedia.org/wiki/Motor_unit' },
      ' and coordinating inter-muscular activation. You get stronger without visibly bigger muscles. This is completely normal.\n\nVisible muscle growth typically becomes noticeable around weeks 8–12. You will likely experience ',
      { t: 'Delayed Onset Muscle Soreness (DOMS)', url: 'https://en.wikipedia.org/wiki/Delayed_onset_muscle_soreness' },
      ' after early sessions — a dull, achy feeling that peaks 24–72 hours after training. This is normal and reduces significantly as your body adapts. Importantly, soreness is not a reliable indicator of a productive workout; you can have an excellent session with no soreness at all.',
    ],
  },

  full_body: {
    overview: [
      'A full body routine trains all major muscle groups in every session, typically 3 days per week on non-consecutive days (Monday, Wednesday, Friday). This gives each muscle 3 training stimuli per week — a ',
      { t: '2016 meta-analysis by Schoenfeld et al.', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/' },
      ' found that training each muscle at least twice per week produced significantly superior hypertrophic outcomes compared to once-per-week body part splits, and three times weekly is even better for beginners.\n\nThe full body approach is ideal for the first year of training. If you miss a session, you lose one-third of your weekly volume — not an entire muscle group\'s week. Most elite strength coaches recommend full-body training as the foundational approach for all beginners.',
    ],
    schedule: [DEFAULT_CONTENT.full_body.schedule],
    exercise_selection: [
      'Build every session around the six fundamental ',
      { t: 'movement patterns', url: 'https://en.wikipedia.org/wiki/Strength_training#Types_of_exercise' },
      ': (1) Squat (',
      { t: 'quadriceps', url: 'https://en.wikipedia.org/wiki/Quadriceps_femoris_muscle' },
      ', glutes, core), (2) Hip hinge (',
      { t: 'deadlift', url: 'https://en.wikipedia.org/wiki/Deadlift' },
      ', RDL — posterior chain), (3) Horizontal push (',
      { t: 'bench press', url: 'https://en.wikipedia.org/wiki/Bench_press' },
      ' — chest, shoulders, triceps), (4) Vertical push (',
      { t: 'overhead press', url: 'https://en.wikipedia.org/wiki/Overhead_press' },
      ' — deltoids, triceps), (5) Horizontal pull (row — back, biceps), (6) Vertical pull (',
      { t: 'lat pulldown', url: 'https://en.wikipedia.org/wiki/Pulldown_exercise' },
      ', pull-up — lats, biceps). Add 1–2 isolation exercises at the end (curls, tricep extensions, calf raises, core). Keep total sets to 15–20 per session.',
    ],
    progression: [
      'As a beginner, add weight to your main lifts every single session — this is ',
      { t: 'linear progression', url: 'https://en.wikipedia.org/wiki/Progressive_overload' },
      ' and it is your biggest advantage. Your nervous system adapts within 48 hours. Upper body lifts: +2.5 kg (5 lbs) per session. Lower body (squat, deadlift): +5 kg (10 lbs) per session. If you miss all prescribed reps, repeat the same weight. If you fail the same weight twice, investigate sleep and nutrition before changing programme. Linear progression can continue for 3–6 months — do not skip ahead to more complex methods.',
    ],
  },

  upper_lower: {
    overview: [
      'The upper/lower split divides training into upper body days (chest, back, shoulders, arms) and lower body days (quads, hamstrings, glutes, calves). A typical week runs 4 days: Upper–Lower–Rest–Upper–Lower. Each muscle group is trained twice per week — ',
      { t: 'Schoenfeld\'s 2016 meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/' },
      ' identified twice-weekly training frequency as significantly superior to once-weekly for muscle growth. This split suits lifters with 6–18 months of experience who want more per-session volume than full-body allows.',
    ],
    schedule: [DEFAULT_CONTENT.upper_lower.schedule],
    exercise_selection: [DEFAULT_CONTENT.upper_lower.exercise_selection],
    progression: [
      'When linear progression slows, transition to double progression: set a rep range per exercise (e.g., 3×8–12). Keep the same weight until you complete all sets at the top of the range (3×12), then increase weight 2.5–5 kg and reset to 3×8.\n\nA popular structured option is ',
      { t: 'GZCLP', url: 'https://thefitness.wiki/routines/gzclp/' },
      ' by Cody LeFever — a 3-tier system: T1 heavy compound (5×3+ AMRAP), T2 secondary compound (3×10), T3 accessories (3×15+). Progression is built in: when a T1 weight is failed, advance through stages (5×3 → 6×2 → 10×1) before resetting weight.',
    ],
  },

  push_pull_legs: {
    overview: [
      { t: 'Push/Pull/Legs (PPL)', url: 'https://en.wikipedia.org/wiki/Push%E2%80%93pull_legs' },
      ' organises training by movement pattern: push days train chest, anterior/lateral deltoids, and triceps; pull days train lats, rhomboids, traps, rear delts, and biceps; leg days train the lower body. In the 6-day version (running the full cycle twice per week), each muscle receives two training sessions weekly, matching the optimal frequency from the research literature.\n\nPPL is an intermediate-to-advanced split. Beginners should complete 6–12 months of full-body or upper/lower training before attempting the 6-day PPL. The ',
      { t: 'Reddit PPL programme by u/Metallicadpa', url: 'https://thefitness.wiki/reddit-archive/a-linear-progression-based-ppl-program-for-beginners/' },
      ' is a well-structured, free starting point.',
    ],
    schedule: [DEFAULT_CONTENT.push_pull_legs.schedule],
    exercise_selection: [DEFAULT_CONTENT.push_pull_legs.exercise_selection],
    progression: [DEFAULT_CONTENT.push_pull_legs.progression],
  },

  exercise_selection: {
    compounds_first: [
      { t: 'Compound exercises', url: 'https://en.wikipedia.org/wiki/Compound_exercise' },
      ' are multi-joint movements that engage multiple muscle groups simultaneously. The "Big Five" are: ',
      { t: 'Squat', url: 'https://en.wikipedia.org/wiki/Squat_(exercise)' },
      ' (quads, glutes, hamstrings, core), ',
      { t: 'Deadlift', url: 'https://en.wikipedia.org/wiki/Deadlift' },
      ' (entire posterior chain, grip, core), ',
      { t: 'Bench Press', url: 'https://en.wikipedia.org/wiki/Bench_press' },
      ' (chest, anterior deltoids, triceps), ',
      { t: 'Overhead Press', url: 'https://en.wikipedia.org/wiki/Overhead_press' },
      ' (deltoids, triceps, core stabilisers), and ',
      { t: 'Barbell Row', url: 'https://en.wikipedia.org/wiki/Bent-over_row' },
      ' (lats, rhomboids, traps, rear delts, biceps). Every session should begin with one or two of these movements. Getting strong at the Big Five produces a well-developed physique; isolation work simply adds the finishing details.',
    ],
    isolation: [DEFAULT_CONTENT.exercise_selection.isolation],
    exercise_order: [DEFAULT_CONTENT.exercise_selection.exercise_order],
    weight_selection: [
      DEFAULT_CONTENT.exercise_selection.weight_selection.split('Epley formula')[0],
      'As you advance, learn to estimate your ',
      { t: '1-repetition maximum (1RM)', url: 'https://en.wikipedia.org/wiki/One-repetition_maximum' },
      ' from your working sets using the ',
      { t: 'Epley formula', url: 'https://en.wikipedia.org/wiki/One-repetition_maximum#Epley_formula' },
      ': 1RM ≈ weight × (1 + reps / 30). Many programmes prescribe percentages of your 1RM for working weights.',
    ],
  },

  progressive_overload: {
    what_is_it: [
      { t: 'Progressive overload', url: 'https://en.wikipedia.org/wiki/Progressive_overload' },
      ' is the fundamental principle of all adaptation in resistance training: you must continually increase the stress placed on your body to force continued adaptation. Your body is extremely efficient — it adapts to a given stimulus and then stops changing. Without progression, you maintain your current fitness level but make zero further progress.\n\nTypes of progressive overload: (1) Increase load — add weight, (2) Increase volume — add sets or reps, (3) Increase frequency — train more often, (4) Increase density — same work in less time, (5) Improve range of motion or technique. For beginners, load progression is the primary and simplest method.',
    ],
    linear_progression: [DEFAULT_CONTENT.progressive_overload.linear_progression],
    double_progression: [DEFAULT_CONTENT.progressive_overload.double_progression],
    tracking: [DEFAULT_CONTENT.progressive_overload.tracking],
  },

  sets_reps: {
    rep_ranges: [
      'The traditional model divides training into: 1–5 reps (maximal strength), 6–12 reps (',
      { t: 'hypertrophy', url: 'https://en.wikipedia.org/wiki/Muscle_hypertrophy' },
      '), and 12–20+ reps (muscular endurance). A major ',
      { t: '2021 re-examination by Schoenfeld et al.', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7927075/' },
      ' found that for muscle growth, nearly any rep range from approximately 6 to 30 reps can be effective — provided you train close to muscular failure. The critical variable for hypertrophy is effort level, not the specific load. A ',
      { t: '2017 meta-analysis', url: 'https://pubmed.ncbi.nlm.nih.gov/28834797/' },
      ' found no meaningful difference in whole-muscle hypertrophy between high-load (>60% 1RM) and low-load (<60% 1RM) training when effort is equated. For maximal strength, heavier loads retain an advantage due to specificity.',
    ],
    sets_volume: [DEFAULT_CONTENT.sets_reps.sets_volume],
    rest_periods: [
      'A landmark ',
      { t: '2016 study by Schoenfeld et al.', url: 'https://pubmed.ncbi.nlm.nih.gov/26605807/' },
      ' directly compared 1-minute versus 3-minute rest periods across an 8-week programme. The 3-minute group produced significantly greater gains in both maximal strength and muscle thickness. Longer rest allows more complete ',
      { t: 'phosphocreatine', url: 'https://en.wikipedia.org/wiki/Phosphocreatine' },
      ' resynthesis and reduced metabolite accumulation, enabling higher quality subsequent sets.\n\nThe old guideline of "60–90 seconds for hypertrophy" is not supported by this data. Practical guidelines: heavy compounds (squat, deadlift, bench at 80%+ 1RM): 3–5 min. Moderate compounds and accessory work: 2–3 min. Isolation finishers and high-rep sets: 60–90 sec.',
    ],
    rpe: [
      { t: 'RPE (Rating of Perceived Exertion)', url: 'https://en.wikipedia.org/wiki/Rating_of_perceived_exertion' },
      ' is a 1–10 scale quantifying how hard a set felt: 10 = complete failure (zero reps left), RPE 8 = 2 reps in reserve, RPE 7 = 3 reps in reserve. The inverse is RIR (Reps In Reserve) = 10 − RPE.\n\nFor beginners, training main compound lifts at RPE 7–8 (2–3 reps in reserve) is appropriate — hard enough to drive adaptation but not so close to failure that technique collapses. RPE-based programming (used by ',
      { t: 'Barbell Medicine', url: 'https://www.barbellmedicine.com/blog/progressive-loading/' },
      ' and many strength coaches) autoregulates load: you increase weight only when a given performance feels easier (lower RPE), confirming true adaptation.',
    ],
  },

  warmup: {
    why_warmup: [
      'A proper warm-up raises core body temperature (improving ',
      { t: 'enzymatic reaction rates', url: 'https://en.wikipedia.org/wiki/Enzyme_kinetics' },
      ' and nerve conduction speed), increases blood flow to working muscles, lubricates ',
      { t: 'synovial joints', url: 'https://en.wikipedia.org/wiki/Synovial_joint' },
      ', and activates the neuromuscular pathways for the movements you\'re about to perform. Research consistently shows warm-ups improve subsequent force output, rate of force development, and movement coordination, while reducing injury risk — particularly for ',
      { t: 'tendons and ligaments', url: 'https://en.wikipedia.org/wiki/Tendon' },
      ' which have lower blood supply and take longer to reach optimal pliability than muscle tissue.',
    ],
    general_warmup: [
      'Spend 5–10 minutes on low-intensity cardiovascular activity: brisk walking, light jogging, cycling, or rowing. Follow with 3–5 minutes of ',
      { t: 'dynamic stretching', url: 'https://en.wikipedia.org/wiki/Stretching#Dynamic_stretching' },
      ' — controlled, rhythmic movements: leg swings, hip circles, arm circles, thoracic rotations, walking lunges, inchworms, and cat-cow stretches.\n\nDynamic stretching is preferred over ',
      { t: 'static stretching', url: 'https://en.wikipedia.org/wiki/Stretching#Static_stretching' },
      ' before lifting. Research confirms that prolonged static holds (>90 seconds) before a session can acutely reduce maximal strength and power. ',
      { t: 'Static stretching', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3737866/' },
      ' is best saved for after your workout.',
    ],
    specific_sets: [DEFAULT_CONTENT.warmup.specific_sets],
    cooldown: [
      'After training, 5–10 minutes of cooling down enhances recovery and improves long-term flexibility. Static stretching post-workout — unlike pre-workout — is beneficial: muscles are warm and pliable, and ',
      { t: 'research on static stretching', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3737866/' },
      ' supports its use for improving flexibility over time. Hold each stretch 30–60 seconds, focusing on trained muscles.\n\nConsider ',
      { t: 'foam rolling', url: 'https://en.wikipedia.org/wiki/Foam_roller' },
      ' (self-myofascial release) for tight areas. Ending sessions with slow breathing and deliberate deceleration helps shift the ',
      { t: 'autonomic nervous system', url: 'https://en.wikipedia.org/wiki/Autonomic_nervous_system' },
      ' from sympathetic ("fight-or-flight") back to parasympathetic ("rest and digest") — improving post-workout recovery hormone dynamics.',
    ],
  },

  deload: {
    what_is_it: [
      'A deload is a planned period — typically 5–7 days — of reduced training stress. You still train; you simply reduce volume and/or intensity significantly. The goal is to allow accumulated fatigue to dissipate while retaining strength and muscle adaptations. This concept comes from ',
      { t: 'periodisation theory', url: 'https://en.wikipedia.org/wiki/Periodization' },
      ' — the science of structuring training over time to balance stress and recovery. The body ',
      { t: 'supercompensates', url: 'https://en.wikipedia.org/wiki/Supercompensation' },
      ' (comes back stronger) after a period of reduced stress, provided the prior stimulus was sufficient.',
    ],
    when_to_deload: [
      'Most coaches recommend deloading every 4–8 weeks for intermediate and advanced trainees. A ',
      { t: '2023 survey of coaches', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9811819/' },
      ' found an average deload frequency of every 4–6 weeks, with a range of 3–12 weeks depending on athlete needs. Beginners in their first 3–6 months typically do not need formal deloads — training intensity is not yet high enough to accumulate significant fatigue. Factors that warrant earlier deloads include: very high training intensity (RPE 9+), poor sleep, high life stress, or prolonged soreness.',
    ],
    how_to_deload: [DEFAULT_CONTENT.deload.how_to_deload],
    signs: [DEFAULT_CONTENT.deload.signs],
  },
};

// ─── Component ────────────────────────────────────────────────

export function WorkoutGuides({ selectedMuscle, onSelectMuscle, isTrainer }: Props) {
  const t = useTheme();
  const { getEntry, upsertEntry } = useWorkoutGuides();

  const [activeTopic, setActiveTopic] = useState<GuideTopic | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  // (topic alias used only after the null guard below)

  function getContent(topicKey: string, sectionKey: string): string {
    if (editing && draft[sectionKey] !== undefined) return draft[sectionKey];
    const db = getEntry(topicKey, sectionKey);
    if (db) return db.content;
    return DEFAULT_CONTENT[topicKey]?.[sectionKey] ?? '';
  }

  function startEditing() {
    if (!activeTopic) return;
    const d: Record<string, string> = {};
    for (const sec of activeTopic!.sections) {
      d[sec.key] = getEntry(activeTopic!.key, sec.key)?.content ?? DEFAULT_CONTENT[activeTopic!.key]?.[sec.key] ?? '';
    }
    setDraft(d);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setDraft({});
  }

  async function handleSave() {
    if (!activeTopic) return;
    setSaving(true);
    for (const sec of activeTopic!.sections) {
      if (draft[sec.key] !== undefined) {
        const { error } = await upsertEntry(activeTopic!.key, sec.key, draft[sec.key]);
        if (error) { Alert.alert('Error', error); setSaving(false); return; }
      }
    }
    setSaving(false);
    setEditing(false);
    setDraft({});
  }

  // ── Muscle spotlight ─────────────────────────────────────────

  const spotlight = selectedMuscle ? MUSCLE_SPOTLIGHT[selectedMuscle] : null;

  // ── Topic grid (no topic selected) ──────────────────────────

  if (!activeTopic) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: t.background }]}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {spotlight && (
          <View style={[styles.spotlightCard, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '50' }]}>
            <View style={styles.spotlightHeader}>
              <Ionicons name="body-outline" size={16} color={colors.primary} />
              <Text style={[styles.spotlightTitle, { color: colors.primary }]}>
                Training Guide: {selectedMuscle}
              </Text>
              <TouchableOpacity onPress={() => onSelectMuscle(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.spotlightGrid}>
              <View style={styles.spotlightItem}>
                <Text style={[styles.spotlightLabel, { color: t.textSecondary }]}>PPL</Text>
                <Text style={[styles.spotlightValue, { color: t.textPrimary }]}>{spotlight.pplDay}</Text>
              </View>
              <View style={styles.spotlightItem}>
                <Text style={[styles.spotlightLabel, { color: t.textSecondary }]}>Upper/Lower</Text>
                <Text style={[styles.spotlightValue, { color: t.textPrimary }]}>{spotlight.upperLowerDay}</Text>
              </View>
            </View>
            <Text style={[styles.spotlightNote, { color: t.textSecondary }]}>{spotlight.fullBodyNote}</Text>
            <Text style={[styles.spotlightLabel, { color: t.textSecondary, marginTop: spacing.xs }]}>Key exercises</Text>
            <Text style={[styles.spotlightValue, { color: t.textPrimary }]}>{spotlight.primaryExercises.join(' · ')}</Text>
          </View>
        )}

        <Text style={[styles.gridHeading, { color: t.textSecondary }]}>
          Select a topic below to read the guide.
        </Text>
        {TOPICS.map((tp) => (
          <TouchableOpacity
            key={tp.key}
            style={[styles.topicCard, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => setActiveTopic(tp)}
            activeOpacity={0.7}
          >
            <View style={[styles.topicIcon, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name={tp.icon as never} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.topicLabel, { color: t.textPrimary }]}>{tp.label}</Text>
              <Text style={[styles.topicSubtitle, { color: t.textSecondary }]}>{tp.subtitle}</Text>
              <View style={[styles.forWhoBadge, { backgroundColor: t.border }]}>
                <Text style={[styles.forWhoText, { color: t.textSecondary }]}>{tp.forWho}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.textSecondary as string} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  // ── Topic detail ─────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        <TouchableOpacity
          onPress={() => { setActiveTopic(null); cancelEditing(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={t.textPrimary as string} />
        </TouchableOpacity>
        <Text style={[styles.detailTitle, { color: t.textPrimary }]} numberOfLines={1}>{activeTopic!.label}</Text>
        {isTrainer && !editing && (
          <TouchableOpacity onPress={startEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        {isTrainer && editing && (
          <TouchableOpacity onPress={cancelEditing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={t.textSecondary as string} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.detailScroll}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Muscle spotlight inside topic */}
        {spotlight && (
          <View style={[styles.inlineSpotlight, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
            <Ionicons name="body-outline" size={14} color={colors.primary} />
            <Text style={[styles.inlineSpotlightText, { color: colors.primary }]}>
              {selectedMuscle} → {
                activeTopic!.key === 'push_pull_legs' ? spotlight.pplDay :
                activeTopic!.key === 'upper_lower' ? spotlight.upperLowerDay :
                activeTopic!.key === 'full_body' ? 'Every session' :
                `PPL: ${spotlight.pplDay} · Upper/Lower: ${spotlight.upperLowerDay}`
              }
            </Text>
          </View>
        )}

        {/* Sections */}
        {activeTopic!.sections.map(({ key, label, icon }) => {
          const dbEntry = getEntry(activeTopic!.key, key);
          const richSegs = RICH_CONTENT[activeTopic!.key]?.[key];
          return (
            <View key={key} style={[styles.section, { borderColor: t.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name={icon as never} size={16} color={colors.primary} />
                <Text style={[styles.sectionLabel, { color: colors.primary }]}>{label}</Text>
              </View>
              {editing ? (
                <TextInput
                  style={[styles.editInput, { borderColor: t.border, color: t.textPrimary, backgroundColor: t.surface }]}
                  value={draft[key] ?? ''}
                  onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor={t.textSecondary as string}
                  placeholder={`Enter ${label.toLowerCase()}…`}
                />
              ) : dbEntry ? (
                <Text style={[styles.sectionBody, { color: t.textPrimary }]}>
                  {dbEntry.content}
                </Text>
              ) : richSegs ? (
                <RichText segs={richSegs} style={[styles.sectionBody, { color: t.textPrimary }]} />
              ) : (
                <Text style={[styles.sectionBody, { color: t.textPrimary }]}>
                  {getContent(activeTopic!.key, key)}
                </Text>
              )}
            </View>
          );
        })}

        {isTrainer && editing && (
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        )}

        {/* Edited indicator */}
        {!editing && activeTopic!.sections.some((s) => getEntry(activeTopic!.key, s.key)) && (
          <Text style={[styles.editedNote, { color: t.textSecondary }]}>
            ✎ This guide has been customised by your trainer.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  gridContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  gridHeading: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.xs },

  spotlightCard: {
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, gap: spacing.xs, marginBottom: spacing.sm,
  },
  spotlightHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  spotlightTitle: { ...typography.body, fontWeight: '700', flex: 1 },
  spotlightGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  spotlightItem: { flex: 1 },
  spotlightLabel: { ...typography.label },
  spotlightValue: { ...typography.bodySmall, fontWeight: '600', marginTop: 2 },
  spotlightNote: { ...typography.bodySmall, marginTop: spacing.xs },

  topicCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.md, gap: spacing.sm,
  },
  topicIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  topicLabel: { ...typography.body, fontWeight: '700' },
  topicSubtitle: { ...typography.bodySmall, marginTop: 2 },
  forWhoBadge: { borderRadius: radius.full, paddingHorizontal: spacing.xs, paddingVertical: 2, alignSelf: 'flex-start', marginTop: spacing.xs },
  forWhoText: { ...typography.label, fontWeight: '600' },

  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  detailTitle: { ...typography.body, fontWeight: '700', flex: 1 },

  detailScroll: { flex: 1 },
  detailContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  inlineSpotlight: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
  },
  inlineSpotlightText: { ...typography.bodySmall, fontWeight: '600', flex: 1 },

  section: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sectionLabel: { ...typography.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody: { ...typography.body, lineHeight: 22 },

  editInput: {
    ...typography.body, borderWidth: 1, borderRadius: radius.sm,
    padding: spacing.sm, minHeight: 140, lineHeight: 22,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.sm + 2, alignItems: 'center', marginTop: spacing.xs,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },

  editedNote: { ...typography.label, textAlign: 'center' },

  link: { color: colors.primary, textDecorationLine: 'underline' },
});
