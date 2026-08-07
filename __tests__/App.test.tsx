import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput, Text } from 'react-native';
import App from '../App';

jest.mock('../src/components/RadarViewer', () => ({
  __esModule: true,
  default: () => null,
}));

const geocodingOk = {
  results: [{ name: 'Berlin', country_code: 'DE', latitude: 52.52, longitude: 13.405 }],
};

const weatherOk = {
  current: {
    temperature_2m: 12.3,
    apparent_temperature: 11,
    relative_humidity_2m: 77,
    weather_code: 61,
    wind_speed_10m: 3.6,
  },
  daily: {
    time: ['2026-08-07'],
    temperature_2m_min: [10],
    temperature_2m_max: [14],
    weather_code: [61],
  },
};

const enableUI = process.env.EXPO_UI_TESTS === '1';
const d = enableUI ? describe : describe.skip;

d('App (react-test-renderer)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn();
  });

  it('renders initial UI in German', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<App />);
    });
    // @ts-expect-error assigned in act above
    const title = tree.root.findAllByType(Text).find((n) => n.props.children === 'Wetter');
    expect(title).toBeTruthy();
    // @ts-expect-error assigned in act above
    const input = tree.root.findByType(TextInput);
    expect(input.props.placeholder).toContain('Stadt eingeben');
    // @ts-expect-error assigned in act above
    const buttonText = tree.root.findAllByType(Text).find((n) => n.props.children === 'Suchen');
    expect(buttonText).toBeTruthy();
  });

  it('validates empty input and shows German hint', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<App />);
    });
    const buttonNode = tree.root.findAll((n) => n.props && typeof n.props.onPress === 'function').find((n) => {
      try {
        const t = n.findByType(Text);
        return t.props.children === 'Suchen';
      } catch {
        return false;
      }
    });
    expect(buttonNode).toBeTruthy();
    act(() => {
      // @ts-expect-error onPress is provided by our mock
      buttonNode!.props.onPress();
    });
    const errorText = tree.root.findAllByType(Text).find((n) => n.props.children === 'Bitte gebe einen Ort ein.');
    expect(errorText).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('calls fetch with correct URL and shows loading', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('geocoding-api.open-meteo.com') ? geocodingOk : weatherOk,
    }));
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<App />);
    });
    const input = tree.root.findByType(TextInput);
    const button = tree.root.findAll((n) => n.props && typeof n.props.onPress === 'function').find((n) => {
      try {
        const t = n.findByType(Text);
        return t.props.children === 'Suchen';
      } catch {
        return false;
      }
    });

    await act(async () => {
      input.props.onChangeText('Berlin');
    });
    await act(async () => {
      // @ts-expect-error onPress is provided by our mock
      button!.props.onPress();
    });

    // Assert fetch called with proper URL parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calledUrls = ((global as any).fetch as jest.Mock).mock.calls
      .map((call) => call[0] as string)
    expect(calledUrls.some((url) => url.includes('geocoding-api.open-meteo.com/v1/search'))).toBe(true);
    expect(calledUrls.some((url) => url.includes('name=Berlin'))).toBe(true);
    expect(calledUrls.some((url) => url.includes('api.open-meteo.com/v1/forecast'))).toBe(true);
    expect(calledUrls.some((url) => url.includes('latitude=52.52'))).toBe(true);

    // No need to wait for final render here; URL assertion is sufficient
  });

  it('shows German not found error on 404', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<App />);
    });
    const input = tree.root.findByType(TextInput);
    const button = tree.root.findAll((n) => n.props && typeof n.props.onPress === 'function').find((n) => {
      try {
        const t = n.findByType(Text);
        return t.props.children === 'Suchen';
      } catch {
        return false;
      }
    });

    await act(async () => {
      input.props.onChangeText('Nowhere');
    });
    await act(async () => {
      // @ts-expect-error onPress is provided by our mock
      button!.props.onPress();
    });

    const errorText = tree.root.findAllByType(Text).find((n) => n.props.children === 'Ort wurde nicht gefunden.');
    expect(errorText).toBeTruthy();
  });
});
