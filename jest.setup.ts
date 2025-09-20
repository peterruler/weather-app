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

// Basic mocks for React Navigation to avoid ESM parsing and native deps
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const Nav = ({ children }: any) => React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    NavigationContainer: Nav,
    DarkTheme: {},
    DefaultTheme: {},
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const create = () => ({
    Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Screen: ({ children }: any) =>
      React.createElement(React.Fragment, null, typeof children === 'function' ? children({}) : children),
  });
  return { __esModule: true, createNativeStackNavigator: create };
});

jest.mock('@react-navigation/material-top-tabs', () => {
  const React = require('react');
  const create = () => ({
    Navigator: ({ children }: any) => React.createElement(React.Fragment, null, children),
    Screen: ({ children }: any) =>
      React.createElement(React.Fragment, null, typeof children === 'function' ? children({}) : children),
  });
  return { __esModule: true, createMaterialTopTabNavigator: create };
});

jest.mock('react-native-screens', () => ({ enableScreens: () => {} }));

// Mock expo-location globally to avoid ESM parsing in App import; specific tests can override
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
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
