/**
 * Memory-bounded sliding-window rate limiter protecting free-tier AI quotas from abuse.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

const DEFAULT_LIMIT = 15;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 1000;

/** Sliding-window in-memory rate limiter with bounded key capacity to prevent OOM floods. */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly nowFn: () => number;

  constructor(
    maxRequests: number = DEFAULT_LIMIT,
    windowMs: number = DEFAULT_WINDOW_MS,
    nowFn: () => number = () => Date.now(),
  ) {
    this.maxRequests = Math.max(1, maxRequests);
    this.windowMs = Math.max(1000, windowMs);
    this.nowFn = nowFn;
  }

  private evictIfFull(cutoff: number): void {
    if (this.hits.size < MAX_TRACKED_KEYS) return;
    for (const [k, timestamps] of this.hits) {
      if (timestamps.every((ts) => ts <= cutoff)) this.hits.delete(k);
    }
    if (this.hits.size >= MAX_TRACKED_KEYS) {
      const oldest = this.hits.keys().next().value;
      if (oldest !== undefined) this.hits.delete(oldest);
    }
  }

  /** Records one hit for key and returns allowance + retry reset timing. */
  check(key: string): RateLimitResult {
    const now = this.nowFn();
    const cutoff = now - this.windowMs;
    const prev = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (prev.length >= this.maxRequests) {
      this.hits.set(key, prev);
      const oldest = prev[0] ?? now;
      return { allowed: false, remaining: 0, resetMs: Math.max(0, oldest + this.windowMs - now) };
    }

    if (!this.hits.has(key)) this.evictIfFull(cutoff);
    const updated = [...prev, now];
    this.hits.set(key, updated);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - updated.length),
      resetMs: this.windowMs,
    };
  }

  /** Clears all rate-limit buckets (used by isolated test runs). */
  clear(): void {
    this.hits.clear();
  }
}

export const chatRateLimiter = new SlidingWindowRateLimiter(DEFAULT_LIMIT, DEFAULT_WINDOW_MS);
