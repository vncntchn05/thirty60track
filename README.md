# thirty60track

An app for personal trainers to track client workouts, monitor progress, and load structured workout programs — with a companion client-facing portal for self-logging and progress tracking. Built with Expo (iOS, Android, Web) and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Language | TypeScript (strict) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Charts | Victory Native XL + React Native Skia |
| Body Map | react-native-body-highlighter (SVG body diagram) |
| Styling | React Native StyleSheet |

---

## Features

### Accounts
- Separate logins for trainers and clients — each sees only their own view
- Trainers add clients by email; clients sign up and are automatically linked to their profile
- Change password from the Profile screen at any time

### Client Management
- View all your clients in one list, with their total sessions and last workout date
- Search clients by name or email
- Add clients with full intake details: personal info, body metrics, health history, injuries, medications, goals, and emergency contact
- Red alert banner on a client's page if they have active injuries or chronic conditions on file
- Edit any client's info or body metrics directly from their profile
- Green checkmark next to clients who have signed up and linked their account

### Photo & Video Gallery
- Per-client media gallery for progress photos and videos
- Upload from your camera roll with a date and optional caption
- Tap any photo or video to view it fullscreen; swipe between items
- Edit or delete any entry at any time

### Workout Logging
- Log a full session for any client with exercises, sets, reps, weight, and duration
- Switch between lbs, kg, and seconds per exercise
- Log body weight and body fat % alongside any session
- Add notes to the whole workout or to individual sets
- Load a template to instantly pre-fill all exercises for the session
- Link exercises together as supersets with a tap
- Log a group session — select multiple clients who trained together and their workouts are kept in sync
- Edit or delete any past workout

### Workout Templates
32 pre-built templates from the Thirty60 program library, ready to load in one tap:

| Split | Templates |
|---|---|
| Full Body | Total Body, Stability, Lateral/Total, Agility/Total, Phase 1–3 progressions |
| Upper / Lower | Push/Pull/Strength/Hypertrophy/Power (upper); Squat/Hinge/Unilateral (lower) |
| Push / Pull / Legs | 5 Push, 5 Pull, 4 Legs variations |
| Abs & Core | Core Fundamentals, Ab Circuits (beginner → advanced) |

Create, rename, reorder, and delete templates from the Exercise Library tab at any time.

### Assigned Workouts
- Write a workout prescription for a client — exercises, sets, reps, weight, and a scheduled date
- Assign the same workout to multiple clients at once
- Clients see upcoming assigned workouts at the top of their Workouts tab and complete them by filling in their actual numbers
- Completing an assigned workout automatically saves it to their workout log
- View all pending and completed assigned workouts per client; edit or delete any entry
- Any trainer on the platform can complete an assigned workout on a client's behalf

### Scheduling
- Set your weekly availability (recurring or one-off dates) from the Schedule tab
- Full-screen weekly timetable shows your availability windows and all booked sessions colour-coded by status (pending / confirmed / completed)
- Book sessions on behalf of clients, or let clients book themselves through the app
- Confirm, cancel, or mark sessions complete directly from the timetable
- Multiple trainers can view each other's schedules

### Session Credits
- Each client has a credit balance (30-min session = 1 credit, 60-min session = 2 credits)
- Grant credits to a client from their profile with an optional note
- Credits are deducted automatically when you confirm a session and refunded if you cancel
- Full transaction history (grants, deductions, refunds) visible on the client's Credits tab

### Exercise Library
- 220+ exercises across all muscle groups, including stretches and mobility work
- Interactive body map — tap any muscle to filter exercises for that area; works on both the library and the in-workout exercise picker
- Filter by equipment (Barbell, Dumbbell, Cable, Machine, Bodyweight, and more)
- Search by name or muscle (common names like "biceps", "quads", "lats" all work)
- Each exercise has coaching cues, movement photos, exercise variants, and an optional tutorial video link
- Add your own custom exercises at any time; upload photos and videos to any exercise page
- **Injury warning** — if you add an exercise to a client's workout and it conflicts with an injury on their intake form, the app flags it before you proceed

### Workout Guides
- 10 built-in training guides covering: Getting Started, Full Body, Upper/Lower, Push/Pull/Legs, Exercise Selection, Progressive Overload, Sets/Reps & Intensity, Warm-Up, Deload Weeks, and Abs & Core
- Each guide links directly to the exercises it mentions — tap any exercise name to open it
- Select a muscle on the body map to see a spotlight showing which split day trains it and its key exercises
- Trainers can edit any guide section in-app; clients see your customised version

### Exercise Encyclopedia
- In-depth muscle anatomy and function for every major muscle group
- Warm-up and stretching protocols, common injuries, and rehab exercises per muscle
- Editable by trainers in-app; client-facing view shows any customisations you've made

### Progress & Charts
- Charts for every client: sessions per week, total volume, body weight, body fat %, and any exercise over time
- Filter all charts by time range: 1 month, 3 months, 6 months, 1 year, all time, or a custom date range
- **Performance Report Card** — generate a shareable PDF summary of any period: sessions, volume, PRs, body composition charts, and optional nutrition data; shared via the system share sheet on mobile or printed from the browser on web

### Nutrition Tracking
- Log meals (Breakfast / Lunch / Dinner / Snack) for any client on any day
- Search a combined food database (USDA + Open Food Facts) covering millions of items
- Scan product barcodes with the camera to instantly pull up nutrition info
- Add food manually if it's not in the database
- Set a daily calorie and macro goal per client (protein / carbs / fat split); the app warns you before adding a food that would push them over their goal
- Save named recipes (e.g. "Post-workout shake") with any number of ingredients; log a recipe by entering a serving weight and macros scale automatically
- Clients can log their own nutrition and see their goal in the app

### Direct Messaging
- Real-time chat between trainers and clients
- Attach exercises, workouts, assigned workouts, or guide articles directly to a message
- Reply to individual messages; tapping a reply scrolls back to the original
- Unread conversations are highlighted and the Messages tab shows a badge until you open them
- Booking confirmations, cancellations, and session requests automatically send a message in the relevant conversation

---

## Database Schema

```
trainers                    — one row per auth user (auto-created on signup via trigger)
clients                     — belong to one trainer; includes gender, body metrics, DOB, notes, intake_completed flag
client_intake               — one row per client; full intake form data (health history, emergency contact, goals…)
workouts                    — one session per client per date; stores optional body metrics + logged_by_role/user_id
workout_sets                — one row per set (reps, weight_kg, duration_seconds, notes, superset_group)
exercises                   — shared library; authenticated read + insert; `equipment` column (Barbell / Dumbbell / Cable / Machine / Bodyweight / Kettlebell / Band / Other / NULL)
workout_templates           — editable program templates stored in DB; authenticated CRUD; `split TEXT` + `subgroup TEXT` columns group templates into a two-level hierarchy in the picker and editor
client_media                — image/video metadata per client (storage_path, media_type, taken_at, notes)
assigned_workouts           — trainer-assigned workout prescriptions per client (title, scheduled_date, status)
assigned_workout_exercises  — exercises within an assigned workout (exercise_id, order_index, superset_group)
assigned_workout_sets       — prescribed sets per assigned exercise (reps, weight_kg, duration_seconds, notes)
nutrition_logs              — per-meal food entries per client per day (food_name, serving_size_g, macros, usda_food_id, logged_by_role)
nutrition_goals             — one row per client; daily calorie target + protein/carbs/fat percentage split
trainer_availability        — recurring weekly slots (day_of_week) or specific-date slots; free-form start_time/end_time; is_active flag
scheduled_sessions          — one row per booked session (trainer_id, client_id, scheduled_at, duration_minutes, status, confirmed_at, cancelled_at, cancelled_by)
client_credits              — one row per client; current credit balance
credit_transactions         — ledger of every grant, session_deduct, and session_refund with amount, reason, note, and optional session_id FK
recipes                     — named recipe per client/trainer (name, description); RLS for both trainer and client
recipe_ingredients          — one row per ingredient in a recipe (food_name, usda_food_id, weight_g, per-100g macros); cascades on recipe delete
workout_guides              — trainer-editable guide content keyed by (topic, section_key); all authenticated users can read; only trainers can write
exercise_media              — trainer-uploaded photos/videos per exercise (storage_path, media_type, uploaded_by); stored in `exercise-media` bucket
conversations               — one row per conversation thread (created_at)
conversation_participants   — maps users to conversations (user_id, role, last_read_at); UPDATE policy lets participants write own last_read_at
messages                    — one row per message (conversation_id, sender_id, sender_role, content, reply_to_id FK, attachment_type, attachment_id, attachment_title, attachment_subtitle, created_at)
```

`workout_sets.superset_group` is a nullable integer that groups exercises into supersets within a workout. Sets for exercises in the same superset share the same group number, scoped to the workout.

`clients.intake_completed` is a boolean flag set to `true` when the client submits their first intake form. The client home screen shows the intake form until this is set.

Row-Level Security is enabled on all tables. Trainers can read and write their own clients, workout data, and assigned workouts. Clients can read their own row, write their own `client_intake` record, insert their own workouts (with `logged_by_role = 'client'`), and read/complete their own assigned workouts.

Media files are stored in the `client-media` Supabase Storage bucket (public read, authenticated write/delete). The `client_media` table records the storage path, type, date taken, and optional notes.

---

## Project Structure

```
app/
  _layout.tsx               # Root layout — auth gate, role-based routing, Skia web init
  (auth)/login.tsx          # Login — client tab default, trainer tab on right
  (auth)/signup.tsx         # Signup — client tab default; links client profile to auth user
  (tabs)/index.tsx          # Trainer: client list + search bar
  (tabs)/exercises.tsx      # Trainer: exercise library — browse, group, add; Edit Templates FAB
  (tabs)/schedule.tsx       # Trainer: weekly timetable + trainer selector + availability FAB; reads ?weekOf= param to jump to a week
  (tabs)/messages.tsx       # Trainer: conversations list + unread dot on tab icon
  (tabs)/profile.tsx        # Trainer: profile + sign out
  (client)/index.tsx                    # Client: home dashboard + intake gate (shows intake form on first login)
  (client)/workouts.tsx                 # Client: Workouts segment (calendar/list toggle, default calendar) + Schedule segment (timetable + booking)
  (client)/exercises.tsx                # Client: read-only exercise library (re-exports trainer screen; edit controls hidden via useAuth role check)
  (client)/progress.tsx                 # Client: progress charts (same charts as trainer view)
  (client)/nutrition.tsx                # Client: daily nutrition log + macro summary (goal read-only)
  (client)/media.tsx                    # Client: photo/video gallery
  (client)/profile.tsx                  # Client: personal info (read-only) + editable intake info
  (client)/messages.tsx                 # Client: conversations list + unread dot on tab icon
  (client)/workout/log.tsx              # Client: self-log a workout
  (client)/session/[id].tsx            # Client: workout detail view (back → workouts tab)
  messages/[id].tsx                     # Message thread — real-time chat, reply/threading, attachment picker, deep-link routing
  exercise/[id].tsx                     # Exercise detail — form images + variant tabs + form notes + tutorial link; edit controls shown to trainers only
  client/[id].tsx                       # Trainer: client detail — info+intake card, body metrics, charts, workouts, assigned, media
  client/new.tsx                        # Add client form (duplicate name guard)
  +not-found.tsx                        # 404 handler — shows "Page not found" (does not redirect; Render rewrite rule serves index.html so this only fires for genuinely missing routes)
  workout/[id].tsx                      # Workout detail — view/edit sets, body metrics, supersets, delete
  workout/new.tsx                       # Trainer: log or assign a workout; mode toggle at top
  workout/assigned/[id].tsx             # Trainer: edit assigned workout — full exercise builder + delete with confirmation bar
  workout/assigned/complete/[id].tsx    # Client: complete an assigned workout — pre-filled sets, confirmation bar on submit

components/
  charts/
    ProgressSection.tsx       # Time range selector (presets + custom calendar) + all chart sections
    FrequencyChart.tsx        # Bar chart — workouts per week + streak chips + axis labels
    VolumeChart.tsx           # Bar chart — total volume per session + axis labels
    ExerciseProgressChart.tsx # Line chart — weight or reps over time + tooltip + axis labels
  schedule/
    WeeklyTimetable.tsx       # Full-screen 7-day timetable; dynamic slot height via onLayout; gold availability bands; session blocks colour-coded by status; getSessionLabel prop for trainer-name vs client-name display
    CalendarStrip.tsx         # Week strip with session dots; exports sameDay, getMondayOfWeek helpers
    SessionSheet.tsx          # Bottom sheet — trainer: confirm/cancel/complete; client: view/cancel
    AvailabilitySheet.tsx     # Trainer manages recurring/specific-date availability slots with free-form TimePicker (0/15/30/45 min chips)
    BookingSheet.tsx          # 3-step client booking: date (availability days only) → time (15-min increments within availability windows, 30/60 min duration) → confirm; credit check per option
    TrainerBookingSheet.tsx   # 3-step trainer booking on behalf of a client: date (all 60 days, no availability restriction) → time (all 15-min slots 6 AM–10 PM) → confirm; credit deduction shown
    WeekPickerModal.tsx       # Modal week picker with session dots; 7-column calendar grid
  workout/
    ExercisePicker.tsx        # Searchable exercise picker with body map (left) + equipment chips + list (right); used when logging or editing workouts
    DbExerciseSection.tsx     # "FROM DATABASE" result rows with optional Add button (hidden when onAdd not provided — client read-only mode)
    TemplatePicker.tsx        # Phase-grouped template browser
    TemplateEditor.tsx        # Create / edit / delete workout templates
    WorkoutCalendar.tsx       # Full-screen monthly calendar; gold/green/dark-green dots per day; tap month/year title to open month-year picker modal; onDayPress callback fires for any day with dots; single-item days navigate directly, multi-item days show a custom Modal picker (web-safe — avoids Alert.alert limitations)
  client/
    MediaGallery.tsx          # Photo/video gallery — grid, upload modal, detail/edit modal
    IntakeForm.tsx            # Client intake form (first-time and edit modes)
    ReportCardButton.tsx      # Period picker + data fetching + PDF generation trigger
  messaging/
    MessagesScreen.tsx        # Shared conversations list (used by both trainer and client tabs); search bar, unread highlighting, new conversation FAB
    ConversationCard.tsx      # Single conversation row — gold tint + bold name when unread; timestamp color shifts to gold
    NewConversationModal.tsx  # Modal to start a new conversation; lists eligible participants; prevents duplicates
    AttachmentPickerModal.tsx # Slide-up sheet with Exercise / Workout / Assigned / Guide tabs; search; client sees only own workouts
  exercises/
    EncyclopediaPanel.tsx    # Muscle group reference — anatomy, warm-up, injuries, rehab; inline Wikipedia links; trainer-editable sections saved to Supabase
    WorkoutGuides.tsx        # 9-topic workout planning guide (Full Body / Upper-Lower / PPL / Progressive Overload / etc.); inline Wikipedia + PubMed links; muscle spotlight from body map; trainer-editable per section; accepts initialTopicKey prop to pre-select a topic on mount
  ui/
    BodyMap.tsx               # Interactive SVG body diagram (react-native-body-highlighter); tap/hover to filter by muscle group; Front/Back toggle; hover = light gold, selected = full gold, others dimmed
    ChangePasswordModal.tsx   # In-app change password sheet (re-authenticates with current password, then updateUser)
    DatePicker.tsx            # Inline single date selection component
    DatePickerModal.tsx       # Modal single date picker with log-dot indicators and Today shortcut
    DateRangePicker.tsx       # Calendar modal — range selection with workout dot indicators

hooks/
  useClients.ts              # Client CRUD + stats (workout count, last session)
  useClientProfile.ts        # Fetch the authenticated client's own profile + refresh
  useClientIntake.ts         # Fetch and upsert client_intake row; marks intake_completed on first submit
  useWorkouts.ts             # List workouts; single workout detail (joins trainer + client name) + sets + superset mutations
  useClientWorkouts.ts       # Client's own workout history
  useAssignedWorkouts.ts     # Assigned workout CRUD + complete (createAssignedWorkout, updateAssignedWorkout, deleteAssignedWorkout, completeAssignedWorkout)
  useExercises.ts            # Exercise library (read + create)
  useWorkoutTemplates.ts     # Template CRUD against the workout_templates table
  useClientProgress.ts       # Derives all chart data from workouts; hasWeight/hasDuration flags per exercise; duration progress series
  useClientMedia.ts          # Media CRUD — upload (blob → Storage → DB), update, delete
  useNutrition.ts            # Nutrition log CRUD + goal upsert; fetches trainer_id from clients table for client accounts
  useRecipes.ts              # useRecipes(clientId) — live recipe list; saveRecipe (create/update with ingredient replace); deleteRecipe
  useWorkoutGuides.ts        # Load all workout_guide rows; getEntry(topic, sectionKey); upsertEntry (trainer-only write)
  useExerciseMedia.ts        # Exercise media CRUD — upload (blob → exercise-media bucket → DB), list, delete own uploads
  useMessaging.ts            # useConversations (with unread flag), useMessages, sendMessage, markConversationRead, createConversation
  useTrainers.ts             # Fetch all trainers except the current user
  useSchedule.ts             # useTrainerAvailability, useAvailabilityForClient, useTrainerSessions, useClientSessions, useSessionsForClient (trainer views a client's sessions); requestSession, confirmSession, cancelSession, completeSession mutations
  useCredits.ts              # useClientCredits (balance), useCreditTransactions (ledger), grantCredits mutation

constants/
  theme.ts              # Color/spacing/typography tokens + useTheme (always dark)
  workoutTemplates.ts   # Seed data shape for the 16 built-in templates

index.js                # Custom entry point — installs a console.error filter before Expo's LogBox patches it; suppresses react-native-svg web renderer noise (accessible non-boolean, Unknown event handler) that are harmless but verbose on web

lib/
  supabase.ts              # Supabase client singleton
  auth.tsx                 # AuthContext + useAuth (role detection via maybeSingle — no 406 noise for client users, client linking, auth recovery)
  unreadContext.tsx        # UnreadProvider + useUnread() — global unread count via Realtime subscriptions on messages INSERT and conversation_participants UPDATE
  slugify.ts               # Name → URL slug helpers (clientSlug, slugify)
  generateReportPdf.ts     # HTML report builder + SVG chart generator + expo-print/sharing wrapper
  usda.ts                  # USDA FoodData Central search client; in-memory cache; per-100g macro scaling
  off.ts                   # Open Food Facts client; barcode lookup + text search; in-memory cache
  muscleSearch.ts          # Muscle synonym map + resolveGroupsFromQuery (e.g. "biceps" → "arms")
  exerciseDb.ts            # free-exercise-db fetch + session cache + muscle/category mapping + search + getDbImageUrls (slug overrides for all 150 seeded exercises, verified on disk)
  exerciseVariants.ts      # APPROXIMATED_EXERCISES (61 exercises with no exact DB match) + EXERCISE_VARIANTS (74 exercises → verified variant slug arrays, 239 total slugs)

components/
  nutrition/
    NutritionTab.tsx         # Date nav + daily summary + goal editor + meal sections + add food modal
    DailySummary.tsx         # Calorie ring + protein/carbs/fat progress bars vs. goal
    GoalEditor.tsx           # Collapsible calorie target + macro % split editor (trainer only)
    AddFoodModal.tsx         # Bottom sheet — Search / Scan / Manual / Recipes tabs; serving size scaling; recipe list with weight-based log flow
    MealSection.tsx          # Per-meal log entries with calorie subtotal + delete
    RecipeBuilderModal.tsx   # Create/edit recipes: name + description, ingredient search (USDA+OFF), per-ingredient weight, live macro totals + per-100g display
    NutritionEncyclopedia.tsx # 37-topic nutrition science reference — category filter tabs (All / Macros / Vitamins / Minerals / Supplements); macros retain full long-form detail; individual entries for all 13 vitamins (A, B1–B12, C, D, E, K) and 14 minerals (Calcium → Fluoride) with NIH ODS Consumer outlinks; 3 supplement entries (Omega-3, Probiotics, CoQ10); overview "Vitamins" and "Minerals" topics preserved alongside individual entries

types/
  database.ts          # Manual TS types mirroring the DB schema (Client, ClientIntake, ActivityLevel…)

assets/
  fonts/
    Roboto-Regular.ttf  # Bundled font for Skia chart axis labels
  Thirty60_logo.png     # Brand logo used in header and favicon

public/
  _redirects                # Render/Netlify SPA fallback — all paths serve index.html (prevents 404 on page refresh)
  favicon.png

supabase/
  schema.sql                        # Source-of-truth DDL (migrations 001–022 + 016b + Recipes + Workout Guides, all inline)
  seed.sql                          # 220+ exercises across all muscle groups (strength, cardio, flexibility, stretch, hands, feet)
  seed_test_client.sql              # Full year of realistic test data (youth hockey player)
  migration_016_form_notes.sql      # Backfills form_notes for all 150 seeded exercises from free-exercise-db instructions (run once; guarded with WHERE form_notes IS NULL OR form_notes = '')
  migrations/
    012_client_intake.sql        # client_intake table + RLS policies
    013_assigned_workouts.sql    # assigned_workouts, assigned_workout_exercises, assigned_workout_sets + RLS
    014_exercise_form_notes.sql  # populates form_notes for all 100 seeded exercises
    015_exercise_equipment.sql   # adds equipment column; classifies all 100 seeded exercises by type
```

---

## Web Deployment (Render)

The app is built as a single-page application (`"output": "single"` in `app.json`). `public/_redirects` tells Render to serve `index.html` for every path, which lets Expo Router handle client-side navigation on page refresh.

**Build command:** `npx expo export -p web`
**Publish directory:** `dist`

No additional Render configuration is needed — the `_redirects` file is copied into `dist/` automatically during export.

---

## Getting Started

### 1. Clone and install
```bash
git clone <repo-url>
cd thirty60track
npm install
npx expo install expo-image-picker expo-av expo-print expo-sharing expo-file-system expo-camera react-native-body-highlighter react-native-svg
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
```

### 3. Set up the database

Run these in order in the **Supabase SQL Editor**:

```
1. supabase/schema.sql          — creates all tables, triggers, RLS policies, and all migrations
2. supabase/seed.sql            — populates the exercise library (220+ exercises)
```

`schema.sql` is the single source of truth and includes all incremental migrations inline:
- **001** — base schema (trainers, clients, workouts, workout_sets, exercises)
- **002** — body metrics columns on workouts
- **003** — shared trainer access (RLS policies for workouts and workout_sets)
- **004** — `workout_templates` table
- **005** — unique constraint fix on workout_templates
- **006** — `superset_group` column on workout_sets
- **007** — `client_media` table for the photo/video gallery
- **008** — `gender` column on clients (`'male' | 'female' | 'other'`)
- **009** — `form_notes` and `help_url` columns on exercises; UPDATE RLS policy for authenticated trainers
- **010** — `workout_group_id UUID` on workouts; index; enables "worked out with" group sync
- **011** — `intake_completed BOOLEAN` on clients (default `false`); `client_intake` table with all intake fields; RLS policies for trainers and clients
- **012** — `clients: client update own` RLS policy so clients can update their own row
- **013** — `assigned_workouts`, `assigned_workout_exercises`, `assigned_workout_sets` tables; RLS for both trainers (full CRUD on their clients' assignments) and clients (read + complete their own); `assigned_workouts.status` enum (`assigned` | `completed`); `completed_workout_id` FK back to `workouts`
- **014** — `nutrition_logs` table (per-meal food entries with USDA food ID, serving size, macros); `nutrition_goals` table (daily calorie target + macro % split per client); RLS for trainers (full CRUD on their clients' data) and clients (read + insert + delete own logs; read own goal)
- **015** — drops `phase` and `category` columns from `workout_templates`; renames duplicate template names (appends `(P2)` / `(P3)` suffix); replaces `UNIQUE(name, phase)` constraint with `UNIQUE(name)`
- **016** — broadens assigned workout RLS from per-trainer (`trainer_id = auth.uid()`) to any authenticated trainer (`EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid())`); enables cross-trainer collaboration on client assigned workouts
- **017** — `link_client_to_auth_user()` SECURITY DEFINER function; resolves the RLS catch-22 where a newly signed-up client cannot update their own `auth_user_id` (the UPDATE policy requires `auth.uid() = auth_user_id` which is always false when the column is NULL); the function looks up the caller's email from `auth.users`, finds the matching unlinked client row, and writes `auth_user_id = auth.uid()` with elevated privileges
- **018** — populates `form_notes` for all 100 seeded exercises with detailed coaching cues (setup, execution, common cues per exercise)
- **015** — adds `equipment TEXT` column to `exercises`; classifies all 100 seeded exercises (Barbell / Dumbbell / Cable / Machine / Bodyweight / Kettlebell / Band / Other)
- **019** — adds `split TEXT` column to `workout_templates`; drops `UNIQUE(name)` and replaces with `UNIQUE(name, split)`; backfills all 32 seeded templates with their correct split label (Full Body / Upper / Lower / Push / Pull / Legs / Abs & Core)
- **020** — adds `subgroup TEXT` column to `workout_templates`; re-homes Phase 1/2/3 templates under Full Body with phase subgroups; merges old Abs split into Abs & Core; backfills all subgroup labels by name pattern
- **021** — renames all workout templates to remove "Workout A/B/C/D" prefixes; templates now use descriptive target-area names (e.g. "Push Emphasis", "Quad Focus"); drops `UNIQUE(name, split)` and replaces with `UNIQUE(name, split, subgroup)` to allow same-named templates in different subgroups
- **022** — adds `'stretch'` as a valid exercise category; seeds 72 new exercises: 36 stretches across all major muscle groups, 8 hand/wrist stretches, 10 hand/wrist strength exercises, 7 foot/ankle stretches, 11 foot/ankle strength exercises (muscle_group `'Hands'` / `'Feet'`)
- **016b** (scheduling) — `trainer_availability` (recurring weekly + specific-date slots; free-form start/end times; `day_of_week` nullable with CHECK constraint ensuring exactly one of `day_of_week` / `specific_date` is set); `scheduled_sessions` (status: `pending | confirmed | completed | cancelled`; `confirmed_at`, `cancelled_at`, `cancelled_by`); `client_credits` (balance per client); `credit_transactions` (ledger with reason: `grant | session_deduct | session_refund`); RLS for both trainers and clients on all four tables
- **Recipes** — `recipes` table (name, description, client_id, trainer_id); `recipe_ingredients` table (food_name, usda_food_id, weight_g, per-100g macro columns, sort_order; cascades on recipe delete); RLS for both trainer (`trainer_id = auth.uid()`) and client (`client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid())`)
- **Workout Guides** — `workout_guides` table (topic, section_key, content, updated_at; UNIQUE on topic+section_key); read policy for all authenticated users; write policy restricted to trainers (`EXISTS (SELECT 1 FROM trainers WHERE id = auth.uid())`)
- **Exercise Media** — `exercise_media` table (exercise_id, storage_path, media_type, uploaded_by); `exercise-media` Supabase Storage bucket (authenticated write, public read); trainers can delete their own uploads; requires Storage bucket setup (same pattern as `client-media`)
- **Messaging (019b)** — `conversations` table; `conversation_participants` table (user_id, role); `messages` table (sender_id, sender_role, content, reply_to_id self-FK, attachment_type, attachment_id, attachment_title, attachment_subtitle); RLS: participants can read their own conversations and messages; any participant can insert messages; automatic system messages on session state changes
- **Unread tracking (021)** — `ALTER TABLE conversation_participants ADD COLUMN last_read_at TIMESTAMPTZ`; UPDATE RLS policy so each participant can update their own `last_read_at`; unread state computed client-side by comparing `messages.created_at > last_read_at`

**Migration 007 also requires Storage setup** — create a public bucket named `client-media` in Supabase Dashboard → Storage, then run the four storage object policies included (commented out) at the bottom of `schema.sql`.

Optionally, to load a full year of test client data:
```
3. supabase/seed_test_client.sql — creates "Test" client with 156 realistic workouts
```
> Requires at least one trainer account to exist in the app first.

### 4. Start the app
```bash
npx expo start
```
Press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

---

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `EXPO_PUBLIC_USDA_API_KEY` | USDA FoodData Central API key (optional — falls back to `DEMO_KEY` at 30 req/hr; get a free key at api.nal.usda.gov) |
| *(none needed)* | Open Food Facts requires no API key — the barcode and search endpoints are publicly accessible |

## Future Features

### Planned

- [ ] **Weekly hard sets / muscle group monitor** — track weekly set volume per muscle group across all workouts; surface a per-muscle-group summary (e.g. chest: 14 sets this week) and flag when a group is under- or over-trained relative to a target range
- [ ] **Quick-tap coaching cues (AI)** — one-tap form cues per exercise during a workout; optionally AI-generated based on the exercise and the client's logged history
- [ ] **Push notifications** — reminders for upcoming assigned workouts; trainer alerts when a client completes a session or logs a new PR
- [ ] **Rest timer** — countdown between sets with audio/haptic alert
- [ ] **Personal records (PRs) tracking** — dedicated PR log per exercise; auto-flagged when a new best is set
- [ ] Archive/deactivate client
- [ ] Client profile photo
- [ ] Shared UI primitives library (Button, Card, Input)
- [ ] Pull-to-refresh
- [ ] Loading skeletons

### Server-Side Trainer Access Code Verification

Currently, the gym access code required during trainer signup is validated client-side only. Since the code lives in the app bundle, a determined user could theoretically extract it and create an unauthorised trainer account.

**Planned improvement:** Move validation to a Supabase Edge Function. The signup flow would call the function with the submitted access code; the function would verify it against a secret stored in Supabase Vault (not the app bundle) and only return a success token if correct. The client would then pass that token to the actual `signUp` call, and a database trigger would verify the token before creating the trainer row — ensuring no trainer account can be created without passing server-side validation.
