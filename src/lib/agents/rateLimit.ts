export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

const DEFAULT_LIMIT = 15;
const DEFAULT_WINDOW_MS = 60_000;

/** Sliding-window in-memory rate limiter (15 req/min default for Gemini free tier). */
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

  check(key: string): RateLimitResult {
    const now = this.nowFn();
    const cutoff = now - this.windowMs;
    const prev = (this.hits.get(key) ?? []).filter((ts) => ts > cutoff);

    if (prev.length >= this.maxRequests) {
      this.hits.set(key, prev);
      const oldest = prev[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, oldest + this.windowMs - now),
      };
    }

    const updated = [...prev, now];
    this.hits.set(key, updated);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - updated.length),
      resetMs: this.windowMs,
    };
  }

  clear(): void {
    this.hits.clear();
  }
}

export const chatRateLimiter = new SlidingWindowRateLimiter(DEFAULT_LIMIT, DEFAULT_WINDOW_MS);
