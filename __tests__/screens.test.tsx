import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

const styles: any = {
  safe: {}, bg: {}, bgImage: {}, container: {},
  title: {}, searchRow: {}, input: {}, button: {}, buttonText: {},
  actionsRow: {}, secondaryButton: {}, secondaryButtonText: {}, fullWidth: {},
  center: {}, muted: {}, error: {}, content: {}, headerRow: {}, location: {}, condition: {}, hero: {},
  listContent: {}, separator: {}, row: {}, label: {}, value: {}, valueRow: {}, iconSmall: {},
  cardsGrid: {}, infoCard: {}, infoCardLabel: {}, infoCardValue: {}, alwaysWhite: {}, radarContainer: {},
  card: {}, cardText: {}, cardRemove: {},
};

// Helper to create a lightweight React Native mock for this file only
const mockReactNative = () => {
  jest.doMock('react-native', () => {
    const React = require('react');
    const mk = (name: string) => (props: any) => React.createElement(name, props, props?.children);
    const StyleSheet = { create: (s: any) => s, hairlineWidth: 1 };
    const Platform = { OS: 'ios', select: (o: any) => o?.ios };
    const StatusBar = { currentHeight: 0 };
    return {
      __esModule: true,
      ActivityIndicator: mk('ActivityIndicator'),
      FlatList: (props: any) => {
        const items = props.data || [];
        const kids = props.renderItem
          ? items.map((item: any, index: number) =>
              React.createElement('Item', { key: String(index) }, props.renderItem({ item, index }))
            )
          : null;
        return React.createElement('FlatList', props, kids);
      },
      Image: mk('Image'),
      ImageBackground: mk('ImageBackground'),
      Linking: { openURL: jest.fn() },
      Pressable: mk('Pressable'),
      SafeAreaView: mk('SafeAreaView'),
      ScrollView: mk('ScrollView'),
      Text: mk('Text'),
      TextInput: mk('TextInput'),
      TouchableOpacity: mk('TouchableOpacity'),
      View: mk('View'),
      StyleSheet,
      Platform,
      StatusBar,
      useColorScheme: () => 'light',
    };
  });
};

const enableUI = process.env.EXPO_UI_TESTS === '1';
const d = enableUI ? describe : describe.skip;

d('WeatherScreen UI', () => {
  const baseData = {
    name: 'Berlin',
    sys: { country: 'DE' },
    main: { temp: 12, feels_like: 11, temp_min: 10, temp_max: 14, humidity: 80 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky' }],
    wind: { speed: 3 },
  };

  it('renders empty state hint', async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      mockReactNative();
      const WeatherScreen = require('../src/screens/WeatherScreen').default;
      tree = TestRenderer.create(
      <WeatherScreen
        styles={styles}
        isDark={false}
        themeMode={'light'}
        setThemeMode={() => {}}
        theme={{ placeholder: '#666' }}
        bgImage={null}
        location={''}
        setLocation={() => {}}
        onSubmit={() => {}}
        useMyLocation={() => {}}
        saveLocation={() => {}}
        saved={[]}
        onPressSaved={() => {}}
        removeLocation={() => {}}
        loading={false}
        error={null}
        data={null}
        translateWeather={() => ({ deMain: 'Klar', deDesc: 'Klarer Himmel' })}
        heroImage={{ uri: 'test' }}
        infoList={[]}
        radarInfo={null}
      />
      );
    });
    // @ts-expect-error set above
    const txts = (tree as any).root.findAllByType(require('react-native').Text);
    expect(txts.map((t: any) => t.props.children).join(' ')).toContain('Suche');
    // @ts-expect-error
    await act(async () => { tree.unmount(); });
  });

  it('renders data with radar name', async () => {
    const info = [
      { key: 'temp', label: 'Temperatur', value: '12°C' },
      { key: 'cond', label: 'Bedingung', value: 'Klar' },
    ];
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      mockReactNative();
      const WeatherScreen = require('../src/screens/WeatherScreen').default;
      tree = TestRenderer.create(
      <WeatherScreen
        styles={styles}
        isDark={false}
        themeMode={'light'}
        setThemeMode={() => {}}
        theme={{ placeholder: '#666' }}
        bgImage={null}
        location={'Berlin'}
        setLocation={() => {}}
        onSubmit={() => {}}
        useMyLocation={() => {}}
        saveLocation={() => {}}
        saved={['Berlin']}
        onPressSaved={() => {}}
        removeLocation={() => {}}
        loading={false}
        error={null}
        data={baseData}
        translateWeather={() => ({ deMain: 'Klar', deDesc: 'Klarer Himmel' })}
        heroImage={{ uri: 'test' }}
        infoList={info}
        radarInfo={{ id: 'composite', name: 'Komposit' }}
      />
      );
    });
    // @ts-expect-error
    const texts = (tree as any).root.findAllByType(require('react-native').Text).map((t: any) => t.props.children);
    const rendered = texts.flat(Infinity).join(' ');
    expect(rendered).toContain('Komposit');
    expect(rendered).toContain('composite');
    expect(rendered).toContain('Open-Meteo');
    // @ts-expect-error
    await act(async () => { (tree as any).unmount(); });
  });
});

d('Cards and Forecast Screens', () => {
  it('CardsScreen renders the default radar without weather data', async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      mockReactNative();
      jest.doMock('../src/components/RadarViewer', () => {
        const React = require('react');
        return { __esModule: true, default: (props: any) => React.createElement('RadarViewer', props) };
      });
      const CardsScreen = require('../src/screens/CardsScreen').default;
      tree = TestRenderer.create(
      <CardsScreen
        styles={styles}
        bgImage={null}
        data={null}
        heroImage={{}}
        translateWeather={() => ({ deMain: 'Klar', deDesc: 'Klarer Himmel' })}
        isDark={false}
        setThemeMode={() => {}}
        onRadarChosen={() => {}}
        radarInfo={{ id: 'composite', name: 'Komposit' }}
      />
      );
    });
    // @ts-expect-error
    const texts = (tree as any).root.findAllByType(require('react-native').Text).map((t: any) => t.props.children);
    expect(texts.flat(Infinity).join(' ')).toContain('Zürich (Standard)');
    // @ts-expect-error
    const radar = (tree as any).root.findByType('RadarViewer');
    expect(radar.props.lat).toBeCloseTo(47.3769);
    expect(radar.props.lon).toBeCloseTo(8.5417);
    // Radar and attribution must share the scroll area so they remain reachable on short screens.
    // @ts-expect-error set above
    const scroll = (tree as any).root.findByType('ScrollView');
    expect(scroll.findByType('RadarViewer')).toBe(radar);
    expect(scroll.findAllByType(require('react-native').Text).map((t: any) => t.props.children).flat(Infinity).join(' ')).toContain('Radarquelle:');
    // @ts-expect-error
    await act(async () => { (tree as any).unmount(); });
  });

  it('ForecastScreen renders when provided days', async () => {
    const days = [
      { date: '2024-09-20', min: 10, max: 15, cond: 'light rain' },
      { date: '2024-09-21', min: 9, max: 14, cond: 'clear sky' },
    ];
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      mockReactNative();
      const ForecastScreen = require('../src/screens/ForecastScreen').default;
      tree = TestRenderer.create(
      <ForecastScreen
        styles={styles}
        isDark={false}
        bgImage={null}
        data={{}}
        location={'Berlin'}
        forecastLoading={false}
        forecastError={null}
        forecastDays={days}
        fetchForecast={async () => {}}
        translateWeather={(w?: any) => ({ deMain: 'Klar', deDesc: String(w?.description || '') })}
      />
      );
    });
    // @ts-expect-error
    const texts = (tree as any).root.findAllByType(require('react-native').Text).map((t: any) => t.props.children);
    expect(texts.flat(Infinity).join(' ')).toContain('light rain');
    expect(texts.flat(Infinity).join(' ')).toContain('Open-Meteo');
    // @ts-expect-error
    await act(async () => { (tree as any).unmount(); });
  });
});
