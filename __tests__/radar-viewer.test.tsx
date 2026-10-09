import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import RadarViewer from '../src/components/RadarViewer';

const describeUI = process.env.EXPO_UI_TESTS === '1' ? describe : describe.skip;

describeUI('RadarViewer basemap configuration', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        host: 'https://tilecache.rainviewer.com',
        radar: { past: [{ time: 123456, path: '/v2/radar/123456' }] },
      }),
    });
  });

  it('keeps radar and attribution visible without requesting unconfigured CARTO tiles', async () => {
    const view = render(<RadarViewer lat={47.3769} lon={8.5417} styles={{}} cartoApiKey="" />);
    await view.findByText('Bild 1 von 1');

    expect(view.getByText(/Die Grundkarte ist noch nicht eingerichtet/)).toBeTruthy();
    expect(view.getByText('Radardaten: RainViewer')).toBeTruthy();
    expect(view.getByText('Karte: © OpenStreetMap · © CARTO')).toBeTruthy();
    const urls = view.UNSAFE_getAllByType(Image).map((image) => image.props.source.uri as string);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.startsWith('https://tilecache.rainviewer.com/'))).toBe(true);
  });

  it('authenticates every basemap tile without sending the key to RainViewer', async () => {
    const view = render(<RadarViewer lat={47.3769} lon={8.5417} styles={{}} cartoApiKey="test key&value" />);
    await view.findByText('Bild 1 von 1');

    expect(view.queryByText(/Die Grundkarte ist noch nicht eingerichtet/)).toBeNull();
    const urls = view.UNSAFE_getAllByType(Image).map((image) => image.props.source.uri as string);
    const baseMaps = urls.filter((url) => url.startsWith('https://basemaps.cartocdn.com/'));
    const radar = urls.filter((url) => url.startsWith('https://tilecache.rainviewer.com/'));
    expect(baseMaps.length).toBeGreaterThan(0);
    expect(baseMaps.every((url) => url.endsWith('?key=test%20key%26value'))).toBe(true);
    expect(radar.length).toBe(baseMaps.length);
    expect(radar.every((url) => !url.includes('key='))).toBe(true);
  });
});
