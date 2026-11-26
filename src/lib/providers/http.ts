import {
  normalizeAirNow,
  normalizeIqAir,
  normalizeOpenAq,
  normalizeOpenWeather,
} from '@/lib/providers/mappers';
import type { AqiReading } from '@/lib/types';

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

/** Performs an HTTP GET returning parsed JSON or null on timeout/error. */
export async function safeFetchJson(
  url: string,
  headers: Record<string, string> = {},
  fetchFn: FetchLike = fetch,
): Promise<unknown | null> {
  try {
    const res = await fetchFn(url, {
      headers,
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Resolves lat/lon coordinates via OpenWeather Direct Geocoding API when a key is configured. */
export async function geocodeOpenWeather(
  city: string,
  apiKey: string | undefined,
  fetchFn: FetchLike = fetch,
): Promise<{ lat: number; lon: number; country?: string } | null> {
  if (!apiKey) return null;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${encodeURIComponent(apiKey)}`;
  const raw = await safeFetchJson(url, {}, fetchFn);
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const row = raw[0] as Record<string, unknown>;
  if (typeof row.lat !== 'number' || typeof row.lon !== 'number') return null;
  return {
    lat: row.lat,
    lon: row.lon,
    country: typeof row.country === 'string' ? row.country : undefined,
  };
}

/** Fetches baseline nearest-city AQI from IQAir AirVisual API. */
export async function fetchIqAir(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const url = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${encodeURIComponent(apiKey)}`;
  return normalizeIqAir(await safeFetchJson(url, {}, fetchFn));
}

/** Fetches current + 5-day air pollution forecast from OpenWeather API. */
export async function fetchOpenWeather(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const currUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(apiKey)}`;
  const fcUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(apiKey)}`;
  const [curr, fc] = await Promise.all([
    safeFetchJson(currUrl, {}, fetchFn),
    safeFetchJson(fcUrl, {}, fetchFn),
  ]);
  return normalizeOpenWeather(curr, fc);
}

/** Fetches nearest monitor enrichment from OpenAQ v3 API. */
export async function fetchOpenAq(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const url = `https://api.openaq.org/v3/locations?coordinates=${lat},${lon}&radius=25000&limit=3`;
  return normalizeOpenAq(await safeFetchJson(url, { 'X-API-Key': apiKey }, fetchFn));
}

/** Fetches US EPA AirNow current observation enrichment by coordinates. */
export async function fetchAirNow(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=50&API_KEY=${encodeURIComponent(apiKey)}`;
  return normalizeAirNow(await safeFetchJson(url, {}, fetchFn));
}
