import * as Location from 'expo-location';

export const isCoreLocationUnknown = (err: unknown): boolean => {
  const msg = String((err as any)?.message ?? err ?? '').toLowerCase();
  return (
    msg.includes('kclerrorlocationunknown') ||
    msg.includes('kclerror') ||
    msg.includes('locationunknown') ||
    msg.includes('cleerrordomain') ||
    msg.includes('e_location_unavailable')
  );
};

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function getCurrentPositionWithRetry(
  maxAttempts = 3,
  baseDelayMs = 400
): Promise<Location.LocationObject> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (err) {
      lastErr = err;
      if (!isCoreLocationUnknown(err) || attempt === maxAttempts) break;
      await delay(baseDelayMs * attempt);
    }
  }
  throw lastErr ?? new Error('Konnte Standort nicht ermitteln.');
}

export function computeSavedAfterSave(saved: string[], name: string): string[] {
  const city = name.trim();
  if (!city) return saved;
  const list = [city, ...saved.filter((s) => s.toLowerCase() !== city.toLowerCase())];
  return list.slice(0, 5);
}

export function computeSavedAfterRemove(saved: string[], name: string): string[] {
  return saved.filter((s) => s.toLowerCase() !== name.toLowerCase());
}

