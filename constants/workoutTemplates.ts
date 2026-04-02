// ============================================================
// Workout Templates — two-level hierarchy: split → subgroup
// Exercise names are matched against the live exercises table
// when a template is loaded; unmatched names are skipped.
// ============================================================

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseNames: string[];
  split?: string;
  subgroup?: string;
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [

  // ── Full Body ────────────────────────────────────────────────
  // Subgroup: Standard (guide-based 3-day sessions)

  {
    id: 'FB-A',
    name: 'Session A: Full Body',
    split: 'Full Body',
    subgroup: 'Standard',
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
    subgroup: 'Standard',
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
    subgroup: 'Standard',
    exerciseNames: [
      'Deadlift',
      'Front Squat',
      'Push-Up',
      'Cable Row',
      'Pallof Press',
    ],
  },

  // Subgroup: Phase 1 (beginner full-body, bodyweight / light load)

  {
    id: 'P1-A',
    name: 'Workout A: Push Focus',
    split: 'Full Body',
    subgroup: 'Phase 1',
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
    split: 'Full Body',
    subgroup: 'Phase 1',
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
    split: 'Full Body',
    subgroup: 'Phase 1',
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
    split: 'Full Body',
    subgroup: 'Phase 1',
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

  // Subgroup: Phase 2 (intermediate full-body, plyometrics / med ball)

  {
    id: 'P2-A',
    name: 'Workout A: Push Focus (P2)',
    split: 'Full Body',
    subgroup: 'Phase 2',
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
    split: 'Full Body',
    subgroup: 'Phase 2',
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
    split: 'Full Body',
    subgroup: 'Phase 2',
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
    split: 'Full Body',
    subgroup: 'Phase 2',
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

  // Subgroup: Phase 3 (advanced full-body, dumbbell / cable loading)

  {
    id: 'P3-A',
    name: 'Workout A: Chest/Push (P3)',
    split: 'Full Body',
    subgroup: 'Phase 3',
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
    split: 'Full Body',
    subgroup: 'Phase 3',
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
    split: 'Full Body',
    subgroup: 'Phase 3',
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
    split: 'Full Body',
    subgroup: 'Phase 3',
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

  // ── Upper / Lower ────────────────────────────────────────────
  // Subgroup: Upper

  {
    id: 'UL-UA',
    name: 'Upper A: Strength',
    split: 'Upper / Lower',
    subgroup: 'Upper',
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
    id: 'UL-UB',
    name: 'Upper B: Volume',
    split: 'Upper / Lower',
    subgroup: 'Upper',
    exerciseNames: [
      'Incline Dumbbell Press',
      'Cable Row',
      'Dumbbell Shoulder Press',
      'Chest-Supported Row',
      'Hammer Curl',
      'Overhead Tricep Extension',
    ],
  },

  // Subgroup: Lower

  {
    id: 'UL-LA',
    name: 'Lower A: Strength',
    split: 'Upper / Lower',
    subgroup: 'Lower',
    exerciseNames: [
      'Barbell Squat',
      'Romanian Deadlift',
      'Leg Press',
      'Leg Curl',
      'Calf Raise',
    ],
  },
  {
    id: 'UL-LB',
    name: 'Lower B: Volume',
    split: 'Upper / Lower',
    subgroup: 'Lower',
    exerciseNames: [
      'Deadlift',
      'Bulgarian Split Squat',
      'Leg Press',
      'Leg Curl',
      'Hip Thrust',
    ],
  },

  // ── Push / Pull / Legs ───────────────────────────────────────
  // Subgroup: Push

  {
    id: 'PPL-Push-1',
    name: 'Push Day 1',
    split: 'Push / Pull / Legs',
    subgroup: 'Push',
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
    id: 'PPL-Push-2',
    name: 'Push Day 2',
    split: 'Push / Pull / Legs',
    subgroup: 'Push',
    exerciseNames: [
      'Overhead Press',
      'Incline Dumbbell Press',
      'Dips',
      'Cable Fly',
      'Cable Lateral Raise',
      'Tricep Rope Pushdown',
    ],
  },

  // Subgroup: Pull

  {
    id: 'PPL-Pull-1',
    name: 'Pull Day 1',
    split: 'Push / Pull / Legs',
    subgroup: 'Pull',
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
    id: 'PPL-Pull-2',
    name: 'Pull Day 2',
    split: 'Push / Pull / Legs',
    subgroup: 'Pull',
    exerciseNames: [
      'Deadlift',
      'Lat Pulldown',
      'Chest-Supported Row',
      'Face Pull',
      'Hammer Curl',
      'Cable Row',
    ],
  },

  // Subgroup: Legs

  {
    id: 'PPL-Legs-1',
    name: 'Legs Day 1',
    split: 'Push / Pull / Legs',
    subgroup: 'Legs',
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
    id: 'PPL-Legs-2',
    name: 'Legs Day 2',
    split: 'Push / Pull / Legs',
    subgroup: 'Legs',
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

  // ── Abs & Core ───────────────────────────────────────────────
  // Subgroup: Core Fundamentals (tiered by intensity)

  {
    id: 'Core-Beginner',
    name: 'Core: Beginner',
    split: 'Abs & Core',
    subgroup: 'Core Fundamentals',
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
    subgroup: 'Core Fundamentals',
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
    subgroup: 'Core Fundamentals',
    exerciseNames: [
      'Hanging Leg Raise',
      'Ab Wheel Rollout',
      'Dragon Flag',
      'Weighted Cable Crunch',
      'Toes to Bar',
      'L-Sit Hold',
    ],
  },

  // Subgroup: Ab Circuits (same 12 exercises, rotated order)

  {
    id: 'Abs-A',
    name: 'Abs: Variation A',
    split: 'Abs & Core',
    subgroup: 'Ab Circuits',
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
    split: 'Abs & Core',
    subgroup: 'Ab Circuits',
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
    split: 'Abs & Core',
    subgroup: 'Ab Circuits',
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
    split: 'Abs & Core',
    subgroup: 'Ab Circuits',
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
];
