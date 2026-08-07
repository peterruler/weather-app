export const RAINVIEWER_MAPS_URL = 'https://api.rainviewer.com/public/weather-maps.json';
export const CARTO_TILE_HOST = 'https://a.basemaps.cartocdn.com/light_all';

export type RadarFrame = {
  time: number;
  path: string;
  kind: 'past' | 'nowcast';
};

export type RadarTimeline = {
  host: string;
  frames: RadarFrame[];
};

type WeatherMapsResponse = {
  host?: string;
  radar?: {
    past?: Array<{ time: number; path: string }>;
    nowcast?: Array<{ time: number; path: string }>;
  };
};

const clampLatitude = (lat: number) => Math.max(-85.05112878, Math.min(85.05112878, lat));

export function latLonToTilePoint(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const safeLat = clampLatitude(lat);
  const latRad = (safeLat * Math.PI) / 180;
  const n = 2 ** zoom;
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  };
}

export function latLonToTile(lat: number, lon: number, zoom: number): { x: number; y: number } {
  const point = latLonToTilePoint(lat, lon, zoom);
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

export function normalizeTileCoordinates(x: number, y: number, zoom: number): { x: number; y: number } {
  const max = 2 ** zoom;
  return {
    x: ((x % max) + max) % max,
    y: Math.max(0, Math.min(max - 1, y)),
  };
}

export function buildBaseMapTileURL(x: number, y: number, zoom: number): string {
  const tile = normalizeTileCoordinates(x, y, zoom);
  return `${CARTO_TILE_HOST}/${zoom}/${tile.x}/${tile.y}.png`;
}

export function buildRadarTileURL(
  host: string,
  path: string,
  x: number,
  y: number,
  zoom: number,
): string {
  const tile = normalizeTileCoordinates(x, y, zoom);
  return `${host.replace(/\/$/, '')}${path}/256/${zoom}/${tile.x}/${tile.y}/2/1_1.png`;
}

export async function getRadarTimeline(maxFrames = 8, timeoutMs = 8000): Promise<RadarTimeline> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(RAINVIEWER_MAPS_URL, { signal: controller.signal as AbortSignal });
    if (!response.ok) {
      throw new Error(`RainViewer antwortet mit Status ${response.status}.`);
    }

    const json: WeatherMapsResponse = await response.json();
    if (!json.host) throw new Error('RainViewer liefert keinen Tile-Host.');

    const frames = [
      ...(json.radar?.past ?? []).map((frame) => ({ ...frame, kind: 'past' as const })),
      ...(json.radar?.nowcast ?? []).map((frame) => ({ ...frame, kind: 'nowcast' as const })),
    ]
      .filter((frame) => Number.isFinite(frame.time) && typeof frame.path === 'string' && frame.path.length > 0)
      .sort((a, b) => a.time - b.time)
      .slice(-maxFrames);

    if (frames.length === 0) throw new Error('RainViewer liefert aktuell keine Radarframes.');
    return { host: json.host, frames };
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new Error('Der Radarabruf hat zu lange gedauert.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
