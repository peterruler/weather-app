import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { computeSavedAfterRemove, computeSavedAfterSave, getCurrentPositionWithRetry } from "./src/utils";
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { enableScreens } from 'react-native-screens';
import { RootStackParamList, RootTabParamList } from "./src/navigation/types";
import WeatherScreenView from "./src/screens/WeatherScreen";
import ForecastScreenView from "./src/screens/ForecastScreen";
import CardsScreenView from "./src/screens/CardsScreen";

type WeatherResponse = {
  name: string;
  weather: { id: number; main: string; description: string; icon: string }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  wind?: { speed: number };
  sys?: { country?: string };
};

type InfoRow = { key: string; label: string; value: string };

const API_KEY = "ca4ab639490b58b65967f8a7816cb8d4";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialTopTabNavigator<RootTabParamList>();
enableScreens(true);

export default function App() {
  const systemScheme = useColorScheme();
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastDays, setForecastDays] = useState<{
    date: string;
    min: number;
    max: number;
    cond: string;
  }[]>([]);
  const [radarInfo, setRadarInfo] = useState<{ id: string; name: string } | null>(null);

  const isDark = themeMode === "dark" || (!themeMode && systemScheme === "dark");

  const theme = useMemo(
    () =>
      isDark
        ? {
            bg: "#0b1117",
            panelBg: "#0b1117",
            inputBg: "#1a1f27",
            text: "#d9e6f2",
            textStrong: "#e6f2ff",
            muted: "#b3c2d1",
            cardBg: "#1a1f27",
            border: "#2a3441",
            secondaryButtonBg: "#1f2630",
            secondaryButtonBorder: "#2a3441",
            buttonPrimaryBg: "#0A84FF",
            buttonPrimaryBorder: "#0a6ad1",
            buttonText: "#eef6ff",
            placeholder: "#999",
            // Backdrop for radar/maps in dark mode (light blue)
            mapBg: "#BFDBFE",
          }
        : {
            bg: "#f4f7fb",
            panelBg: "#f9fbfd",
            inputBg: "#ffffff",
            text: "#0b1117",
            textStrong: "#0b1117",
            muted: "#5b6675",
            cardBg: "#ffffff",
            border: "#d6dee6",
            secondaryButtonBg: "#e8eef5",
            secondaryButtonBorder: "#d6dee6",
            buttonPrimaryBg: "#0A84FF",
            buttonPrimaryBorder: "#0a6ad1",
            buttonText: "#eef6ff",
            placeholder: "#666",
            // Backdrop for radar/maps in light mode (light blue)
            mapBg: "#E0F2FE",
          },
    [isDark]
  );

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Optional background image (assets/bg.png). Falls back to solid dark color when missing.
  let bgImage: any = null;
  try {
    // If the file is not present, this will throw and we'll use the fallback.
    // Provide your image at: expo-weather/assets/bg.png
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    bgImage = require("./assets/bg.png");
  } catch {}

  const fetchWeather = useCallback(async (loc: string) => {
    if (!loc.trim()) {
      setError("Bitte gebe einen Ort ein.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const encoded = encodeURIComponent(loc.trim());
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encoded}&units=metric&appid=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) {
        const msg =
          res.status === 404
            ? "Ort wurde nicht gefunden."
            : `Anfrage fehlgeschlagen: ${res.status}`;
        throw new Error(msg);
      }
      const json: WeatherResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchForecast = useCallback(
    async (query: { city?: string; lat?: number; lon?: number }) => {
      if (!query.city && (query.lat == null || query.lon == null)) return;
      setForecastLoading(true);
      setForecastError(null);
      setForecastDays([]);
      try {
        let url = "";
        if (query.city) {
          const encoded = encodeURIComponent(query.city.trim());
          url = `https://api.openweathermap.org/data/2.5/forecast?q=${encoded}&units=metric&appid=${API_KEY}`;
        } else {
          url = `https://api.openweathermap.org/data/2.5/forecast?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${API_KEY}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Vorhersage fehlgeschlagen: ${res.status}`);
        const json = await res.json();
        // Group by day, compute min/max and pick noon condition
        const byDay: Record<string, { mins: number[]; maxs: number[]; conds: string[] }>= {};
        for (const item of json.list || []) {
          const dt = new Date((item.dt as number) * 1000);
          const key = dt.toISOString().slice(0, 10);
          const temp = item.main?.temp as number;
          const cond = (item.weather?.[0]?.description as string) || "";
          if (!byDay[key]) byDay[key] = { mins: [], maxs: [], conds: [] };
          byDay[key].mins.push(item.main?.temp_min ?? temp);
          byDay[key].maxs.push(item.main?.temp_max ?? temp);
          // Prefer midday conditions: collect all and we will pick around 12:00 later
          byDay[key].conds.push(`${dt.getHours()}:${cond}`);
        }
        const days = Object.keys(byDay)
          .sort()
          .slice(0, 5)
          .map((k) => {
            const d = byDay[k];
            const min = Math.round(Math.min(...d.mins));
            const max = Math.round(Math.max(...d.maxs));
            // pick condition closest to 12:00
            let chosen = d.conds[0] ?? "";
            let bestDelta = 999;
            for (const c of d.conds) {
              const h = parseInt(c.split(":")[0] || "0", 10);
              const delta = Math.abs(12 - h);
              if (delta < bestDelta) {
                bestDelta = delta;
                chosen = c;
              }
            }
            const cond = chosen.split(":").slice(1).join(":");
            return { date: k, min, max, cond };
          });
        setForecastDays(days);
      } catch (e: any) {
        setForecastError(e?.message || "Vorhersage konnte nicht geladen werden.");
      } finally {
        setForecastLoading(false);
      }
    },
    []
  );

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number) => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Anfrage fehlgeschlagen: ${res.status}`);
        }
        const json: WeatherResponse = await res.json();
        setData(json);
        const display = [json.name, json.sys?.country].filter(Boolean).join(", ");
        if (display) setLocation(display);
      } catch (e: any) {
        setError(e?.message || "Etwas ist schiefgelaufen.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onSubmit = useCallback(() => {
    fetchWeather(location);
    Keyboard.dismiss();
  }, [location, fetchWeather]);

  // Saved locations persistence
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("@saved_locations");
        if (raw) setSaved(JSON.parse(raw));
        const t = await AsyncStorage.getItem("@theme_mode");
        if (t === "light" || t === "dark") setThemeMode(t);
      } catch {}
    })();
  }, []);

  const persistSaved = useCallback(async (next: string[]) => {
    setSaved(next);
    try {
      await AsyncStorage.setItem("@saved_locations", JSON.stringify(next));
    } catch {}
  }, []);

  const saveLocation = useCallback((name: string) => {
    const next = computeSavedAfterSave(saved, name);
    if (next !== saved) persistSaved(next);
  }, [saved, persistSaved]);

  const removeLocation = useCallback((name: string) => {
    const next = computeSavedAfterRemove(saved, name);
    persistSaved(next);
  }, [saved, persistSaved]);

  const onPressSaved = useCallback(
    (name: string) => {
      setLocation(name);
      fetchWeather(name);
    },
    [fetchWeather]
  );

  const useMyLocation = useCallback(async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Standortberechtigung erforderlich.");
        return;
      }
      const pos = await getCurrentPositionWithRetry();
      await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      // Try reverse geocode for display + saving
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const p = places?.[0];
        const display = [p?.city || p?.subregion, p?.country].filter(Boolean).join(", ");
        if (display) {
          setLocation(display);
          saveLocation(display);
        }
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Konnte Standort nicht ermitteln.");
    }
  }, [fetchWeatherByCoords, saveLocation]);

  const conditions = data?.weather?.[0]?.main ?? "";
  const conditionDesc = (data?.weather?.[0]?.description ?? "").toLowerCase();

  // Deutsch-Übersetzungen für OpenWeatherMap
  const translateWeather = useCallback((w?: { id?: number; main?: string; description?: string }) => {
    const id = w?.id ?? 0;
    const main = (w?.main ?? "").toLowerCase();
    const desc = (w?.description ?? "").toLowerCase();

    const mainMap: Record<string, string> = {
      clear: "Klar",
      clouds: "Wolken",
      rain: "Regen",
      drizzle: "Nieselregen",
      thunderstorm: "Gewitter",
      snow: "Schnee",
      mist: "Nebel",
      smoke: "Rauch",
      haze: "Dunst",
      dust: "Staub",
      fog: "Nebel",
      sand: "Sand",
      ash: "Asche",
      squall: "Böen",
      tornado: "Tornado",
    };

    const descMap: Record<string, string> = {
      // Clear/Clouds
      "clear sky": "Klarer Himmel",
      "few clouds": "Wenige Wolken",
      "scattered clouds": "Aufgelockerte Bewölkung",
      "broken clouds": "Aufgerissene Bewölkung",
      "overcast clouds": "Bedeckt",
      // Rain
      "light rain": "Leichter Regen",
      "moderate rain": "Mäßiger Regen",
      "heavy intensity rain": "Starker Regen",
      "very heavy rain": "Sehr starker Regen",
      "extreme rain": "Extremer Regen",
      "freezing rain": "Gefrierender Regen",
      "light intensity shower rain": "Leichter Regenschauer",
      "shower rain": "Regenschauer",
      "heavy intensity shower rain": "Heftiger Regenschauer",
      "ragged shower rain": "Unregelmäßiger Regenschauer",
      // Drizzle
      "light intensity drizzle": "Leichter Nieselregen",
      drizzle: "Nieselregen",
      "heavy intensity drizzle": "Starker Nieselregen",
      "light intensity drizzle rain": "Leichter Nieselregen",
      "drizzle rain": "Nieselregen",
      "heavy intensity drizzle rain": "Starker Nieselregen",
      "shower rain and drizzle": "Schauer und Nieselregen",
      "heavy shower rain and drizzle": "Starker Schauer und Nieselregen",
      "shower drizzle": "Nieselschauer",
      // Thunderstorm
      "thunderstorm with light rain": "Gewitter mit leichtem Regen",
      "thunderstorm with rain": "Gewitter mit Regen",
      "thunderstorm with heavy rain": "Gewitter mit starkem Regen",
      "light thunderstorm": "Leichtes Gewitter",
      thunderstorm: "Gewitter",
      "heavy thunderstorm": "Starkes Gewitter",
      "ragged thunderstorm": "Unregelmäßiges Gewitter",
      // Snow
      "light snow": "Leichter Schneefall",
      snow: "Schnee",
      "heavy snow": "Starker Schneefall",
      sleet: "Schneeregen",
      "light shower sleet": "Leichter Schneeregenschauer",
      "shower sleet": "Schneeregenschauer",
      "light rain and snow": "Leichter Regen und Schnee",
      "rain and snow": "Regen und Schnee",
      "light shower snow": "Leichter Schneeschauer",
      "shower snow": "Schneeschauer",
      "heavy shower snow": "Heftiger Schneeschauer",
      // Atmosphere
      mist: "Nebel",
      smoke: "Rauch",
      haze: "Dunst",
      "sand/dust whirls": "Sand-/Staubwirbel",
      fog: "Nebel",
      sand: "Sand",
      dust: "Staub",
      "volcanic ash": "Vulkanasche",
      squalls: "Böen",
      tornado: "Tornado",
    };

    // Prefer code-specific mapping for clouds variants
    let deDesc: string | undefined;
    if (id === 800) deDesc = "Klarer Himmel";
    else if (id === 801) deDesc = "Wenige Wolken";
    else if (id === 802) deDesc = "Aufgelockerte Bewölkung";
    else if (id === 803) deDesc = "Aufgerissene Bewölkung";
    else if (id === 804) deDesc = "Bedeckt";
    else deDesc = descMap[desc];

    const deMain = mainMap[main] || (deDesc ? deDesc : w?.main ?? "");
    return { deMain, deDesc: deDesc ?? (w?.description ?? "") };
  }, []);

  const heroImage = useMemo(() => {
    const cond = conditions.toLowerCase();
    const text = `${cond} ${conditionDesc}`; // combine for robust matching

    if (
      text.includes("snow") ||
      text.includes("sleet")
    ) {
      try { return require("./assets/img/snowy.png"); } catch { return require("./assets/img/cloudy.png"); }
    }
    if (
      text.includes("rain") ||
      text.includes("drizzle") ||
      text.includes("thunder")
    ) {
      return require("./assets/img/rainy.png");
    }
    if (text.includes("cloud")) {
      return require("./assets/img/cloudy.png");
    }
    if (text.includes("clear") || text.includes("sun")) {
      return require("./assets/img/sunny.png");
    }
    // Fallbacks
    return require("./assets/img/cloudy.png");
  }, [conditions, conditionDesc]);

  const infoList: InfoRow[] = useMemo(() => {
    if (!data) return [];
    const de = translateWeather(data.weather?.[0]);
    return [
      {
        key: "temp",
        label: "Temperatur",
        value: `${Math.round(data.main.temp)}°C`,
      },
      {
        key: "feels",
        label: "Gefühlt",
        value: `${Math.round(data.main.feels_like)}°C`,
      },
      {
        key: "minmax",
        label: "Min/Max",
        value: `${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°C`,
      },
      {
        key: "humidity",
        label: "Luftfeuchtigkeit",
        value: `${data.main.humidity}%`,
      },
      { key: "wind", label: "Wind", value: `${data.wind?.speed ?? 0} m/s` },
      { key: "cond", label: "Bedingung", value: `${de.deDesc || "-"}` },
    ];
  }, [data, translateWeather]);

  const WeatherCards = ({ w }: { w: WeatherResponse }) => {
    const de = translateWeather(w.weather?.[0]);
    const cards = [
      { key: "city", label: "Ort", value: `${w.name}${w.sys?.country ? ", " + w.sys.country : ""}` },
      { key: "temp", label: "Temperatur", value: `${Math.round(w.main.temp)}°C` },
      { key: "feels", label: "Gefühlt", value: `${Math.round(w.main.feels_like)}°C` },
      { key: "minmax", label: "Min/Max", value: `${Math.round(w.main.temp_min)}° / ${Math.round(w.main.temp_max)}°C` },
      { key: "humidity", label: "Luftfeuchtigkeit", value: `${w.main.humidity}%` },
      { key: "wind", label: "Wind", value: `${w.wind?.speed ?? 0} m/s` },
      { key: "cond", label: "Bedingung", value: de.deDesc || "-" },
    ];
    return (
      <View style={styles.cardsGrid}>
        {cards.map((c) => (
          <View key={c.key} style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>{c.label}</Text>
            <Text style={styles.infoCardValue}>{c.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const WeatherScreen = () => (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
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
              onPress={async () => {
                const next = themeMode === "dark" ? "light" : "dark";
                setThemeMode(next);
                try {
                  await AsyncStorage.setItem("@theme_mode", next);
                } catch {}
              }}
              style={[styles.button, styles.secondaryButton, styles.fullWidth]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>{isDark ? "☀️ Hell" : "🌙 Dunkel"}</Text>
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
                    {data.sys?.country ? `, ${data.sys.country}` : ""}
                  </Text>
                  <Text style={styles.condition}>{translateWeather(data.weather?.[0]).deMain}</Text>
                </View>
                <Image source={heroImage} style={styles.hero} resizeMode="contain" />
              </View>

              <FlatList
                data={infoList}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const isCond = item.key === "cond";
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

  const ForecastScreen = () => {
    useEffect(() => {
      const city = data?.name || location.trim();
      if (city) fetchForecast({ city });
    }, [data?.name, location]);

    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
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
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({ item }) => (
                    <View style={styles.row}>
                      <Text style={styles.label}>{new Date(item.date).toLocaleDateString()}</Text>
                      <Text style={styles.value}>
                        {item.min}° / {item.max}°C — {item.cond}
                      </Text>
                    </View>
                  )}
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
  };

  const CardsScreen = () => (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />
      <ImageBackground source={bgImage ?? undefined} style={styles.bg} resizeMode="cover" imageStyle={styles.bgImage}>
        <View style={styles.container}>
          <Text style={styles.title}>Wetter-Karten</Text>
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
                      {data.sys?.country ? `, ${data.sys.country}` : ""}
                    </Text>
                    <Text style={styles.condition}>{translateWeather(data.weather?.[0]).deMain}</Text>
                  </View>
                  <Image source={heroImage} style={styles.hero} resizeMode="contain" />
                </View>
                <WeatherCards w={data} />
              </>
            )}
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );

  const navTheme = isDark ? NavDarkTheme : NavLightTheme;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RootTabs">
          {() => (
            <Tab.Navigator
              screenOptions={{
                tabBarIndicatorStyle: { backgroundColor: theme.buttonText },
                tabBarStyle: { backgroundColor: "transparent" },
              }}
            >
              <Tab.Screen name="Weather" options={{ title: "Wetter" }}>
                {() => (
                  <WeatherScreenView
                    styles={styles}
                    isDark={isDark}
                    themeMode={themeMode}
                    setThemeMode={async (m) => {
                      setThemeMode(m);
                      try { await AsyncStorage.setItem("@theme_mode", m); } catch {}
                    }}
                    theme={theme}
                    bgImage={bgImage}
                    location={location}
                    setLocation={setLocation}
                    onSubmit={onSubmit}
                    useMyLocation={useMyLocation}
                    saveLocation={saveLocation}
                    saved={saved}
                    onPressSaved={onPressSaved}
                    removeLocation={removeLocation}
                    loading={loading}
                    error={error}
                    data={data}
                    translateWeather={translateWeather}
                    heroImage={heroImage}
                    infoList={infoList}
                    radarInfo={radarInfo}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name="Forecast" options={{ title: "Fünf Tages Prognose" }}>
                {() => (
                  <ForecastScreenView
                    styles={styles}
                    isDark={isDark}
                    bgImage={bgImage}
                    data={data}
                    location={location}
                    forecastLoading={forecastLoading}
                    forecastError={forecastError}
                    forecastDays={forecastDays}
                    fetchForecast={fetchForecast}
                    translateWeather={translateWeather}
                  />
                )}
              </Tab.Screen>
              <Tab.Screen name="Cards" options={{ title: "Wetter-Karten" }}>
                {() => (
                  <CardsScreenView
                    styles={styles}
                    bgImage={bgImage}
                    data={data}
                    heroImage={heroImage}
                    translateWeather={translateWeather}
                    isDark={isDark}
                    setThemeMode={async (m) => {
                      setThemeMode(m);
                      try { await AsyncStorage.setItem("@theme_mode", m); } catch {}
                    }}
                    onRadarChosen={(info) => setRadarInfo(info)}
                    radarInfo={radarInfo}
                  />
                )}
              </Tab.Screen>
            </Tab.Navigator>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const makeStyles = (theme: {
  bg: string;
  panelBg: string;
  inputBg: string;
  text: string;
  textStrong: string;
  muted: string;
  cardBg: string;
  border: string;
  secondaryButtonBg: string;
  secondaryButtonBorder: string;
  buttonPrimaryBg: string;
  buttonPrimaryBorder: string;
  buttonText: string;
  placeholder: string;
  mapBg: string;
}) =>
StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  bg: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingTop: Platform.select({
      ios: 0,
      android: StatusBar.currentHeight ?? 0,
    }),
    paddingHorizontal: 16,
  },
    title: {
      fontSize: 28,
      fontWeight: "700",
      marginTop: 12,
      marginBottom: 12,
      color: "#ffffff",
    },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: theme.inputBg,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 16,
    color: theme.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  button: {
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: theme.buttonPrimaryBg,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.buttonPrimaryBorder,
  },
  buttonText: {
    color: theme.buttonText,
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: theme.secondaryButtonBg,
    borderColor: theme.secondaryButtonBorder,
  },
  secondaryButtonText: {
    color: theme.textStrong,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  fullWidth: {
    width: '100%',
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  cardText: {
    color: theme.text,
    fontWeight: "600",
  },
  cardRemove: {
    color: theme.muted,
    marginLeft: 4,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  muted: {
    color: theme.muted,
    marginTop: 8,
  },
  error: {
    color: "#ff8a80",
    fontWeight: "600",
  },
  alwaysWhite: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
    location: {
      fontSize: 22,
      fontWeight: "700",
      color: "#ffffff",
    },
    condition: {
      fontSize: 16,
      color: "#ffffff",
      marginTop: 4,
    },
  hero: {
    width: 84,
    height: 84,
  },
  listContent: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
    label: {
      fontSize: 16,
      color: "#ffffff",
    },
    value: {
      fontSize: 16,
      fontWeight: "600",
      color: "#ffffff",
    },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconSmall: {
    width: 20,
    height: 20,
  },
  separator: {
    height: 1,
    backgroundColor: theme.border,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: theme.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  infoCardLabel: {
    color: theme.muted,
    marginBottom: 6,
    fontSize: 13,
  },
  infoCardValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Used by Wetter‑Karten radar to ensure a good-contrast backdrop
  radarContainer: {
    backgroundColor: theme.mapBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
});
