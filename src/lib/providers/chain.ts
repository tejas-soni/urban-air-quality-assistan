/**
 * Multi-provider AQI fallback chain orchestrator across IQAir, OpenWeather, OpenAQ, and AirNow.
 */
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

const PROVIDER_ADAPTERS: readonly {
  name: Exclude<ProviderName, 'baseline'>;
  fetcher: (
    lat: number,
    lon: number,
    key: string,
    fn: FetchLike,
  ) => Promise<Partial<AqiReading> | null>;
}[] = [
  { name: 'iqair', fetcher: fetchIqAir },
  { name: 'openweather', fetcher: fetchOpenWeather },
  { name: 'openaq', fetcher: fetchOpenAq },
  { name: 'airnow', fetcher: fetchAirNow },
];

function mergeReading(base: AqiReading, part: Partial<AqiReading>): AqiReading {
  const nextPollutants = part.pollutants;
  const pm25 = nextPollutants?.pm25;
  return {
    ...base,
    aqi: part.aqi ?? base.aqi,
    pollutants: nextPollutants ? { ...base.pollutants, ...nextPollutants } : base.pollutants,
    forecast24h: pm25 ? build24hForecast(pm25) : base.forecast24h,
    forecast5d: part.forecast5d ?? base.forecast5d,
  };
}

/** Runs configured external AQI adapters in priority order, recording successes and failures. */
export async function runProviderChain(
  initial: AqiReading,
  keys: ProviderEnvKeys,
  fetchFn: FetchLike,
): Promise<{ merged: AqiReading; used: ProviderName[]; failed: ProviderName[] }> {
  let merged = initial;
  const used: ProviderName[] = [];
  const failed: ProviderName[] = [];

  for (const adapter of PROVIDER_ADAPTERS) {
    const key = keys[adapter.name];
    if (!key) continue;
    const part = await adapter.fetcher(initial.lat, initial.lon, key, fetchFn);
    if (part) {
      used.push(adapter.name);
      merged = mergeReading(merged, part);
    } else {
      failed.push(adapter.name);
    }
  }
  return { merged, used, failed };
}
