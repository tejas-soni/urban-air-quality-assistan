import { describe, it, expect } from 'vitest';
import { TtlCache } from './cache';
import { fetchCityAqi } from './client';
import type { AqiReading } from '@/lib/types';

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_ROUTES: readonly [string, () => Response][] = [
  ['airvisual', () => new Response('err', { status: 503 })],
  ['/geo/1.0/direct', () => okResponse([{ lat: 40.76, lon: -111.89, country: 'US' }])],
  [
    'air_pollution/forecast',
    () => okResponse({ list: [{ dt: 1735689600, components: { pm2_5: 25 } }] }),
  ],
  [
    'air_pollution',
    () => okResponse({ list: [{ components: { pm2_5: 32, pm10: 45, o3: 40, no2: 28 } }] }),
  ],
  [
    'openaq',
    () =>
      okResponse({
        results: [{ sensors: [{ parameter: { name: 'pm25' }, latest: { value: 30 } }] }],
      }),
  ],
  [
    'airnowapi',
    () => okResponse([{ ParameterName: 'PM2.5', AQI: 92, ReportingArea: 'Salt Lake' }]),
  ],
];

describe('fetchCityAqi multi-provider fallback and cache', () => {
  it('falls back to seasonal baseline when no API keys exist and caches for 60m', async () => {
    const cache = new TtlCache<AqiReading>();
    const first = await fetchCityAqi('London', { keys: {}, cache });
    expect(first.cached).toBe(false);
    expect(first.providersUsed).toEqual(['baseline']);

    const second = await fetchCityAqi('London', { keys: {}, cache });
    expect(second.cached).toBe(true);
    expect(second.aqi).toBe(first.aqi);
  });

  it('merges live providers and falls back gracefully when one provider errors', async () => {
    const cache = new TtlCache<AqiReading>();
    const mockFetch = async (input: string | URL | Request): Promise<Response> => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const route = MOCK_ROUTES.find(([key]) => url.includes(key));
      if (route) return route[1]();
      throw new Error('unexpected URL');
    };

    const reading = await fetchCityAqi('Salt Lake City', {
      keys: { iqair: 'k1', openweather: 'k2', openaq: 'k3', airnow: 'k4' },
      fetchFn: mockFetch,
      cache,
    });

    expect(reading.providersFailed).toEqual(['iqair']);
    expect(reading.providersUsed).toEqual(['openweather', 'openaq', 'airnow']);
    expect(reading.aqi).toBe(92);
    expect(reading.pollutants.pm25).toBe(30);
    expect(reading.note).toContain('openweather');
  });

  it('handles network throw across providers without throwing', async () => {
    const cache = new TtlCache<AqiReading>();
    const failingFetch = async () => {
      throw new Error('network down');
    };
    const res = await fetchCityAqi('Delhi', {
      keys: { iqair: 'k1', openweather: 'k2', openaq: 'k3', airnow: 'k4' },
      fetchFn: failingFetch,
      cache,
    });
    expect(res.providersUsed).toEqual(['baseline']);
    expect(res.providersFailed).toEqual(['iqair', 'openweather', 'openaq', 'airnow']);
  });
});
