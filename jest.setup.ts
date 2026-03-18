// ─── React Native native module mocks ─────────────────────────────────────────

// URL polyfill — no-op in test environment (Node has URL built-in)
jest.mock('react-native-url-polyfill/auto', () => {});

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

// expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// @shopify/react-native-skia — heavy native lib, replace with stubs
jest.mock('@shopify/react-native-skia', () => ({
  Skia: {
    Paint: jest.fn(() => ({})),
    Path: jest.fn(() => ({})),
    Color: jest.fn(() => ({})),
  },
  Canvas: 'Canvas',
  Image: 'Image',
  Group: 'Group',
  Path: 'Path',
  Text: 'Text',
  useFont: jest.fn(() => null),
  useImage: jest.fn(() => null),
  useTouchHandler: jest.fn(() => ({})),
  useSharedValueEffect: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
}));

// react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// victory-native — chart lib that depends on Skia
jest.mock('victory-native', () => ({
  CartesianChart: 'CartesianChart',
  Bar: 'Bar',
  Line: 'Line',
  Scatter: 'Scatter',
  useChartPressState: jest.fn(() => ({ state: {}, isActive: false })),
  useLinePath: jest.fn(() => ({ path: null })),
}));

// expo-router — navigation is not needed in unit tests
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  Link: 'Link',
  Stack: { Screen: 'Screen' },
  Tabs: { Screen: 'Screen' },
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// expo-constants
jest.mock('expo-constants', () => ({
  default: { expoConfig: { name: 'test', slug: 'test' } },
  Constants: { expoConfig: { name: 'test', slug: 'test' } },
}));
