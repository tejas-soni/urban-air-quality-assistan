import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/aqi/route';

describe('GET /api/aqi', () => {
  it('returns cached/baseline AQI reading for a valid city', async () => {
    const req = new Request('http://localhost/api/aqi?city=New+Delhi');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.city).toBe('New Delhi');
    expect(body.aqi).toBeGreaterThan(0);
    expect(body.providersUsed.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects invalid city parameters with 400', async () => {
    const req = new Request('http://localhost/api/aqi?city=X');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
