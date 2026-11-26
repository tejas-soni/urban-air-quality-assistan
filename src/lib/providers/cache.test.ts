import { describe, it, expect } from 'vitest';
import { TtlCache, normalizeCacheKey, DEFAULT_AQI_TTL_MS } from './cache';

describe('TtlCache', () => {
  it('normalizes city keys consistently', () => {
    expect(normalizeCacheKey('  New   Delhi ')).toBe('new delhi');
  });

  it('returns cached entries before TTL expiry and evicts after 60 minutes', () => {
    let now = 1_000_000;
    const cache = new TtlCache<number>(DEFAULT_AQI_TTL_MS, () => now);
    cache.set('London', 42);
    expect(cache.size()).toBe(1);
    expect(cache.get('london')).toBe(42);

    now += 59 * 60 * 1000;
    expect(cache.get('  LONDON ')).toBe(42);

    now += 2 * 60 * 1000;
    expect(cache.get('london')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('clears cache on demand', () => {
    const cache = new TtlCache<string>();
    cache.set('Lahore', 'ok');
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
