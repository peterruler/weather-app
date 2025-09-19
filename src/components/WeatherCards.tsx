import React from 'react';
import { View, Text } from 'react-native';

type Weather = {
  name: string;
  sys?: { country?: string };
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; humidity: number };
  wind?: { speed?: number };
  weather?: { id?: number; main?: string; description?: string }[];
};

type Props = {
  w: Weather;
  styles: any;
  translateWeather: (w?: { id?: number; main?: string; description?: string }) => { deMain: string; deDesc: string };
};

export default function WeatherCards({ w, styles, translateWeather }: Props) {
  const de = translateWeather(w.weather?.[0]);
  const cards = [
    { key: 'city', label: 'Ort', value: `${w.name}${w.sys?.country ? ", " + w.sys.country : ""}` },
    { key: 'temp', label: 'Temperatur', value: `${Math.round(w.main.temp)}°C` },
    { key: 'feels', label: 'Gefühlt', value: `${Math.round(w.main.feels_like)}°C` },
    { key: 'minmax', label: 'Min/Max', value: `${Math.round(w.main.temp_min)}° / ${Math.round(w.main.temp_max)}°C` },
    { key: 'humidity', label: 'Luftfeuchtigkeit', value: `${w.main.humidity}%` },
    { key: 'wind', label: 'Wind', value: `${w.wind?.speed ?? 0} m/s` },
    { key: 'cond', label: 'Bedingung', value: de.deDesc || '-' },
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
}

