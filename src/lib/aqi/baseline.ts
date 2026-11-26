import { classifyAqi, pm25ToUsAqi, whoGuidelineRatio } from '@/lib/aqi/bands';
import type { AqiReading, ForecastPoint } from '@/lib/types';

interface CitySeed {
  city: string;
  country: string;
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

const CITY_SEEDS: ReadonlyArray<CitySeed> = [
  { city: 'New Delhi', country: 'IN', lat: 28.6139, lon: 77.209, pm25: 138, pm10: 230, no2: 58, o3: 42 },
  { city: 'Lahore', country: 'PK', lat: 31.5204, lon: 74.3587, pm25: 152, pm10: 255, no2: 54, o3: 39 },
  { city: 'Beijing', country: 'CN', lat: 39.9042, lon: 116.4074, pm25: 62, pm10: 108, no2: 44, o3: 52 },
  { city: 'Salt Lake City', country: 'US', lat: 40.7608, lon: -111.891, pm25: 42, pm10: 66, no2: 34, o3: 48 },
  { city: 'Los Angeles', country: 'US', lat: 34.0522, lon: -118.2437, pm25: 29, pm10: 49, no2: 38, o3: 68 },
  { city: 'London', country: 'GB', lat: 51.5072, lon: -0.1276, pm25: 19, pm10: 31, no2: 32, o3: 44 },
  { city: 'Milan', country: 'IT', lat: 45.4642, lon: 9.19, pm25: 48, pm10: 76, no2: 45, o3: 38 },
  { city: 'Krakow', country: 'PL', lat: 50.0647, lon: 19.945, pm25: 58, pm10: 88, no2: 40, o3: 34 },
  { city: 'Ulaanbaatar', country: 'MN', lat: 47.8864, lon: 106.9057, pm25: 115, pm10: 185, no2: 49, o3: 30 },
  { city: 'Mexico City', country: 'MX', lat: 19.4326, lon: -99.1332, pm25: 37, pm10: 68, no2: 46, o3: 82 },
  { city: 'New York', country: 'US', lat: 40.7128, lon: -74.006, pm25: 14, pm10: 25, no2: 28, o3: 46 },
  { city: 'Toronto', country: 'CA', lat: 43.6532, lon: -79.3832, pm25: 11, pm10: 20, no2: 22, o3: 45 },
];

const DIURNAL_SLOTS: ReadonlyArray<{ label: string; factor: number; lowest?: boolean }> = [
  { label: '00:00', factor: 1.15 },
  { label: '03:00', factor: 1.1 },
  { label: '06:00', factor: 1.24 },
  { label: '08:00', factor: 1.28 },
  { label: '11:00', factor: 0.96 },
  { label: '14:00', factor: 0.74, lowest: true },
  { label: '17:00', factor: 0.94 },
  { label: '21:00', factor: 1.26 },
];

export const POPULAR_CITIES = CITY_SEEDS.map((c) => c.city);

function hashCity(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 10000;
  }
  return hash;
}

/** Builds a 24-hour winter inversion profile from a baseline PM2.5 reading. */
export function build24hForecast(basePm25: number): ForecastPoint[] {
  const safeBase = Math.max(2, Number.isFinite(basePm25) ? basePm25 : 2);
  return DIURNAL_SLOTS.map((slot) => {
    const pm25 = Math.round(safeBase * slot.factor * 10) / 10;
    return {
      hourLabel: slot.label,
      pm25,
      aqi: pm25ToUsAqi(pm25),
      isLowestWindow: Boolean(slot.lowest),
    };
  });
}

/** Builds a deterministic 5-day outlook from baseline PM2.5. */
export function build5dForecast(basePm25: number): AqiReading['forecast5d'] {
  const safeBase = Math.max(2, Number.isFinite(basePm25) ? basePm25 : 2);
  const factors = [1.0, 0.92, 1.08, 0.84, 0.95];
  const labels = ['Today', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
  return labels.map((dayLabel, idx) => {
    const avgPm25 = Math.round(safeBase * factors[idx] * 10) / 10;
    return {
      dayLabel,
      avgPm25,
      minAqi: pm25ToUsAqi(avgPm25 * 0.74),
      maxAqi: pm25ToUsAqi(avgPm25 * 1.26),
    };
  });
}

/** Returns a deterministic seasonal baseline AQI reading for any city when APIs are offline. */
export function buildBaselineReading(cityName: string, now: Date = new Date()): AqiReading {
  const clean = cityName.trim() || 'London';
  const match = CITY_SEEDS.find((c) => c.city.toLowerCase() === clean.toLowerCase());
  const h = hashCity(clean.toLowerCase());
  const seed: CitySeed = match ?? {
    city: clean,
    country: 'Urban',
    lat: 35 + (h % 20),
    lon: -100 + (h % 180),
    pm25: 18 + (h % 65),
    pm10: 32 + (h % 95),
    no2: 24 + (h % 32),
    o3: 36 + (h % 36),
  };

  const aqi = pm25ToUsAqi(seed.pm25);
  return {
    city: seed.city,
    country: seed.country,
    lat: seed.lat,
    lon: seed.lon,
    aqi,
    band: classifyAqi(aqi).band,
    dominantPollutant: 'pm25',
    pollutants: { pm25: seed.pm25, pm10: seed.pm10, o3: seed.o3, no2: seed.no2 },
    whoRatio: whoGuidelineRatio(seed.pm25),
    forecast24h: build24hForecast(seed.pm25),
    forecast5d: build5dForecast(seed.pm25),
    providersUsed: ['baseline'],
    providersFailed: [],
    cached: false,
    updatedAt: now.toISOString(),
    note: 'Seasonal winter-smog baseline (add provider API keys in .env for live station telemetry).',
  };
}
