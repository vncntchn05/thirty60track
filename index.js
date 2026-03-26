// Custom entry point — must come before expo-router/entry so this patch
// installs BEFORE Expo's LogBox wraps console.error.
//
// react-native-svg's web renderer passes React Native-specific props
// (accessible, onStartShouldSetResponder, onResponderTerminationRequest, …)
// directly to DOM SVG elements, which React DOM 18 rejects with noisy but
// completely harmless warnings. Filter them here.
if (typeof window !== 'undefined' && typeof console !== 'undefined') {
  const _err = console.error.bind(console);
  console.error = function (...args) {
    const msg = String(args[0] ?? '');
    if (
      // "Received `%s` for a non-boolean attribute `%s`" — value is args[1], name is args[2]
      (msg.includes('non-boolean attribute') && String(args[2] ?? '') === 'accessible') ||
      // "Unknown event handler property `%s`" — all onResponder*/onStartShouldSet* props
      msg.includes('Unknown event handler property')
    ) return;
    _err(...args);
  };
}

import 'expo-router/entry';
