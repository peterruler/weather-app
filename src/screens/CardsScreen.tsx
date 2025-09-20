import React from 'react';
import { Image, ImageBackground, SafeAreaView, Text, View, TouchableOpacity } from 'react-native';
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

export default function CardsScreen({ styles, bgImage, data, heroImage, translateWeather, isDark, setThemeMode, onRadarChosen, radarInfo }: Props) {
  const lat = (data as any)?.coord?.lat as number | undefined;
  const lon = (data as any)?.coord?.lon as number | undefined;
  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage ?? undefined} style={styles.bg} resizeMode="cover" imageStyle={styles.bgImage}>
        <View style={styles.container}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <Text style={styles.title}>Niederschlagsradar</Text>
          </View>
          <View style={styles.content}>
            {!data ? (
              <View style={styles.center}>
                <Text style={[styles.muted, styles.alwaysWhite]}>Bitte wähle zuerst einen Ort auf dem Wetter-Tab.</Text>
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>
          {radarInfo?.id === 'composite' && (
            <View style={{ paddingTop: 8, paddingBottom: 8 }}>
              <Text style={[styles.muted, styles.alwaysWhite, { textAlign: 'center' }]}>toe radar und Radar: Komposit</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
