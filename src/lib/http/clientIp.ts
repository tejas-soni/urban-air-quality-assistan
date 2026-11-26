/**
 * Safe client IP extraction helper for rate limiting without storing PII.
 */
/** Extracts the normalized client IP string from trusted proxy or forwarding headers. */
export function resolveClientIp(req: Request): string {
  const real = req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip');
  if (real?.trim()) return real.trim().slice(0, 64);
  const fwd = req.headers.get('x-forwarded-for');
  const first = fwd ? fwd.split(',')[0] : undefined;
  return first?.trim() ? first.trim().slice(0, 64) : 'local';
}
