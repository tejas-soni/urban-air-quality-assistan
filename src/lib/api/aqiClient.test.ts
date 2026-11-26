import { describe, it, expect, vi } from 'vitest';
import { fetchCityAqiClient } from '@/lib/api/aqiClient';
import { buildBaselineReading } from '@/lib/aqi/baseline';

describe('fetchCityAqiClient Zod-validated fetcher', () => {
  it('validates 200 JSON responses and flags HTTP errors, malformed payloads, and aborts', async () => {
    const london = buildBaselineReading('London');
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(london), { status: 200 }))
      .mockResolvedValueOnce(new Response('bad', { status: 502 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ invalid: true }), { status: 200 }))
      .mockRejectedValueOnce(new DOMException('aborted', 'AbortError'))
      .mockRejectedValueOnce(new Error('offline'));

    const ok = await fetchCityAqiClient('London');
    expect(ok).toEqual({ ok: true, data: london });

    const httpErr = await fetchCityAqiClient('London');
    expect(httpErr).toMatchObject({ ok: false, aborted: false });

    const badShape = await fetchCityAqiClient('London');
    expect(badShape).toMatchObject({ ok: false, error: 'Received malformed AQI response payload' });

    const aborted = await fetchCityAqiClient('London');
    expect(aborted).toEqual({ ok: false, aborted: true, error: '' });

    const netErr = await fetchCityAqiClient('London');
    expect(netErr).toMatchObject({ ok: false, aborted: false });

    spy.mockRestore();
  });
});
