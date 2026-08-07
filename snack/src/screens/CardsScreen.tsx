import React from 'react';
import { Image, ImageBackground, Linking, Pressable, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarViewer from '../components/RadarViewer';

type Props = {
  styles: any;
  bgImage: any;
  data: any;
  heroImage: any;
  translateWeather: (w?: { id?: number; main?: string; description?: string }) => { deMain: string; deDesc: string };
  isDark: boolean;
  setThemeMode: (m: 'light' | 'dark') => void;
  onRadarChosen?: (info: { id: string; name: string }) => void;
  radarInfo?: { id: string; name: string } | null;
};

const DEFAULT_RADAR_LOCATION = {
  name: 'Zürich (Standard)',
  lat: 47.3769,
  lon: 8.5417,
};

export default function CardsScreen({ styles, bgImage, data, heroImage, translateWeather, isDark, setThemeMode, onRadarChosen, radarInfo }: Props) {
  const lat = ((data as any)?.coord?.lat as number | undefined) ?? DEFAULT_RADAR_LOCATION.lat;
  const lon = ((data as any)?.coord?.lon as number | undefined) ?? DEFAULT_RADAR_LOCATION.lon;
  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage ?? undefined} style={styles.bg} resizeMode="cover" imageStyle={styles.bgImage}>
        <View style={styles.container}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <Text style={styles.title}>Niederschlagsradar</Text>
          </View>
          <View style={styles.content}>
            {data ? (
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.location}>
                    {data.name}
                    {data.sys?.country ? `, ${data.sys.country}` : ''}
                  </Text>
                  <Text style={styles.condition}>{translateWeather(data.weather?.[0]).deMain}</Text>
                </View>
                <Image source={heroImage} style={styles.hero} resizeMode="contain" />
              </View>
            ) : (
              <View>
                <Text style={styles.location}>{DEFAULT_RADAR_LOCATION.name}</Text>
                <Text style={[styles.muted, styles.alwaysWhite]}>
                  Suche im Wetter-Tab einen Ort oder nutze GPS, um den Radar darauf zu zentrieren.
                </Text>
              </View>
            )}
            {data && (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://open-meteo.com/')}>
                <Text style={[styles.muted, styles.alwaysWhite]}>Wetterdaten: Open-Meteo</Text>
              </Pressable>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => {
                  const next = isDark ? 'light' : 'dark';
                  setThemeMode(next);
                }}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{isDark ? '☀️ Hell' : '🌙 Dunkel'}</Text>
              </TouchableOpacity>
            </View>
            <RadarViewer lat={lat} lon={lon} styles={styles} onRadarChosen={onRadarChosen} />
          </View>
          {radarInfo?.name && (
            <Text style={[styles.muted, styles.alwaysWhite, { textAlign: 'center', paddingVertical: 8 }]}>
              Radarquelle: {radarInfo.name}
            </Text>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
