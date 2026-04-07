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

### Authentication
- [x] Email/password login via Supabase Auth
- [x] Auth gate in root layout (redirects unauthenticated users)
- [x] Auto-create trainer profile on signup (DB trigger)
- [x] Sign out from profile screen
- [x] **Role-based routing** — role inferred from DB on login; client and trainer accounts use separate navigators automatically
- [x] **Signup role toggle** — client/trainer toggle on signup only; login is role-agnostic
- [x] **Client signup flow** — trainers add clients by email; clients sign up and are auto-linked to their profile via a `SECURITY DEFINER` RPC (`link_client_to_auth_user`) that bypasses the RLS catch-22 where `auth.uid() = auth_user_id` is always false when `auth_user_id IS NULL`
- [x] **Existing-account recovery on signup** — if a client already has a Supabase auth user (e.g. from a previous failed attempt), signup silently signs them in with the provided password and completes linking; if the password is wrong a generic "account exists" error is shown
- [x] **Rate limit handling** — exponential backoff on 429 token refresh errors; friendly error message when signup email is rate-limited
- [x] **Auth recovery** — if a client account exists but `auth_user_id` was never written (signup race condition), the next sign-in auto-links the account via the `link_client_to_auth_user` RPC
- [x] **Change Password (in-app)** — trainers and clients can change their password directly from the Profile screen; a modal collects the current password (verified via re-authentication), new password, and confirmation; no email involved

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
- [x] **Linked client indicator** — a green checkmark appears next to the client's name in the client list when the client has signed up and linked their account (`auth_user_id` is populated); unlinked clients show no indicator

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

### Scheduling & Availability

- [x] **Trainer availability** — trainers set recurring weekly slots or one-off specific-date slots with arbitrary start/end times; managed from the Schedule tab via the Availability FAB; start/end times selected via vertical drum-roll scroll pickers; expired specific-date slots (past dates) are automatically hidden from the list
- [x] **Edit availability** — pencil icon on each slot row opens the add form pre-populated with the existing slot's data; saving routes to an update rather than an insert; changes are reflected immediately for all users (trainer schedule screen, client booking sheet) via Supabase Realtime
- [x] **Weekly timetable** — full-screen 7-day grid (8 AM–8 PM) that fills the available height without scrolling; faint gold bands show trainer availability windows; session blocks are colour-coded by status (red = pending, green = confirmed, gold = completed); "now" red line on today's column; today's column has a subtle gold tint
- [x] **Week navigation** — prev/next chevrons plus a tap-to-open week picker modal; week picker shows session dots on dates that have sessions
- [x] **Trainer selector** — when multiple trainers exist, a horizontal chip strip above the timetable lets any trainer view a colleague's schedule; the Availability FAB is hidden when viewing another trainer's schedule
- [x] **Client booking** — sequential drum-roll picker flow: pick month → pick date (only months/dates with availability shown) → pick time → confirm; each time step includes a 30 min / 60 min duration toggle; gold = affordable, amber outline = can't afford; opens as a transparent bottom-sheet popup (not a new page); availability updates appear in real time without reopening the sheet
- [x] **Trainer booking** — same drum-roll picker flow as client booking; date and time are unrestricted (all 60 upcoming days, all 15-min slots from 6 AM–10 PM) regardless of availability settings; opens as a bottom-sheet popup
- [x] **Session management** — trainers can confirm, cancel, or mark sessions complete directly from the timetable; clients can view or cancel their own sessions; credits are deducted on confirm and refunded on trainer-initiated cancel of a confirmed session
- [x] **Client schedule segment** — the client Workouts tab has a "Schedule" segment showing the same full-screen timetable with availability bands and session blocks; includes a "Book Session" FAB and the credit balance pill (`★ Credits: N`) in the week nav bar
- [x] **Schedule tab deep-link** — tapping a confirmed session dot in the Workout Calendar navigates to the Schedule tab (trainer) or switches to the Schedule segment (client) pre-scrolled to the correct week

### Credits

- [x] **Credit balance** — each client has a `client_credits` row tracking their balance; 30-min session = 1 credit, 60-min session = 2 credits
- [x] **Grant credits** — trainers grant credits from the Credits tab on the client detail screen; amount and optional note required
- [x] **Automatic deduct/refund** — credits are deducted when a trainer confirms a session; refunded automatically if the trainer cancels a session that was already confirmed
- [x] **Transaction history** — every grant, deduction, and refund is logged to `credit_transactions` with reason, note, date, and linked session ID; shown in the Credits tab
- [x] **Credit pill in client schedule** — the week nav bar on the client's Schedule segment shows a gold `★ Credits: N` pill so clients always know their balance while booking

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
Templates are stored in the database and fully editable from within the app (via the Exercise Library tab → Edit Templates). The app ships with 32 pre-built templates sourced from the Thirty60 program library, organised into a two-level hierarchy:

| Split | Subgroups | Templates |
|---|---|---|
| Full Body | Standard, Phase 1, Phase 2, Phase 3 | Total Body, Stability, Lateral/Total, Agility/Total, and Phase 1–3 progressions |
| Upper / Lower | Upper, Lower | Push Emphasis, Pull Emphasis, Strength Focus, Hypertrophy Focus, Power Focus upper sessions; Squat Focus, Hinge Focus, Unilateral Focus lower sessions |
| Push / Pull / Legs | Push, Pull, Legs | Chest Emphasis, Push Strength, Chest & Shoulders, Shoulder Emphasis, Tricep Focus; Back Emphasis, Pull Strength, Back & Biceps, Rear Delt & Traps, Bicep Focus; Quad Emphasis, Hamstring & Glute Focus, Unilateral Leg, Power & Plyometrics |
| Abs & Core | Core Fundamentals, Ab Circuits | Tiered core work (beginner → intermediate → advanced) and Abs Variations A–D |

Templates are displayed grouped by split and subgroup in both the picker and the editor. They are matched to live exercises in the database when loading a workout. Any unmatched exercises are listed so they can be added manually. Trainers can create, rename, reorder exercises in, and delete templates at any time; each template carries a `split` and `subgroup` field that controls where it appears in the grouped list.

### Exercise Library
- [x] Shared exercise library (220+ exercises seeded across all muscle groups, including stretches and hand/wrist/foot/ankle exercises)
- [x] Dedicated **Exercises tab** — browse, search, and manage the full library
- [x] Group exercises by muscle group or category (collapsible sections)
- [x] **Interactive body map** — SVG body diagram (powered by `react-native-body-highlighter`) occupies the left half of the exercise library screen and the in-workout exercise picker; tap any muscle region to filter by that muscle group; hover highlights the region in light gold before selecting; selected region turns full gold and dims all others; Front/Back toggle switches diagram view; tap the selected label's × to clear; the body map column auto-sizes to fill available space via `onLayout`; **Hands** and **Feet** are clickable regions that filter to hand/wrist and foot/ankle exercises respectively
- [x] **Equipment filter chips** — horizontal chip row (All / Barbell / Dumbbell / Cable / Machine / Bodyweight / Kettlebell / Band / Other) filters the list in real time; works alongside the group-by selector and search
- [x] **Add custom exercises** — name, muscle group, category (strength / cardio / flexibility / stretch / other), equipment type, tutorial URL, and form notes; all fields available inline in the Exercises tab and in the in-workout picker
- [x] **Muscle synonym search** — searching "biceps", "quads", "lats", etc. resolves to the matching broad muscle group (Arms, Legs, Back…) so exercises surface even when the group label doesn't match the query exactly
- [x] **External exercise database** — search the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (~800 exercises, public domain) directly from the exercise library and the in-workout picker; results show only exercises not already in the library; tapping Add imports the exercise (name, muscle group, category) into the local library; in the workout picker, Add also immediately selects the exercise; database is fetched on mount and cached in memory for the session; the "FROM DATABASE" section is always visible (not just when searching) and shows up to 20 results when no query is active; cards are the same size as local library exercise cards
- [x] **Injury contraindication warning** — when a trainer adds an exercise to a workout, the app checks the client's current and past injuries (from their intake form) and shows a modal warning if the exercise conflicts with a known injury; badge is red for current injuries, yellow for past; trainer can Cancel or proceed with Add Anyway
- [x] Exercise search when logging a workout
- [x] **In-workout picker equipment filter** — same equipment chip row in the exercise picker modal when logging or assigning a workout
- [x] Exercises auto-inserted by workout templates when missing from the library
- [x] **Exercise detail page** — tap any exercise to open its detail screen
- [x] **Equipment badge** — equipment type shown as a badge on each exercise row and in the detail screen info card; editable via chip selector on the detail page
- [x] **Form notes** — free-text step-by-step coaching cues per exercise (editable by any trainer; all 150 seeded exercises pre-populated via `migration_016_form_notes.sql` using instructions from free-exercise-db)
- [x] **Tutorial link** — YouTube URL per exercise with one-tap Watch button; 4 core lifts pre-seeded (Bench Press, Squat, Deadlift, Lat Pulldown)
- [x] **Form images** — exercise detail screen fetches movement photos from the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) image CDN; all 150 seeded exercises have verified slug mappings (`lib/exerciseDb.ts` → `SLUG_OVERRIDES`); images imported from the DB also receive images automatically via `mapDbExercise`; tap any thumbnail to open a full-screen lightbox; images silently hidden when no match is found
- [x] **DB variant tabs** — 74 exercises with multiple free-exercise-db equivalents (e.g. Bench Press has 16: Powerlifting, With Bands, With Chains, Close-Grip, Decline, Smith Machine…) show a horizontal scrollable chip row above the images; tapping a variant chip swaps the images to that variant; all 239 variant slugs verified on disk
- [x] **Approximation disclaimer** — 61 exercises that have no direct DB equivalent (custom combos, trainer-named variants, etc.) show an italic disclaimer beneath the images when no specific variant is selected
- [x] **Client read-only exercise library** — clients can browse the Exercises tab (positioned between Workouts and Progress in the client tab bar) and open exercise detail pages, but cannot add exercises, import from DB, edit form notes, equipment, or tutorial URL, or use the Edit Templates FAB; all edit controls are hidden and fields render as plain text
- [x] **Workout Guides** — third tab ("Guides") in the exercise library right-column tab bar; 10 beginner-friendly guide topics (Getting Started, Full Body, Upper/Lower, Push/Pull/Legs, Exercise Selection, Progressive Overload, Sets/Reps/Intensity, Warm-Up & Cool-Down, Deload Weeks, Abs & Core); each topic has 4 richly written sections with inline Wikipedia and PubMed hyperlinks; trainers can edit any section in-app (saved to Supabase; overrides shown to clients with "customised by your trainer" note); body map integration — selecting a muscle on the body map shows a spotlight callout indicating which split day trains that muscle and its primary exercises; accepts `?tab=guides&topic=<key>` URL params to deep-link directly into a specific topic
- [x] **Custom exercise media** — trainers can upload photos and videos to any exercise detail page (stored in the `exercise-media` Supabase Storage bucket); thumbnails appear in a horizontally scrollable row on the detail screen; tap to open a full-screen lightbox (image) or inline video player; trainers can delete their own uploads with a confirmation prompt

### Client Portal

Clients have their own separate tab navigator with distinct screens:

- [x] **Home dashboard** — greeting, total sessions, weekly streak, last workout card, quick actions
- [x] **One-time intake form** — shown on first login; collects full name, date of birth, phone, address, emergency contact, occupation, current/past injuries, chronic conditions, medications, activity level, goals, and timeframe; disappears once submitted
- [x] **Workout history — calendar + list view** — the Workouts segment defaults to a full-screen monthly calendar; gold dots = logged workouts, green = assigned, dark green = confirmed sessions; tap the month/year title to jump to any month/year via a picker modal; a toggle icon in the segment bar switches to the classic card list; tapping a date with a single item navigates directly; tapping a date with multiple items (e.g. a logged workout + a confirmed session) shows a custom in-app modal listing each item — works on web where native `Alert.alert` is limited; confirmed session dots switch to the Schedule segment at the correct week
- [x] **Self-log workouts** — clients can log their own workouts (exercises + sets + body metrics) with per-exercise unit toggle
- [x] **Complete assigned workouts** — pre-filled prescribed sets; client fills in actual values and confirms via a bottom confirmation bar; saved to workout log automatically
- [x] **Schedule segment** — second segment in the Workouts tab; shows the full-screen weekly timetable with gold availability bands and colour-coded session blocks; week nav + week picker modal; "Book Session" FAB opens the 3-step booking flow; credit balance pill shown in the week nav bar
- [x] **Exercise library** — read-only Exercises tab between Workouts and Progress; clients can browse, search, filter by muscle/equipment, and open exercise detail pages (form images, variant tabs, form notes, tutorial Watch button all functional); no add/edit controls shown
- [x] **Progress tab** — same frequency/volume/body composition/exercise charts as the trainer view; includes Performance Report Card button
- [x] **Nutrition tab** — log daily meals, search USDA + Open Food Facts food databases, scan product barcodes, view macro summary vs. daily goal (goal set by trainer)
- [x] **Media tab** — view photo/video gallery
- [x] **Profile tab** — view personal info and body metrics (trainer-managed); edit health & fitness intake info; change password in-app
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
- [x] **Calorie & macro overage warning** — when adding a food entry, the app calculates whether the addition would push any macro (calories, protein, carbs, or fat) over the client's daily goal; if so, a modal lists all exceeded macros with current vs. target values; trainer can Cancel or proceed with Add Anyway
- [x] **Recipes** — trainers and clients can create, edit, and delete named recipes (e.g. "Post-workout shake"); each recipe holds any number of ingredients sourced from USDA + Open Food Facts search; per-ingredient weight drives live macro totals and a per-100g breakdown; logging a recipe simply requires entering a serving weight — macros are scaled automatically; recipes are stored per-client in Supabase with full RLS for both trainer and client access

### Direct Messaging

- [x] **Conversations list** — a dedicated Messages tab (both trainer and client navigators) shows all conversations, ordered by latest message; each card displays the other participant's name, message preview, and timestamp
- [x] **Unread indicators** — conversations with unread messages are highlighted with a gold tint on the card; the Messages tab icon shows a coloured dot badge when any unread conversation exists (both trainer and client navigators); dot disappears as soon as the conversation is opened
- [x] **Start new conversation** — trainers can open a new conversation with any of their clients; clients can open conversations with their trainer; duplicate conversations are prevented (re-opens existing thread)
- [x] **Message thread** — real-time chat view with sent/received bubble alignment; messages load in reverse-chronological order with infinite scroll; sent messages appear instantly for the sender via optimistic update (client-generated UUID deduplicates when the Realtime echo arrives); all other participants receive messages via Supabase Realtime
- [x] **Reply/threading** — long-press any message to reply; replied-to message preview shown above the reply bubble; tapping the preview scrolls to the original message
- [x] **Attachment system** — tap the paperclip icon to open the attachment picker modal; four tabs: Exercise, Workout, Assigned Workout, Guide; attached items render as tappable cards in the message bubble
- [x] **Attachment deep-linking** — tapping an attached exercise opens its detail page (`/exercise/[id]`); tapping a guide opens the Exercises tab pre-scrolled to the matching guide topic (`?tab=guides&topic=<key>`); tapping an assigned workout routes trainers to the edit screen and clients to the read-only session view
- [x] **Client attachment restrictions** — clients can only attach their own workouts and assigned workouts (picker filters by `client_id`); clients routed to read-only session view when tapping an assigned workout attachment (not the trainer edit screen)
- [x] **Automatic session messages** — a system message is sent automatically when a session is requested, confirmed, or cancelled; messages appear in the conversation thread between trainer and client
- [x] **Conversation search** — filter the conversations list by participant name in real time
- [x] **Mark as read** — opening a conversation marks it as read by updating `last_read_at` in `conversation_participants`; unread count refreshes globally via Realtime subscription

### UI & Theme
- [x] **Forced dark theme** — deep charcoal (`#111111`) background, `#1C1C1C` surfaces, gold (`#B88C32`) accents across iOS, Android, and Web
- [x] Design token system (`constants/theme.ts`) — colors, spacing, typography, radius
- [x] Thirty60 logo in app header and browser favicon
- [x] Tab navigation (Clients, Exercises, Profile)
- [x] Profile screen shows list of all other trainers on the platform; Change Password button
- [x] FAB (floating action button) with label
- [x] Safe back navigation — falls back to home if no navigation history (works on web direct links)
- [x] **Name-based client URLs** — web routes use `/client/john-doe` instead of UUIDs; slug lookup with UUID fallback for backward compatibility
- [x] **404 handling** — unmatched routes show a "Page not found" screen; with the Render SPA rewrite rule in place, refreshing any valid URL stays on that page instead of redirecting home
- [x] Five-tab layout on client detail screen (Progress / Workouts / Nutrition / Media / Credits); Workouts tab defaults to the monthly calendar view with a calendar/list toggle; tapping a date navigates to the workout, assigned workout, or Schedule tab at the correct week
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
    NutritionEncyclopedia.tsx # 7-topic nutrition science reference with inline Wikipedia/PubMed links

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
