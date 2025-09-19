type WeatherMaps = {
  radar?: {
    past?: Array<{ time: number; path: string }>;
    nowcast?: Array<{ time: number; path: string }>;
  };
};

export async function getLatestRadarTimestamp(timeoutMs = 6000): Promise<number | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: ctrl.signal as any });
    if (!res.ok) return null;
    const json: WeatherMaps = await res.json();
    const times: number[] = [];
    for (const a of json.radar?.past || []) times.push(a.time);
    for (const a of json.radar?.nowcast || []) times.push(a.time);
    if (times.length === 0) return null;
    return times.sort((a, b) => a - b)[times.length - 1];
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function getCompositeTimeline(maxFrames = 6, timeoutMs = 6000): Promise<number[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: ctrl.signal as any });
    if (!res.ok) return [];
    const json: WeatherMaps = await res.json();
    const times: number[] = [];
    for (const a of json.radar?.past || []) times.push(a.time);
    for (const a of json.radar?.nowcast || []) times.push(a.time);
    return times.sort((a, b) => a - b).slice(-maxFrames);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

// Slippy map tile helpers
export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return { x, y };
}

export function buildCompositeTileURL(time: number, lat: number, lon: number, zoom = 7): string {
  const { x, y } = latLonToTile(lat, lon, zoom);
  // Color=2 (blue), smooth=1, snow=1, tileSize=256
  return `https://tilecache.rainviewer.com/v2/radar/${time}/256/${zoom}/${x}/${y}/2/1_1.png`;
}
