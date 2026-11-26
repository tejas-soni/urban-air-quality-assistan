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

function mergeReading(base: AqiReading, part: Partial<AqiReading>): AqiReading {
  const pm25 = part.pollutants?.pm25;
  return {
    ...base,
    aqi: part.aqi ?? base.aqi,
    pollutants: {
      pm25: pm25 ?? base.pollutants.pm25,
      pm10: part.pollutants?.pm10 ?? base.pollutants.pm10,
      o3: part.pollutants?.o3 ?? base.pollutants.o3,
      no2: part.pollutants?.no2 ?? base.pollutants.no2,
    },
    forecast24h: pm25 ? build24hForecast(pm25) : base.forecast24h,
    forecast5d: part.forecast5d ?? base.forecast5d,
  };
}

export async function runProviderChain(
  initial: AqiReading,
  keys: ProviderEnvKeys,
  fetchFn: FetchLike,
): Promise<{ merged: AqiReading; used: ProviderName[]; failed: ProviderName[] }> {
  const steps: Array<{ name: ProviderName; key?: string; run: () => Promise<Partial<AqiReading> | null> }> = [
    { name: 'iqair', key: keys.iqair, run: () => fetchIqAir(initial.lat, initial.lon, keys.iqair!, fetchFn) },
    { name: 'openweather', key: keys.openweather, run: () => fetchOpenWeather(initial.lat, initial.lon, keys.openweather!, fetchFn) },
    { name: 'openaq', key: keys.openaq, run: () => fetchOpenAq(initial.lat, initial.lon, keys.openaq!, fetchFn) },
    { name: 'airnow', key: keys.airnow, run: () => fetchAirNow(initial.lat, initial.lon, keys.airnow!, fetchFn) },
  ];

  let merged = initial;
  const used: ProviderName[] = [];
  const failed: ProviderName[] = [];

  for (const step of steps) {
    if (!step.key) continue;
    const part = await step.run();
    if (!part) {
      failed.push(step.name);
      continue;
    }
    used.push(step.name);
    merged = mergeReading(merged, part);
  }
  return { merged, used, failed };
}
