/**
 * Live AQI provider HTTP client adapters with 4s abort timeouts and structured error reporting.
 */
import { isAbortError, logServerEvent, summarizeError } from '@/lib/logger';
import { asObj } from '@/lib/providers/jsonHelpers';
import {
  normalizeAirNow,
  normalizeIqAir,
  normalizeOpenAq,
  normalizeOpenWeather,
} from '@/lib/providers/mappers';
import type { AqiReading } from '@/lib/types';

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function boundCoord(val: number, min: number, max: number): string {
  const safe = Number.isFinite(val) ? Math.min(max, Math.max(min, val)) : 0;
  return safe.toFixed(4);
}

/** Performs an HTTP GET with a 4s AbortSignal timeout returning parsed JSON or null on failure. */
export async function safeFetchJson(
  url: string,
  headers: Record<string, string> = {},
  fetchFn: FetchLike = fetch,
): Promise<unknown> {
  try {
    const res = await fetchFn(url, {
      headers,
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return data;
  } catch (err) {
    if (!isAbortError(err)) {
      logServerEvent('provider_fetch_error', { reason: summarizeError(err) });
    }
    return null;
  }
}

/** Resolves lat/lon coordinates via OpenWeather Direct Geocoding API when configured. */
export async function geocodeOpenWeather(
  city: string,
  apiKey: string | undefined,
  fetchFn: FetchLike = fetch,
): Promise<{ lat: number; lon: number; country?: string } | null> {
  if (!apiKey) return null;
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${encodeURIComponent(apiKey)}`;
  const raw = await safeFetchJson(url, {}, fetchFn);
  const row = Array.isArray(raw) ? asObj(raw[0]) : null;
  if (!row || typeof row.lat !== 'number' || typeof row.lon !== 'number') return null;
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
  const url = `https://api.airvisual.com/v2/nearest_city?lat=${boundCoord(lat, -90, 90)}&lon=${boundCoord(lon, -180, 180)}&key=${encodeURIComponent(apiKey)}`;
  return normalizeIqAir(await safeFetchJson(url, {}, fetchFn));
}

/** Fetches current + 5-day air pollution forecast from OpenWeather API. */
export async function fetchOpenWeather(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const sLat = boundCoord(lat, -90, 90);
  const sLon = boundCoord(lon, -180, 180);
  const currUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${sLat}&lon=${sLon}&appid=${encodeURIComponent(apiKey)}`;
  const fcUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${sLat}&lon=${sLon}&appid=${encodeURIComponent(apiKey)}`;
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
  const url = `https://api.openaq.org/v3/locations?coordinates=${boundCoord(lat, -90, 90)},${boundCoord(lon, -180, 180)}&radius=25000&limit=3`;
  return normalizeOpenAq(await safeFetchJson(url, { 'X-API-Key': apiKey }, fetchFn));
}

/** Fetches US EPA AirNow current observation enrichment by coordinates. */
export async function fetchAirNow(
  lat: number,
  lon: number,
  apiKey: string,
  fetchFn: FetchLike = fetch,
): Promise<Partial<AqiReading> | null> {
  const url = `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${boundCoord(lat, -90, 90)}&longitude=${boundCoord(lon, -180, 180)}&distance=50&API_KEY=${encodeURIComponent(apiKey)}`;
  return normalizeAirNow(await safeFetchJson(url, {}, fetchFn));
}
