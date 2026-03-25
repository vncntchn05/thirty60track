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
  form_notes: null;
  help_url: null;
} {
  return {
    name: e.name,
    muscle_group: MUSCLE_TO_GROUP[e.primaryMuscles[0] ?? ''] ?? null,
    category: CATEGORY_MAP[e.category] ?? 'other',
    equipment: null,
    form_notes: null,
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
