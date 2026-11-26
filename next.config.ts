/**
 * Next.js configuration bundling curated KB markdown files and baseline static/API security headers.
 */
import type { NextConfig } from 'next';
import { BASE_SECURITY_HEADERS, buildCspHeader } from './src/lib/http/csp';

const STATIC_CSP = buildCspHeader({ isDev: process.env.NODE_ENV === 'development' });

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/chat': ['./content/**/*'],
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
        ],
      },
      {
        source: '/((?!api/).*)',
        headers: [...BASE_SECURITY_HEADERS, { key: 'Content-Security-Policy', value: STATIC_CSP }],
      },
    ];
  },
};

export default nextConfig;
