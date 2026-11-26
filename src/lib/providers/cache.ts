interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const DEFAULT_AQI_TTL_MS = 60 * 60 * 1000;

/** Normalizes city names into consistent lowercase cache keys. */
export function normalizeCacheKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Deterministic in-memory TTL cache (default 60 minutes) for server-side AQI calls. */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly nowFn: () => number;

  constructor(ttlMs: number = DEFAULT_AQI_TTL_MS, nowFn: () => number = () => Date.now()) {
    this.ttlMs = Math.max(1, ttlMs);
    this.nowFn = nowFn;
  }

  get(key: string): T | null {
    const normalized = normalizeCacheKey(key);
    const entry = this.store.get(normalized);
    if (!entry) return null;
    if (this.nowFn() >= entry.expiresAt) {
      this.store.delete(normalized);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    const normalized = normalizeCacheKey(key);
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
