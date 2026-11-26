/**
 * Same-origin CSRF verification blocking cross-site requests and literal null origins.
 */
export type OriginCheckResult = { ok: true } | { ok: false; status: 403; error: string };

const ALLOWED_FETCH_SITES = new Set(['same-origin', 'none']);

function resolveRequestOrigin(req: Request): string | null {
  try {
    return new URL(req.url).origin;
  } catch {
    const host = req.headers.get('host');
    return host ? `http://${host}` : null;
  }
}

function validateOriginHeader(req: Request): OriginCheckResult {
  const origin = req.headers.get('origin')?.trim();
  if (!origin) return { ok: true };
  if (origin === 'null') return { ok: false, status: 403, error: 'Null origin is forbidden' };
  const expected = resolveRequestOrigin(req);
  return expected && origin !== expected
    ? { ok: false, status: 403, error: 'Origin mismatch' }
    : { ok: true };
}

/** Verifies Sec-Fetch-Site (strict same-origin/none) and Origin headers against request URL. */
export function checkSameOrigin(req: Request): OriginCheckResult {
  const secFetchSite = req.headers.get('sec-fetch-site')?.trim().toLowerCase();
  if (secFetchSite && !ALLOWED_FETCH_SITES.has(secFetchSite)) {
    return { ok: false, status: 403, error: 'Cross-site requests are forbidden' };
  }
  return validateOriginHeader(req);
}
