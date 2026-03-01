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
- [x] Add new client (name, email, phone, date of birth, notes)
- [x] Client body metrics (height, weight, body fat %)
- [x] Inline edit client info and metrics on client detail screen
- [ ] Delete client
- [ ] Archive/deactivate client
- [ ] Client profile photo

### Workout Logging
- [x] Log a new workout session (date auto-set to today)
- [x] Multi-exercise workout builder — add multiple exercises per session
- [x] Exercise picker with search
- [x] Log sets per exercise (reps, weight, duration)
- [x] View workout detail (sets grouped by exercise)
- [ ] Edit or delete an existing workout
- [ ] Delete individual sets
- [ ] Rest timer
- [ ] Workout templates / saved routines
- [ ] Notes per workout or per set

### Exercise Library
- [x] Shared exercise library (30 exercises seeded)
- [x] Exercise search when logging a workout
- [ ] Add custom exercises
- [ ] Exercise categories / muscle group filter
- [ ] Exercise detail page with instructions or video

### Progress & Charts
- [x] Per-client volume chart (total weight lifted per session, bar chart)
- [x] Per-exercise progress chart (best set weight over time, line chart)
- [x] `useClientProgress` hook derives volume and per-exercise data from raw sets
- [ ] Body weight trend chart
- [ ] Personal records (PRs) tracking and display
- [ ] Workout frequency / consistency view
- [ ] Export progress data (CSV or PDF)

### UI & UX
- [x] Dark mode support (system-aware via `useColorScheme`)
- [x] Design token system (`constants/theme.ts`)
- [x] Tab navigation (Dashboard, Profile)
- [x] FAB (floating action button) for primary actions
- [ ] Shared UI primitives library (`components/ui/` — Button, Card, Input)
- [ ] Loading skeletons / placeholder states
- [ ] Pull-to-refresh on list screens
- [ ] Empty states with helpful prompts

## Database Schema

```
trainers       — one row per auth user (auto-created on signup)
clients        — belong to one trainer; RLS enforces visibility
workouts       — one session per client per date
workout_sets   — one row per set (reps, weight_kg, duration_seconds)
exercises      — shared library; authenticated read + insert
```

Row-Level Security is enabled on all tables. Trainers can only read and write their own data.

## Project Structure

```
app/
  _layout.tsx          # Root layout — auth gate, providers
  (auth)/login.tsx     # Public login screen
  (tabs)/index.tsx     # Client list dashboard
  (tabs)/profile.tsx   # Trainer profile + sign out
  client/[id].tsx      # Client detail, metrics, charts, workout history
  client/new.tsx       # Add client form
  workout/[id].tsx     # Workout detail
  workout/new.tsx      # Log new workout

components/
  charts/
    VolumeChart.tsx         # Bar chart — volume per session
    ExerciseProgressChart.tsx # Line chart — weight over time

hooks/
  useClients.ts        # Client CRUD + stats (workout count, last session)
  useWorkouts.ts       # List workouts for a client
  useWorkoutDetail.ts  # Single workout + sets + exercises
  useExercises.ts      # Exercise library (read-only)
  useClientProgress.ts # Derives chart data from workout sets

lib/
  supabase.ts          # Supabase client singleton
  auth.tsx             # AuthContext + useAuth hook

types/
  database.ts          # Manual TS types mirroring the DB schema

constants/
  theme.ts             # Color, spacing, typography tokens

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
