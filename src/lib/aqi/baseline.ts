import { classifyAqi, pm25ToUsAqi, whoGuidelineRatio } from '@/lib/aqi/bands';
import { CITY_SEEDS, DIURNAL_SLOTS, type CitySeed } from '@/lib/aqi/citySeeds';
import type { AqiReading, ForecastPoint } from '@/lib/types';

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
    const factor = factors[idx] ?? 1.0;
    const avgPm25 = Math.round(safeBase * factor * 10) / 10;
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
