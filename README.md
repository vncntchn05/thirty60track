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
- **Recurring workout series** — schedule a workout template on selected days of the week (weekly or biweekly), with optional indefinite scheduling; cancel the entire series or individual instances
- Workout template library: 36 clinical templates across 5 speciality splits (Metabolic & Chronic Disease, Musculoskeletal & Orthopedic, Postural Deviations, Neurological & Mental Health, Special Populations)
- Weekly availability management + session scheduling
- Grant or deduct session credits for any client (not limited to own clients)
- **Family account linking** — link two or more client accounts into a family group; all members can view and edit each other's progress, workouts, nutrition, and credits
- Community feed: post, react, comment; delete any post
- AI fitness trends tab with daily summaries and article links

### Client
- Home screen shows linked family members (avatar, workout count, last session) with tap-through to their full profile
- Pending assigned workouts with one-tap execution
- Log workouts and manage nutrition for linked family members
- Book sessions from trainer's availability slots
- Community feed: post, react, comment
- AI fitness trends tab

## Project Structure

```
app/
  (auth)/                   — login (public)
  (tabs)/                   — trainer tab navigator
  (client)/                 — client tab navigator
  workout/
    new.tsx                 — log or assign a workout
    [id].tsx                — view/edit a logged workout
    assigned/[id].tsx       — edit an assigned workout
    assigned/complete/[id]  — execute an assigned workout
    recurring/new.tsx       — create a recurring workout series
  client/                   — client detail + new client form
components/
  feed/                     — PostCard, PostComposer, CommentSheet, TrendCard
  feed/FeedScreen           — shared Community + Trends screen (trainer + client)
  schedule/
    CalendarStrip           — week strip with session dots
    SessionSheet            — session detail (confirm / cancel / complete)
    AvailabilitySheet       — trainer recurring availability slots
    TrainerBookingSheet     — trainer-side session booking flow
    BookingSheet            — client-side session booking flow
    RecurringPickerSheet    — client picker → navigate to recurring/new
  nutrition/                — RecipeBuilderModal, AddFoodModal
  exercises/                — WorkoutGuides, EncyclopediaPanel, MuscleMap
  charts/                   — VolumeChart, ExerciseProgressChart
hooks/
  useClientLinks.ts         — family linking: useClientLinks, useMyLinkedClients,
                              addToFamilyGroup, removeFromFamilyGroup
  useRecurringPlans.ts      — recurring plans: useRecurringPlansForClient,
                              createRecurringPlan, cancelRecurringPlan,
                              cancelRecurringInstance, generateOccurrenceDates
  useFeed.ts                — feed posts, reactions, comments, image upload
  useTrends.ts              — useTodayTrend, useRecentTrends
  useSchedule.ts            — availability, sessions, booking
  useCredits.ts             — client credits + transactions
  useRecipes.ts             — recipe CRUD
  useAssignedWorkouts.ts
  useClients.ts / useWorkouts.ts / useClientProgress.ts
lib/
  supabase.ts               — Supabase client singleton
  auth.tsx                  — AuthProvider + useAuth
  anthropic.ts              — fetchOrGenerateTrend, generateTrendSummary
supabase/
  schema.sql                — source-of-truth DDL (all migrations inline, M001–M028)
  seed.sql                  — exercise library (200+ exercises across all muscle groups)
  functions/
    generate-trend/         — Deno Edge Function: calls Anthropic API, returns trend JSON
types/
  database.ts               — manual TS types mirroring schema
constants/
  theme.ts                  — color, spacing, typography tokens + useTheme()
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

`schema.sql` includes all migrations in sequence (M001–M028):

| Migration | Description |
|---|---|
| M001–M012 | Core schema: trainers, clients, workouts, exercises, body metrics, auth linking |
| M013 | Assigned workouts (trainer-to-client workout programs) |
| M014–M015 | Nutrition logging + goals |
| M016 | Scheduling + session credits |
| M017 | Recipes + recipe ingredients |
| M018 | Workout guides (trainer-editable encyclopaedia) |
| M019–M022 | Media gallery, messaging, favourites, clinical workout templates |
| M023–M025 | Community feed, AI trend summaries, exercise library expansion (200+) |
| M026 | Cross-trainer credit adjustments — any trainer can grant/deduct credits |
| M027 | Family account linking — `client_links` table, `is_linked_to_client()` helper, linked-client SELECT + full write policies across 14 tables |
| M027b | Linked-client write access (workouts, workout_sets, recipes, nutrition_goals) |
| M027c | Any trainer can delete family links (needed for mesh unlinking) |
| M028 | Recurring workout plans — `recurring_plans` table; `assigned_workouts` gains `recurring_plan_id` and `'cancelled'` status |

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

## Family Account Linking

Trainers can link two or more client accounts into a family group from the **Family** tab on any client's detail screen. Once linked:

- Each client's home screen shows avatar cards for their family members; tapping through opens the full trainer-style detail view
- Linked clients can view **and edit** each other's progress, workouts, nutrition logs, recipes, and credits
- Linking is full-mesh — adding a third member to an existing pair automatically links them to all existing members
- Unlinking removes a client from the entire group; all their family links are cleared, and remaining members' links to each other are untouched

**RLS implementation:** A `is_linked_to_client(target_id UUID)` SECURITY DEFINER function checks the `client_links` table. Policies on 14 tables grant linked clients the same read/write access a trainer has for those clients.

## Recurring Workouts

Trainers create recurring series from the **Schedule** tab (Recurring FAB) or from a client's **Workouts** tab (+ New in the Recurring Series section).

The creation screen lets you configure:

- **Title + notes** for the series
- **Days of week** — pill checkboxes (Mon–Sun)
- **Frequency** — Weekly or Biweekly
- **Schedule dates** — start date + either an end date or **No end date** (indefinite)
- **Exercise builder** — same multi-set blocks as the standard workout logger

When saved, the app generates one `assigned_workout` row per occurrence (up to 1 year ahead for indefinite series) and links each to the `recurring_plans` record via `recurring_plan_id`.

Trainers can then:
- **Cancel the full series** — marks all future `assigned` instances as `cancelled`
- **Cancel a single instance** — tap the × on any upcoming row; other instances are untouched
- **Edit a single instance** — tap the row to open the standard assigned-workout editor

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

Template exercise names are stored as clean base names — no set/rep prescriptions (e.g. `'Battle Ropes'` not `'Battle Ropes 3×30 sec'`). The `normalizeExerciseName()` function in `app/workout/new.tsx` and `app/workout/assigned/[id].tsx` handles matching template names against the exercise library at runtime.

### Verifying Template Coverage

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

> **Status: disabled by default.** The feature is gated by `AI_TRENDS_ENABLED` in `lib/anthropic.ts`, which is set to `false`. The Trends tab will show an "AI Trends unavailable" placeholder until it is re-enabled.

### Re-enabling AI Trends

**Step 1 — Flip the flag**

In `lib/anthropic.ts`, change:

```ts
export const AI_TRENDS_ENABLED = false;
```

to:

```ts
export const AI_TRENDS_ENABLED = true;
```

**Step 2 — Deploy the Edge Function** (first time only)

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy generate-trend --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

**Step 3 — Run the app**

On first load each day the Edge Function generates and caches the summary. Subsequent loads return the cached row instantly.

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
