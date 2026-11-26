import { describe, it, expect } from 'vitest';
import { SlidingWindowRateLimiter } from './rateLimit';

describe('SlidingWindowRateLimiter', () => {
  it('allows up to max requests per window and resets after window passes', () => {
    let now = 100_000;
    const limiter = new SlidingWindowRateLimiter(3, 60_000, () => now);

    expect(limiter.check('ip-1').allowed).toBe(true);
    expect(limiter.check('ip-1').remaining).toBe(1);
    expect(limiter.check('ip-1').allowed).toBe(true);

    const blocked = limiter.check('ip-1');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    now += 61_000;
    expect(limiter.check('ip-1').allowed).toBe(true);
    limiter.clear();
    expect(limiter.check('ip-1').remaining).toBe(2);
  });
});
