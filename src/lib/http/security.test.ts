import { describe, it, expect } from 'vitest';
import { resolveClientIp } from '@/lib/http/clientIp';
import { buildCspHeader } from '@/lib/http/csp';
import { checkPostAdmission, readJsonBodyCapped } from '@/lib/http/guard';

describe('CSP builder, clientIp, and streaming body cap security', () => {
  it('builds strict CSP without unsafe-inline in production script-src/style-src', () => {
    const prodCsp = buildCspHeader({ nonce: 'rnd123', isDev: false, upgradeInsecure: true });
    expect(prodCsp).toContain("script-src 'self' 'nonce-rnd123' 'strict-dynamic'");
    expect(prodCsp).toContain("style-src 'self' 'nonce-rnd123'");
    expect(prodCsp).not.toContain("'unsafe-inline'");
    expect(prodCsp).toContain('upgrade-insecure-requests');

    const devCsp = buildCspHeader({ nonce: 'dev1', isDev: true });
    expect(devCsp).toContain("'unsafe-eval'");
    expect(devCsp).toContain("'unsafe-inline'");
  });

  it('resolves sanitized client IP from proxy headers or falls back to local', () => {
    const cf = new Request('http://localhost/api/chat', {
      headers: { 'cf-connecting-ip': '203.0.113.5' },
    });
    expect(resolveClientIp(cf)).toBe('203.0.113.5');
    expect(resolveClientIp(new Request('http://localhost/api/chat'))).toBe('local');
  });

  it('rejects same-site subdomain requests and enforces stream/text byte caps', async () => {
    const sameSite = checkPostAdmission(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-site' },
      }),
    );
    expect(sameSite).toMatchObject({ ok: false, status: 403 });

    const relativeUrlReq = {
      url: '/api/chat',
      headers: new Headers({
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
      }),
    } as unknown as Request;
    expect(checkPostAdmission(relativeUrlReq)).toEqual({ ok: true });

    const chunkedStream = new ReadableStream<Uint8Array>({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode('{"text":"'));
        ctrl.enqueue(new TextEncoder().encode('a'.repeat(120)));
        ctrl.close();
      },
    });
    const streamReq = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: chunkedStream,
      duplex: 'half',
    } as RequestInit);
    expect(await readJsonBodyCapped(streamReq, 64)).toMatchObject({ ok: false, status: 413 });

    const noBodyTooBig = {
      body: null,
      text: async () => JSON.stringify({ data: 'x'.repeat(80) }),
    } as unknown as Request;
    expect(await readJsonBodyCapped(noBodyTooBig, 40)).toMatchObject({ ok: false, status: 413 });

    const noBodyOk = {
      body: null,
      text: async () => JSON.stringify({ ok: true }),
    } as unknown as Request;
    expect(await readJsonBodyCapped(noBodyOk, 40)).toEqual({ ok: true, data: { ok: true } });
  });
});
