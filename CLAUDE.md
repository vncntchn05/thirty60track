# thirty60track — Project Conventions

## Stack
- **Framework**: Expo SDK 51 with Expo Router v3 (file-based routing, works on iOS, Android, and Web)
- **Language**: TypeScript (strict mode)
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Charts**: Victory Native XL
- **Styling**: React Native StyleSheet (no external CSS-in-JS libs)

## Folder Structure
```
app/                    # Expo Router — every file is a route
  _layout.tsx           # Root layout (auth gate, providers)
  (auth)/               # Public routes (no session required)
    _layout.tsx
    login.tsx
  (tabs)/               # Protected tab navigator
    _layout.tsx
    index.tsx           # Dashboard (client list)
    profile.tsx
  workout/
    new.tsx             # Log a new workout
    [id].tsx            # View/edit a workout
  client/
    [id].tsx            # Client detail + history + charts

components/
  ui/                   # Primitive, reusable components (Button, Card, Input…)
  charts/               # Victory Native wrappers (ProgressChart, VolumeChart…)
  workout/              # Workout-specific composite components

hooks/                  # Custom hooks (useClients, useWorkouts, useAuth…)
lib/
  supabase.ts           # Supabase client singleton
  auth.tsx              # AuthContext + useAuth hook
types/
  database.ts           # Manual DB types (mirrors schema.sql)
  index.ts              # Re-exports
constants/
  theme.ts              # Colors, spacing, typography tokens
supabase/
  schema.sql            # Source-of-truth DDL (run in Supabase SQL editor)
  seed.sql              # Development seed data
```

## Naming Conventions
- **Files/folders**: `kebab-case` for folders, `PascalCase.tsx` for components, `camelCase.ts` for utilities/hooks
- **Components**: PascalCase, one component per file
- **Hooks**: prefix with `use` — `useClients`, `useWorkout`
- **Types/Interfaces**: PascalCase, no `I` prefix — `Client`, `Workout`, `WorkoutSet`
- **Supabase table names**: `snake_case` plural — `trainers`, `clients`, `workouts`, `workout_sets`
- **Constants**: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for theme tokens

## TypeScript Rules
- Strict mode enabled — no `any`, use `unknown` and narrow
- All Supabase query results should be typed via `types/database.ts`
- Prefer `type` over `interface` unless declaration merging is needed
- Avoid enums; use `as const` object maps instead

## Supabase Patterns
- Import the client from `@/lib/supabase` — never instantiate inline
- Always destructure `{ data, error }` and handle `error` before using `data`
- Row-Level Security (RLS) is **always enabled** — never bypass with service role key on the client
- Use `supabase.auth.getUser()` (not `getSession()`) for authoritative user checks
- Mutations go in hooks (e.g. `useWorkouts`) so components stay declarative
- Prefer `select('column1, column2')` over `select('*')` for performance

## Component Guidelines
- Screens live in `app/` — keep them thin (fetch via hook, render with components)
- Shared UI components in `components/ui/` must be self-contained with no business logic
- Chart wrappers in `components/charts/` receive plain data arrays — no Supabase calls inside
- Use `React.memo` only when profiling shows a real benefit — not preemptively

## Styling
- All styles via `StyleSheet.create({})` — no inline style objects in JSX
- Design tokens imported from `constants/theme.ts`
- Support light/dark mode via `useColorScheme` — reference semantic color tokens

## Environment Variables
- Stored in `.env.local` (gitignored) — see `.env.example` for required keys
- Expo env vars must be prefixed with `EXPO_PUBLIC_` to be accessible in the bundle
- Never commit real keys; rotate any accidentally committed credentials immediately

## Git Workflow
- Branch: `main` (production), `dev` (integration)
- Feature branches: `feat/<short-description>`, bug fixes: `fix/<short-description>`
- Commit style: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`
- No force-pushing to `main` or `dev`
