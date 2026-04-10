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
- Weekly availability management + session scheduling
- Grant session credits to clients
- Community feed: post, react, comment, delete any post
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
  seed.sql          — exercise library (30 exercises)
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
