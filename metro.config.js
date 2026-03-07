const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable .web.tsx / .web.ts platform-specific file resolution
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;
