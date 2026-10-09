import {
  buildBaseMapTileURL,
  buildRadarTileURL,
  getRadarTimeline,
  latLonToTile,
  latLonToTilePoint,
  normalizeTileCoordinates,
  RAINVIEWER_MAPS_URL,
} from '../src/lib/radarComposite';

describe('radar map helpers', () => {
  it('converts coordinates to deterministic tile positions', () => {
    expect(latLonToTile(52.52, 13.405, 7)).toEqual({ x: 68, y: 41 });
    const point = latLonToTilePoint(52.52, 13.405, 7);
    expect(point.x).toBeGreaterThan(68);
    expect(point.y).toBeGreaterThan(41);
  });

  it('wraps horizontal coordinates and clamps vertical coordinates', () => {
    expect(normalizeTileCoordinates(-1, -4, 2)).toEqual({ x: 3, y: 0 });
    expect(normalizeTileCoordinates(4, 9, 2)).toEqual({ x: 0, y: 3 });
  });

  it('builds CARTO and documented RainViewer tile URLs', () => {
    expect(buildBaseMapTileURL(68, 41, 7, 'test-carto-key')).toBe('https://basemaps.cartocdn.com/rastertiles/light_all/7/68/41.png?key=test-carto-key');
    expect(buildRadarTileURL('https://tilecache.rainviewer.com/', '/v2/radar/123456', 68, 41, 7))
      .toBe('https://tilecache.rainviewer.com/v2/radar/123456/256/7/68/41/2/1_1.png');
  });

  it('encodes the CARTO key and normalizes tile coordinates', () => {
    expect(buildBaseMapTileURL(-1, 9, 2, '  test key&value  '))
      .toBe('https://basemaps.cartocdn.com/rastertiles/light_all/2/3/3.png?key=test%20key%26value');
  });

  it('rejects missing CARTO keys instead of requesting watermarked tiles', () => {
    expect(() => buildBaseMapTileURL(68, 41, 7, '')).toThrow('API-Schlüssel');
    expect(() => buildBaseMapTileURL(68, 41, 7, '   ')).toThrow('API-Schlüssel');
  });
});

describe('RainViewer timeline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses host and paths from the API and keeps the newest frames', async () => {
    const maps = {
      host: 'https://tilecache.rainviewer.com',
      radar: {
        past: [
          { time: 1, path: '/v2/radar/1' },
          { time: 2, path: '/v2/radar/2' },
        ],
        nowcast: [{ time: 3, path: '/v2/radar/3' }],
      },
    };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => maps });

    await expect(getRadarTimeline(2)).resolves.toEqual({
      host: maps.host,
      frames: [
        { time: 2, path: '/v2/radar/2', kind: 'past' },
        { time: 3, path: '/v2/radar/3', kind: 'nowcast' },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(RAINVIEWER_MAPS_URL, expect.objectContaining({ signal: expect.anything() }));
  });

  it('reports HTTP and empty-response failures', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(getRadarTimeline()).rejects.toThrow('Status 503');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ host: 'https://example.test', radar: { past: [] } }),
    });
    await expect(getRadarTimeline()).rejects.toThrow('keine Radarframes');
  });
});
