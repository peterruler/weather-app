import { nearestRadarId, sortSitesByDistance, buildSingleRadarFrameURLs } from '../src/lib/radarLookup';
import { buildCompositeTileURL, getCompositeTimeline, getLatestRadarTimestamp, latLonToTile } from '../src/lib/radarComposite';
import { pickAvailableSwissRadar } from '../src/lib/pickAvailableSwissRadar';

describe('radar lookup helpers', () => {
  const sites = [
    { id: 'A', name: 'A', lat: 0, lon: 0 },
    { id: 'B', name: 'B', lat: 0, lon: 10 },
    { id: 'C', name: 'C', lat: 10, lon: 0 },
  ];

  it('sorts sites by distance', () => {
    const sorted = sortSitesByDistance(0, 1, sites);
    expect(sorted.map((s) => s.id)).toEqual(['A', 'B', 'C']);
  });

  it('picks nearest radar id', () => {
    const near = nearestRadarId(9, 0, sites);
    expect(near.id).toBe('C');
  });

  it('builds single radar frame URLs with formats', () => {
    const urls = buildSingleRadarFrameURLs('ABC', {
      images: [
        { time: 1, formats: ['gif'] },
        { time: 2, formats: ['png'] },
        { time: 3, formats: [] },
      ],
    });
    expect(urls[0]).toContain('/1_0_source.gif');
    expect(urls[1]).toContain('/2_0_source.png');
    expect(urls[2]).toContain('/3_0_source.png');
  });
});

describe('composite helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('latLonToTile is deterministic', () => {
    const t = latLonToTile(52.52, 13.405, 7);
    expect(t).toEqual({ x: expect.any(Number), y: expect.any(Number) });
  });

  it('buildCompositeTileURL uses given time and coords', () => {
    const url = buildCompositeTileURL(123456, 52.52, 13.405, 7);
    expect(url).toContain('/radar/123456/256/7/');
    expect(url).toContain('/2/1_1.png');
  });

  it('getCompositeTimeline and getLatestRadarTimestamp parse weather-maps', async () => {
    const maps = {
      radar: {
        past: [{ time: 1, path: 'a' }, { time: 2, path: 'b' }],
        nowcast: [{ time: 3, path: 'c' }],
      },
    };
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => maps });
    const timeline = await getCompositeTimeline(2);
    expect(timeline).toEqual([2, 3]);
    const latest = await getLatestRadarTimestamp();
    expect(latest).toBe(3);
  });

  it('getCompositeTimeline returns [] on !ok and errors', async () => {
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    const timeline = await getCompositeTimeline(2);
    expect(timeline).toEqual([]);

    // error/exception path
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network'));
    const timelineErr = await getCompositeTimeline(2);
    expect(timelineErr).toEqual([]);
  });

  it('getLatestRadarTimestamp returns null on !ok and errors', async () => {
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    const ts = await getLatestRadarTimestamp();
    expect(ts).toBeNull();

    // error/exception path
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network'));
    const tsErr = await getLatestRadarTimestamp();
    expect(tsErr).toBeNull();
  });
});

describe('pickAvailableSwissRadar', () => {
  it('returns first ok swiss id', async () => {
    const impl = jest.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn((url: string) => impl(url));
    const id = await pickAvailableSwissRadar(50);
    expect(id).toBeTruthy();
  });

  it('returns null when none ok (including exceptions)', async () => {
    const impl = jest.fn()
      .mockResolvedValue({ ok: false })
      .mockRejectedValueOnce(new Error('abort'))
      .mockResolvedValue({ ok: false });
    // @ts-expect-error define fetch mock
    global.fetch = jest.fn((url: string) => impl(url));
    const id = await pickAvailableSwissRadar(5);
    expect(id).toBeNull();
  });
});
