import '@testing-library/jest-native/extend-expect';

// Basic fetch mock
if (!global.fetch) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).fetch = jest.fn();
}

// Mock Expo StatusBar to avoid RN hooks requirements in test env
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Silence animated warnings and avoid native animated dependency (best-effort)
try {
  // Some environments may not expose this path; ignore if not found
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.resolve('react-native/Libraries/Animated/NativeAnimatedHelper');
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {}

// Force a stable color scheme in tests
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => 'light',
}));

// Use official AsyncStorage Jest mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Tame RN Animated internals that can pull in hooks not supported by test renderer in some setups
try {
  // No-op animated props hook
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.resolve('react-native/src/private/animated/createAnimatedPropsHook');
  jest.mock('react-native/src/private/animated/createAnimatedPropsHook', () => ({
    __esModule: true,
    default: () => () => ({}),
  }));
} catch {}

try {
  // Wrap animated component factory to return plain wrapped components
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.resolve('react-native/Libraries/Animated/createAnimatedComponent');
  jest.mock('react-native/Libraries/Animated/createAnimatedComponent', () => {
    const React = require('react');
    return function createAnimatedComponent(Component: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      return React.forwardRef((props: any, ref: any) => React.createElement(Component, { ...props, ref })); // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  });
} catch {}

// Simplify FlatList to avoid VirtualizedList internals in tests
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require.resolve('react-native/Libraries/Lists/FlatList');
  jest.mock('react-native/Libraries/Lists/FlatList', () => {
    const React = require('react');
    const Mock = function MockFlatList() { return null; };
    return { __esModule: true, default: Mock };
  });
} catch {}

// Note: rely on jest-expo's built-in React Native mocks
