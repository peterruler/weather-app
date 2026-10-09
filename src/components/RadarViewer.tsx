import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  buildBaseMapTileURL,
  buildRadarTileURL,
  getRadarTimeline,
  latLonToTilePoint,
  type RadarTimeline,
} from '../lib/radarComposite';

type Props = {
  lat?: number | null;
  lon?: number | null;
  styles: any;
  cartoApiKey?: string;
  onRadarChosen?: (info: { id: string; name: string }) => void;
};

type MapTile = {
  key: string;
  x: number;
  y: number;
  left: number;
  top: number;
};

const MAP_HEIGHT = 280;
const TILE_SIZE = 256;
const ZOOM = 7;

export default function RadarViewer({ lat, lon, styles, onRadarChosen, cartoApiKey = process.env.EXPO_PUBLIC_CARTO_API_KEY }: Props) {
  const [timeline, setTimeline] = useState<RadarTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mapWidth, setMapWidth] = useState(320);
  const [reloadKey, setReloadKey] = useState(0);

  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lon);
  const baseMapApiKey = cartoApiKey?.trim();

  useEffect(() => {
    let active = true;
    if (!hasCoordinates) return undefined;

    setLoading(true);
    setError(null);
    setTimeline(null);
    setPlaying(false);

    getRadarTimeline()
      .then((next) => {
        if (!active) return;
        setTimeline(next);
        setFrameIndex(Math.max(0, next.frames.length - 1));
        onRadarChosen?.({ id: 'rainviewer', name: 'RainViewer Komposit' });
      })
      .catch((reason: unknown) => {
        if (active) setError((reason as Error)?.message || 'Konnte den Radar nicht laden.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hasCoordinates, lat, lon, onRadarChosen, reloadKey]);

  useEffect(() => {
    if (!playing || !timeline || timeline.frames.length < 2) return undefined;
    const timer = setInterval(() => {
      setFrameIndex((current) => (current + 1) % timeline.frames.length);
    }, 900);
    return () => clearInterval(timer);
  }, [playing, timeline]);

  const mapTiles = useMemo<MapTile[]>(() => {
    if (!hasCoordinates) return [];
    const center = latLonToTilePoint(lat as number, lon as number, ZOOM);
    const originX = center.x * TILE_SIZE - mapWidth / 2;
    const originY = center.y * TILE_SIZE - MAP_HEIGHT / 2;
    const firstX = Math.floor(originX / TILE_SIZE);
    const firstY = Math.floor(originY / TILE_SIZE);
    const columns = Math.ceil(mapWidth / TILE_SIZE) + 2;
    const rows = Math.ceil(MAP_HEIGHT / TILE_SIZE) + 2;
    const tiles: MapTile[] = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = firstX + column;
        const y = firstY + row;
        tiles.push({
          key: `${x}:${y}`,
          x,
          y,
          left: x * TILE_SIZE - originX,
          top: y * TILE_SIZE - originY,
        });
      }
    }
    return tiles;
  }, [hasCoordinates, lat, lon, mapWidth]);

  const currentFrame = timeline?.frames[frameIndex];
  const moveFrame = useCallback((step: number) => {
    if (!timeline?.frames.length) return;
    setFrameIndex((current) => (current + step + timeline.frames.length) % timeline.frames.length);
  }, [timeline]);

  if (!hasCoordinates) {
    return <Text style={[styles.muted, styles.alwaysWhite]}>Keine Koordinaten für den gewählten Ort verfügbar.</Text>;
  }

  if (loading || (!timeline && !error)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9bdcff" />
        <Text style={styles.muted}>Radar wird geladen...</Text>
      </View>
    );
  }

  if (error || !timeline || !currentFrame) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Keine Radar-Bilder verfügbar.'}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setReloadKey((value) => value + 1)} style={[styles.button, { marginTop: 12 }]}>
          <Text style={styles.buttonText}>Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 12 }}>
      {!baseMapApiKey && (
        <Text style={[styles.muted, styles.alwaysWhite]}>Die Grundkarte ist noch nicht eingerichtet. Die Radardaten werden trotzdem angezeigt.</Text>
      )}
      <View
        accessibilityLabel="Niederschlagsradar für den gewählten Ort"
        onLayout={(event) => setMapWidth(Math.max(1, Math.round(event.nativeEvent.layout.width)))}
        style={[styles.radarContainer, { height: MAP_HEIGHT, position: 'relative' }]}
      >
        {mapTiles.map((tile) => (
          <View key={tile.key} style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}>
            {baseMapApiKey && (
              <Image source={{ uri: buildBaseMapTileURL(tile.x, tile.y, ZOOM, baseMapApiKey) }} style={{ width: TILE_SIZE, height: TILE_SIZE }} />
            )}
            <Image
              source={{ uri: buildRadarTileURL(timeline.host, currentFrame.path, tile.x, tile.y, ZOOM) }}
              style={{ position: 'absolute', left: 0, top: 0, width: TILE_SIZE, height: TILE_SIZE }}
            />
          </View>
        ))}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 14,
            height: 14,
            marginLeft: -7,
            marginTop: -7,
            borderRadius: 7,
            backgroundColor: '#ef4444',
            borderColor: '#ffffff',
            borderWidth: 2,
            pointerEvents: 'none',
          }}
        />
        <View style={{ position: 'absolute', left: 8, bottom: 6, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.62)' }}>
          <Text style={{ color: '#fff', fontSize: 11 }}>
            {currentFrame.kind === 'nowcast' ? 'Prognose' : 'Messung'} · {new Date(currentFrame.time * 1000).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Vorheriges Radarbild" onPress={() => moveFrame(-1)} style={styles.button}>
          <Text style={styles.buttonText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => setPlaying((value) => !value)} style={styles.button}>
          <Text style={styles.buttonText}>{playing ? 'Pause' : 'Abspielen'}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Nächstes Radarbild" onPress={() => moveFrame(1)} style={styles.button}>
          <Text style={styles.buttonText}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.muted, styles.alwaysWhite, { textAlign: 'center' }]}>
        Bild {frameIndex + 1} von {timeline.frames.length}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://www.rainviewer.com/')}>
          <Text style={[styles.muted, styles.alwaysWhite]}>Radardaten: RainViewer</Text>
        </Pressable>
        <Text style={[styles.muted, styles.alwaysWhite]}> · </Text>
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://carto.com/attributions')}>
          <Text style={[styles.muted, styles.alwaysWhite]}>Karte: © OpenStreetMap · © CARTO</Text>
        </Pressable>
      </View>
    </View>
  );
}
