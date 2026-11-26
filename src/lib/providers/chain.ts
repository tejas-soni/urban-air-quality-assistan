import { build24hForecast } from '@/lib/aqi/baseline';
import {
  fetchAirNow,
  fetchIqAir,
  fetchOpenAq,
  fetchOpenWeather,
  type FetchLike,
} from '@/lib/providers/http';
import type { AqiReading, ProviderName } from '@/lib/types';

export interface ProviderEnvKeys {
  iqair?: string;
  openweather?: string;
  openaq?: string;
  airnow?: string;
}

function mergePollutants(
  base: AqiReading['pollutants'],
  next: Partial<AqiReading['pollutants']> | undefined,
): AqiReading['pollutants'] {
  if (!next) return base;
  return {
    pm25: next.pm25 ?? base.pm25,
    pm10: next.pm10 ?? base.pm10,
    o3: next.o3 ?? base.o3,
    no2: next.no2 ?? base.no2,
  };
}

function mergeReading(base: AqiReading, part: Partial<AqiReading>): AqiReading {
  const pm25 = part.pollutants?.pm25;
  return {
    ...base,
    aqi: part.aqi ?? base.aqi,
    pollutants: mergePollutants(base.pollutants, part.pollutants),
    forecast24h: pm25 ? build24hForecast(pm25) : base.forecast24h,
    forecast5d: part.forecast5d ?? base.forecast5d,
  };
}

export async function runProviderChain(
  initial: AqiReading,
  keys: ProviderEnvKeys,
  fetchFn: FetchLike,
): Promise<{ merged: AqiReading; used: ProviderName[]; failed: ProviderName[] }> {
  const steps: Array<{
    name: ProviderName;
    key?: string;
    run: (key: string) => Promise<Partial<AqiReading> | null>;
  }> = [
    {
      name: 'iqair',
      key: keys.iqair,
      run: (k) => fetchIqAir(initial.lat, initial.lon, k, fetchFn),
    },
    {
      name: 'openweather',
      key: keys.openweather,
      run: (k) => fetchOpenWeather(initial.lat, initial.lon, k, fetchFn),
    },
    {
      name: 'openaq',
      key: keys.openaq,
      run: (k) => fetchOpenAq(initial.lat, initial.lon, k, fetchFn),
    },
    {
      name: 'airnow',
      key: keys.airnow,
      run: (k) => fetchAirNow(initial.lat, initial.lon, k, fetchFn),
    },
  ];

  let merged = initial;
  const used: ProviderName[] = [];
  const failed: ProviderName[] = [];

  for (const step of steps) {
    if (!step.key) continue;
    const part = await step.run(step.key);
    if (!part) {
      failed.push(step.name);
      continue;
    }
    used.push(step.name);
    merged = mergeReading(merged, part);
  }
  return { merged, used, failed };
}
