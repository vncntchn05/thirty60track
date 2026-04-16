# thirty60track

A personal training management app built with Expo + Supabase. Trainers manage clients, log workouts, assign programs, schedule sessions, and share content. Clients track progress, follow assigned workouts, book sessions, use an AI nutrition assistant, and stay connected via a community feed.

## Stack

- **Expo SDK 51** + Expo Router v3 (iOS, Android, Web)
- **TypeScript** strict mode
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions
- **Anthropic Claude** — AI-generated fitness trends + personalised nutrition guides + meal plans + AI chat (all via Supabase Edge Functions)
- **Victory Native XL** — progress and volume charts
- **React Native StyleSheet** — luxury minimalist dark/light theme

## Features

### Trainer
- Client list with workout count and last session date
- Client detail: info, body metrics, progress charts, workout history
- **Nutrition & Diet System** — generate a personalised nutrition guide per client (calories, macros, meal timing, foods to prioritise/avoid, supplements); generate a structured weekly meal plan with per-meal macro breakdowns and a supplement schedule; configure each client's cheat meal cadence
- Log workouts (multi-exercise builder with sets/reps/weight) with per-set rest timer, estimated calorie burn per exercise, workout summary popup (total time, rest time, time under tension, total kcal), and new PR detection
- **Personal Records** — all-time best weight and reps per client per exercise; visible on the client's Progress tab; a congratulatory popup appears automatically when a workout is saved with any new PR
- Assign workout programs with scheduled dates and prescribed rest durations per exercise
- **Recurring workout series** — schedule a workout template on selected days of the week (weekly or biweekly), with optional indefinite scheduling; cancel the entire series or individual instances
- Workout template library: 36 clinical templates across 5 speciality splits (Metabolic & Chronic Disease, Musculoskeletal & Orthopedic, Postural Deviations, Neurological & Mental Health, Special Populations)
- Weekly availability management + session scheduling
- Grant or deduct session credits for any client (not limited to own clients)
- **Family account linking** — link two or more client accounts into a family group; all members can view and edit each other's progress, workouts, nutrition, and credits
- **QR check-in scanner** — scan a client's QR code to instantly log a timestamped gym visit; view full check-in history on the client's Check-ins tab. On mobile web the scanner uses the device's rear camera by default with a flip-camera button; camera access is handled via native browser APIs (`getUserMedia` + `enumerateDevices`) for reliable cross-platform behaviour
- Community feed: post, react, comment; delete any post; attach exercises, workouts, assigned workouts, or guides to any post
- AI fitness trends tab with daily summaries and article links
- **Video calls** — generate an instant video call link from any conversation; link is sent as a pre-populated message the trainer can edit before sending
- **Feature Guide** — compass-icon button at the top of the home screen opens a categorised modal listing every feature with descriptions and direct navigation links; toggled on/off per account from the Profile tab

### Client
- Home screen shows linked family members (avatar, workout count, last session) with tap-through to their full profile
- Pending assigned workouts with one-tap execution
- Log workouts and manage nutrition for linked family members
- Book sessions from trainer's availability slots
- **AI Nutrition Assistant** — ask the assistant for meal ideas, fast food picks, snack suggestions, recipe ideas, supplement guidance, workout recommendations, and exercise tips; answers are personalised to macro targets, dietary restrictions, and actual workout history (recent sessions, muscle group frequency, personal records); cheat meal tracker shows a banner when a cheat meal is due
- **Check-in QR code** — personal QR code on the Profile tab; show it to the trainer to log a gym visit
- Community feed: post, react, comment; attach exercises or workouts to posts
- AI fitness trends tab
- **Video calls** — tap video icon in any conversation to generate a shareable call link
- **Feature Guide** — same compass-icon button on the home screen; toggled on/off from the Profile tab

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
  checkin/
    QRScannerModal          — full-screen camera scanner; on native uses expo-camera, on web
                              uses WebCameraView (getUserMedia + BarcodeDetector); validates
                              payload, looks up client, records check-in, shows result
    WebCameraView.web.tsx   — web-only camera using enumerateDevices for reliable rear/front
                              selection; scans via BarcodeDetector requestAnimationFrame loop
    WebCameraView.tsx       — native stub (returns null)
  feed/                     — PostCard, PostComposer, CommentSheet, TrendCard
  feed/FeedScreen           — shared Community + Trends screen (trainer + client)
  messaging/                — MessagesScreen, ConversationCard, AttachmentPickerModal,
                              NewConversationModal
  schedule/
    CalendarStrip           — week strip with session dots
    SessionSheet            — session detail (confirm / cancel / complete)
    AvailabilitySheet       — trainer recurring availability slots
    TrainerBookingSheet     — trainer-side session booking flow
    BookingSheet            — client-side session booking flow
    RecurringPickerSheet    — client picker → navigate to recurring/new
  nutrition/                — NutritionGuide, MealPlanView, NutritionChat,
                              RecipeBuilderModal, AddFoodModal
  exercises/                — WorkoutGuides, EncyclopediaPanel, MuscleMap
  charts/                   — VolumeChart, ExerciseProgressChart
  ui/
    FeaturesModal           — role-aware feature guide modal (trainer / client content);
                              19 trainer features + 16 client features with direct nav links
    UnsavedChangesModal     — cross-platform popup (Modal, not Alert) for dirty-state back
                              navigation; Discard / Save / Keep Editing; used across all
                              screens with dirty tracking
hooks/
  useNutritionGuide.ts      — fetch + upsert client nutrition guide
  useMealPlan.ts            — active meal plan + history; savePlan auto-deactivates previous
  useNutritionChat.ts       — chat message CRUD + useNutritionSettings (cheat meal cadence)
  useCheckins.ts            — useCheckins(clientId), recordCheckin()
  useClientLinks.ts         — family linking: useClientLinks, useMyLinkedClients,
                              addToFamilyGroup, removeFromFamilyGroup
  useRecurringPlans.ts      — recurring plans: useRecurringPlansForClient,
                              createRecurringPlan, cancelRecurringPlan,
                              cancelRecurringInstance, generateOccurrenceDates
  useFeed.ts                — feed posts, reactions, comments, image upload, attachments
  usePersonalRecords.ts     — fetch PRs per client; checkAndSavePRs() upserts on workout save
  useTrends.ts              — useTodayTrend, useRecentTrends
  useSchedule.ts            — availability, sessions, booking
  useCredits.ts             — client credits + transactions
  useRecipes.ts             — recipe CRUD
  useFeatureGuide.ts        — AsyncStorage-backed per-user toggle for the Feature Guide button
  useAssignedWorkouts.ts
  useClients.ts / useWorkouts.ts / useClientProgress.ts
lib/
  supabase.ts               — Supabase client singleton
  auth.tsx                  — AuthProvider + useAuth
  anthropic.ts              — fetchOrGenerateTrend, generateTrendSummary
  nutritionAI.ts            — generateNutritionGuide, generateMealPlan, getNutritionChatResponse;
                              NUTRITION_AI_ENABLED flag; mock responses for nutrition + workout topics;
                              WorkoutHistorySummary/PersonalRecordSummary/WorkoutStatsContext types;
                              isCheatMealDue(); getMockChatResponse(message, context?)
  calorieEstimation.ts      — estimateSetKcal / estimateBlockKcal; MET + mechanical work
                              formula with EPOC multipliers per exercise category
supabase/
  schema.sql                — source-of-truth DDL (all migrations inline, M001–M037)
  seed.sql                  — exercise library (200+ exercises across all muscle groups)
  functions/
    generate-trend/         — Deno Edge Function: calls Anthropic API, returns trend JSON
    nutrition-ai/           — (deploy when NUTRITION_AI_ENABLED=true) guide + meal plan + chat
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

`schema.sql` includes all migrations in sequence (M001–M037):

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
| M029 | Exercise enrichment — `exercise_alternatives` join table; `muscle_group`, `equipment`, `form_notes`, and `help_url` populated for all 280+ exercises; YouTube tutorial URLs verified via `scripts/fetch-youtube-ids.js` |
| M030 | Client check-ins — `client_checkins` table; QR-code-based gym visit log with trainer scanner and per-client history |
| M031 | Personal records — `personal_records` table (UNIQUE per client+exercise); auto-upserted when a workout is saved; PRs surface on the Progress tab and trigger a post-save popup |
| M032 | Fat Loss workout templates — 4 templates (HIIT Circuit A/B, Metabolic Strength A/B) under a new Fat Loss split; keyword-matched to fat/weight-loss goals in the Suggested tab |
| M033 | Feed post attachments — `attachment_type`, `attachment_id`, `attachment_title`, `attachment_subtitle` columns on `feed_posts`; tappable attachment cards in PostCard navigate to the referenced resource |
| M034 | Extended client intake — `allergies`, `dietary_restrictions`, `training_frequency_per_week`, `typical_session_length_minutes`, `outside_gym_activity_level` columns on `client_intake` |
| M035 | Nutrition guides — `nutrition_guides` table (UNIQUE per client); stores AI-generated or custom JSONB guide |
| M036 | Meal plans — `meal_plans` table; daily or weekly structured plans (JSONB) with per-meal macros and supplement schedules |
| M037 | Nutrition chat + settings — `nutrition_chat_messages` table; `client_nutrition_settings` table (cheat meal cadence per client) |

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

## Workout Logger — Rest Timer, Calories & Summary

Every set row in Log mode has a rest timer button to the right of the weight/reps fields.

- **Default rest** is 2 minutes; presets (0 s / 30 s / 1 / 1.5 / 2 / 2.5 / 3 min) are shown at the top of the builder and update the default for new timers.
- Tapping the button starts a countdown. The active timer shows the remaining time and turns gold; a completed timer shows a checkmark in green.
- When a timer reaches zero the device vibrates and a brief toast notification appears above the save button.
- Multiple timers can run concurrently (one per set).

**Calorie estimation** — as sets are filled in, a `~X kcal` badge appears next to the Add Set button for each exercise block. The estimate uses a combined formula:

- **MET component** (net metabolic cost above rest) — MET values by category: compound lifts 5.0, isolation 3.0, bodyweight/calisthenics 3.8, explosive/Olympic 7.0
- **Mechanical work component** — load × gravity × vertical displacement × reps × 2, divided by 4 184 J/kcal at 22% muscle efficiency; displacement is looked up by exercise name (squat 0.55 m, deadlift 0.50 m, bench 0.35 m, curl 0.30 m, etc.)
- **EPOC multiplier** per category to account for post-set elevated metabolism: compound ×3.0, explosive/bodyweight ×2.0, isolation ×1.5

Body weight entered in the header is used; falls back to 75 kg if omitted.

On save, a **Workout Summary** sheet slides up showing:

| Stat | How it's measured |
|---|---|
| Total time | Wall-clock time from screen open to save |
| Rest time | Sum of all completed rest intervals |
| Time under tension | Total elapsed − rest (clock starts when the first exercise block is added) |
| Estimated kcal | Sum of all set estimates across every exercise block |

Any new personal records broken in the workout are listed below the stats with the previous best and the new value.

## Assigned Workout Execution — Prescribed Rest Timers

When a trainer assigns a workout they can set a **rest duration per exercise** (presets: 0 s / 30 s / 1 / 1.5 / 2 / 2.5 / 3 min) using the rest row below each exercise block in the assign builder. The `rest_seconds` value is stored on `assigned_workout_exercises`.

During client execution (`workout/assigned/complete/[id].tsx`) each exercise block shows:

- A **Rest: M:SS** label above the column headers indicating the prescribed rest
- A timer button on every set row — tapping starts a countdown from the prescribed duration
- Vibration and a toast when the timer completes
- Multiple timers can run concurrently

## Personal Records

The `personal_records` table stores the all-time best weight and best reps per client per exercise (`UNIQUE(client_id, exercise_id)`). Records are upserted automatically when a workout is saved — only improvements update the row.

**Progress tab** — a Personal Records card above the time-range selector lists every exercise with gold weight badges and blue reps badges. A lbs/kg toggle adjusts the display unit. Long lists collapse to the top 5 with a "Show all N records" button.

**Post-save popup** — if any PR was broken, the Workout Summary sheet highlights it with the previous best and new value so the trainer can celebrate the moment with the client.

## Client Check-In (QR Code)

Trainers scan a client's QR code at the gym to log a timestamped visit.

**Client side** — the **Profile** tab displays a personal QR code. The code encodes a JSON payload `{ type: "thirty60_checkin", clientId }` so only valid app codes are accepted.

**Trainer side** — the **Profile** tab has a **Scan Client Check-In** button that opens a full-screen camera view. On native it uses `expo-camera`; on mobile web it uses a custom `WebCameraView` component built on `navigator.mediaDevices.getUserMedia` and `BarcodeDetector` for reliable rear-camera access and QR detection. A gold targeting reticle guides the scan; a flip-camera button lets the trainer switch between front and rear. After a successful scan the trainer sees a confirmation with the client's name; tapping **Scan Another** immediately starts the next scan.

**Check-ins tab** — each client's detail screen has a **Check-ins** tab showing a reverse-chronological list of every logged visit: date, time, and optional note.

**RLS:** trainers have full access to check-in rows they created (`trainer_id = auth.uid()`); clients can read their own rows only.

## Video Calls in Messaging

Any conversation screen has a video-camera button in the input bar. Tapping it:

1. Generates a unique [Jitsi Meet](https://meet.jit.si) room URL (`https://meet.jit.si/thirty60-xxxx-xxxx`) — no account or API key required.
2. Pre-populates the message field with `"Join my video call: <url>"` so the sender can edit before sending.
3. The recipient sees the URL as a tappable underlined link that opens in the system browser.

Any other URL pasted into a message is also rendered as a tappable link.

> Jitsi Meet is used because Google Meet requires OAuth + Google Calendar API to pre-generate a joinable room URL client-side.

## Exercise Library & Workout Templates

### Exercise Library

`seed.sql` seeds 200+ exercises covering all major muscle groups and movement patterns. Each exercise has a `name`, `muscle_group`, `equipment`, `category`, `form_notes`, and `help_url` (verified YouTube tutorial link).

Migration M029 enriched all 280+ exercises in the live library with:
- **muscle_group** — primary muscle targeted
- **equipment** — Barbell / Dumbbell / Cable / Machine / Bodyweight / Kettlebell / Band / Other
- **form_notes** — 2–5 cue bullet points covering setup, execution, and common errors
- **help_url** — YouTube tutorial URL verified against the exercise name via `scripts/fetch-youtube-ids.js` (YouTube Data API v3)
- **exercise_alternatives** — bidirectional join table linking similar exercises (e.g. Bench Press ↔ Dumbbell Press); shown on the exercise detail screen

#### Verifying / refreshing YouTube links

```bash
# 1. Clear unverified URLs
#    Run supabase/migration_029c_clear_bad_urls.sql in the Supabase SQL editor

# 2. Re-fetch verified links (requires a free YouTube Data API v3 key)
node scripts/fetch-youtube-ids.js <YOUR_API_KEY>

# 3. Apply the generated SQL
#    Run supabase/migration_029c_youtube_urls.sql in the Supabase SQL editor
```

The script reads all exercises from the CSV export, verifies existing URLs using `videos.list` (1 quota unit per 50 videos), and replaces any whose video title doesn't match the exercise name via `search.list`. Use `--max-searches N` to stay within the 10 000 units/day free-tier cap (default: 80 searches).

### Clinical Workout Templates

40 pre-built templates are defined in schema.sql (M022, M032) across 6 splits:

| Split | Templates |
|---|---|
| Fat Loss | HIIT Circuit A/B, Metabolic Strength A/B |
| Metabolic & Chronic Disease | Diabetes management, cardiac rehab, COPD, obesity, hypertension, metabolic syndrome |
| Musculoskeletal & Orthopedic | Low back pain, knee rehab, shoulder rehab, arthritis, osteoporosis, hip replacement |
| Postural Deviations | Kyphosis, lordosis, scoliosis, forward head, flat feet, upper-cross syndrome |
| Neurological & Mental Health | Parkinson's, stroke recovery, MS, anxiety/depression, ADHD, chronic pain |
| Special Populations | Prenatal, postnatal, pediatric, senior mobility, cancer recovery, wheelchair users |

Fat Loss templates appear in the **Suggested** tab automatically when a client's goals mention fat loss, weight loss, burning fat, HIIT, cardio, or related keywords.

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

## Nutrition & Diet System

The **Nutrition** tab on every client detail screen has five segments: **Log | Guide | Plan | Chat | Ref**.

### Extended Client Intake

The new client form and the client detail Progress tab both include two new sections:

- **Health Restrictions** — allergies and dietary restrictions (e.g. no gluten, lactose intolerant, diabetic)
- **Training Volume** — sessions per week, session length (minutes), activity level outside the gym

These fields are stored in `client_intake` and surfaced in the health warning banner at the top of the client detail screen (alongside existing injuries and chronic conditions).

### Nutrition Guide

Trainers generate a personalised nutrition guide per client from the **Guide** tab. The guide is derived from the client's intake data (goals, restrictions, training volume, body metrics) and covers:

- **Daily calorie and macro targets** — protein, carbs, and fat targets in grams
- **Meal timing** — guidance relative to training sessions
- **Foods to prioritise and avoid** — tailored to dietary restrictions and goals
- **Supplement recommendations** — name, dose, timing; macro and supplement names are tappable and open the relevant entry in the Nutrition Encyclopedia

Trainers can regenerate the guide at any time or manually edit the notes section. The guide is read-only for clients.

> **AI generation is disabled by default** (`NUTRITION_AI_ENABLED = false` in `lib/nutritionAI.ts`). When disabled, a deterministic mock guide is returned so the UI is fully testable. To enable live generation, deploy the `nutrition-ai` Edge Function and flip the flag (see below).

### Meal Plan

Trainers generate a structured weekly meal plan from the **Plan** tab. Each plan includes:

- Named meals per day (Breakfast, Lunch, Dinner, Pre-workout Snack, Evening Snack) with per-meal macro breakdowns
- A supplement schedule (Morning / Pre-workout / Post-workout / Night)
- Swap suggestions for common dietary restrictions

Generating a new plan automatically deactivates the previous one. Clients can view their current active plan.

### AI Nutrition Assistant

Clients access the AI chat from the **Chat** tab. Capabilities:

- **Meal ideas** — breakfast, lunch, dinner, snack suggestions aligned with macro targets
- **Fast food advisor** — best options at McDonald's, KFC, Subway, etc. within calorie targets
- **Recipe suggestions** — quick high-protein recipes
- **Supplement guidance** — dosing and timing based on the client's guide
- **Workout recommendations** — suggests which muscle groups to train based on recent session history; provides peri-workout nutrition advice
- **Exercise guidance** — recommends specific exercises with progressive overload tips; references the client's personal records as benchmarks
- **Recovery advice** — flags high training frequency, rest-day macro adjustments, and DOMS remedies
- **Plateau troubleshooting** — microloading, double progression, and deload strategies personalised to the client's PRs
- **Cheat meal tracker** — a gold banner appears when a cheat meal is due; the client taps Done to mark it used and reset the countdown

**Workout context** — on mount, the chat fetches the client's last 60 workouts (exercise names + muscle groups + sets + estimated volume) and builds three context objects passed to the AI on every message:
- `recent_workouts` — per-session summaries (exercises, muscle groups, total sets, estimated volume)
- `personal_records` — all-time best weight and reps per exercise
- `workout_stats` — total workouts, avg sessions/week, most/least trained muscles, days since last workout

This lets the assistant give recommendations grounded in actual training history rather than generic advice.

Trainers see a settings row at the top of the Chat tab to configure the **cheat meal cadence** (every N days) per client. A dot badge on the Chat segment indicates when a cheat meal is due for the viewing client.

> Same flag as above: `NUTRITION_AI_ENABLED = false` returns keyword-matched mock responses for both nutrition and workout/exercise topics. All UI is fully functional in mock mode.

### Enabling AI Nutrition Features

**Step 1 — Flip the flag**

In `lib/nutritionAI.ts`:

```ts
export const NUTRITION_AI_ENABLED = true;
```

**Step 2 — Deploy the Edge Function**

```bash
supabase functions deploy nutrition-ai --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The `nutrition-ai` function handles three actions (`generate_guide`, `generate_meal_plan`, `chat`) dispatched via the `action` field in the request body.

---

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
