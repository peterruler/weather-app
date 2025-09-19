import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, SafeAreaView, Text, View } from 'react-native';

type Day = { date: string; min: number; max: number; cond: string };

type Props = {
  styles: any;
  isDark: boolean;
  bgImage: any;
  data: any;
  location: string;
  forecastLoading: boolean;
  forecastError: string | null;
  forecastDays: Day[];
  fetchForecast: (q: { city?: string; lat?: number; lon?: number }) => Promise<void>;
  translateWeather: (w?: { id?: number; main?: string; description?: string }) => { deMain: string; deDesc: string };
};

export default function ForecastScreen({ styles, isDark, bgImage, data, location, forecastLoading, forecastError, forecastDays, fetchForecast, translateWeather }: Props) {
  const weekdayAbbr = (d: Date) => {
    const abbr = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']; // German short names without dot
    return abbr[d.getDay()];
  };
  useEffect(() => {
    const city = data?.name || location.trim();
    if (city) fetchForecast({ city });
  }, [data?.name, location]);

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage ?? undefined} style={styles.bg} resizeMode="cover" imageStyle={styles.bgImage}>
        <View style={styles.container}>
          <Text style={styles.title}>Fünf Tages Prognose</Text>
          <View style={styles.content}>
            {forecastLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#9bdcff" />
                <Text style={styles.muted}>Vorhersage wird geladen...</Text>
              </View>
            ) : forecastError ? (
              <View style={styles.center}>
                <Text style={styles.error}>{forecastError}</Text>
              </View>
            ) : forecastDays.length > 0 ? (
              <FlatList
                data={forecastDays}
                keyExtractor={(item) => item.date}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: '#ffffff' }]} />
                )}
                renderItem={({ item }) => {
                  const de = translateWeather({ description: item.cond });
                  // Swiss German variant: replace "ß" with "ss" for forecast text
                  const swissDesc = (de.deDesc || item.cond).replace(/ß/g, 'ss');
                  const dt = new Date(item.date);
                  const wd = weekdayAbbr(dt);
                  const dateStr = dt.toLocaleDateString('de-DE');
                  return (
                    <View style={styles.row}>
                      <Text style={styles.label}>{wd}, {dateStr}</Text>
                      <Text style={styles.value}>
                        {item.min}° / {item.max}°C — {swissDesc}
                      </Text>
                    </View>
                  );
                }}
              />
            ) : (
              <View style={styles.center}>
                <Text style={[styles.muted, styles.alwaysWhite]}>Bitte wähle zuerst einen Ort auf dem Wetter-Tab.</Text>
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
