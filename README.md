# thirty60track

An app for personal trainers to track client workouts, monitor progress, and load structured workout programs — with a companion client-facing portal for self-logging and progress tracking. Built with Expo (iOS, Android, Web) and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Language | TypeScript (strict) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Charts | Victory Native XL + React Native Skia |
| Styling | React Native StyleSheet |

---

## Features

### Authentication
- [x] Email/password login via Supabase Auth
- [x] Auth gate in root layout (redirects unauthenticated users)
- [x] Auto-create trainer profile on signup (DB trigger)
- [x] Sign out from profile screen
- [x] **Role-based routing** — role inferred from DB on login; client and trainer accounts use separate navigators automatically
- [x] **Signup role toggle** — client/trainer toggle on signup only; login is role-agnostic
- [x] **Client signup flow** — trainers add clients by email; clients sign up and are auto-linked to their profile
- [x] **Rate limit handling** — exponential backoff on 429 token refresh errors; friendly error message when signup email is rate-limited
- [x] **Auth recovery** — if a client account exists but `auth_user_id` was never written (signup race condition), the next sign-in auto-links the account by email

### Client Management
- [x] Client list dashboard with workout count and last session date
- [x] **Client search bar** — filter by name or email in real time
- [x] Auto-refresh client list on screen focus
- [x] Add new client (name, email, phone, date of birth, gender, height, notes)
- [x] **Duplicate name guard** — blocks adding a client whose name matches an existing one (slug-normalized)
- [x] Client body metrics (weight, height, body fat %, BMI, lean body mass)
- [x] Inline edit client info (including gender) and metrics on client detail screen
- [x] Delete client (confirmation alert before deletion)
- [x] **Full intake form in trainer view** — all intake fields (emergency contact, occupation, health history, fitness goals) are viewable and editable directly in the Client Info card above body metrics; no separate tab
- [x] **Health alert banner** — red warning at the top of the client detail page if current injuries or chronic conditions are on file; hidden when neither is set

### Media Gallery
- [x] Per-client photo and video gallery (Media tab on client detail screen)
- [x] Upload images and videos from device library with date and optional notes
- [x] 3-column thumbnail grid — images show preview, videos show play-icon placeholder
- [x] Hover/press thumbnails to preview date and caption overlaid on the media
- [x] Fullscreen detail view — tap any thumbnail to open image viewer or inline video player
- [x] Left/right arrow navigation between media items in the detail view
- [x] Edit date and notes on any existing media item
- [x] Delete media (confirmation prompt; removes file from storage and DB row)
- [x] Files stored in Supabase Storage (`client-media` bucket); metadata in `client_media` table

### Workout Logging
- [x] Log a new workout session with date picker
- [x] Multi-exercise workout builder — add multiple exercises per session
- [x] **Workout templates** — load a template to pre-populate all exercises instantly
- [x] Shared exercise picker with search
- [x] Log sets per exercise (reps, weight, duration)
- [x] **Per-exercise unit toggle** — cycle between lbs, kg, and secs per exercise block in all workout log/edit screens; weight converted to kg at save time
- [x] Optional body weight and body fat % per workout session
- [x] Notes per workout
- [x] View workout detail (sets grouped by exercise)
- [x] Edit existing workout — add exercises, edit sets, update notes, edit body metrics
- [x] **Unsaved changes guard** — editing a set, the workout header, or an add-set form and tapping back shows an in-screen bar with Save and Discard options; back gesture is disabled while changes are pending
- [x] Delete workout (confirmation bar)
- [x] Delete individual sets
- [x] Body metrics on past workouts sync back to the client profile
- [x] **Superset support** — chain exercises together with a link icon; each superset group gets a distinct color (violet, blue, amber, pink, teal); works in both the new workout logger and the edit screen
- [x] Workout notes per set
- [x] **Worked out with** — select clients who trained in the same session; their workouts are created and kept in sync (add/edit/delete sets propagate to all group members automatically); exercise display order is preserved on all members' workout views; manage the group from the workout edit screen
- [x] **Logged-by attribution** — workout list and detail screens show the correct name (trainer or client) for who logged each session

### Assigned Workouts
- [x] Trainers can assign a workout to a client with a title, scheduled date, optional notes, and a full exercise + set prescription
- [x] **Assign mode in workout builder** — toggle between "Log" and "Assign" at the top of the new workout screen; assign mode sends the workout to the client without creating a session log entry; exits immediately on success (no confirmation dialog)
- [x] **Unsaved changes guard on new workout** — if exercises or inputs have been filled in and the user navigates away, an in-screen Save/Discard bar appears; back gesture disabled while dirty
- [x] **Assign to multiple clients** — in assign mode, a checkbox list of all clients is shown; any combination can be selected; the same workout is submitted for all selected clients simultaneously
- [x] **Client pending workouts** — assigned workouts with status `assigned` appear at the top of the client's Workouts tab as "UPCOMING" cards with a play button
- [x] Client taps an upcoming workout to open the **Complete Workout** screen — exercises and prescribed sets are pre-filled; client edits actual reps/weight/duration and taps Complete
- [x] Completing an assigned workout creates a real workout + sets entry in the client's log and marks the assigned workout as `completed`
- [x] **Assigned tab on client detail** — trainers see all assigned workouts (pending and completed) for a client; edit or delete any entry
- [x] **Edit assigned workout** — full exercise builder pre-populated with prescribed exercises and sets; supports template loading, superset linking, and unit toggle
- [x] **Unsaved changes guard on edit assigned workout** — navigating away with unsaved edits shows an in-screen Save/Discard bar; back gesture disabled while dirty
- [x] **Any trainer can complete an assigned workout** — a "Complete" button appears on the edit screen for pending workouts; any trainer (not just the assigning trainer) can fill in actual values and log the session on behalf of the client; logged-by attribution is set to `trainer` automatically
- [x] Delete assigned workout with confirmation bar (child sets and exercises deleted first to satisfy RLS)
- [x] Unit toggle (lbs / kg / secs) in both the assign builder and the complete screen
- [x] **Cross-trainer access** — all trainers can view, edit, and complete any client's assigned workouts (migration 016 broadened RLS from per-trainer to any-authenticated-trainer)

### Workout Templates
Templates are stored in the database and fully editable from within the app (via the Exercise Library tab → Edit Templates). The app ships with 16 pre-built templates sourced from the Thirty60 program library: Push Focus, Pull Focus, Stability, Lateral/Total, Shoulder Focus, Agility/Total, Chest/Push, Back/Pull, Total Body, and Abs Variations A–D.

Templates are displayed as a flat list (no phase grouping). They are matched to live exercises in the database when loading a workout. Any unmatched exercises are listed so they can be added manually. Trainers can create, rename, reorder exercises in, and delete templates at any time.

### Exercise Library
- [x] Shared exercise library (150+ exercises seeded across all muscle groups)
- [x] Dedicated **Exercises tab** — browse, search, and manage the full library
- [x] Group exercises by muscle group or category (collapsible sections)
- [x] **Add custom exercises** — name, muscle group, and category (strength / cardio / flexibility / other)
- [x] Exercise search when logging a workout
- [x] Exercises auto-inserted by workout templates when missing from the library
- [x] **Exercise detail page** — tap any exercise to open its detail screen
- [x] **Form notes** — free-text step-by-step instructions per exercise (editable by any trainer)
- [x] **Tutorial link** — YouTube URL per exercise with one-tap Watch button; 4 core lifts pre-seeded (Bench Press, Squat, Deadlift, Lat Pulldown)

### Client Portal

Clients have their own separate tab navigator with distinct screens:

- [x] **Home dashboard** — greeting, total sessions, weekly streak, last workout card, quick actions
- [x] **One-time intake form** — shown on first login; collects full name, date of birth, phone, address, emergency contact, occupation, current/past injuries, chronic conditions, medications, activity level, goals, and timeframe; disappears once submitted
- [x] **Workout history** — list of all logged sessions with date, logged-by name (trainer or client), and notes; pending assigned workouts shown at the top
- [x] **Self-log workouts** — clients can log their own workouts (exercises + sets + body metrics) with per-exercise unit toggle
- [x] **Complete assigned workouts** — pre-filled prescribed sets; client fills in actual values and confirms via a bottom confirmation bar; saved to workout log automatically
- [x] **Progress tab** — same frequency/volume/body composition/exercise charts as the trainer view; includes Performance Report Card button
- [x] **Nutrition tab** — log daily meals, search USDA + Open Food Facts food databases, scan product barcodes, view macro summary vs. daily goal (goal set by trainer)
- [x] **Media tab** — view photo/video gallery
- [x] **Profile tab** — view personal info and body metrics (trainer-managed); edit health & fitness intake info
- [x] Correct logged-by name shown on all workouts (trainer name for trainer-logged; client name for client-logged) in both list and detail views
- [x] Back button on workout detail returns to Workouts tab (not home)

### Progress & Charts

All charts support a **time range filter: 1M / 3M / 6M / 1Y / All / Custom** applied simultaneously. Selecting a range with no data shows a "No workouts in this period" placeholder instead of hiding the selector.

#### Workout Frequency
- [x] Workouts-per-week bar chart with labelled axes (Sessions / week, Week)
- [x] Stat chips: This week · Avg/week · Current streak · Best streak · Active weeks

#### Volume Over Time
- [x] Total volume per session bar chart with labelled axes
- [x] **lbs / kg toggle** — converts displayed values; unit shared with exercise progress toggle

#### Body Composition
- [x] Body weight trend line chart (logged per workout)
- [x] Body fat % trend line chart (logged per workout)
- [x] Charts shown side-by-side with exercise progress

#### Exercise Progress
- [x] Searchable dropdown — any exercise the client has logged
- [x] **lbs / kg toggle** — shown for exercises with weight data; duration-only exercises display seconds with no toggle
- [x] Weight progress line chart (best set per session) with press-to-inspect tooltip and labelled axes
- [x] Duration progress line chart (max duration per session) — shown only for timed exercises
- [x] Reps progress line chart (max reps per session) with tooltip
- [x] Footer showing first date, total gain/loss, and latest value

#### Date Range
- [x] Preset chips: 1M / 3M / 6M / 1Y / All
- [x] **Custom range** — tap "Custom" to open a calendar picker; select a start and end date; workout dates are highlighted with dots; selected range shown as a coloured strip; chip displays the chosen date span (e.g. "Jan 1 – Feb 28")

#### Performance Report Card
- [x] **Report Card button** — available on both the trainer's Progress tab (client detail) and the client's own Progress tab
- [x] **Period selection** — This Week / Last 4 Weeks / Last 12 Weeks / Custom (calendar picker with workout dots, same pattern as chart range picker)
- [x] **Generated PDF includes:** summary stats (sessions, total sets, volume, new PRs), body progress (start/end/Δ per metric + side-by-side line charts for weight, body fat, and lean mass), and exercise bests with PR flag
- [x] **Include nutrition checkbox** — optional section in the report showing avg daily calories, protein, carbs, fat, days logged, and a colour-coded macro split bar chart for the selected period
- [x] **Native share** — PDF file generated via `expo-print`, shared via system share sheet (`expo-sharing`)
- [x] **Web** — HTML report opens in a new tab and auto-triggers the browser print dialog (Save as PDF); default filename set from `<title>`

### Nutrition Tracking

- [x] **Daily nutrition log** — trainers and clients can log meals per day (Breakfast / Lunch / Dinner / Snack)
- [x] **Unified food search** — queries USDA FoodData Central and Open Food Facts simultaneously; results interleaved with a source badge per item; in-memory cache per query to avoid redundant API calls
- [x] **Barcode scanning** — Scan tab in the Add Food modal; camera scans EAN-8, EAN-13, UPC-A, UPC-E barcodes; Open Food Facts lookup pre-fills the form; "product not found" message with retry option; requires camera permission (prompted on first use)
- [x] **Manual entry** — add food manually without any lookup (name + serving size + macros)
- [x] **Serving size scaling** — changing the serving size in the add-food form instantly recalculates all macros
- [x] **Daily macro summary** — calorie ring + protein / carbs / fat progress bars vs. goal; shown at the top of the Nutrition tab
- [x] **Calorie & macro goals** — trainers set a daily calorie target and protein/carbs/fat percentage split per client; live gram previews while editing; macros must total 100%
- [x] **Goal card auto-expands** — Daily Goal card starts expanded when no goal has been set yet
- [x] **Date picker calendar** — tap the date label to open a calendar modal; dates with existing logs are highlighted with gold dots; future dates are disabled
- [x] Date navigation — prev/next day arrows; capped at today
- [x] Delete log entries — trainers can delete any entry; clients can only delete entries they logged themselves
- [x] **Client Nutrition tab** — clients have a dedicated Nutrition screen in their tab navigator (same log view, goal read-only)
- [x] Trainer Nutrition tab — accessible from the client detail screen (Progress / Workouts / Assigned / **Nutrition** / Media); full goal editing enabled
- [x] **Open Food Facts integration** — food search queries both USDA FoodData Central and Open Food Facts in parallel; results are interleaved with a source badge ("USDA" or "Open Food Facts") so users know where each item came from
- [x] **Barcode scanning** — dedicated Scan tab in the Add Food modal; uses the device camera to scan EAN-8, EAN-13, UPC-A, and UPC-E barcodes; product looked up via Open Food Facts API and macros pre-filled automatically; graceful "product not found" state with retry; camera permission prompt on first use

### UI & Theme
- [x] **Forced dark theme** — deep charcoal (`#111111`) background, `#1C1C1C` surfaces, gold (`#B88C32`) accents across iOS, Android, and Web
- [x] Design token system (`constants/theme.ts`) — colors, spacing, typography, radius
- [x] Thirty60 logo in app header and browser favicon
- [x] Tab navigation (Clients, Exercises, Profile)
- [x] Profile screen shows list of all other trainers on the platform
- [x] FAB (floating action button) with label
- [x] Safe back navigation — falls back to home if no navigation history (works on web direct links)
- [x] **Name-based client URLs** — web routes use `/client/john-doe` instead of UUIDs; slug lookup with UUID fallback for backward compatibility
- [x] **404 redirect** — unmatched routes redirect to the home screen
- [x] Five-tab layout on client detail screen (Progress / Workouts / Assigned / Nutrition / Media)
- [x] Skia web initialization with CanvasKit CDN (charts work on web)
- [x] Lazy-loaded chart section (CanvasKit loads before charts render)

---

## Database Schema

```
trainers                    — one row per auth user (auto-created on signup via trigger)
clients                     — belong to one trainer; includes gender, body metrics, DOB, notes, intake_completed flag
client_intake               — one row per client; full intake form data (health history, emergency contact, goals…)
workouts                    — one session per client per date; stores optional body metrics + logged_by_role/user_id
workout_sets                — one row per set (reps, weight_kg, duration_seconds, notes, superset_group)
exercises                   — shared library; authenticated read + insert
workout_templates           — editable program templates stored in DB; authenticated CRUD
client_media                — image/video metadata per client (storage_path, media_type, taken_at, notes)
assigned_workouts           — trainer-assigned workout prescriptions per client (title, scheduled_date, status)
assigned_workout_exercises  — exercises within an assigned workout (exercise_id, order_index, superset_group)
assigned_workout_sets       — prescribed sets per assigned exercise (reps, weight_kg, duration_seconds, notes)
nutrition_logs              — per-meal food entries per client per day (food_name, serving_size_g, macros, usda_food_id, logged_by_role)
nutrition_goals             — one row per client; daily calorie target + protein/carbs/fat percentage split
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
  (tabs)/profile.tsx        # Trainer: profile + sign out
  (client)/index.tsx                    # Client: home dashboard + intake gate (shows intake form on first login)
  (client)/workouts.tsx                 # Client: workout history + pending assigned workouts at top
  (client)/progress.tsx                 # Client: progress charts (same charts as trainer view)
  (client)/nutrition.tsx                # Client: daily nutrition log + macro summary (goal read-only)
  (client)/media.tsx                    # Client: photo/video gallery
  (client)/profile.tsx                  # Client: personal info (read-only) + editable intake info
  (client)/workout/log.tsx              # Client: self-log a workout
  (client)/session/[id].tsx            # Client: workout detail view (back → workouts tab)
  exercise/[id].tsx                     # Exercise detail — form notes + tutorial link (editable)
  client/[id].tsx                       # Trainer: client detail — info+intake card, body metrics, charts, workouts, assigned, media
  client/new.tsx                        # Add client form (duplicate name guard)
  +not-found.tsx                        # 404 handler — redirects to home
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
  workout/
    ExercisePicker.tsx        # Searchable exercise picker
    TemplatePicker.tsx        # Phase-grouped template browser
    TemplateEditor.tsx        # Create / edit / delete workout templates
  client/
    MediaGallery.tsx          # Photo/video gallery — grid, upload modal, detail/edit modal
    IntakeForm.tsx            # Client intake form (first-time and edit modes)
    ReportCardButton.tsx      # Period picker + data fetching + PDF generation trigger
  ui/
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
  useTrainers.ts             # Fetch all trainers except the current user

constants/
  theme.ts              # Color/spacing/typography tokens + useTheme (always dark)
  workoutTemplates.ts   # Seed data shape for the 16 built-in templates

lib/
  supabase.ts              # Supabase client singleton
  auth.tsx                 # AuthContext + useAuth (role detection, client linking, auth recovery)
  slugify.ts               # Name → URL slug helpers (clientSlug, slugify)
  generateReportPdf.ts     # HTML report builder + SVG chart generator + expo-print/sharing wrapper
  usda.ts                  # USDA FoodData Central search client; in-memory cache; per-100g macro scaling
  off.ts                   # Open Food Facts client; barcode lookup + text search; in-memory cache

components/
  nutrition/
    NutritionTab.tsx       # Date nav + daily summary + goal editor + meal sections + add food modal
    DailySummary.tsx       # Calorie ring + protein/carbs/fat progress bars vs. goal
    GoalEditor.tsx         # Collapsible calorie target + macro % split editor (trainer only)
    AddFoodModal.tsx       # Bottom sheet — unified USDA+OFF search, barcode scanner, or manual entry; serving size scaling
    MealSection.tsx        # Per-meal log entries with calorie subtotal + delete

types/
  database.ts          # Manual TS types mirroring the DB schema (Client, ClientIntake, ActivityLevel…)

assets/
  fonts/
    Roboto-Regular.ttf  # Bundled font for Skia chart axis labels
  Thirty60_logo.png     # Brand logo used in header and favicon

supabase/
  schema.sql                # Source-of-truth DDL (migrations 001–015)
  seed.sql                  # 150+ exercises across all muscle groups
  seed_test_client.sql      # Full year of realistic test data (youth hockey player)
  migrations/
    012_client_intake.sql   # client_intake table + RLS policies
    013_assigned_workouts.sql # assigned_workouts, assigned_workout_exercises, assigned_workout_sets + RLS
```

---

## Getting Started

### 1. Clone and install
```bash
git clone <repo-url>
cd thirty60track
npm install
npx expo install expo-image-picker expo-av expo-print expo-sharing expo-file-system expo-camera
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
```

### 3. Set up the database

Run these in order in the **Supabase SQL Editor**:

```
1. supabase/schema.sql          — creates all tables, triggers, RLS policies, and migrations 001–013
2. supabase/seed.sql            — populates the exercise library (150+ exercises)
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
- [ ] **[BIG] Full scheduling** — calendar-based view for planning future workouts weeks or months ahead; drag-and-drop rescheduling; recurring session patterns; trainer sees all clients' schedules in one view
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
