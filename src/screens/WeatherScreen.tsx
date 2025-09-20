import React from 'react';
import { ActivityIndicator, FlatList, Image, ImageBackground, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  styles: any;
  isDark: boolean;
  themeMode: 'light' | 'dark';
  setThemeMode: (m: 'light' | 'dark') => void;
  theme: any;
  bgImage: any;
  location: string;
  setLocation: (v: string) => void;
  onSubmit: () => void;
  useMyLocation: () => void;
  saveLocation: (name: string) => void;
  saved: string[];
  onPressSaved: (name: string) => void;
  removeLocation: (name: string) => void;
  loading: boolean;
  error: string | null;
  data: any;
  translateWeather: (w?: { id?: number; main?: string; description?: string }) => { deMain: string; deDesc: string };
  heroImage: any;
  infoList: { key: string; label: string; value: string }[];
  radarInfo?: { id: string; name: string } | null;
};

export default function WeatherScreen(props: Props) {
  const { styles, isDark, themeMode, setThemeMode, theme, bgImage, location, setLocation, onSubmit, useMyLocation, saveLocation, saved, onPressSaved, removeLocation, loading, error, data, translateWeather, heroImage, infoList, radarInfo } = props;

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={bgImage ?? undefined} style={styles.bg} resizeMode="cover" imageStyle={styles.bgImage}>
        <View style={styles.container}>
          <Text style={styles.title}>Wetter</Text>

          <View style={styles.searchRow}>
            <TextInput
              placeholder="Stadt eingeben (z. B. Berlin)"
              placeholderTextColor={theme.placeholder}
              value={location}
              onChangeText={setLocation}
              onSubmitEditing={onSubmit}
              returnKeyType="search"
              style={styles.input}
              autoCapitalize="words"
            />
            <TouchableOpacity accessibilityRole="button" onPress={onSubmit} style={styles.button}>
              <Text style={styles.buttonText}>Suchen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={useMyLocation} style={[styles.button, styles.secondaryButton]}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>📍 Meinen Standort</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => saveLocation(location)} style={[styles.button, styles.secondaryButton]}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>➕ Speichern</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const next = themeMode === 'dark' ? 'light' : 'dark';
                setThemeMode(next);
              }}
              style={[styles.button, styles.secondaryButton, styles.fullWidth]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>{isDark ? '☀️ Hell' : '🌙 Dunkel'}</Text>
            </TouchableOpacity>
          </View>

          {saved.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <FlatList
                horizontal
                data={saved}
                keyExtractor={(item) => item}
                contentContainerStyle={{ gap: 8 }}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <TouchableOpacity onPress={() => onPressSaved(item)}>
                      <Text style={styles.cardText}>{item}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeLocation(item)} accessibilityRole="button">
                      <Text style={styles.cardRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#9bdcff" />
              <Text style={styles.muted}>Laden...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : data ? (
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.location}>
                    {data.name}
                    {data.sys?.country ? `, ${data.sys.country}` : ''}
                  </Text>
                  <Text style={styles.condition}>{translateWeather(data.weather?.[0]).deMain}</Text>
                  {radarInfo?.name && (
                    <Text style={styles.condition}>Radar: {radarInfo.name}</Text>
                  )}
                </View>
                <Image source={heroImage} style={styles.hero} resizeMode="contain" />
              </View>

              <FlatList
                data={infoList}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const isCond = item.key === 'cond';
                  return (
                    <View style={styles.row}>
                      <Text style={styles.label}>{item.label}</Text>
                      {isCond ? (
                        <View style={styles.valueRow}>
                          <Image source={heroImage} style={styles.iconSmall} resizeMode="contain" />
                          <Text style={styles.value}>{item.value}</Text>
                        </View>
                      ) : (
                        <Text style={styles.value}>{item.value}</Text>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={[styles.muted, styles.alwaysWhite]}>Suche nach einer Stadt, um das Wetter zu sehen.</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
