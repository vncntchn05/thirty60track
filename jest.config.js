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
  // Start conservative: only the three files with real unit tests are measured.
  // Raise these thresholds as new tests are added (see TESTING.md).
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 35,
    },
  },
  // Only collect coverage for files that have corresponding unit tests.
  // Expand this list as new unit tests are added rather than leaving untested
  // files drag the global percentage down to a meaningless number.
  collectCoverageFrom: [
    'lib/slugify.ts',
    'lib/auth.tsx',
    'lib/usda.ts',
    'lib/generateReportPdf.ts',
    'hooks/useWorkouts.ts',
    'constants/workoutTemplates.ts',
  ],
};
