import {
  fetchForecastAtCoordinates,
  fetchWeatherAtCoordinates,
  resolvePlace,
  weatherConditionFromCode,
} from '../src/lib/weatherApi';

describe('Open-Meteo weather API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('normalizes WMO weather codes for the existing UI', () => {
    expect(weatherConditionFromCode(0)).toMatchObject({ id: 800, main: 'Clear', description: 'clear sky' });
    expect(weatherConditionFromCode(65)).toMatchObject({ main: 'Rain', description: 'heavy intensity rain' });
    expect(weatherConditionFromCode(95)).toMatchObject({ main: 'Thunderstorm' });
  });

  it('resolves a German place without an API key', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ name: 'Zürich', country_code: 'CH', latitude: 47.36667, longitude: 8.55 }],
      }),
    });

    await expect(resolvePlace('Zürich')).resolves.toEqual({
      name: 'Zürich',
      country: 'CH',
      latitude: 47.36667,
      longitude: 8.55,
    });
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('language=de');
    expect((global.fetch as jest.Mock).mock.calls[0][0]).not.toContain('apikey=');
  });

  it('maps current conditions and five daily forecasts', async () => {
    const response = {
      current: {
        temperature_2m: 21.4,
        apparent_temperature: 20.2,
        relative_humidity_2m: 63,
        weather_code: 2,
        wind_speed_10m: 1.8,
      },
      daily: {
        time: ['2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11'],
        temperature_2m_min: [12, 13, 14, 15, 16],
        temperature_2m_max: [22, 23, 24, 25, 26],
        weather_code: [2, 61, 63, 71, 95],
      },
    };
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => response });

    await expect(fetchWeatherAtCoordinates(47.37, 8.54, 'Zürich', 'CH')).resolves.toMatchObject({
      name: 'Zürich',
      coord: { lat: 47.37, lon: 8.54 },
      main: { temp: 21.4, feels_like: 20.2, temp_min: 12, temp_max: 22, humidity: 63 },
      wind: { speed: 1.8 },
      sys: { country: 'CH' },
    });

    const forecast = await fetchForecastAtCoordinates(47.37, 8.54);
    expect(forecast).toHaveLength(5);
    expect(forecast[1]).toEqual({ date: '2026-08-08', min: 13, max: 23, cond: 'light rain' });
  });

  it('reports a missing geocoding result clearly', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ results: [] }) });
    await expect(resolvePlace('gibt-es-nicht')).rejects.toThrow('Ort wurde nicht gefunden.');
  });
});
