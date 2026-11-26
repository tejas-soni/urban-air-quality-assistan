import { describe, it, expect } from 'vitest';
import { checkPostAdmission, readJsonBodyCapped } from './guard';

describe('HTTP POST admission gate and capped JSON reader', () => {
  it('enforces application/json, same-origin CSRF checks, and declared byte limits', () => {
    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'text/html' },
        }),
      ),
    ).toMatchObject({ ok: false, status: 415 });

    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' },
        }),
      ),
    ).toMatchObject({ ok: false, status: 403 });

    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'null' },
        }),
      ),
    ).toMatchObject({ ok: false, status: 403 });

    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'https://attacker.test' },
        }),
      ),
    ).toMatchObject({ ok: false, status: 403 });

    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'content-length': '20000' },
        }),
        8192,
      ),
    ).toMatchObject({ ok: false, status: 413 });

    expect(
      checkPostAdmission(
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
            'sec-fetch-site': 'same-origin',
            'content-length': '128',
          },
        }),
      ),
    ).toEqual({ ok: true });
  });

  it('handles body read byte caps (including multibyte UTF-8) and parse errors', async () => {
    const oversizedUtf8 = await readJsonBodyCapped(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ note: '₹'.repeat(50) }),
      }),
      100,
    );
    expect(oversizedUtf8).toMatchObject({ ok: false, status: 413 });

    const invalid = await readJsonBodyCapped(
      new Request('http://localhost/api/chat', { method: 'POST', body: '{bad' }),
      100,
    );
    expect(invalid).toMatchObject({ ok: false, status: 400 });

    const unreadable = {
      text: () => Promise.reject(new Error('stream aborted')),
    } as unknown as Request;
    const readErr = await readJsonBodyCapped(unreadable, 100);
    expect(readErr).toMatchObject({ ok: false, status: 400 });

    const ok = await readJsonBodyCapped(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
      }),
      100,
    );
    expect(ok).toEqual({ ok: true, data: { hello: 'world' } });
  });
});
