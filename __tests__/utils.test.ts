import { computeSavedAfterRemove, computeSavedAfterSave, getCurrentPositionWithRetry, isCoreLocationUnknown, delay } from '../src/utils';

jest.mock('expo-location', () => ({
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

describe('utils: storage helpers', () => {
  it('computeSavedAfterSave dedupes and limits to 5', () => {
    const start: string[] = [];
    let cur = start;
    const add = (name: string) => (cur = computeSavedAfterSave(cur, name));
    add('Berlin');
    add('Hamburg');
    add('Munich');
    add('Cologne');
    add('Frankfurt');
    add('Stuttgart');
    expect(cur).toHaveLength(5);
    // Latest 5 kept
    expect(cur).toEqual(['Stuttgart', 'Frankfurt', 'Cologne', 'Munich', 'Hamburg']);
    // Dedup (case-insensitive) moves to front
    cur = computeSavedAfterSave(cur, 'berlin');
    expect(cur[0].toLowerCase()).toBe('berlin');
    expect(new Set(cur).size).toBe(cur.length);
  });

  it('computeSavedAfterRemove removes by case-insensitive match', () => {
    const cur = computeSavedAfterRemove(['Berlin', 'Hamburg'], 'berlin');
    expect(cur).toEqual(['Hamburg']);
  });
});

describe('utils: geolocation retry', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.now() });
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it('detects CoreLocation unknown errors', () => {
    expect(isCoreLocationUnknown(new Error('kCLErrorLocationUnknown'))).toBe(true);
    expect(isCoreLocationUnknown('CoreLocationProvider: CoreLocation framework reported a kCLErrorLocationUnknown failure.')).toBe(true);
    expect(isCoreLocationUnknown('random')).toBe(false);
  });

  it('retries twice then succeeds on third', async () => {
    const Location = require('expo-location');
    let attempts = 0;
    Location.getCurrentPositionAsync.mockImplementation(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('kCLErrorLocationUnknown');
      return { coords: { latitude: 1, longitude: 2 } };
    });
    const p = getCurrentPositionWithRetry(3, 100);
    await jest.advanceTimersByTimeAsync(100);
    await jest.advanceTimersByTimeAsync(200);
    const res = await p;
    expect(res.coords.latitude).toBe(1);
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(3);
  });

  it('throws after maxAttempts on persistent unknown error', async () => {
    const Location = require('expo-location');
    Location.getCurrentPositionAsync.mockImplementation(async () => { throw new Error('kCLErrorLocationUnknown'); });
    const p = getCurrentPositionWithRetry(1, 0);
    await expect(p).rejects.toThrow();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledTimes(1);
  });
});
