/**
 * Bounded LRU + TTL cache preserving 60-minute provider responses within free-tier API quotas.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const DEFAULT_AQI_TTL_MS = 60 * 60 * 1000;
export const DEFAULT_MAX_CACHE_ENTRIES = 100;

/** Normalizes city or query strings into consistent lowercase cache keys. */
export function normalizeCacheKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Deterministic bounded LRU + TTL cache (default 60 minutes, max 100 entries). */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly nowFn: () => number;

  constructor(
    ttlMs: number = DEFAULT_AQI_TTL_MS,
    nowFn: () => number = () => Date.now(),
    maxEntries: number = DEFAULT_MAX_CACHE_ENTRIES,
  ) {
    this.ttlMs = Math.max(1, ttlMs);
    this.nowFn = nowFn;
    this.maxEntries = Math.max(1, maxEntries);
  }

  get(key: string): T | null {
    const normalized = normalizeCacheKey(key);
    const entry = this.store.get(normalized);
    if (!entry) return null;
    if (this.nowFn() >= entry.expiresAt) {
      this.store.delete(normalized);
      return null;
    }
    this.store.delete(normalized);
    this.store.set(normalized, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    const normalized = normalizeCacheKey(key);
    if (this.store.has(normalized)) {
      this.store.delete(normalized);
    } else if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(normalized, {
      value,
      expiresAt: this.nowFn() + this.ttlMs,
    });
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
