// ============================================================
// Manual TypeScript types mirroring supabase/schema.sql
// Keep in sync with the schema whenever tables change.
// ============================================================

export type Trainer = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  trainer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date string 'YYYY-MM-DD'
  notes: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  bf_percent: number | null;
  bmi: number | null;           // generated (read-only): weight_kg / (height_cm/100)^2
  lean_body_mass: number | null;
  created_at: string;
  updated_at: string;
};

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'other';

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  category: ExerciseCategory;
  created_at: string;
};

export type Workout = {
  id: string;
  client_id: string;
  trainer_id: string;
  performed_at: string; // ISO date string 'YYYY-MM-DD'
  notes: string | null;
  body_weight_kg: number | null;
  body_fat_percent: number | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutSet = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  notes: string | null;
  superset_group: number | null;
  created_at: string;
};

// ─── Join / View types ────────────────────────────────────────

/** Workout with the trainer who logged it, used wherever workouts are listed. */
export type WorkoutWithTrainer = Workout & {
  trainer: { full_name: string } | null;
};

/** Workout with its sets and exercise details, used on the workout detail screen. */
export type WorkoutWithSets = WorkoutWithTrainer & {
  workout_sets: (WorkoutSet & { exercise: Exercise })[];
};

/** Client with their workout count, used in the client list. */
export type ClientWithStats = Client & {
  workout_count: number;
  last_workout_at: string | null;
};

// ─── Insert / Update payloads ─────────────────────────────────

export type InsertClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'bmi'>;
export type UpdateClient = Partial<Omit<Client, 'id' | 'trainer_id' | 'created_at' | 'updated_at' | 'bmi'>>;

export type InsertWorkout = Omit<Workout, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWorkout = Partial<Omit<Workout, 'id' | 'client_id' | 'trainer_id' | 'created_at' | 'updated_at'>>;

export type InsertWorkoutSet = Omit<WorkoutSet, 'id' | 'created_at'>;
export type UpdateWorkoutSet = Partial<Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>>;
