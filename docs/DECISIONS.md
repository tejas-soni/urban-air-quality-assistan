# Architecture Decision Records (ADRs) — BreatheWise

## ADR-001: Deterministic Math Engine + Grounded LLM Boundary
- **Context:** Generative models frequently hallucinate numerical PM2.5 doses, EPA AQI category thresholds, and emission factors.
- **Decision:** All AQI interpolation (`bands.ts`), diurnal curves (`baseline.ts`), atmospheric scenario simulation (`scenario.ts`), ventilation/purifier impact (`impact.ts`, `cadr.ts`), inversion risk (`inversion.ts`), and commute dose/CO2e comparisons (`commuteCompare.ts`) live in pure TypeScript under `src/lib/aqi/`. Gemini receives live tool results and curated markdown docs (`content/**/*.md`) and is guarded on both live streams (`liveFirewall.ts`) and fallbacks (`numberFirewall.ts`).
- **Consequence:** Core health and environmental guidance remain deterministic, unit-tested at 99.85% lines, and functional even with zero API keys configured.

## ADR-002: Next.js 16 App Router + Cryptographic CSP Nonce Proxy + System Font Stack
- **Context:** Static inline hydration scripts traditionally required `'unsafe-inline'` in `script-src`, weakening XSS defense, while external web fonts added latency and third-party CSP origins.
- **Decision:** Implement a per-request CSP nonce proxy (`src/proxy.ts` + `src/lib/http/csp.ts`) wired to `await headers()` in `RootLayout` (`src/app/layout.tsx`) alongside a zero-network system font stack (`globals.css`), eliminating `'unsafe-inline'` in production scripts and stylesheets.
- **Consequence:** Strict production CSP (`script-src 'self' 'nonce-...' 'strict-dynamic'`; `style-src 'self' 'nonce-...'`) passes Chromium Playwright E2E across all 5 routes with `0` CSP/console errors.

## ADR-003: Server-Side Multi-Provider AQI Chain + Bounded LRU TTL Cache
- **Context:** Free-tier AQI APIs (IQAir, OpenWeather, OpenAQ, AirNow) impose strict rate limits and intermittent timeouts.
- **Decision:** Encapsulate provider adapters server-side in `src/lib/providers/` behind a `4s` abort timeout, deterministic city baseline fallback, and a 60-minute `TtlCache` capped at `100` LRU entries plus a 10-minute SHA-256 fallback response cache (`hash.ts`, `chatFallbackStream.ts`).
- **Consequence:** API keys remain strictly server-side (`process.env`) and repeat lookups resolve cleanly without draining quotas.

## ADR-004: Zero-Trust API Admission Gate, Bounded Streams & CWE-209 Logging
- **Context:** Public `/api/chat` endpoints face CSRF cross-site/subdomain abuse, un-lengthed chunked body DoS, IP-rotation OOM attacks, prompt injection, and stack-trace leakage.
- **Decision:** `src/lib/http/guard.ts` + `originGuard.ts` enforce `application/json` (`415`), strict `{same-origin, none}` `Sec-Fetch-Site` + `Origin` checks (`403`), streaming chunk cancellation above `8,192` UTF-8 bytes (`413`), memory-bounded rate limiting (`1,000` keys in `rateLimit.ts`), randomized XML data fencing (`promptGuard.ts`), and secret-redacted logging (`logger.ts`).
- **Consequence:** Malformed, cross-origin, cross-subdomain, and overflowing requests abort before touching rate-limit budgets or Gemini.

## ADR-005: Strict Type-Checked ESLint + Architectural Layer Tests (Zero `as` Casts)
- **Context:** Implicit `any` returns from `fetch().json()`, UI component bloat, and silent `catch {}` blocks degrade maintainability.
- **Decision:** Enable `typescript-eslint` `strictTypeChecked`, `stylisticTypeChecked`, `no-deprecated`, and `consistent-type-assertions: never` across `src/`, centralize client `/api/aqi` calls in `src/lib/api/aqiClient.ts` validated by `AqiReadingSchema`, add App Router error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`), and enforce import boundaries via `tests/quality/conventions.test.ts`.
- **Consequence:** Compiler + ESLint + Vitest programmatically fail on any `as` assertion, unvalidated response, layer violation, or excessive complexity.

## ADR-006: WCAG 2.2 AA Twin Representation & Focus-Preserving Controls
- **Context:** Inline charts (`<svg>`) can hide hourly data from screen readers, and `disabled` buttons drop keyboard focus during async fetches.
- **Decision:** Pair `<svg aria-hidden="true">` charts with a structured `.sr-only` `<ul>` readout (`ForecastChart.tsx`), keep `>= 44px` touch targets, enforce `>= 4.5:1` light-theme contrast (`#0369A1`), use `aria-disabled` on busy submit buttons, add keyboard-scroll `tabIndex={0}` regions on horizontal tables (`CommuteExposureTable.tsx`), and verify in Chromium via `@axe-core/playwright`.
- **Consequence:** Zero accessibility violations across Desktop Chrome and Mobile Pixel 5 viewports.
