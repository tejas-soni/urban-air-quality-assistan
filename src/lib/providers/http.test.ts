import { describe, it, expect } from 'vitest';
import { fetchIqAir, geocodeOpenWeather, safeFetchJson } from './http';

describe('provider HTTP helpers', () => {
  it('returns null when safeFetchJson sees non-200 status or invalid JSON', async () => {
    const notOk = async () => new Response('fail', { status: 404 });
    expect(await safeFetchJson('https://example.test', {}, notOk)).toBeNull();

    const badJson = async () => new Response('not-json', { status: 200 });
    expect(await safeFetchJson('https://example.test', {}, badJson)).toBeNull();
  });

  it('geocodes city via OpenWeather when key present and guards missing/bad payloads', async () => {
    expect(await geocodeOpenWeather('London', undefined)).toBeNull();

    const okGeo = async () =>
      new Response(JSON.stringify([{ lat: 51.5, lon: -0.12, country: 'GB' }]), { status: 200 });
    expect(await geocodeOpenWeather('London', 'key', okGeo)).toEqual({
      lat: 51.5,
      lon: -0.12,
      country: 'GB',
    });

    const badGeo = async () => new Response(JSON.stringify([{ lat: 'bad' }]), { status: 200 });
    expect(await geocodeOpenWeather('London', 'key', badGeo)).toBeNull();
  });

  it('parses valid IQAir response via fetchIqAir', async () => {
    const okIqAir = async () =>
      new Response(
        JSON.stringify({
          data: {
            city: 'Lahore',
            country: 'Pakistan',
            location: { coordinates: [74.35, 31.52] },
            current: { pollution: { aqius: 210 } },
          },
        }),
        { status: 200 },
      );
    const res = await fetchIqAir(31.52, 74.35, 'iq-key', okIqAir);
    expect(res?.aqi).toBe(210);
  });
});
