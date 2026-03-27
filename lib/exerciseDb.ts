import type { ExerciseCategory } from '@/types';

export type DbExercise = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
};

const MUSCLE_TO_GROUP: Record<string, string> = {
  abdominals:   'Core',
  biceps:       'Arms',
  triceps:      'Arms',
  forearms:     'Arms',
  chest:        'Chest',
  lats:         'Back',
  traps:        'Back',
  'middle back': 'Back',
  'lower back':  'Back',
  shoulders:    'Shoulders',
  quadriceps:   'Legs',
  hamstrings:   'Legs',
  calves:       'Legs',
  glutes:       'Glutes',
  abductors:    'Legs',
  adductors:    'Legs',
  'inner thighs': 'Legs',
};

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  strength:               'strength',
  stretching:             'flexibility',
  plyometrics:            'strength',
  cardio:                 'cardio',
  powerlifting:           'strength',
  strongman:              'strength',
  'olympic weightlifting': 'strength',
};

const DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const DB_IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

/**
 * Explicit name → free-exercise-db slug overrides for exercises whose name
 * doesn't match the DB slug via simple space→underscore conversion.
 * Covers all seeded + common user-added exercises.
 * All slugs verified to have images on disk at ~/code/free-exercise-db/exercises/{slug}/0.jpg
 */
const SLUG_OVERRIDES: Record<string, string> = {
  // ── Barbell / compound lifts ────────────────────────────────────────────
  'Barbell Row':                        'Bent_Over_Barbell_Row',
  'Bench Press':                        'Barbell_Bench_Press_-_Medium_Grip',
  'flat bench':                         'Barbell_Bench_Press_-_Medium_Grip',
  'flat bench press':                   'Barbell_Bench_Press_-_Medium_Grip',
  'Incline Bench Press':                'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'decline press':                      'Decline_Barbell_Bench_Press',
  'Deadlift':                           'Barbell_Deadlift',
  'Squat':                              'Barbell_Full_Squat',
  'Overhead Press':                     'Barbell_Shoulder_Press',
  'Landmine':                           'Landmine_180s',
  'Landmine Rotation':                  'Landmine_180s',
  'Skull Crusher':                      'EZ-Bar_Skullcrusher',
  'Tricep Pushdown':                    'Triceps_Pushdown',
  'triceps rope extensions':            'Triceps_Pushdown_-_Rope_Attachment',

  // ── Dumbbell exercises (prefixed "DB" in our library) ───────────────────
  'DB Bench Press':                     'Dumbbell_Bench_Press',
  'DB Goblet Squat':                    'Goblet_Squat',
  'DB Incline Press':                   'Incline_Dumbbell_Press',
  'DB Overhead Press':                  'Dumbbell_Shoulder_Press',
  'DB Renegade Row':                    'Alternating_Renegade_Row',
  'DB Split Squat':                     'Split_Squat_with_Dumbbells',
  'DB Step-ups':                        'Dumbbell_Step_Ups',
  'squat dumbbell':                     'Dumbbell_Squat',
  'Bicep Curls':                        'Dumbbell_Bicep_Curl',
  'Teapots':                            'Dumbbell_Side_Bend',
  'Deadbug (Weighted)':                 'Dead_Bug',

  // ── Cable exercises ─────────────────────────────────────────────────────
  'Seated Cable Row':                   'Seated_Cable_Rows',
  'Cable Squat Row':                    'Seated_Cable_Rows',
  'Cable Face Pulls':                   'Face_Pull',
  'Cable Torso Rotations':              'Torso_Rotation',
  'Static Squat Cable Torso Rotations': 'Torso_Rotation',
  'Cable Woodchops':                    'Standing_Cable_Wood_Chop',
  'Cable/Band Lateral Raise':           'Cable_Seated_Lateral_Raise',
  'Cable Pullover':                     'Cable_Crossover',
  'Cable Fly':                          'Flat_Bench_Cable_Flyes',

  // ── Push / pull bodyweight ──────────────────────────────────────────────
  'Push-Up':                            'Pushups',
  'Pushup':                             'Pushups',
  'Tempo Push-ups':                     'Pushups',
  'T-Pushups':                          'Push_Up_to_Side_Plank',
  'Spiderman Push-ups':                 'Spider_Crawl',
  'Push-up (Weighted)':                 'Pushups',
  'Diamond + Wide Pushups':             'Pushups',
  'Scapular Push-ups':                  'Scapular_Pull-Up',
  'Pike Push-ups':                      'Handstand_Push-Ups',
  'Incline Push-up':                    'Incline_Push-Up',
  'Floor Press + Mod Push-up':          'Floor_Press',
  'Pull-Up':                            'Pullups',
  'Pull up/Lat Pulldown':               'Pullups',
  'Scapular Pull-up':                   'Scapular_Pull-Up',
  'Mid Row':                            'Bodyweight_Mid_Row',
  'BW Back Extensions':                 'Hyperextensions_Back_Extensions',
  'Chin-up Negatives':                  'Chin-Up',
  'Towel Curls':                        'Hammer_Curls',

  // ── Plank variations (all map to Plank images) ──────────────────────────
  'Plank (Variations)':                 'Plank',
  'Plank Taps':                         'Plank',
  'Plank-to-Pushup':                    'Plank',
  'Plank with Knee-to-Elbow':           'Plank',
  'Plank (Weighted)':                   'Plank',
  'Plank with Row':                     'Plank',
  'Plank Shoulder Taps':                'Plank',
  'Plank In and Outs':                  'Plank',
  'Plank Jacks':                        'Plank',
  'Side Planks':                        'Push_Up_to_Side_Plank',
  'Side Plank Dips':                    'Push_Up_to_Side_Plank',

  // ── Legs / lower body ───────────────────────────────────────────────────
  'Air Squat':                          'Bodyweight_Squat',
  'Wall Sit':                           'Bodyweight_Squat',
  'Wall Sits (Weighted)':               'Bodyweight_Squat',
  'Pilates Squat + Squat':              'Bodyweight_Squat',
  'Squat Press (DB/Bar)':               'Dumbbell_Squat',
  'Goblet Lateral Lunge':               'Goblet_Squat',
  'Lateral Lunge':                      'Dumbbell_Lunges',
  'Lunge with Twist':                   'Dumbbell_Lunges',
  'Lunges':                             'Dumbbell_Lunges',
  'Reverse Lunge':                      'Dumbbell_Rear_Lunge',
  'Single-Leg Reach (Bulg Squat)':      'Split_Squats',
  'Step-ups/Weighted':                  'Dumbbell_Step_Ups',
  'Box Step-ups':                       'Dumbbell_Step_Ups',
  'Leg Press + Leg Machines':           'Leg_Press',
  'Single-Leg Step-Up':                 'Step-up_with_Knee_Raise',
  'Box Jump':                           'Front_Box_Jump',
  'Jump Squats':                        'Freehand_Jump_Squat',
  'Walking Lunges':                     'Bodyweight_Walking_Lunge',
  'Single-Leg Bridge':                  'Single_Leg_Glute_Bridge',
  'Glute Bridge':                       'Barbell_Glute_Bridge',
  'Glute Bridge Hold':                  'Barbell_Glute_Bridge',
  'Glute Bridge (Pulsing)':             'Barbell_Glute_Bridge',
  'RDL':                                'Romanian_Deadlift',
  'RDL (Dumbbells)':                    'Stiff-Legged_Dumbbell_Deadlift',
  'KB Deadlift':                        'Kettlebell_Dead_Clean',
  'Hamstring Curl':                     'Lying_Leg_Curls',
  'Leg Curl':                           'Lying_Leg_Curls',
  'Leg Extension':                      'Leg_Extensions',
  'Calf Raise':                         'Seated_Calf_Raise',
  'Lateral Bounds':                     'Lateral_Bound',
  'Pistol Squat':                       'Kettlebell_Pistol_Squat',
  'Skater Jumps':                       'Skating',
  'Speed Skaters':                      'Skating',
  'Ice Skater Steps':                   'Skating',
  'Single-Leg Hops':                    'Single-Leg_Hop_Progression',

  // ── Shoulders / arms ────────────────────────────────────────────────────
  'Lat Pulldown':                       'Wide-Grip_Lat_Pulldown',
  'Lateral Raise':                      'Side_Lateral_Raise',
  'Hammer Curl':                        'Hammer_Curls',
  'Box Dips (Assist)':                  'Bench_Dips',
  'Dips':                               'Dips_-_Chest_Version',
  'Dips/Band Flyes':                    'Dumbbell_Flyes',

  // ── Core ────────────────────────────────────────────────────────────────
  'Russian Twists':                     'Russian_Twist',
  'Decline Russian Twists':             'Russian_Twist',
  'V-Ups':                              'Jackknife_Sit-Up',
  'V-Ups/Knee Raises':                  'Jackknife_Sit-Up',
  'Weighted Sit-up':                    'Sit-Up',
  'Deadbugs':                           'Dead_Bug',
  'Bicycle Crunches':                   'Cross-Body_Crunch',
  'Crunch':                             'Crunches',
  'Hanging Leg Raises':                 'Hanging_Leg_Raise',
  'Knee/Leg Raises':                    'Hanging_Leg_Raise',
  'Knee to Elbows':                     'Hanging_Leg_Raise',
  'Center Decline':                     'Decline_Crunch',
  'Single Leg Decline':                 'Decline_Crunch',
  'Toe Taps':                           'Toe_Touchers',
  'Windshields/Alternate Knee Raises':  'Flutter_Kicks',
  'Medicine Ball Rotational Toss':      'Medicine_Ball_Scoop_Throw',

  // ── Cardio / full body ───────────────────────────────────────────────────
  'Mountain Climbers + Air Squats':     'Mountain_Climbers',
  'Mountain Climber Burpee':            'Mountain_Climbers',
  'Burpees':                            'Mountain_Climbers',
  'Treadmill Run':                      'Running_Treadmill',
  'High Knees (s)':                     'Running_Treadmill',
  'Shuttle Runs (yd)':                  'Running_Treadmill',
  'Rowing Machine':                     'Rowing_Stationary',
  'Cycling':                            'Bicycling',
  'Jump Rope':                          'Rope_Jumping',
  'In-Out Jumping Jacks':               'Rope_Jumping',
  'Jumping Jacks (s)':                  'Rope_Jumping',
  'Butt Kicks (s)':                     'Double_Leg_Butt_Kick',
  'Rope Ladder Broad Jumps':            'Lateral_Box_Jump',
  'Med Ball Slams':                     'Overhead_Slam',
  'Med Ball Overhead Hold':             'Medicine_Ball_Scoop_Throw',
  'Wall Balls':                         'Backward_Medicine_Ball_Throw',
  'Chest Pass (Med Ball)':              'Medicine_Ball_Chest_Pass',
  'Ball Squat Toss':                    'Medicine_Ball_Chest_Pass',
  'Bear Crawl':                         'Bear_Crawl_Sled_Drags',
  'Inchworm Push-Up':                   'Inchworm',
  'Burpee DB Press':                    'Pushups',
  'Suitcase Carry (L/R)':              'Farmers_Walk',
  "Farmer's Walk":                      'Farmers_Walk',
  'Squat Thrusts':                      'Squat_Jerk',

  // ── Flexibility / mobility ───────────────────────────────────────────────
  'Cobra Stretch':                      'Cat_Stretch',
  'Hip Circles':                        'Hip_Circles_prone',
};

/**
 * Returns the two candidate image URLs for an exercise based on its name.
 * Pass an explicit `slug` to bypass the SLUG_OVERRIDES lookup (used for variant tabs).
 * Checks SLUG_OVERRIDES first, then falls back to a simple name→slug conversion.
 * Images silently 404 when no match exists.
 */
export function getDbImageUrls(name: string, slug?: string): [string, string] {
  const resolvedSlug = slug ?? SLUG_OVERRIDES[name] ?? name
    .replace(/[/()']/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  return [
    `${DB_IMAGE_BASE}${resolvedSlug}/0.jpg`,
    `${DB_IMAGE_BASE}${resolvedSlug}/1.jpg`,
  ];
}

let cache: DbExercise[] | null = null;
let inflight: Promise<DbExercise[]> | null = null;

/** Fetches the full exercise database once; returns the cached result on subsequent calls. */
export function fetchExerciseDb(): Promise<DbExercise[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(DB_URL)
    .then((r) => r.json() as Promise<DbExercise[]>)
    .then((data) => {
      cache = data;
      inflight = null;
      return data;
    });
  return inflight;
}

/** Maps a free-exercise-db entry to a payload compatible with createExercise(). */
export function mapDbExercise(e: DbExercise): {
  name: string;
  muscle_group: string | null;
  category: ExerciseCategory;
  equipment: null;
  form_notes: string | null;
  help_url: null;
} {
  const form_notes = e.instructions.length > 0
    ? e.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')
    : null;
  return {
    name: e.name,
    muscle_group: MUSCLE_TO_GROUP[e.primaryMuscles[0] ?? ''] ?? null,
    category: CATEGORY_MAP[e.category] ?? 'other',
    equipment: null,
    form_notes,
    help_url: null,
  };
}

/**
 * Returns up to 20 exercises from the DB that match the query (by name or muscle)
 * and are not already present in the local library.
 */
export function searchDbExercises(
  db: DbExercise[],
  query: string,
  existingNames: Set<string>,
): DbExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: DbExercise[] = [];
  for (const e of db) {
    if (existingNames.has(e.name.toLowerCase())) continue;
    if (
      e.name.toLowerCase().includes(q) ||
      e.primaryMuscles.some((m) => m.includes(q)) ||
      e.secondaryMuscles.some((m) => m.includes(q))
    ) {
      results.push(e);
      if (results.length === 20) break;
    }
  }
  return results;
}
