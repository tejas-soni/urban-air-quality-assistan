import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { fallbackReplyCache } from '@/lib/agents/chatFallbackStream';
import { chatRateLimiter } from '@/lib/agents/rateLimit';

const JSON_HEADERS = {
  'content-type': 'application/json',
  'x-forwarded-for': '10.0.0.1',
};

describe('POST /api/chat', () => {
  beforeEach(() => {
    chatRateLimiter.clear();
    fallbackReplyCache.clear();
    delete process.env.GEMINI_API_KEY;
  });

  it('enforces admission gate: 415 non-JSON, 403 cross-origin/null, 413 oversized', async () => {
    const nonJson = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    });
    expect((await POST(nonJson)).status).toBe(415);

    const crossSite = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { ...JSON_HEADERS, 'sec-fetch-site': 'cross-site' },
      body: '{}',
    });
    expect((await POST(crossSite)).status).toBe(403);

    const foreignOrigin = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { ...JSON_HEADERS, origin: 'https://evil.example' },
      body: '{}',
    });
    expect((await POST(foreignOrigin)).status).toBe(403);

    const nullOrigin = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { ...JSON_HEADERS, origin: 'null' },
      body: '{}',
    });
    expect((await POST(nullOrigin)).status).toBe(403);

    const oversized = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ messages: [{ role: 'user', content: 'a'.repeat(9000) }] }),
    });
    expect((await POST(oversized)).status).toBe(413);
  });

  it('rejects malformed JSON and invalid payloads with 400 and no-store', async () => {
    const badJson = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: '{oops',
    });
    const badRes = await POST(badJson);
    expect(badRes.status).toBe(400);
    expect(badRes.headers.get('cache-control')).toBe('no-store');

    const emptyMsgs = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ messages: [] }),
    });
    expect((await POST(emptyMsgs)).status).toBe(400);
  });

  it('streams grounded local RAG response and hits SHA-256 fallback cache on repeat', async () => {
    const body = JSON.stringify({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'When should I ventilate?' }] }],
      profile: { persona: 'family', city: 'New Delhi' },
    });

    const res1 = await POST(
      new Request('http://localhost/api/chat', { method: 'POST', headers: JSON_HEADERS, body }),
    );
    expect(res1.status).toBe(200);
    expect(res1.headers.get('X-BreatheWise-Mode')).toBe('local-fallback');
    expect(res1.headers.get('X-BreatheWise-Cache')).toBe('MISS');
    expect(res1.headers.get('cache-control')).toBe('no-store');
    const streamText = await res1.text();
    expect(streamText).toContain('get_live_aqi');
    expect(streamText).toContain('Quantified Impact & Sources');

    const res2 = await POST(
      new Request('http://localhost/api/chat', { method: 'POST', headers: JSON_HEADERS, body }),
    );
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-BreatheWise-Cache')).toBe('HIT');
  });

  it('activates rate-limit fallback after 15 requests per minute', async () => {
    for (let i = 0; i < 15; i += 1) {
      const r = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI tips?' }] }],
        }),
      });
      await POST(r);
    }

    const limitedReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.99' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI tips?' }] }],
      }),
    });
    const limitedRes = await POST(limitedReq);
    expect(limitedRes.status).toBe(200);
    expect(limitedRes.headers.get('X-BreatheWise-Mode')).toBe('rate-limit-fallback');
  });
});
