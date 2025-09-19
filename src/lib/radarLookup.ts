import { EU_RADARS } from './radars/europe';
import type { RadarSite } from './radars/types';

// Haversine distance (km)
function distKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLon = (bLon - aLon) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export function nearestRadarId(lat: number, lon: number, sites: RadarSite[] = EU_RADARS): RadarSite {
  return sites.reduce((best, cur) =>
    distKm(lat, lon, cur.lat, cur.lon) < distKm(lat, lon, best.lat, best.lon) ? cur : best
  , sites[0]);
}

export function sortSitesByDistance(lat: number, lon: number, sites: RadarSite[] = EU_RADARS): RadarSite[] {
  return [...sites]
    .map((s) => ({ s, d: distKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.s);
}

// Build Single-Radar endpoints for last <=6 frames
export function buildSingleRadarFrameURLs(
  radarId: string,
  productsJson: { images?: Array<{ time: number; formats?: string[] }> }
): string[] {
  const base = `https://data.rainviewer.com/images/${radarId}`;
  return (productsJson.images ?? [])
    .slice(-6) // <= 6 frames
    .map((item) => {
      const ext = item.formats?.includes("png") ? "png" : (item.formats?.[0] ?? "png");
      return `${base}/${item.time}_0_source.${ext}`;
    });
}
