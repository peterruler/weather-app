export const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export type WeatherCondition = {
  id: number;
  main: string;
  description: string;
  icon: string;
};

export type WeatherResponse = {
  name: string;
  coord: { lat: number; lon: number };
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  wind: { speed: number };
  sys?: { country?: string };
};

export type ForecastDay = {
  date: string;
  min: number;
  max: number;
  cond: string;
};

export type ResolvedPlace = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    weather_code?: number[];
  };
};

type GeocodingResponse = {
  results?: Array<{
    name?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
  }>;
};

const condition = (id: number, main: string, description: string): WeatherCondition => ({
  id,
  main,
  description,
  icon: '',
});

export function weatherConditionFromCode(code: number): WeatherCondition {
  if (code === 0) return condition(800, 'Clear', 'clear sky');
  if (code === 1) return condition(801, 'Clouds', 'few clouds');
  if (code === 2) return condition(802, 'Clouds', 'scattered clouds');
  if (code === 3) return condition(804, 'Clouds', 'overcast clouds');
  if (code === 45 || code === 48) return condition(741, 'Fog', 'fog');
  if (code >= 51 && code <= 55) return condition(301, 'Drizzle', 'drizzle');
  if (code === 56 || code === 57) return condition(511, 'Drizzle', 'freezing rain');
  if (code === 61) return condition(500, 'Rain', 'light rain');
  if (code === 63) return condition(501, 'Rain', 'moderate rain');
  if (code === 65) return condition(502, 'Rain', 'heavy intensity rain');
  if (code === 66 || code === 67) return condition(511, 'Rain', 'freezing rain');
  if (code === 71) return condition(600, 'Snow', 'light snow');
  if (code === 73 || code === 77) return condition(601, 'Snow', 'snow');
  if (code === 75) return condition(602, 'Snow', 'heavy snow');
  if (code === 80) return condition(520, 'Rain', 'light intensity shower rain');
  if (code === 81) return condition(521, 'Rain', 'shower rain');
  if (code === 82) return condition(522, 'Rain', 'heavy intensity shower rain');
  if (code === 85) return condition(620, 'Snow', 'light shower snow');
  if (code === 86) return condition(622, 'Snow', 'heavy shower snow');
  if (code === 95) return condition(200, 'Thunderstorm', 'thunderstorm');
  if (code === 96 || code === 99) return condition(202, 'Thunderstorm', 'thunderstorm with heavy rain');
  return condition(804, 'Clouds', 'overcast clouds');
}

const buildForecastUrl = (latitude: number, longitude: number, includeCurrent: boolean): string => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
    forecast_days: '5',
  });
  if (includeCurrent) {
    params.set(
      'current',
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    );
    params.set('wind_speed_unit', 'ms');
  }
  return `${OPEN_METEO_FORECAST_URL}?${params.toString()}`;
};

const fetchJson = async <T>(url: string, failureMessage: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${failureMessage} (Status ${response.status}).`);
  return await response.json() as T;
};

export async function resolvePlace(query: string): Promise<ResolvedPlace> {
  const params = new URLSearchParams({ name: query.trim(), count: '1', language: 'de', format: 'json' });
  const json = await fetchJson<GeocodingResponse>(
    `${OPEN_METEO_GEOCODING_URL}?${params.toString()}`,
    'Ortssuche fehlgeschlagen',
  );
  const place = json.results?.[0];
  if (!place?.name || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
    throw new Error('Ort wurde nicht gefunden.');
  }
  return {
    name: place.name,
    country: place.country_code,
    latitude: place.latitude as number,
    longitude: place.longitude as number,
  };
}

export async function fetchWeatherAtCoordinates(
  latitude: number,
  longitude: number,
  name: string,
  country?: string,
): Promise<WeatherResponse> {
  const json = await fetchJson<OpenMeteoResponse>(
    buildForecastUrl(latitude, longitude, true),
    'Wetterabruf fehlgeschlagen',
  );
  const current = json.current;
  if (!current || !Number.isFinite(current.temperature_2m)) {
    throw new Error('Der Wetterdienst liefert aktuell keine Messwerte.');
  }
  const temperature = current.temperature_2m as number;
  return {
    name,
    coord: { lat: latitude, lon: longitude },
    weather: [weatherConditionFromCode(current.weather_code ?? -1)],
    main: {
      temp: temperature,
      feels_like: current.apparent_temperature ?? temperature,
      temp_min: json.daily?.temperature_2m_min?.[0] ?? temperature,
      temp_max: json.daily?.temperature_2m_max?.[0] ?? temperature,
      humidity: current.relative_humidity_2m ?? 0,
    },
    wind: { speed: current.wind_speed_10m ?? 0 },
    sys: { country },
  };
}

export async function fetchForecastAtCoordinates(
  latitude: number,
  longitude: number,
): Promise<ForecastDay[]> {
  const json = await fetchJson<OpenMeteoResponse>(
    buildForecastUrl(latitude, longitude, false),
    'Vorhersage fehlgeschlagen',
  );
  const dates = json.daily?.time ?? [];
  return dates.slice(0, 5).map((date, index) => ({
    date,
    min: Math.round(json.daily?.temperature_2m_min?.[index] ?? 0),
    max: Math.round(json.daily?.temperature_2m_max?.[index] ?? 0),
    cond: weatherConditionFromCode(json.daily?.weather_code?.[index] ?? -1).description,
  }));
}
