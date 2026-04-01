// ============================================================
// Workout Templates — sourced from workout_templates.csv
// and guide-based splits (Full Body, Upper/Lower, PPL).
// Structured as static data; exercise names are matched
// against the live exercises table when a template is loaded.
// ============================================================

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseNames: string[];
  split?: string;
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [

  // ── Phase 1 ─────────────────────────────────────────────────

  {
    id: 'P1-A',
    name: 'Workout A: Push Focus',
    split: 'Phase 1',
    exerciseNames: [
      'Air Squat',
      'Glute Bridge',
      'Incline Push-up',
      'Floor Press + Mod Push-up',
      'Dips',
      'Plank (Variations)',
      'Mountain Climbers + Air Squats',
      'Cobra Stretch',
      'Bear Crawl',
      'Glute Bridge Hold',
    ],
  },
  {
    id: 'P1-B',
    name: 'Workout B: Pull Focus',
    split: 'Phase 1',
    exerciseNames: [
      'Reverse Lunge',
      'Single-Leg Reach (Bulg Squat)',
      'Pull up/Lat Pulldown',
      'Mid Row',
      'RDL',
      'Cable Pullover',
      'Towel Curls',
      'Hammer Curl',
      'Bear Crawl',
      'Glute Bridge (Pulsing)',
    ],
  },
  {
    id: 'P1-C',
    name: 'Workout C: Stability',
    split: 'Phase 1',
    exerciseNames: [
      'Box Squat',
      'Step-ups/Weighted',
      'Landmine',
      'Squat Press (DB/Bar)',
      'Cable Squat Row',
      'Cable Torso Rotations',
      'Scapular Push-ups',
      'Scapular Pull-up',
      'Plank Taps',
      'BW Back Extensions',
    ],
  },
  {
    id: 'P1-D',
    name: 'Workout D: Lateral/Total',
    split: 'Phase 1',
    exerciseNames: [
      'Lateral Lunge',
      'Wall Sit',
      'Plank-to-Pushup',
      'Box Jump',
      'Side Planks',
      'Ball Squat Toss',
      'Single-Leg Step-Up',
      'Hip Circles',
      'Mountain Climbers',
      'In-Out Jumping Jacks',
    ],
  },

  // ── Phase 2 ─────────────────────────────────────────────────

  {
    id: 'P2-A',
    name: 'Workout A: Push Focus (P2)',
    split: 'Phase 2',
    exerciseNames: [
      'Skater Jumps',
      'Jump Squats',
      'Tempo Push-ups',
      'Chest Pass (Med Ball)',
      'Plank Jacks',
      'Flutter Kicks',
      'T-Pushups',
      'High Knees (s)',
      'Box Jump',
      'Deadbug (Weighted)',
    ],
  },
  {
    id: 'P2-B',
    name: 'Workout B: Pull Focus (P2)',
    split: 'Phase 2',
    exerciseNames: [
      'Box Step-ups',
      'Walking Lunges',
      'Chin-up Negatives',
      'Med Ball Slams',
      'Mountain Climbers',
      'Bicycle Crunches',
      'Cable Face Pulls',
      'Butt Kicks (s)',
      'Single-Leg Hops',
      'Plank (Weighted)',
    ],
  },
  {
    id: 'P2-C',
    name: 'Workout C: Shoulder Focus (P2)',
    split: 'Phase 2',
    exerciseNames: [
      'Rope Ladder Broad Jumps',
      'Lateral Bounds',
      'Med Ball Overhead Hold',
      'Wall Balls',
      'Russian Twists',
      'Static Squat Cable Torso Rotations',
      'Pike Push-ups',
      'Jumping Jacks (s)',
      'Pilates Squat + Squat',
      'Side Plank Dips',
    ],
  },
  {
    id: 'P2-D',
    name: 'Workout D: Agility/Total (P2)',
    split: 'Phase 2',
    exerciseNames: [
      'Shuttle Runs (yd)',
      'Speed Skaters',
      'V-Ups/Knee Raises',
      'Burpees',
      'Spiderman Push-ups',
      'Plank with Knee-to-Elbow',
      'Mountain Climber Burpee',
      'Ice Skater Steps',
      'Squat Thrusts',
      'Deadlift',
    ],
  },

  // ── Phase 3 ─────────────────────────────────────────────────

  {
    id: 'P3-A',
    name: 'Workout A: Chest/Push (P3)',
    split: 'Phase 3',
    exerciseNames: [
      'DB Goblet Squat',
      'RDL (Dumbbells)',
      'DB Bench Press',
      'DB Incline Press',
      'Deadbug (Weighted)',
      'Pallof Press',
      'Dips/Band Flyes',
      'Inchworm Push-Up',
      'Calf Raise',
      'Weighted Sit-up',
    ],
  },
  {
    id: 'P3-B',
    name: 'Workout B: Back/Pull (P3)',
    split: 'Phase 3',
    exerciseNames: [
      'DB Split Squat',
      'Leg Press + Leg Machines',
      'Lat Pulldown',
      'Seated Cable Row',
      'Cable Woodchops',
      'Plank with Row',
      'Cable Face Pulls',
      'Bicep Curls',
      'Single-Leg Bridge',
      'Reverse Crunch',
    ],
  },
  {
    id: 'P3-C',
    name: 'Workout C: Shoulders (P3)',
    split: 'Phase 3',
    exerciseNames: [
      'KB Deadlift',
      'Hamstring Curl',
      'DB Overhead Press',
      'Cable/Band Lateral Raise',
      'Hanging Leg Raises',
      'Landmine Rotation',
      'Burpee DB Press',
      'Diamond + Wide Pushups',
      'Wall Sits (Weighted)',
      'Windshields/Alternate Knee Raises',
    ],
  },
  {
    id: 'P3-D',
    name: 'Workout D: Total Body (P3)',
    split: 'Phase 3',
    exerciseNames: [
      'DB Step-ups',
      'Goblet Lateral Lunge',
      'DB Renegade Row',
      'Push-up (Weighted)',
      'Medicine Ball Rotational Toss',
      'Suitcase Carry (L/R)',
      'Hammer Curl',
      'Box Dips (Assist)',
      'Lunge with Twist',
      "Farmer's Walk",
    ],
  },

  // ── Abs ─────────────────────────────────────────────────────

  {
    id: 'Abs-A',
    name: 'Abs: Variation A',
    split: 'Abs',
    exerciseNames: [
      'Center Decline',
      'Teapots',
      'Single Leg Decline',
      'Knee/Leg Raises',
      'Plank',
      'Plank Shoulder Taps',
      'Deadbugs',
      'Plank In and Outs',
      'Decline Russian Twists',
      'Knee to Elbows',
      'Toe Taps',
      'V-Ups',
    ],
  },
  {
    id: 'Abs-B',
    name: 'Abs: Variation B',
    split: 'Abs',
    exerciseNames: [
      'V-Ups',
      'Toe Taps',
      'Knee to Elbows',
      'Decline Russian Twists',
      'Plank In and Outs',
      'Deadbugs',
      'Plank Shoulder Taps',
      'Plank',
      'Knee/Leg Raises',
      'Single Leg Decline',
      'Teapots',
      'Center Decline',
    ],
  },
  {
    id: 'Abs-C',
    name: 'Abs: Variation C',
    split: 'Abs',
    exerciseNames: [
      'Plank',
      'Deadbugs',
      'V-Ups',
      'Center Decline',
      'Teapots',
      'Single Leg Decline',
      'Knee/Leg Raises',
      'Plank Shoulder Taps',
      'Plank In and Outs',
      'Decline Russian Twists',
      'Knee to Elbows',
      'Toe Taps',
    ],
  },
  {
    id: 'Abs-D',
    name: 'Abs: Variation D',
    split: 'Abs',
    exerciseNames: [
      'Decline Russian Twists',
      'Knee to Elbows',
      'Toe Taps',
      'V-Ups',
      'Center Decline',
      'Teapots',
      'Single Leg Decline',
      'Knee/Leg Raises',
      'Plank',
      'Plank Shoulder Taps',
      'Deadbugs',
      'Plank In and Outs',
    ],
  },

  // ── Abs & Core — tiered by intensity ────────────────────────
  // Covers all three anti-movement categories:
  // anti-extension, anti-rotation, and anti-lateral flexion.

  {
    id: 'Core-Beginner',
    name: 'Core: Beginner',
    split: 'Abs & Core',
    exerciseNames: [
      'Plank',
      'Dead Bug',
      'Bird Dog',
      'Pallof Press',
      'Glute Bridge',
      'Side Plank',
    ],
  },
  {
    id: 'Core-Intermediate',
    name: 'Core: Intermediate',
    split: 'Abs & Core',
    exerciseNames: [
      'Ab Wheel Rollout',
      'Hanging Knee Raise',
      'Cable Crunch',
      'Side Plank with Hip Dip',
      'Copenhagen Plank',
      'Pallof Press',
    ],
  },
  {
    id: 'Core-Advanced',
    name: 'Core: Advanced',
    split: 'Abs & Core',
    exerciseNames: [
      'Hanging Leg Raise',
      'Ab Wheel Rollout',
      'Dragon Flag',
      'Weighted Cable Crunch',
      'Toes to Bar',
      'L-Sit Hold',
    ],
  },

  // ── Full Body — Beginner (0–6 months, 3 days/week) ──────────
  // Based on the Full Body guide: Mon / Wed / Fri, one exercise
  // per fundamental movement pattern per session.

  {
    id: 'FB-A',
    name: 'Session A: Full Body',
    split: 'Full Body',
    exerciseNames: [
      'Back Squat',
      'Bench Press',
      'Bent-Over Row',
      'Overhead Press',
      'Plank',
    ],
  },
  {
    id: 'FB-B',
    name: 'Session B: Full Body',
    split: 'Full Body',
    exerciseNames: [
      'Goblet Squat',
      'Romanian Deadlift',
      'Incline Dumbbell Press',
      'Lat Pulldown',
      'Dead Bug',
    ],
  },
  {
    id: 'FB-C',
    name: 'Session C: Full Body',
    split: 'Full Body',
    exerciseNames: [
      'Deadlift',
      'Front Squat',
      'Push-Up',
      'Cable Row',
      'Pallof Press',
    ],
  },

  // ── Upper / Lower — Early Intermediate (6–18 months, 4 days/week) ─
  // A sessions are strength-focused (lower reps, heavier load).
  // B sessions are volume-focused (moderate reps, more variety).

  {
    id: 'UL-UA',
    name: 'Upper A: Strength',
    split: 'Upper / Lower',
    exerciseNames: [
      'Bench Press',
      'Barbell Row',
      'Overhead Press',
      'Lat Pulldown',
      'Barbell Curl',
      'Tricep Pushdown',
    ],
  },
  {
    id: 'UL-LA',
    name: 'Lower A: Strength',
    split: 'Upper / Lower',
    exerciseNames: [
      'Barbell Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Leg Curl',
      'Calf Raise',
    ],
  },
  {
    id: 'UL-UB',
    name: 'Upper B: Volume',
    split: 'Upper / Lower',
    exerciseNames: [
      'Incline Dumbbell Press',
      'Cable Row',
      'Dumbbell Shoulder Press',
      'Chest-Supported Row',
      'Hammer Curl',
      'Overhead Tricep Extension',
    ],
  },
  {
    id: 'UL-LB',
    name: 'Lower B: Volume',
    split: 'Upper / Lower',
    exerciseNames: [
      'Deadlift',
      'Bulgarian Split Squat',
      'Leg Press',
      'Leg Curl',
      'Hip Thrust',
    ],
  },

  // ── Push / Pull / Legs — Intermediate (1+ years, 6 days/week) ───
  // Day 1 (Mon/Thu) = Push, Day 2 (Tue/Fri) = Pull, Day 3 (Wed/Sat) = Legs.
  // Week 2 variations use different secondary exercises for variety.

  {
    id: 'PPL-Push-1',
    name: 'Push Day 1',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Bench Press',
      'Overhead Press',
      'Incline Dumbbell Press',
      'Cable Lateral Raise',
      'Tricep Pushdown',
      'Overhead Tricep Extension',
    ],
  },
  {
    id: 'PPL-Pull-1',
    name: 'Pull Day 1',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Barbell Row',
      'Lat Pulldown',
      'Cable Row',
      'Face Pull',
      'Barbell Curl',
      'Hammer Curl',
    ],
  },
  {
    id: 'PPL-Legs-1',
    name: 'Legs Day 1',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Barbell Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Leg Curl',
      'Calf Raise',
      'Plank',
      'Hanging Leg Raise',
    ],
  },
  {
    id: 'PPL-Push-2',
    name: 'Push Day 2',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Overhead Press',
      'Incline Dumbbell Press',
      'Dips',
      'Cable Fly',
      'Cable Lateral Raise',
      'Tricep Rope Pushdown',
    ],
  },
  {
    id: 'PPL-Pull-2',
    name: 'Pull Day 2',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Deadlift',
      'Lat Pulldown',
      'Chest-Supported Row',
      'Face Pull',
      'Hammer Curl',
      'Cable Row',
    ],
  },
  {
    id: 'PPL-Legs-2',
    name: 'Legs Day 2',
    split: 'Push / Pull / Legs',
    exerciseNames: [
      'Front Squat',
      'Romanian Deadlift',
      'Bulgarian Split Squat',
      'Leg Curl',
      'Hip Thrust',
      'Calf Raise',
      'Ab Wheel Rollout',
    ],
  },
];
