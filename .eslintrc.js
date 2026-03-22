module.exports = {
  extends: 'expo',
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
  rules: {
    // ESLint's resolver cannot follow Expo/React Native module resolution;
    // actual missing imports are caught by TypeScript at build time.
    'import/no-unresolved': 'off',
  },
};
