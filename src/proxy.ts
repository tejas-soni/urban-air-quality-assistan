/**
 * Next.js 16 request proxy assigning a cryptographic CSP nonce on every page render.
 */
import { NextRequest, NextResponse } from 'next/server';
import { BASE_SECURITY_HEADERS, buildCspHeader } from '@/lib/http/csp';

/** Injects per-request CSP nonces and baseline hardening headers onto dynamic page responses. */
export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const isHttps = request.headers.get('x-forwarded-proto') === 'https';
  const cspValue = buildCspHeader({ nonce, isDev, upgradeInsecure: !isDev && isHttps });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspValue);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspValue);
  for (const h of BASE_SECURITY_HEADERS) {
    response.headers.set(h.key, h.value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|llms.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
