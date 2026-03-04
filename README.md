# thirty60track

An app for personal trainers to track client workouts, monitor progress, and load structured workout programs. Built with Expo (iOS, Android, Web) and Supabase.

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

### Client Management
- [x] Client list dashboard with workout count and last session date
- [x] **Client search bar** — filter by name or email in real time
- [x] Auto-refresh client list on screen focus
- [x] Add new client (name, email, phone, date of birth, gender, height, notes)
- [x] Client body metrics (weight, height, body fat %, BMI, lean body mass)
- [x] Inline edit client info (including gender) and metrics on client detail screen
- [x] Delete client (confirmation alert before deletion)
- [ ] Archive/deactivate client
- [ ] Client profile photo

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
- [x] Optional body weight and body fat % per workout session
- [x] Notes per workout
- [x] View workout detail (sets grouped by exercise)
- [x] Edit existing workout — add exercises, edit sets, update notes, edit body metrics
- [x] Delete workout (confirmation alert)
- [x] Delete individual sets
- [x] Body metrics on past workouts sync back to the client profile
- [x] **Superset support** — chain exercises together with a link icon; each superset group gets a distinct color (violet, blue, amber, pink, teal); works in both the new workout logger and the edit screen
- [ ] Rest timer
- [ ] Workout notes per set

### Workout Templates
Templates are stored in the database and fully editable from within the app (via the Exercise Library tab → Edit Templates). The app ships with 16 pre-built templates sourced from the Thirty60 program library:

| Phase | Templates |
|---|---|
| Phase 1 | Workout A: Push Focus, B: Pull Focus, C: Stability, D: Lateral/Total |
| Phase 2 | Workout A: Push Focus, B: Pull Focus, C: Shoulder Focus, D: Agility/Total |
| Phase 3 | Workout A: Chest/Push, B: Back/Pull, C: Shoulders, D: Total Body |
| Abs | Variation A, B, C, D |

Templates are matched to live exercises in the database when loading a workout. Any unmatched exercises are listed so they can be added manually. Trainers can create, rename, reorder exercises in, and delete templates at any time.

### Exercise Library
- [x] Shared exercise library (150+ exercises seeded across all muscle groups)
- [x] Dedicated **Exercises tab** — browse, search, and manage the full library
- [x] Group exercises by muscle group or category (collapsible sections)
- [x] **Add custom exercises** — name, muscle group, and category (strength / cardio / flexibility / other)
- [x] Exercise search when logging a workout
- [x] Exercises auto-inserted by workout templates when missing from the library
- [ ] Exercise detail page

### Progress & Charts

All charts support a **time range filter: 1M / 3M / 6M / 1Y / All** applied simultaneously. Selecting a range with no data shows a "No workouts in this period" placeholder instead of hiding the selector.

#### Workout Frequency
- [x] Workouts-per-week bar chart
- [x] Stat chips: This week · Avg/week · Current streak · Best streak · Active weeks

#### Volume Over Time
- [x] Total volume (kg × reps) per session bar chart

#### Body Composition
- [x] Body weight trend line chart (logged per workout)
- [x] Body fat % trend line chart (logged per workout)
- [x] Charts shown side-by-side with exercise progress

#### Exercise Progress
- [x] Searchable dropdown — any exercise the client has logged
- [x] Weight progress line chart (best set per session) with press-to-inspect tooltip
- [x] Reps progress line chart (max reps per session) with tooltip
- [x] Footer showing first date, total gain/loss, and latest value

- [ ] Personal records (PRs) tracking
- [ ] Export progress data (CSV or PDF)

### UI & Theme
- [x] **Forced dark theme** — deep charcoal (`#111111`) background, `#1C1C1C` surfaces, gold (`#B88C32`) accents across iOS, Android, and Web
- [x] Design token system (`constants/theme.ts`) — colors, spacing, typography, radius
- [x] Thirty60 logo in app header and browser favicon
- [x] Tab navigation (Clients, Exercises, Profile)
- [x] Profile screen shows list of all other trainers on the platform
- [x] FAB (floating action button) with label
- [x] Safe back navigation — falls back to home if no navigation history (works on web direct links)
- [x] Three-tab layout on client detail screen (Progress / Workouts / Media)
- [x] Skia web initialization with CanvasKit CDN (charts work on web)
- [x] Lazy-loaded chart section (CanvasKit loads before charts render)
- [ ] Shared UI primitives library (Button, Card, Input)
- [ ] Pull-to-refresh
- [ ] Loading skeletons

---

## Database Schema

```
trainers           — one row per auth user (auto-created on signup via trigger)
clients            — belong to one trainer; includes gender, body metrics, DOB, notes
workouts           — one session per client per date; stores optional body metrics
workout_sets       — one row per set (reps, weight_kg, duration_seconds, notes, superset_group)
exercises          — shared library; authenticated read + insert
workout_templates  — editable program templates stored in DB; authenticated CRUD
client_media       — image/video metadata per client (storage_path, media_type, taken_at, notes)
```

`workout_sets.superset_group` is a nullable integer that groups exercises into supersets within a workout. Sets for exercises in the same superset share the same group number, scoped to the workout.

Row-Level Security is enabled on all tables. Trainers can only read and write their own clients and workout data.

Media files are stored in the `client-media` Supabase Storage bucket (public read, authenticated write/delete). The `client_media` table records the storage path, type, date taken, and optional notes.

---

## Project Structure

```
app/
  _layout.tsx          # Root layout — auth gate, Skia web init, dark status bar
  (auth)/login.tsx     # Public login screen
  (tabs)/index.tsx     # Client list + search bar
  (tabs)/exercises.tsx # Exercise library — browse, group, add; Edit Templates FAB
  (tabs)/profile.tsx   # Trainer profile + sign out
  client/[id].tsx      # Client detail — metrics, progress charts, workout history
  client/new.tsx       # Add client form
  workout/[id].tsx     # Workout detail — view/edit sets, body metrics, supersets, delete
  workout/new.tsx      # Log new workout + template loader + superset linking

components/
  charts/
    ProgressSection.tsx       # Time range selector + all chart sections
    FrequencyChart.tsx        # Bar chart — workouts per week + streak chips
    VolumeChart.tsx           # Bar chart — total volume per session
    ExerciseProgressChart.tsx # Line chart — weight or reps over time + tooltip
  workout/
    ExercisePicker.tsx        # Searchable exercise picker
    TemplatePicker.tsx        # Phase-grouped template browser
    TemplateEditor.tsx        # Create / edit / delete workout templates
  client/
    MediaGallery.tsx          # Photo/video gallery — grid, upload modal, detail/edit modal
  ui/
    DatePicker.tsx            # Date selection component

hooks/
  useClients.ts           # Client CRUD + stats (workout count, last session)
  useWorkouts.ts          # List workouts; single workout detail + sets + superset mutations
  useExercises.ts         # Exercise library (read + create)
  useWorkoutTemplates.ts  # Template CRUD against the workout_templates table
  useClientProgress.ts    # Derives all chart data from workouts; supports date range
  useClientMedia.ts       # Media CRUD — upload (blob → Storage → DB), update, delete
  useTrainers.ts          # Fetch all trainers except the current user

constants/
  theme.ts              # Color/spacing/typography tokens + useTheme (always dark)
  workoutTemplates.ts   # Seed data shape for the 16 built-in templates

lib/
  supabase.ts          # Supabase client singleton
  auth.tsx             # AuthContext + useAuth hook

types/
  database.ts          # Manual TS types mirroring the DB schema

assets/
  fonts/
    Roboto-Regular.ttf  # Bundled font for Skia chart axis labels
  Thirty60_logo.png     # Brand logo used in header and favicon

supabase/
  schema.sql                # Source-of-truth DDL (migrations 001–007)
  seed.sql                  # 150+ exercises across all muscle groups
  seed_test_client.sql      # Full year of realistic test data (youth hockey player)
```

---

## Getting Started

### 1. Clone and install
```bash
git clone <repo-url>
cd thirty60track
npm install
npx expo install expo-image-picker expo-av
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
```

### 3. Set up the database

Run these in order in the **Supabase SQL Editor**:

```
1. supabase/schema.sql          — creates all tables, triggers, RLS policies, and migrations 001–007
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
