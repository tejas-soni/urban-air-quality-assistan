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

  it('evicts the least recently used entry when exceeding maxEntries', () => {
    const cache = new TtlCache<number>(DEFAULT_AQI_TTL_MS, () => 1_000_000, 2);
    cache.set('Delhi', 1);
    cache.set('London', 2);
    expect(cache.get('Delhi')).toBe(1);
    cache.set('Beijing', 3);
    cache.set('Delhi', 9);
    expect(cache.size()).toBe(2);
    expect(cache.get('London')).toBeNull();
    expect(cache.get('Delhi')).toBe(9);
    expect(cache.get('Beijing')).toBe(3);
  });
});
