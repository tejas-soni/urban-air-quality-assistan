import { describe, it, expect } from 'vitest';
import {
  normalizeIqAir,
  normalizeOpenWeather,
  normalizeOpenAq,
  normalizeAirNow,
} from './mappers';

describe('AQI provider normalizers', () => {
  it('normalizes valid IQAir payloads and rejects invalid ones', () => {
    const ok = normalizeIqAir({
      data: {
        city: 'Delhi',
        country: 'India',
        location: { coordinates: [77.2, 28.6] },
        current: { pollution: { aqius: 184 } },
      },
    });
    expect(ok).toEqual({ city: 'Delhi', country: 'India', lon: 77.2, lat: 28.6, aqi: 184 });
    expect(normalizeIqAir(null)).toBeNull();
    expect(normalizeIqAir({ data: {} })).toBeNull();
  });

  it('normalizes OpenWeather current and 5-day forecast', () => {
    const current = {
      list: [{ components: { pm2_5: 45.4, pm10: 78, o3: 55, no2: 40 } }],
    };
    const forecast = {
      list: [
        { dt: 1735689600, components: { pm2_5: 40 } },
        { dt: 1735700400, components: { pm2_5: 50 } },
        { dt: 1735776000, components: { pm2_5: 30 } },
      ],
    };
    const ok = normalizeOpenWeather(current, forecast);
    expect(ok?.aqi).toBeGreaterThan(100);
    expect(ok?.pollutants?.pm25).toBe(45.4);
    expect(ok?.forecast5d?.length).toBe(2);
    expect(normalizeOpenWeather({})).toBeNull();
  });

  it('normalizes OpenAQ v3 monitor payloads', () => {
    const ok = normalizeOpenAq({
      results: [
        {
          sensors: [{ parameter: { name: 'pm25' }, latest: { value: 22.34 } }],
        },
      ],
    });
    expect(ok?.pollutants?.pm25).toBe(22.3);
    expect(normalizeOpenAq({ results: [{ sensors: [] }] })).toBeNull();
  });

  it('normalizes AirNow observation arrays', () => {
    const ok = normalizeAirNow([
      { ParameterName: 'O3', AQI: 40, ReportingArea: 'Salt Lake' },
      { ParameterName: 'PM2.5', AQI: 112, ReportingArea: 'Salt Lake' },
    ]);
    expect(ok).toEqual({ city: 'Salt Lake', aqi: 112 });
    expect(normalizeAirNow([])).toBeNull();
    expect(normalizeAirNow([{}])).toBeNull();
  });
});
