# thirty60track

A personal training management app built with Expo + Supabase. Trainers manage clients, log workouts, assign programs, schedule sessions, and share content. Clients track progress, follow assigned workouts, book sessions, use an AI nutrition assistant, and stay connected via a community feed.

## Stack

- **Expo SDK 51** + Expo Router v3 (iOS, Android, Web)
- **TypeScript** strict mode
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions
- **Anthropic Claude** — AI-generated fitness trends + personalised nutrition guides + meal plans + AI chat for clients and trainers (all via Supabase Edge Functions)
- **Victory Native XL** — progress and volume charts
- **React Native StyleSheet** — luxury minimalist dark/light theme

## Features

### Trainer
- Client list with workout count and last session date
- Client detail: info, body metrics, progress charts, workout history
- **Nutrition & Diet System** — generate a personalised nutrition guide per client (calories, macros, meal timing, foods to prioritise/avoid, supplements); generate a structured weekly meal plan with per-meal macro breakdowns and a supplement schedule; configure each client's cheat meal cadence
- Log workouts (multi-exercise builder with sets/reps/weight) with per-set rest timer, estimated calorie burn per exercise, workout summary popup (total time, rest time, time under tension, total kcal), and new PR detection
- **Workout grade** — each logged workout receives an A+–F letter grade based on total volume vs the client's all-time best, percentage of exercises where a new weight PR was set, and volume vs the rolling 4-session average; displayed as a card at the top of the workout detail screen with score bars and a PR callout
- **Personal Records** — all-time best weight and reps per client per exercise; visible on the client's Progress tab; a congratulatory popup appears automatically when a workout is saved with any new PR
- Assign workout programs with scheduled dates and prescribed rest durations per exercise
- **Recurring workout series** — schedule a workout template on selected days of the week (weekly or biweekly), with optional indefinite scheduling; cancel the entire series or individual instances
- Workout template library: 36 clinical templates across 5 speciality splits (Metabolic & Chronic Disease, Musculoskeletal & Orthopedic, Postural Deviations, Neurological & Mental Health, Special Populations)
- Weekly availability management + session scheduling
- Grant or deduct session credits for any client (not limited to own clients)
- **Family account linking** — link two or more client accounts into a family group; all members can view and edit each other's progress, workouts, nutrition, and credits
- **QR check-in scanner** — scan a client's QR code to instantly log a timestamped gym visit; view full check-in history on the client's Check-ins tab
- Community feed: post, react, comment; delete any post; attach exercises, workouts, assigned workouts, or guides to any post
- AI fitness trends tab with daily summaries and article links
- **AI Training Assistant** — pinned at the top of the Messages tab; answers questions about program design, progressive overload, splits (PPL / upper-lower / full body), warm-up protocols, deload weeks, exercise substitutions, client retention, and nutrition for clients; backed by the same `nutrition-ai` Edge Function
- **Video calls** — generate an instant video call link from any conversation
- **Feature Guide** — compass-icon button at the top of the home screen opens a categorised modal listing every feature with descriptions and direct navigation links

### Client
- Home screen shows linked family members (avatar, workout count, last session) with tap-through to their full profile
- Pending assigned workouts with one-tap execution
- Log workouts and manage nutrition for linked family members
- Book sessions from trainer's availability slots
- **AI Nutrition Assistant** — pinned at the top of the Messages tab; ask for meal ideas, fast food picks, snack suggestions, recipe ideas, supplement guidance, workout recommendations, and exercise tips; answers are personalised to macro targets, dietary restrictions, and actual workout history (recent sessions, muscle group frequency, personal records); cheat meal tracker shows a banner when a cheat meal is due
- **Check-in QR code** — personal QR code on the Profile tab; show it to the trainer to log a gym visit
- Community feed: post, react, comment; attach exercises or workouts to posts
- AI fitness trends tab
- **Video calls** — tap video icon in any conversation to generate a shareable call link
- **Feature Guide** — same compass-icon button on the home screen

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
  messages/
    [id].tsx                — conversation thread
    ai.tsx                  — client AI Nutrition Assistant screen
    ai-trainer.tsx          — trainer AI Training Assistant screen
components/
  ai/
    TrainerAIChat.tsx       — trainer AI chat UI (barbell avatar, 8 quick prompts, message history)
  checkin/
    QRScannerModal          — full-screen camera scanner; validates payload, records check-in
    WebCameraView.web.tsx   — web-only camera (getUserMedia + BarcodeDetector)
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
  workout/
    WorkoutGradeCard        — A+–F letter grade card with score bars and PR callout
  ui/
    FeaturesModal           — role-aware feature guide modal (trainer / client content)
    UnsavedChangesModal     — cross-platform dirty-state back navigation popup
hooks/
  useNutritionGuide.ts      — fetch + upsert client nutrition guide
  useMealPlan.ts            — active meal plan + history
  useNutritionChat.ts       — client chat message CRUD + useNutritionSettings (cheat meal cadence)
  useTrainerAIChat.ts       — trainer AI chat message CRUD (backed by trainer_ai_messages table)
  useCheckins.ts            — useCheckins(clientId), recordCheckin()
  useClientLinks.ts         — family linking: useClientLinks, useMyLinkedClients,
                              addToFamilyGroup, removeFromFamilyGroup
  useRecurringPlans.ts      — recurring plans CRUD + generateOccurrenceDates
  useFeed.ts                — feed posts, reactions, comments, image upload, attachments
  usePersonalRecords.ts     — fetch PRs per client; checkAndSavePRs() upserts on workout save
  useTrends.ts              — useTodayTrend, useRecentTrends
  useSchedule.ts            — availability, sessions, booking
  useCredits.ts             — client credits + transactions
  useRecipes.ts             — recipe CRUD
  useFeatureGuide.ts        — AsyncStorage-backed per-user toggle for the Feature Guide button
  useAssignedWorkouts.ts
  useWorkoutGrade.ts        — fetch client history + compute letter grade for a workout
  useClients.ts / useWorkouts.ts / useClientProgress.ts
lib/
  supabase.ts               — Supabase client singleton
  auth.tsx                  — AuthProvider + useAuth
  anthropic.ts              — fetchOrGenerateTrend, generateTrendSummary
  nutritionAI.ts            — generateNutritionGuide, generateMealPlan, getNutritionChatResponse;
                              NUTRITION_AI_ENABLED flag; mock responses for nutrition + workout topics;
                              nRef() / eRef() inline encyclopedia link helpers
  trainerAI.ts              — getTrainerAIChatResponse, getTrainerMockResponse;
                              TrainerAIContext type; mock responses for training topics +
                              nutrition (reuses NUTRITION_AI_ENABLED flag)
  calorieEstimation.ts      — estimateSetKcal / estimateBlockKcal
  workoutGrading.ts         — pure grading logic: gradeWorkout(currentSets, pastWorkouts) → WorkoutGradeResult
supabase/
  schema.sql                — source-of-truth DDL (all migrations inline, M001–M038)
  seed.sql                  — exercise library (200+ exercises across all muscle groups)
  functions/
    generate-trend/         — Deno Edge Function: calls Anthropic API, returns trend JSON
    nutrition-ai/           — guide + meal plan + client chat + trainer chat
                              (deploy when NUTRITION_AI_ENABLED=true)
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

`schema.sql` includes all migrations in sequence (M001–M038):

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
| M029 | Exercise enrichment — `exercise_alternatives` join table; `muscle_group`, `equipment`, `form_notes`, and `help_url` populated for all 280+ exercises |
| M030 | Client check-ins — `client_checkins` table; QR-code-based gym visit log |
| M031 | Personal records — `personal_records` table (UNIQUE per client+exercise); auto-upserted when a workout is saved |
| M032 | Fat Loss workout templates — 4 templates (HIIT Circuit A/B, Metabolic Strength A/B) |
| M033 | Feed post attachments — `attachment_type`, `attachment_id`, `attachment_title`, `attachment_subtitle` columns on `feed_posts` |
| M034 | Extended client intake — `allergies`, `dietary_restrictions`, `training_frequency_per_week`, `typical_session_length_minutes`, `outside_gym_activity_level` |
| M035 | Nutrition guides — `nutrition_guides` table (UNIQUE per client) |
| M036 | Meal plans — `meal_plans` table; daily or weekly structured plans (JSONB) |
| M037 | Nutrition chat + settings — `nutrition_chat_messages` table; `client_nutrition_settings` table |
| M038 | Trainer AI chat — `trainer_ai_messages` table; RLS: only the owning trainer can read/write |

Create a public storage bucket named `feed-images` in the Supabase dashboard.

### 4. Deploy the Edge Functions

```bash
supabase login
supabase link --project-ref your-project-ref

# AI trends (always on)
supabase functions deploy generate-trend --no-verify-jwt

# AI nutrition + chat (client + trainer) — deploy now, enable via flag when ready
supabase functions deploy nutrition-ai --no-verify-jwt

supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Run the app

```bash
npx expo start
```

---

## AI Features

The app has three AI-powered features, all gated by a single flag:

| Feature | Who | Entry point |
|---|---|---|
| **AI Nutrition Assistant** | Clients | Messages tab → AI Nutrition Assistant |
| **AI Training Assistant** | Trainers | Messages tab → AI Training Assistant |
| **Nutrition Guide + Meal Plan generation** | Trainers | Client detail → Nutrition → Guide / Plan |
| **AI Fitness Trends** | Everyone | Feed tab → Trends segment |

AI chat features work in **mock (demo) mode** by default — all UI is fully functional without any API calls. Mock responses cover nutrition, workouts, exercise, fast food, supplements (client), and program design, progressive overload, splits, warm-up, recovery, deload, client retention, macros, and cut/bulk phases (trainer).

### Enabling AI chat and guide generation

**Step 1 — Flip the flag** in `lib/nutritionAI.ts`:

```ts
export const NUTRITION_AI_ENABLED = true;
```

This single flag controls all three features: client nutrition chat, trainer training chat, and guide/meal plan generation.

**Step 2 — Deploy the Edge Function** (if not already deployed):

```bash
supabase functions deploy nutrition-ai --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

The `nutrition-ai` function dispatches on the `action` field in the request body:

| `action` | Used by | Description |
|---|---|---|
| `generate_guide` | Trainer | Generate a personalised nutrition guide for a client |
| `generate_meal_plan` | Trainer | Generate a structured weekly meal plan |
| `chat` | Client | Nutrition + workout AI chat (personalised to client context) |
| `trainer-chat` | Trainer | Training + nutrition AI chat (personalised to trainer context) |

**Step 3 — Verify the secrets**

```bash
supabase secrets list
```

Confirm `ANTHROPIC_API_KEY` is set. The function will return a `500` error (logged to console) if the key is missing.

---

### Enabling AI Fitness Trends

The Trends tab is separately controlled.

**Step 1 — Flip the flag** in `lib/anthropic.ts`:

```ts
export const AI_TRENDS_ENABLED = true;
```

**Step 2 — Deploy the Edge Function** (if not already deployed):

```bash
supabase functions deploy generate-trend --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

On first load each day the function generates and caches the summary in `trend_summaries`. Subsequent loads return the cached row.

To regenerate today's summary (e.g. after updating the function):

```sql
DELETE FROM trend_summaries WHERE date = CURRENT_DATE;
```

---

## AI Assistants in Messages

Both AI entries are pinned at the top of the **Messages** tab, above the conversation list.

### Client — AI Nutrition Assistant

Accessible at `messages/ai`. Loaded with the client's own record, intake, nutrition guide, and last 60 workouts. Capabilities:

- Meal ideas (breakfast, lunch, dinner, snacks) aligned with macro targets
- Fast food advisor — best options at McDonald's, KFC, Subway, etc.
- Recipe suggestions — quick high-protein recipes
- Supplement guidance — dosing and timing based on the client's guide
- Workout recommendations — muscle groups to train based on recent session history
- Exercise guidance — specific exercises with progressive overload tips referenced against personal records
- Recovery advice — rest-day macros, DOMS management, sleep
- Plateau troubleshooting — microloading, double progression, deload strategies
- **Cheat meal tracker** — gold banner when a cheat meal is due; client taps Done to reset the countdown

Trainers see a settings row at the top of the Chat tab on each client's Nutrition screen to configure the cheat meal cadence (every N days).

### Trainer — AI Training Assistant

Accessible at `messages/ai-trainer`. Uses the trainer's profile and total client count as context. Capabilities:

- **Program design** — beginner templates, PPL, upper/lower, full-body splits
- **Progressive overload** — plateau-breaking techniques, double progression, volume increases
- **Warm-up protocols** — general, dynamic mobility, and activation sequences
- **Recovery and deload** — when and how to schedule deloads, DOMS management
- **Exercise substitutions** — injury modifications, no-equipment alternatives by muscle group
- **Client retention** — adherence strategies, motivation layering, habit stacking
- **Nutrition for clients** — TDEE calculation, macro setting, cut/bulk phases, supplement tiers
- All the same nutrition topics as the client assistant (meals, fast food, recipes, supplements)

---

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
- **Mechanical work component** — load × gravity × vertical displacement × reps × 2, divided by 4 184 J/kcal at 22% muscle efficiency
- **EPOC multiplier** per category: compound ×3.0, explosive/bodyweight ×2.0, isolation ×1.5

Body weight entered in the header is used; falls back to 75 kg if omitted.

On save, a **Workout Summary** sheet slides up showing:

| Stat | How it's measured |
|---|---|
| Total time | Wall-clock time from screen open to save |
| Rest time | Sum of all completed rest intervals |
| Time under tension | Total elapsed − rest |
| Estimated kcal | Sum of all set estimates across every exercise block |

Any new personal records broken in the workout are listed below the stats.

## Workout Grade

Every logged workout receives a letter grade (A+–F) displayed as a card directly below the date/metrics header on the workout detail screen.

**Score components (0–100 each):**

| Component | Weight | What it measures |
|---|---|---|
| Volume vs best | 40% | Today's total volume (kg × reps) ÷ all-time best workout |
| PRs hit | 30% | % of exercises where you beat your all-time max weight |
| vs Recent avg | 30% | Today's volume ÷ rolling 4-session average |

**Grade scale:** A+ (97+) · A (93+) · A- (90+) · B+ (87+) · B (83+) · B- (80+) · C+ (77+) · C (73+) · C- (70+) · D+ (67+) · D (60+) · F

The card shows three score bars with icons, a volume stat strip (Today / Best / Avg-4), and a PR callout listing which exercises hit new bests. When a client has fewer than 2 past workouts the card displays "(building history…)" and shifts weight toward the PR component.

Duration-only and reps-only exercises (no weight data) are handled gracefully — the grade falls back to neutral scores for the volume components.

**Implementation:** `lib/workoutGrading.ts` (pure scoring, no React), `hooks/useWorkoutGrade.ts` (Supabase history fetch), `components/workout/WorkoutGradeCard.tsx` (UI).

## Assigned Workout Execution — Prescribed Rest Timers

When a trainer assigns a workout they can set a **rest duration per exercise** (presets: 0 s / 30 s / 1 / 1.5 / 2 / 2.5 / 3 min) using the rest row below each exercise block. The `rest_seconds` value is stored on `assigned_workout_exercises`.

During client execution (`workout/assigned/complete/[id].tsx`) each exercise block shows:

- A **Rest: M:SS** label above the column headers indicating the prescribed rest
- A timer button on every set row — tapping starts a countdown from the prescribed duration
- Vibration and a toast when the timer completes
- Multiple timers can run concurrently

## Personal Records

The `personal_records` table stores the all-time best weight and best reps per client per exercise (`UNIQUE(client_id, exercise_id)`). Records are upserted automatically when a workout is saved — only improvements update the row.

**Progress tab** — a Personal Records card above the time-range selector lists every exercise with gold weight badges and blue reps badges. A lbs/kg toggle adjusts the display unit. Long lists collapse to the top 5 with a "Show all N records" button.

**Post-save popup** — if any PR was broken, the Workout Summary sheet highlights it with the previous best and new value.

## Client Check-In (QR Code)

Trainers scan a client's QR code at the gym to log a timestamped visit.

**Client side** — the **Profile** tab displays a personal QR code encoding `{ type: "thirty60_checkin", clientId }`.

**Trainer side** — the **Profile** tab has a **Scan Client Check-In** button that opens a full-screen camera view. On native it uses `expo-camera`; on mobile web it uses a custom `WebCameraView` component built on `navigator.mediaDevices.getUserMedia` and `BarcodeDetector`. A gold targeting reticle guides the scan; a flip-camera button lets the trainer switch between front and rear.

**Check-ins tab** — each client's detail screen has a **Check-ins** tab showing a reverse-chronological list of every logged visit.

**RLS:** trainers have full access to check-in rows they created; clients can read their own rows only.

## Video Calls in Messaging

Any conversation screen has a video-camera button in the input bar. Tapping it:

1. Generates a unique [Jitsi Meet](https://meet.jit.si) room URL (`https://meet.jit.si/thirty60-xxxx-xxxx`) — no account or API key required.
2. Pre-populates the message field with `"Join my video call: <url>"` so the sender can edit before sending.
3. The recipient sees the URL as a tappable underlined link that opens in the system browser.

> Jitsi Meet is used because Google Meet requires OAuth + Google Calendar API to pre-generate a joinable room URL client-side.

## Exercise Library & Workout Templates

### Exercise Library

`seed.sql` seeds 200+ exercises covering all major muscle groups and movement patterns. Each exercise has a `name`, `muscle_group`, `equipment`, `category`, `form_notes`, and `help_url` (verified YouTube tutorial link).

Migration M029 enriched all 280+ exercises with muscle group, equipment, form notes, YouTube URLs, and bidirectional `exercise_alternatives` links.

#### Verifying / refreshing YouTube links

```bash
# 1. Clear unverified URLs
#    Run supabase/migration_029c_clear_bad_urls.sql in the Supabase SQL editor

# 2. Re-fetch verified links (requires a free YouTube Data API v3 key)
node scripts/fetch-youtube-ids.js <YOUR_API_KEY>

# 3. Apply the generated SQL
#    Run supabase/migration_029c_youtube_urls.sql in the Supabase SQL editor
```

### Clinical Workout Templates

40 pre-built templates across 6 splits:

| Split | Templates |
|---|---|
| Fat Loss | HIIT Circuit A/B, Metabolic Strength A/B |
| Metabolic & Chronic Disease | Diabetes management, cardiac rehab, COPD, obesity, hypertension, metabolic syndrome |
| Musculoskeletal & Orthopedic | Low back pain, knee rehab, shoulder rehab, arthritis, osteoporosis, hip replacement |
| Postural Deviations | Kyphosis, lordosis, scoliosis, forward head, flat feet, upper-cross syndrome |
| Neurological & Mental Health | Parkinson's, stroke recovery, MS, anxiety/depression, ADHD, chronic pain |
| Special Populations | Prenatal, postnatal, pediatric, senior mobility, cancer recovery, wheelchair users |

## Nutrition & Diet System

The **Nutrition** tab on every client detail screen has four segments: **Log | Guide | Plan | Ref**.

### Extended Client Intake

New client form and client detail screen both include:

- **Health Restrictions** — allergies and dietary restrictions
- **Training Volume** — sessions per week, session length, activity level outside the gym

These fields are stored in `client_intake` and surfaced in the health warning banner at the top of the client detail screen.

### Nutrition Guide

Trainers generate a personalised nutrition guide per client from the **Guide** tab covering calorie/macro targets, meal timing, foods to prioritise/avoid, and supplement recommendations with tappable Nutrition Encyclopedia links.

### Meal Plan

Structured weekly meal plan with named meals, per-meal macro breakdowns, supplement schedule, and swap suggestions. Generating a new plan auto-deactivates the previous one.

### Nutrition Encyclopedia (Ref)

Reference tab covering macronutrients, vitamins, minerals, and specialty supplements — all with inline Wikipedia/PubMed citations.

> **AI guide and meal plan generation is disabled by default.** See [Enabling AI chat and guide generation](#enabling-ai-chat-and-guide-generation) above.

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
| `ANTHROPIC_API_KEY` | Edge Function only | Set via `supabase secrets set` — used by both `nutrition-ai` and `generate-trend` |
