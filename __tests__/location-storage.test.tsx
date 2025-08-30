import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create controllable mocks for expo-location
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...args: any[]) => mockRequestForegroundPermissionsAsync(...args),
  getCurrentPositionAsync: (...args: any[]) => mockGetCurrentPositionAsync(...args),
  reverseGeocodeAsync: (...args: any[]) => mockReverseGeocodeAsync(...args),
  Accuracy: { Balanced: 3 },
}));

// Helper to mount App freshly with isolated modules so our mocks apply
const renderApp = () => {
  jest.isolateModules(() => {
    // fresh require to pick up current mocks
  });
  const App = require('../App').default; // eslint-disable-line @typescript-eslint/no-var-requires
  return TestRenderer.create(<App />);
};

describe('Geolocation and storage behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Reset AsyncStorage mock state
    // @ts-expect-error jest mock has clear
    if (typeof (AsyncStorage as any).clear === 'function') (AsyncStorage as any).clear();
  });

  it('shows error when permission is denied', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const tree = renderApp();

    const btn = tree.root.findAll((n: any) => n.props && typeof n.props.onPress === 'function').find((n: any) => {
      try {
        return n.findByType(Text).props.children.includes('📍');
      } catch {
        return false;
      }
    });
    expect(btn).toBeTruthy();

    await act(async () => {
      // @ts-expect-error test env
      btn!.props.onPress();
      await Promise.resolve();
    });

    const errorText = tree.root
      .findAllByType(Text)
      .find((n) => n.props.children === 'Standortberechtigung erforderlich.');
    expect(errorText).toBeTruthy();
  });

  it('retries on kCLErrorLocationUnknown and succeeds; saves reverse geocode', async () => {
    jest.useFakeTimers();
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    let attempts = 0;
    mockGetCurrentPositionAsync.mockImplementation(async () => {
      attempts += 1;
      if (attempts < 3) {
        const err = new Error('CoreLocationProvider: CoreLocation framework reported a kCLErrorLocationUnknown failure.');
        throw err;
      }
      return { coords: { latitude: 48.137, longitude: 11.575 } };
    });
    mockReverseGeocodeAsync.mockResolvedValue([{ city: 'München', country: 'DE' }]);

    // Mock fetch to resolve
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
      name: 'Munich',
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      main: { temp: 20, feels_like: 20, temp_min: 18, temp_max: 24, humidity: 50 },
      sys: { country: 'DE' },
    }) });

    const tree = renderApp();
    const btn = tree.root.findAll((n: any) => n.props && typeof n.props.onPress === 'function').find((n: any) => {
      try {
        return n.findByType(Text).props.children.includes('📍');
      } catch {
        return false;
      }
    });

    await act(async () => {
      // Press my location
      // @ts-expect-error test env
      btn!.props.onPress();
    });

    // Advance timers to allow two backoff delays and the final success
    await act(async () => {
      jest.advanceTimersByTime(400 + 800 + 10);
    });

    // It should have attempted 3 times
    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(3);

    // Location input should be updated to the reverse geocode display
    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toContain('München');

    // Saved list is persisted
    const raw = await AsyncStorage.getItem('@saved_locations');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)[0]).toContain('München');
  });

  it('saves locations, de-duplicates, and limits to 5', async () => {
    const tree = renderApp();
    const input = tree.root.findByType(TextInput);
    const saveBtn = tree.root.findAll((n: any) => n.props && typeof n.props.onPress === 'function').find((n: any) => {
      try {
        return n.findByType(Text).props.children.includes('➕');
      } catch {
        return false;
      }
    });

    const add = async (name: string) => {
      await act(async () => {
        input.props.onChangeText(name);
      });
      await act(async () => {
        // @ts-expect-error test env
        saveBtn!.props.onPress();
      });
    };

    await add('Berlin');
    await add('Hamburg');
    await add('Munich');
    await add('Cologne');
    await add('Frankfurt');
    await add('Stuttgart'); // sixth should push out oldest when limited to 5
    await add('berlin');    // duplicate (case-insensitive) moves to front without duplication

    const raw = await AsyncStorage.getItem('@saved_locations');
    const list = JSON.parse(String(raw || '[]')) as string[];
    expect(list.length).toBe(5);
    expect(list[0].toLowerCase()).toBe('berlin');
    // Oldest of first five should be dropped; initial order: Berlin, Hamburg, Munich, Cologne, Frankfurt
    // After adding Stuttgart and then berlin again, expect Hamburg to remain but Berlin deduped at front
    expect(list).not.toContain('Stuttgart'); // because berlin duplicate re-ordered and we keep only 5
  });

  it('can remove a saved location via rendered list', async () => {
    // Override FlatList mock to render items for this test
    jest.resetModules();
    jest.doMock('react-native/Libraries/Lists/FlatList', () => {
      const React = require('react');
      return function SimpleFlatList(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return React.createElement(
          'View',
          {},
          (props.data || []).map((item: any, index: number) =>
            React.createElement('Item', { key: String(index) }, props.renderItem({ item }))
          )
        );
      };
    });

    // Pre-populate storage
    await AsyncStorage.setItem('@saved_locations', JSON.stringify(['Berlin', 'Hamburg']));
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const App = require('../App').default; // re-require with new mocks
    const tree = TestRenderer.create(<App />);

    // Remove button is the Touchable with text '✕' next to the item
    const removeButtons = tree.root
      .findAllByType(Text)
      .filter((n) => n.props.children === '✕');
    expect(removeButtons.length).toBeGreaterThan(0);

    await act(async () => {
      const btn = removeButtons[0].parent as any; // TouchableOpacity parent mock
      // @ts-expect-error test env
      btn.props.onPress();
      await Promise.resolve();
    });

    const raw = await AsyncStorage.getItem('@saved_locations');
    const list = JSON.parse(String(raw || '[]')) as string[];
    expect(list).toHaveLength(1);
  });
});
