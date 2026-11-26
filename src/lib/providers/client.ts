import { classifyAqi, whoGuidelineRatio } from '@/lib/aqi/bands';
import { buildBaselineReading } from '@/lib/aqi/baseline';
import { DEFAULT_AQI_TTL_MS, TtlCache } from '@/lib/providers/cache';
import { runProviderChain, type ProviderEnvKeys } from '@/lib/providers/chain';
import { geocodeOpenWeather, type FetchLike } from '@/lib/providers/http';
import type { AqiReading, ProviderName } from '@/lib/types';

export type { ProviderEnvKeys };

export interface FetchCityAqiOptions {
  keys?: ProviderEnvKeys;
  fetchFn?: FetchLike;
  cache?: TtlCache<AqiReading>;
}

const serverAqiCache = new TtlCache<AqiReading>(DEFAULT_AQI_TTL_MS);

function readEnvKeys(): ProviderEnvKeys {
  return {
    iqair: process.env.IQAIR_API_KEY,
    openweather: process.env.OPENWEATHER_API_KEY,
    openaq: process.env.OPENAQ_API_KEY,
    airnow: process.env.AIRNOW_API_KEY,
  };
}

function finalizeReading(
  merged: AqiReading,
  used: ProviderName[],
  failed: ProviderName[],
  fallbackNote: string,
): AqiReading {
  const providersUsed: ProviderName[] = used.length > 0 ? used : ['baseline'];
  const note = used.length > 0 ? `Live station/forecast blend (${used.join(', ')})` : fallbackNote;
  return {
    ...merged,
    band: classifyAqi(merged.aqi).band,
    whoRatio: whoGuidelineRatio(merged.pollutants.pm25),
    providersUsed,
    providersFailed: failed,
    cached: false,
    updatedAt: new Date().toISOString(),
    note,
  };
}

/** Fetches live AQI with 60-min caching and multi-provider fallback across IQAir, OpenWeather, OpenAQ, AirNow, and baseline. */
export async function fetchCityAqi(
  rawCity: string,
  options: FetchCityAqiOptions = {},
): Promise<AqiReading> {
  const cache = options.cache ?? serverAqiCache;
  const cleanCity = rawCity.trim() || 'London';
  const hit = cache.get(cleanCity);
  if (hit) return { ...hit, cached: true };

  const keys = options.keys ?? readEnvKeys();
  const fetchFn = options.fetchFn ?? fetch;
  const baseline = buildBaselineReading(cleanCity);
  const geo = await geocodeOpenWeather(cleanCity, keys.openweather, fetchFn);
  const seeded = geo
    ? { ...baseline, lat: geo.lat, lon: geo.lon, country: geo.country ?? baseline.country }
    : baseline;

  const { merged, used, failed } = await runProviderChain(seeded, keys, fetchFn);
  const result = finalizeReading(merged, used, failed, baseline.note);
  cache.set(cleanCity, result);
  return result;
}
