# thirty60track

A personal training management app built with Expo + Supabase. Trainers manage clients, log workouts, assign programs, schedule sessions, and share content. Clients track progress, follow assigned workouts, book sessions, and stay connected via a community feed.

## Stack

- **Expo SDK 51** + Expo Router v3 (iOS, Android, Web)
- **TypeScript** strict mode
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions
- **Anthropic Claude** — AI-generated daily fitness trends (via Supabase Edge Function)
- **Victory Native XL** — progress and volume charts
- **React Native StyleSheet** — luxury minimalist dark/light theme

## Features

### Trainer
- Client list with workout count and last session date
- Client detail: info, body metrics, progress charts, workout history
- Log workouts (multi-exercise builder with sets/reps/weight)
- Assign workout programs with scheduled dates
- Workout template library: 36 clinical templates across 5 speciality splits (Metabolic & Chronic Disease, Musculoskeletal & Orthopedic, Postural Deviations, Neurological & Mental Health, Special Populations)
- Weekly availability management + session scheduling
- Grant session credits to clients
- Community feed: post, react, comment; delete any post
- AI fitness trends tab with daily summaries and article links

### Client
- Pending assigned workouts with one-tap execution
- Book sessions from trainer's availability slots
- Community feed: post, react, comment
- AI fitness trends tab

## Project Structure

```
app/
  (auth)/           — login (public)
  (tabs)/           — trainer tab navigator
  (client)/         — client tab navigator
  workout/          — log/edit/assign/complete workouts
  client/           — client detail + new client form
components/
  feed/             — PostCard, PostComposer, CommentSheet, TrendCard
  feed/FeedScreen   — shared Community + Trends screen (trainer + client)
  schedule/         — CalendarStrip, SessionSheet, BookingSheet, AvailabilitySheet
  nutrition/        — RecipeBuilderModal, AddFoodModal
  exercises/        — WorkoutGuides, EncyclopediaPanel, MuscleMap
  charts/           — VolumeChart, ExerciseProgressChart
hooks/
  useFeed.ts        — feed posts, reactions, comments, image upload
  useTrends.ts      — useTodayTrend, useRecentTrends
  useSchedule.ts    — availability, sessions, booking
  useCredits.ts     — client credits + transactions
  useRecipes.ts     — recipe CRUD
  useAssignedWorkouts.ts
  useClients.ts / useWorkouts.ts / useClientProgress.ts
lib/
  supabase.ts       — Supabase client singleton
  auth.tsx          — AuthProvider + useAuth
  anthropic.ts      — fetchOrGenerateTrend, generateTrendSummary (delegates to Edge Function)
supabase/
  schema.sql        — source-of-truth DDL (all migrations inline)
  seed.sql          — exercise library (200+ exercises across all muscle groups)
  functions/
    generate-trend/ — Deno Edge Function: calls Anthropic API server-side, returns trend JSON
types/
  database.ts       — manual TS types mirroring schema
constants/
  theme.ts          — color, spacing, typography tokens + useTheme()
```

## Getting Started

### 1. Install dependencies

```bash
npm install
npx expo install @shopify/react-native-skia
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Run `supabase/schema.sql` in the Supabase SQL Editor, then `supabase/seed.sql` for the exercise library.

`schema.sql` includes all migrations in sequence (M001–M025). The final migration (M025) expands the exercise library to 200+ exercises and ensures all clinical workout template exercise names are clean base names (no set/rep prescriptions embedded in the name).

Create a public storage bucket named `feed-images` in the Supabase dashboard.

### 4. Deploy the AI trends Edge Function

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy generate-trend --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Run the app

```bash
npx expo start
```

## Exercise Library & Workout Templates

### Exercise Library

`seed.sql` seeds 200+ exercises covering all major muscle groups and movement patterns. Each exercise has a `name`, `muscle_group`, and `category` (`strength`, `cardio`, `flexibility`, `plyometric`, etc.).

### Clinical Workout Templates

36 pre-built clinical templates are defined in schema.sql (M022) across 5 speciality splits:

| Split | Templates |
|---|---|
| Metabolic & Chronic Disease | Diabetes management, cardiac rehab, COPD, obesity, hypertension, metabolic syndrome |
| Musculoskeletal & Orthopedic | Low back pain, knee rehab, shoulder rehab, arthritis, osteoporosis, hip replacement |
| Postural Deviations | Kyphosis, lordosis, scoliosis, forward head, flat feet, upper-cross syndrome |
| Neurological & Mental Health | Parkinson's, stroke recovery, MS, anxiety/depression, ADHD, chronic pain |
| Special Populations | Prenatal, postnatal, pediatric, senior mobility, cancer recovery, wheelchair users |

Template exercise names are stored as clean base names — no set/rep prescriptions (e.g. `'Battle Ropes'` not `'Battle Ropes 3×30 sec'`). The `normalizeExerciseName()` function in `app/workout/new.tsx` and `app/workout/assigned/[id].tsx` handles matching template names against the exercise library at runtime by stripping any residual qualifiers.

### Verifying Template Coverage

To check that all template exercise names resolve to an exercise in the library:

```sql
SELECT
  t.name AS template_name,
  t.split,
  e AS raw_name,
  lower(trim(e)) AS normalized,
  CASE WHEN ex.name IS NULL THEN false ELSE true END AS in_library
FROM workout_templates t,
  unnest(t.exercise_names) AS e
LEFT JOIN exercises ex ON lower(trim(ex.name)) = lower(trim(e))
WHERE t.split IN (
  'Metabolic & Chronic Disease',
  'Musculoskeletal & Orthopedic',
  'Postural Deviations',
  'Neurological & Mental Health',
  'Special Populations'
)
ORDER BY in_library, t.split, t.name;
```

## AI Trends

The **Trends** tab shows a daily AI-generated fitness summary — headline, 3 trend items with article links, a tip of the day, and sources. Summaries are cached in the `trend_summaries` Supabase table (one row per date). On first load each day the Edge Function calls Claude with web search enabled; subsequent loads return the cached row instantly.

To regenerate today's summary (e.g. after updating the Edge Function):

```sql
DELETE FROM trend_summaries WHERE date = CURRENT_DATE;
```

## Testing

```bash
npm test
```

Unit tests cover `lib/anthropic.ts` and `hooks/useFeed.ts`. The Supabase client and Edge Function invocations are mocked.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `ANTHROPIC_API_KEY` | Edge Function only | Set via `supabase secrets set` |
