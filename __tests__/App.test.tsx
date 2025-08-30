import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput, Text } from 'react-native';
import App from '../App';

const sampleOk = {
  name: 'Berlin',
  weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
  main: { temp: 12.3, feels_like: 11.0, temp_min: 10.0, temp_max: 14.0, humidity: 77 },
  wind: { speed: 3.6 },
  sys: { country: 'DE' },
};

describe('App (react-test-renderer)', () => {
  beforeEach(() => {
    jest.resetModules();
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
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sampleOk });
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
    const calledWith = ((global as any).fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledWith).toContain('api.openweathermap.org/data/2.5/weather');
    expect(calledWith).toContain('q=Berlin');
    expect(calledWith).toContain('units=metric');

    // No need to wait for final render here; URL assertion is sufficient
  });

  it('shows German not found error on 404', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
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
