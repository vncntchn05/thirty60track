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
  auth_user_id: string | null; // Migration 011: linked Supabase Auth user
  full_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null; // ISO date string 'YYYY-MM-DD'
  gender: 'male' | 'female' | 'other' | null;
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
  form_notes: string | null;
  help_url: string | null;
  created_at: string;
};

export type UpdateExercise = Partial<Pick<Exercise, 'form_notes' | 'help_url'>>;

export type Workout = {
  id: string;
  client_id: string;
  trainer_id: string;
  performed_at: string; // ISO date string 'YYYY-MM-DD'
  notes: string | null;
  body_weight_kg: number | null;
  body_fat_percent: number | null;
  workout_group_id: string | null; // shared UUID across clients who trained together
  logged_by_role: 'trainer' | 'client'; // Migration 011
  logged_by_user_id: string | null;     // Migration 011
  created_at: string;
  updated_at: string;
};

/** A peer workout in the same workout group, with the client's name. */
export type WorkoutGroupPeer = {
  id: string;           // workout ID
  client_id: string;
  client: { full_name: string } | null;
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

export type ClientMediaType = 'image' | 'video';

export type ClientMedia = {
  id: string;
  client_id: string;
  trainer_id: string;
  storage_path: string;
  media_type: ClientMediaType;
  taken_at: string; // ISO date 'YYYY-MM-DD'
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UpdateClientMedia = Partial<Pick<ClientMedia, 'taken_at' | 'notes'>>;

// ─── Insert / Update payloads ─────────────────────────────────

export type InsertClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'bmi' | 'auth_user_id'> & {
  auth_user_id?: string | null;
};
export type UpdateClient = Partial<Omit<Client, 'id' | 'trainer_id' | 'created_at' | 'updated_at' | 'bmi'>>;

export type InsertWorkout = Omit<Workout, 'id' | 'created_at' | 'updated_at' | 'logged_by_role' | 'logged_by_user_id' | 'workout_group_id'> & {
  workout_group_id?: string | null;
  logged_by_role?: 'trainer' | 'client';
  logged_by_user_id?: string | null;
};
export type UpdateWorkout = Partial<Omit<Workout, 'id' | 'client_id' | 'trainer_id' | 'created_at' | 'updated_at'>>;

export type InsertWorkoutSet = Omit<WorkoutSet, 'id' | 'created_at'>;
export type UpdateWorkoutSet = Partial<Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>>;
