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
  intake_completed: boolean;    // Migration 012
  created_at: string;
  updated_at: string;
};

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type ClientIntake = {
  id: string;
  client_id: string;
  address: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  occupation: string | null;
  current_injuries: string | null;
  past_injuries: string | null;
  chronic_conditions: string | null;
  medications: string | null;
  activity_level: ActivityLevel | null;
  goals: string | null;
  goal_timeframe: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type UpdateClientIntake = Partial<Omit<ClientIntake, 'id' | 'client_id' | 'updated_at'>>;

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'other';

export const EQUIPMENT_TYPES = {
  Barbell:    'Barbell',
  Dumbbell:   'Dumbbell',
  Cable:      'Cable',
  Machine:    'Machine',
  Bodyweight: 'Bodyweight',
  Kettlebell: 'Kettlebell',
  Band:       'Band',
  Other:      'Other',
} as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[keyof typeof EQUIPMENT_TYPES];

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  category: ExerciseCategory;
  equipment: EquipmentType | null;
  form_notes: string | null;
  help_url: string | null;
  created_at: string;
};

export type UpdateExercise = Partial<Pick<Exercise, 'form_notes' | 'help_url' | 'equipment'>>;

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
  client: { full_name: string } | null;
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

export type InsertClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'bmi' | 'auth_user_id' | 'intake_completed'> & {
  auth_user_id?: string | null;
  intake_completed?: boolean;
};
export type UpdateClient = Partial<Omit<Client, 'id' | 'trainer_id' | 'created_at' | 'updated_at' | 'bmi' | 'auth_user_id'>>;

export type InsertWorkout = Omit<Workout, 'id' | 'created_at' | 'updated_at' | 'logged_by_role' | 'logged_by_user_id' | 'workout_group_id'> & {
  workout_group_id?: string | null;
  logged_by_role?: 'trainer' | 'client';
  logged_by_user_id?: string | null;
};
export type UpdateWorkout = Partial<Omit<Workout, 'id' | 'client_id' | 'trainer_id' | 'created_at' | 'updated_at'>>;

export type InsertWorkoutSet = Omit<WorkoutSet, 'id' | 'created_at'>;
export type UpdateWorkoutSet = Partial<Omit<WorkoutSet, 'id' | 'workout_id' | 'created_at'>>;

// ─── Assigned Workouts ────────────────────────────────────────

export type AssignedWorkout = {
  id: string;
  trainer_id: string;
  client_id: string;
  title: string | null;
  scheduled_date: string; // YYYY-MM-DD
  notes: string | null;
  status: 'assigned' | 'completed';
  completed_at: string | null;
  completed_workout_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AssignedWorkoutExercise = {
  id: string;
  assigned_workout_id: string;
  exercise_id: string;
  order_index: number;
  superset_group: number | null;
};

export type AssignedWorkoutSet = {
  id: string;
  assigned_workout_exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  notes: string | null;
};

/** AssignedWorkoutExercise with joined exercise details and sets. */
export type AssignedWorkoutExerciseWithDetails = AssignedWorkoutExercise & {
  exercise: Exercise;
  sets: AssignedWorkoutSet[];
};

/** AssignedWorkout with all exercises (sorted by order_index) and their sets. */
export type AssignedWorkoutWithDetails = AssignedWorkout & {
  exercises: AssignedWorkoutExerciseWithDetails[];
};

/** Payload for a single exercise when creating/updating an assigned workout. */
export type AssignedExercisePayload = {
  exercise_id: string;
  order_index: number;
  superset_group: number | null;
  sets: {
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    duration_seconds: number | null;
    notes: string | null;
  }[];
};

export type InsertAssignedWorkout = {
  title: string | null;
  scheduled_date: string;
  notes: string | null;
  exercises: AssignedExercisePayload[];
};

export type UpdateAssignedWorkout = {
  title?: string | null;
  scheduled_date?: string;
  notes?: string | null;
  exercises?: AssignedExercisePayload[];
};

// ─── Nutrition (Migration 014) ────────────────────────────────

export const MEAL_TYPES = {
  breakfast: 'breakfast',
  lunch:     'lunch',
  dinner:    'dinner',
  snack:     'snack',
} as const;

export type MealType = typeof MEAL_TYPES[keyof typeof MEAL_TYPES];

export type NutritionLog = {
  id: string;
  client_id: string;
  trainer_id: string;
  logged_date: string;            // 'YYYY-MM-DD'
  meal_type: MealType;
  food_name: string;
  serving_size_g: number;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  usda_food_id: string | null;
  logged_by_role: 'trainer' | 'client';
  logged_by_user_id: string | null;
  created_at: string;
};

export type NutritionGoal = {
  id: string;
  client_id: string;
  trainer_id: string;
  calories: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
  created_at: string;
  updated_at: string;
};

export type InsertNutritionLog = Omit<NutritionLog, 'id' | 'created_at'>;
export type UpsertNutritionGoal = Omit<NutritionGoal, 'id' | 'created_at' | 'updated_at'>;

// ─── Muscle Group Encyclopedia (Migration 015) ────────────────

export type MuscleGroupEntry = {
  muscle_group: string;
  function_description: string | null;
  warmup_and_stretches: string | null;
  common_injuries: string | null;
  rehab_exercises: string | null;
  updated_at: string;
};

export type UpsertMuscleGroupEntry = Partial<Omit<MuscleGroupEntry, 'muscle_group' | 'updated_at'>>;

// ─── Scheduling & Credits (Migration 016) ─────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon … 6=Sat

export type TrainerAvailability = {
  id: string;
  trainer_id: string;
  day_of_week: DayOfWeek | null; // null when specific_date is set
  specific_date: string | null;  // 'YYYY-MM-DD', null when day_of_week is set
  start_time: string; // 'HH:MM:SS'
  end_time: string;   // 'HH:MM:SS'
  is_active: boolean;
  created_at: string;
};

export type SessionStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type ScheduledSession = {
  id: string;
  trainer_id: string;
  client_id: string;
  availability_id: string | null;
  scheduled_at: string; // ISO datetime
  duration_minutes: 30 | 60;
  status: SessionStatus;
  notes: string | null;
  trainer_notes: string | null;
  cancelled_by: 'trainer' | 'client' | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduledSessionWithDetails = ScheduledSession & {
  client: { full_name: string; email: string | null } | null;
  trainer: { full_name: string } | null;
};

export type ClientCredits = {
  client_id: string;
  balance: number;
  updated_at: string;
};

export type CreditReason = 'grant' | 'session_deduct' | 'session_refund' | 'manual';

export type CreditTransaction = {
  id: string;
  client_id: string;
  trainer_id: string;
  session_id: string | null;
  amount: number; // positive = added, negative = deducted
  reason: CreditReason;
  note: string | null;
  created_at: string;
};

export type InsertTrainerAvailability = Omit<TrainerAvailability, 'id' | 'created_at'>;

export type InsertScheduledSession = {
  trainer_id: string;
  client_id: string;
  availability_id?: string | null;
  scheduled_at: string;
  duration_minutes: 30 | 60;
  notes?: string | null;
};
