/**
 * Single source of truth for BreatheWise strict CSP and browser security headers.
 */
export interface CspOptions {
  nonce?: string;
  isDev?: boolean;
  upgradeInsecure?: boolean;
}

const STATIC_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

/** Builds a strict Content-Security-Policy header value with per-request nonce support. */
export function buildCspHeader(options: CspOptions = {}): string {
  const noncePart = options.nonce ? `'nonce-${options.nonce}'` : '';
  const scriptTokens = ["'self'", noncePart, options.nonce ? "'strict-dynamic'" : ''];
  if (options.isDev) scriptTokens.push("'unsafe-eval'");
  const styleTokens = ["'self'", options.isDev ? "'unsafe-inline'" : noncePart];

  const directives = [
    STATIC_DIRECTIVES[0],
    `script-src ${scriptTokens.filter(Boolean).join(' ')}`,
    `style-src ${styleTokens.filter(Boolean).join(' ')}`,
    ...STATIC_DIRECTIVES.slice(1),
  ];
  if (options.upgradeInsecure) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export const DENIED_PERMISSIONS = [
  'camera=()',
  'microphone=()',
  'geolocation=()',
  'payment=()',
  'usb=()',
  'bluetooth=()',
  'display-capture=()',
  'autoplay=()',
  'fullscreen=()',
  'midi=()',
  'serial=()',
  'hid=()',
].join(', ');

export const BASE_SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: DENIED_PERMISSIONS },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
];
