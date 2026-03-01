# thirty60track

A mobile app for personal trainers to track client workouts and progress. Built with Expo (iOS, Android, Web) and Supabase.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + Expo Router v3 |
| Language | TypeScript (strict) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Charts | Victory Native XL + React Native Skia |
| Styling | React Native StyleSheet |

## Features

### Authentication
- [x] Email/password login via Supabase Auth
- [x] Auth gate in root layout (redirects unauthenticated users)
- [x] Auto-create trainer profile on signup (DB trigger)
- [x] Sign out from profile screen

### Client Management
- [x] Client list dashboard with workout count and last session date
- [x] Auto-refresh client list when navigating back (useFocusEffect)
- [x] Add new client (name, email, phone, date of birth, notes)
- [x] Client body metrics (height, weight, body fat %)
- [x] Inline edit client info and metrics on client detail screen
- [x] Delete client (confirmation alert before deletion)
- [ ] Archive/deactivate client
- [ ] Client profile photo

### Workout Logging
- [x] Log a new workout session with date picker
- [x] Multi-exercise workout builder — add multiple exercises per session
- [x] Shared exercise picker with search (reused across screens)
- [x] Log sets per exercise (reps, weight, duration)
- [x] Notes per workout and per set
- [x] View workout detail (sets grouped by exercise)
- [x] Edit existing workout — add exercises, edit sets, update notes
- [x] Delete workout (confirmation alert)
- [x] Delete individual sets
- [ ] Rest timer
- [ ] Workout templates / saved routines

### Exercise Library
- [x] Shared exercise library (30 exercises seeded)
- [x] Exercise search when logging a workout
- [ ] Add custom exercises
- [ ] Exercise categories / muscle group filter
- [ ] Exercise detail page with instructions or video

### Progress & Charts

All charts feature:
- Y-axis unit labels (↑ kg, ↑ reps, ↑ sessions, ↑ kg·reps)
- Numerical tick marks on both axes (bundled Roboto font, works on web + native)
- Light grid lines for readability
- Time range filter: **1M / 3M / 6M / 1Y / All** applied across all charts simultaneously

#### Workout Frequency
- [x] Workouts-per-week bar chart (up to 16 most recent weeks)
- [x] Stat chips: This week · Avg/week · Current streak · Best streak
- [x] Footer showing date range and active weeks count

#### Volume Over Time
- [x] Total volume (kg·reps) per session bar chart
- [x] Footer showing first session, latest volume value, and latest date

#### Exercise Progress
- [x] Searchable dropdown to select any exercise the client has logged
- [x] Weight progress line chart (best set per session) with hover tooltip
- [x] Reps progress line chart (max reps per session) with hover tooltip
- [x] Footer showing first date, total gain/loss, and latest value

- [ ] Body weight trend chart
- [ ] Personal records (PRs) tracking and display
- [ ] Export progress data (CSV or PDF)

### UI & UX
- [x] Dark mode support (system-aware via `useColorScheme`)
- [x] Gold accent color theme (`#B88C32`)
- [x] Design token system (`constants/theme.ts`)
- [x] Tab navigation (Dashboard, Profile)
- [x] FAB (floating action button) with action label text
- [x] Back button on all nested screens (returns to previous screen)
- [x] Home button on deep screens (returns directly to client list)
- [x] Two-tab layout on client detail screen (Progress / History)
- [x] Skia web initialization with CanvasKit CDN (charts work on web)
- [x] Lazy-loaded chart section (no Skia module evaluated until CanvasKit ready)
- [ ] Shared UI primitives library (`components/ui/` — Button, Card, Input)
- [ ] Loading skeletons / placeholder states
- [ ] Pull-to-refresh on list screens
- [ ] Empty states with helpful prompts

## Database Schema

```
trainers       — one row per auth user (auto-created on signup)
clients        — belong to one trainer; RLS enforces visibility
workouts       — one session per client per date
workout_sets   — one row per set (reps, weight_kg, duration_seconds, notes)
exercises      — shared library; authenticated read + insert
```

Row-Level Security is enabled on all tables. Trainers can only read and write their own data.

## Project Structure

```
app/
  _layout.tsx          # Root layout — auth gate, Skia web init, providers
  (auth)/login.tsx     # Public login screen
  (tabs)/index.tsx     # Client list dashboard
  (tabs)/profile.tsx   # Trainer profile + sign out
  client/[id].tsx      # Client detail — metrics, progress charts, workout history
  client/new.tsx       # Add client form
  workout/[id].tsx     # Workout detail — view, edit sets, add exercises, delete
  workout/new.tsx      # Log new workout

components/
  charts/
    ProgressSection.tsx       # Lazy-loaded container — time range selector + all charts
    FrequencyChart.tsx        # Bar chart — workouts per week + streak stat chips
    VolumeChart.tsx           # Bar chart — total volume per session
    ExerciseProgressChart.tsx # Line chart — weight or reps over time + hover tooltip
  workout/
    ExercisePicker.tsx        # Searchable exercise picker (shared between screens)
  ui/
    DatePicker.tsx            # Date selection component

hooks/
  useClients.ts        # Client CRUD + stats (workout count, last session)
  useWorkouts.ts       # List workouts for a client
  useWorkoutDetail.ts  # Single workout + sets + exercises
  useExercises.ts      # Exercise library (read-only)
  useClientProgress.ts # Derives all chart data; supports daysBack range filter

assets/
  fonts/
    Roboto-Regular.ttf  # Bundled font for Skia chart axis labels

lib/
  supabase.ts          # Supabase client singleton
  auth.tsx             # AuthContext + useAuth hook

types/
  database.ts          # Manual TS types mirroring the DB schema

constants/
  theme.ts             # Color, spacing, typography tokens + useTheme hook

supabase/
  schema.sql           # Source-of-truth DDL
  seed.sql             # 30 exercises
  migrations/
    001_body_metrics_and_rls.sql
```

## Getting Started

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd thirty60track
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase project URL and anon key
   ```

3. **Set up the database**
   - Run `supabase/schema.sql` in the Supabase SQL editor
   - Run `supabase/migrations/001_body_metrics_and_rls.sql`
   - Run `supabase/seed.sql` to populate the exercise library

4. **Start the app**
   ```bash
   npx expo start
   ```
   Press `i` for iOS simulator, `a` for Android emulator, or `w` for web.

## Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
