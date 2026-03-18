# Testing Guide

## Overview

The test suite has two layers:

| Layer | Location | When it runs |
|---|---|---|
| **Unit tests** | `__tests__/unit/` | Local dev + every CI push |
| **Integration tests** | `__tests__/integration/` | Local dev (with creds) + dedicated CI job |

---

## Running Tests Locally

```bash
# Run all unit tests (watch mode)
npm test

# Run all unit tests once and exit
npm run test:ci

# Run with coverage report
npm run test:coverage

# Run integration tests (requires env vars — see below)
npm run test:integration
```

Coverage HTML report is written to `coverage/lcov-report/index.html`.

---

## Unit Test Structure

```
__tests__/
  helpers/
    supabase-mock.ts              # Shared chainable query builder mock
  unit/
    slugify.test.ts               # lib/slugify.ts — pure function edge cases
    auth.test.tsx                 # lib/auth.tsx — detectRole() paths
    useClients.test.ts            # hooks/useClients.ts — CRUD + statsMap algorithm
    useWorkouts.test.ts           # hooks/useWorkouts.ts — insertSetsOrdered + createWorkoutWithSets
    useWorkouts.extended.test.ts  # lean_body_mass formula, sets error propagation, updateWorkout sync
    useAssignedWorkouts.test.ts   # createAssignedWorkout, updateAssignedWorkout, deleteAssignedWorkout, completeAssignedWorkout
    useNutrition.test.ts          # addLog, deleteLog, saveGoal call patterns + guard clauses
    useClientProgress.test.ts     # frequency, volume, streaks, body-comp, exercise progress, date filter
    useClientIntake.test.ts       # saveIntake — upsert + markComplete + clientData sync
    useWorkoutTemplates.test.ts   # toTemplate mapping + createTemplate, updateTemplate, deleteTemplate
    useExercises.test.ts          # createExercise, updateExercise call patterns
    usda.test.ts                  # scaleMacros rounding + searchFoods HTTP/cache/nutrient mapping
    generateReportPdf.test.ts     # buildReportHtml — volume, PRs, body progress, nutrition section
    workoutTemplates.test.ts      # WORKOUT_TEMPLATES static data integrity (16 templates, unique IDs/names)
  integration/
    auth.integration.test.ts
    clients.integration.test.ts
    workouts.integration.test.ts
```

---

## Integration Tests — Setup

Integration tests run against a **separate Supabase test project** so they never touch production data.

### 1. Create a test Supabase project

1. Go to [supabase.com](https://supabase.com) → New project → name it `thirty60track-test`
2. Run `supabase/schema.sql` in the SQL editor to create all tables + RLS policies
3. Optionally run `supabase/seed.sql` for the exercise library

### 2. Seed test users

In your test project's SQL editor:

```sql
-- Create a test trainer (Supabase Auth handles the password hash)
-- Use the Supabase Auth UI or API to create the user, then:
INSERT INTO trainers (id, full_name, email)
VALUES ('<auth_user_id>', 'Test Trainer', 'trainer@test.example.com');

-- Create a test client row *before* creating the auth user so the
-- auth_user_id auto-link trigger fires on first sign-in.
INSERT INTO clients (trainer_id, full_name, email)
VALUES ('<trainer_id>', 'Test Client', 'client@test.example.com');
-- Then create the Auth user for client@test.example.com via the Dashboard.
```

### 3. Set environment variables

For local runs, create `.env.test.local` (gitignored) at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

TEST_TRAINER_EMAIL=trainer@test.example.com
TEST_TRAINER_PASSWORD=super-secret-1234

TEST_CLIENT_EMAIL=client@test.example.com
TEST_CLIENT_PASSWORD=super-secret-5678

# UUID of a client owned by the test trainer (for workout tests)
TEST_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Then run:

```bash
npm run test:integration
```

---

## GitHub Secrets — CI Setup

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add:

| Secret name | Description |
|---|---|
| `SUPABASE_URL` | Test project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Test project anon key |
| `TEST_TRAINER_EMAIL` | Seeded trainer email |
| `TEST_TRAINER_PASSWORD` | Seeded trainer password |
| `TEST_CLIENT_EMAIL` | Seeded client email |
| `TEST_CLIENT_PASSWORD` | Seeded client password |
| `TEST_CLIENT_ID` | UUID of a client row owned by the test trainer |
| `EAS_TOKEN` | Expo token for EAS preview builds (Settings → Access Tokens) |

> **Never use production Supabase credentials.** The test project should have no real user data.

---

## Coverage Thresholds

Coverage is measured for the files that have unit tests:
`lib/slugify.ts`, `lib/auth.tsx`, `lib/usda.ts`, `lib/generateReportPdf.ts`,
`hooks/useWorkouts.ts`, `constants/workoutTemplates.ts`.

Current thresholds (in `jest.config.js`):

```js
coverageThreshold: {
  global: {
    branches:   30,   // ~53% currently
    functions:  35,   // ~72% currently
    lines:      40,   // ~62% currently
    statements: 35,   // ~61% currently
  },
},
```

In CI the coverage step uses `continue-on-error: true` so a threshold miss
doesn't block merges while the baseline is being established.  The HTML
report is still uploaded as an artifact for review.

### Why the thresholds start low

Most hooks in this codebase (`useWorkouts`, `useClients`, etc.) are React
hooks — they can only be exercised by rendering them inside a React component.
`@testing-library/react-native` (which provides `renderHook`) requires
transforming the full Expo/React Native module graph, which exhausts the
default Node.js heap size.  Until those tests are split into a separate
memory-isolated worker (or the app migrates to a version of RNTL that
supports streaming transforms), hook tests should be written as pure-logic
unit tests that simulate the data flow rather than rendering the hook.

### How to raise them over time

1. Run `npm run test:coverage` and open `coverage/lcov-report/index.html`
2. Identify uncovered files/branches
3. Add targeted tests for the gap
4. Add the newly-tested file to `collectCoverageFrom` in `jest.config.js`
5. Once the new baseline is green, bump the threshold
6. Commit both the tests and the updated threshold together so CI stays green

Good next targets (not yet covered in `collectCoverageFrom`):
- `hooks/useClients.ts` — addClient/deleteClient (currently simulated, not imported directly)
- `hooks/useWorkouts.ts` — the React hook body (lines 38-262); requires renderHook or further pure simulation
- `lib/generateReportPdf.ts` — `generateAndShare()` function (native-only; needs expo-print mock)

### Memory note

Run tests with `NODE_OPTIONS=--max-old-space-size=4096` (already baked into
all `package.json` test scripts) to prevent OOM when the transform cache is
cold.

---

## Keeping Tests Fast

- Unit tests mock `@/lib/supabase` entirely — no network calls.
- Integration tests are in a separate job (`integration-tests`) that runs *after* unit tests pass.
- The EAS preview build only triggers on PRs to `main`, not on every push to `dev`.
