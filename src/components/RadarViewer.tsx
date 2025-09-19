import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { buildSingleRadarFrameURLs, sortSitesByDistance } from '../lib/radarLookup';
import { pickAvailableSwissRadar } from '../lib/pickAvailableSwissRadar';
import { buildCompositeTileURL, getCompositeTimeline } from '../lib/radarComposite';

type Props = {
  lat?: number | null;
  lon?: number | null;
  styles: any;
};

type ProductsIndex = {
  images?: Array<{ time: number; formats?: string[] }>;
};

export default function RadarViewer({ lat, lon, styles }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radarId, setRadarId] = useState<string | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [times, setTimes] = useState<number[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);

  const canLocate = typeof lat === 'number' && typeof lon === 'number';

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!canLocate) return;
      setLoading(true);
      setError(null);
      setFrames([]);
      setTimes([]);
      setIndex(0);
      try {
        const sites = sortSitesByDistance(lat as number, lon as number).slice(0, 5);
        let lastErr: any = null;
        const withTimeout = async (url: string, ms = 8000) => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), ms);
          try {
            const res = await fetch(url, { signal: ctrl.signal as any });
            return res;
          } finally {
            clearTimeout(t);
          }
        };

        for (const site of sites) {
          if (cancelled) return;
          try {
            const idxUrl = `https://data.rainviewer.com/images/${site.id}/0_products.json`;
            const res = await withTimeout(idxUrl);
            if (!res.ok) throw new Error(`Radar Index fehlgeschlagen: ${res.status}`);
            const json: ProductsIndex = await res.json();
            const urls = buildSingleRadarFrameURLs(site.id, json);
            const ts = (json.images ?? []).slice(-6).map((it) => it.time);
            if (urls.length === 0 || ts.length === 0) throw new Error('Keine Radarframes in Index.');
            if (cancelled) return;
            setRadarId(site.id);
            setFrames(urls);
            setTimes(ts);
            setIndex(urls.length - 1);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (lastErr) {
          // Swiss HEAD-probe fallback
          const swId = await pickAvailableSwissRadar();
          if (cancelled) return;
          if (swId) {
            const idxUrl = `https://data.rainviewer.com/images/${swId}/0_products.json`;
            const res = await fetch(idxUrl);
            if (!res.ok) throw new Error(`Radar Index fehlgeschlagen: ${res.status}`);
            const json: ProductsIndex = await res.json();
            const urls = buildSingleRadarFrameURLs(swId, json);
            const ts = (json.images ?? []).slice(-6).map((it) => it.time);
            if (urls.length === 0 || ts.length === 0) throw new Error('Keine Radarframes in Index.');
            setRadarId(swId);
            setFrames(urls);
            setTimes(ts);
            setIndex(urls.length - 1);
          } else {
            // Composite tile fallback: build small timeline
            if (typeof lat === 'number' && typeof lon === 'number') {
              const ts = await getCompositeTimeline(6);
              if (ts.length > 0) {
                const urls = ts.map((t) => buildCompositeTileURL(t, lat as number, lon as number, 7));
                setRadarId('composite');
                setFrames(urls);
                setTimes(ts);
                setIndex(urls.length - 1);
              } else {
                throw lastErr;
              }
            } else {
              throw lastErr;
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Konnte Radar nicht laden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, canLocate]);

  // autoplay frames
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, 900);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const content = useMemo(() => {
    if (!canLocate) {
      return <Text style={[styles.muted, styles.alwaysWhite]}>Keine Koordinaten verfügbar.</Text>;
    }
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9bdcff" />
          <Text style={styles.muted}>Radar wird geladen...</Text>
          {Platform.OS === 'web' && (
            <Text style={[styles.muted, styles.alwaysWhite]}>Hinweis: Im Web können CORS‑Beschränkungen den Radarabruf verhindern.</Text>
          )}
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          {Platform.OS === 'web' && (
            <Text style={[styles.muted, styles.alwaysWhite]}>Hinweis: Im Web können CORS‑Beschränkungen den Radarabruf verhindern.</Text>
          )}
        </View>
      );
    }
    if (frames.length === 0) {
      return <Text style={[styles.muted, styles.alwaysWhite]}>Keine Radar‑Bilder verfügbar.</Text>;
    }
    const current = frames[index];
    return (
      <View>
        <View style={styles?.radarContainer ?? { backgroundColor: '#0f1720', borderRadius: 12, overflow: 'hidden' }}>
          <Image
            source={{ uri: current }}
            style={{ width: '100%', height: 260 }}
            resizeMode="cover"
          />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity accessibilityRole="button" onPress={() => setIndex((i) => (i - 1 + frames.length) % frames.length)}>
              <Text style={[styles.buttonText]}>◀︎</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setPlaying((p) => !p)}>
              <Text style={[styles.buttonText]}>{playing ? 'Pause' : 'Abspielen'}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setIndex((i) => (i + 1) % frames.length)}>
              <Text style={[styles.buttonText]}>▶︎</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.muted, styles.alwaysWhite]}>
            {times[index] ? new Date(times[index] * 1000).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {frames.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setIndex(i)} accessibilityRole="button">
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i === index ? '#9bdcff' : '#6b7a8a' }} />
            </TouchableOpacity>
          ))}
        </View>
        {radarId && (
          <Text style={[styles.muted, styles.alwaysWhite, { textAlign: 'center', marginTop: 8 }]}>Radar: {radarId === 'composite' ? 'Komposit' : radarId}</Text>
        )}
      </View>
    );
  }, [canLocate, loading, error, frames, index, styles, radarId, times, playing]);

  return (
    <View style={{ marginTop: 12 }}>
      {content}
    </View>
  );
}
