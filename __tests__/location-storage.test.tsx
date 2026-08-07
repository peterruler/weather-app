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

jest.mock('../src/components/RadarViewer', () => ({
  __esModule: true,
  default: () => null,
}));

// Helper to mount App freshly with isolated modules so our mocks apply
const renderApp = async () => {
  let tree: TestRenderer.ReactTestRenderer;
  await act(async () => {
    const App = require('../App').default; // eslint-disable-line @typescript-eslint/no-var-requires
    tree = TestRenderer.create(<App />);
  });
  // @ts-expect-error set in act
  return tree as TestRenderer.ReactTestRenderer;
};

const enableUI = process.env.EXPO_UI_TESTS === '1';
const d = enableUI ? describe : describe.skip;

d('Geolocation and storage behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage mock state
    // @ts-expect-error jest mock has clear
    if (typeof (AsyncStorage as any).clear === 'function') (AsyncStorage as any).clear();
  });

  it('shows error when permission is denied', async () => {
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const tree = await renderApp();

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

    // Open-Meteo current weather and daily forecast use the same response shape.
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
      current: {
        temperature_2m: 20,
        apparent_temperature: 20,
        relative_humidity_2m: 50,
        weather_code: 0,
        wind_speed_10m: 2,
      },
      daily: {
        time: ['2026-08-07'],
        temperature_2m_min: [18],
        temperature_2m_max: [24],
        weather_code: [0],
      },
    }) });

    const tree = await renderApp();
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

    // Advance recursively scheduled retry timers and their promise callbacks.
    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // It should have attempted 3 times
    expect(mockGetCurrentPositionAsync).toHaveBeenCalledTimes(3);

    const weatherUrl = ((global as any).fetch as jest.Mock).mock.calls
      .map((call) => call[0] as string)
      .find((url) => url.includes('api.open-meteo.com/v1/forecast'));
    expect(weatherUrl).toContain('latitude=48.137');
    expect(weatherUrl).not.toContain('appid=');

    // Location input should be updated to the reverse geocode display
    const input = tree.root.findByType(TextInput);
    expect(input.props.value).toContain('München');

    // Saved list is persisted
    const raw = await AsyncStorage.getItem('@saved_locations');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)[0]).toContain('München');
  });

  it('saves locations, de-duplicates, and limits to 5', async () => {
    const tree = await renderApp();
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
    // The newest unique location remains; the oldest surviving entry is removed.
    expect(list).toContain('Stuttgart');
    expect(list).not.toContain('Hamburg');
  });

  it('can remove a saved location via rendered list', async () => {
    // Pre-populate storage
    await AsyncStorage.setItem('@saved_locations', JSON.stringify(['Berlin', 'Hamburg']));
    mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const App = require('../App').default;
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<App />);
    });

    // Remove button is the Touchable with text '✕' next to the item
    const removeButtons = tree.root
      .findAllByType(Text)
      .filter((n) => n.props.children === '✕');
    expect(removeButtons.length).toBeGreaterThan(0);

    await act(async () => {
      let btn = removeButtons[0] as any;
      while (btn && typeof btn.props?.onPress !== 'function') btn = btn.parent;
      expect(btn).toBeTruthy();
      btn.props.onPress();
      await Promise.resolve();
    });

    const raw = await AsyncStorage.getItem('@saved_locations');
    const list = JSON.parse(String(raw || '[]')) as string[];
    expect(list).toHaveLength(1);
  });
});
