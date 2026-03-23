/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testTimeout: 30000,
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Extend the jest-expo base pattern with additional packages that use ESM.
  // Note: expo(nent)? (no trailing slash) is required to cover expo-modules-core,
  // expo-router, expo-constants, etc. — all packages starting with "expo".
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '(jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@unimodules/.*' +
      '|unimodules' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      '|victory-native' +
      '|@shopify/react-native-skia' +
      '|@supabase/.*' +
      '|react-native-url-polyfill' +
      '|react-native-reanimated' +
      '|react-native-gesture-handler' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      '))',
  ],
  testMatch: [
    '**/__tests__/unit/**/*.test.{ts,tsx}',
    '**/__tests__/integration/**/*.test.{ts,tsx}',
  ],
  // Thresholds raised as new tests were added. Keep these moving upward —
  // never lower them. Pure-function modules (muscleSearch, exerciseDb, off)
  // carry high coverage and pull the aggregate up.
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 45,
      lines: 50,
      statements: 45,
    },
  },
  // Only collect coverage for files that have corresponding unit tests.
  // Expand this list as new unit tests are added rather than leaving untested
  // files drag the global percentage down to a meaningless number.
  collectCoverageFrom: [
    // lib — pure functions and clients
    'lib/slugify.ts',
    'lib/auth.tsx',
    'lib/usda.ts',
    'lib/off.ts',
    'lib/muscleSearch.ts',
    'lib/exerciseDb.ts',
    'lib/generateReportPdf.ts',
    // hooks — all hooks with dedicated unit tests
    'hooks/useWorkouts.ts',
    'hooks/useClients.ts',
    'hooks/useExercises.ts',
    'hooks/useWorkoutTemplates.ts',
    'hooks/useAssignedWorkouts.ts',
    'hooks/useClientIntake.ts',
    'hooks/useClientProfile.ts',
    'hooks/useClientWorkouts.ts',
    'hooks/useClientProgress.ts',
    'hooks/useNutrition.ts',
    'hooks/useTrainers.ts',
    // constants
    'constants/workoutTemplates.ts',
  ],
};
