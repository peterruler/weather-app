import { CH_RADARS } from './radars/europe';

export async function pickAvailableSwissRadar(timeoutMs = 6000): Promise<string | null> {
  const ids = CH_RADARS.map((r) => r.id);
  const withTimeout = async (url: string, ms: number) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal as any });
      return res;
    } finally {
      clearTimeout(t);
    }
  };
  for (const id of ids) {
    try {
      const url = `https://data.rainviewer.com/images/${id}/0_products.json`;
      const res = await withTimeout(url, timeoutMs);
      if (res.ok) return id;
    } catch {}
  }
  return null;
}

