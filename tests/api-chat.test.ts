import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { chatRateLimiter } from '@/lib/agents/rateLimit';

describe('POST /api/chat', () => {
  beforeEach(() => {
    chatRateLimiter.clear();
    delete process.env.GEMINI_API_KEY;
  });

  it('rejects malformed JSON and invalid payloads with 400', async () => {
    const badJson = new Request('http://localhost/api/chat', { method: 'POST', body: '{oops' });
    expect((await POST(badJson)).status).toBe(400);

    const emptyMsgs = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });
    expect((await POST(emptyMsgs)).status).toBe(400);
  });

  it('streams grounded local RAG response when GEMINI_API_KEY is missing', async () => {
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'When should I ventilate?' }] }],
        profile: { persona: 'family', city: 'New Delhi' },
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('X-BreatheWise-Mode')).toBe('local-fallback');
    const streamText = await res.text();
    expect(streamText).toContain('get_live_aqi');
    expect(streamText).toContain('Quantified Impact & Sources');
  });

  it('activates rate-limit fallback after 15 requests per minute', async () => {
    for (let i = 0; i < 15; i += 1) {
      const r = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.99' },
        body: JSON.stringify({
          messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI tips?' }] }],
        }),
      });
      await POST(r);
    }

    const limitedReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.99' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI tips?' }] }],
      }),
    });
    const limitedRes = await POST(limitedReq);
    expect(limitedRes.status).toBe(200);
    expect(limitedRes.headers.get('X-BreatheWise-Mode')).toBe('rate-limit-fallback');
  });
});
