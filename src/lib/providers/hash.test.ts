import { describe, it, expect } from 'vitest';
import { hashPayload } from './hash';

describe('hashPayload', () => {
  it('returns deterministic 16-char SHA-256 hex digests', () => {
    const a = hashPayload({ city: 'New Delhi', aqi: 210 });
    const b = hashPayload({ city: 'New Delhi', aqi: 210 });
    const c = hashPayload({ city: 'London', aqi: 55 });
    expect(a).toHaveLength(16);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
