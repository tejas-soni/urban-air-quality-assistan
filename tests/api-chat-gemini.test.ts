import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fallbackReplyCache } from '@/lib/agents/chatFallbackStream';
import { chatRateLimiter } from '@/lib/agents/rateLimit';

const streamTextMock = vi.fn();

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    streamText: (...args: unknown[]) => streamTextMock(...args),
  };
});

describe('POST /api/chat with GEMINI_API_KEY configured', () => {
  beforeEach(() => {
    chatRateLimiter.clear();
    fallbackReplyCache.clear();
    streamTextMock.mockReset();
    process.env.GEMINI_API_KEY = 'fake-test-key';
  });

  it('invokes Gemini streamText and falls back cleanly if streamText throws', async () => {
    const { POST } = await import('@/app/api/chat/route');

    streamTextMock.mockReturnValueOnce({
      toUIMessageStreamResponse: ({ headers }: { headers?: Record<string, string> }) =>
        new Response('live-stream', { status: 200, headers }),
    });

    const okReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.1.1' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI check?' }] }],
      }),
    });
    const okRes = await POST(okReq);
    expect(okRes.headers.get('X-BreatheWise-Mode')).toBe('gemini-live');
    expect(okRes.headers.get('cache-control')).toBe('no-store');

    streamTextMock.mockImplementationOnce(() => {
      throw new Error('Gemini unavailable');
    });

    const errReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.1.2' },
      body: JSON.stringify({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'AQI check?' }] }],
      }),
    });
    const errRes = await POST(errReq);
    expect(errRes.status).toBe(200);
    expect(errRes.headers.get('X-BreatheWise-Mode')).toBe('local-fallback');
  });
});
