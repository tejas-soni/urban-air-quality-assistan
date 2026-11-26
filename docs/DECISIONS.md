# Architecture Decision Records (ADRs) — BreatheWise

## ADR-001: Deterministic Math Engine + Grounded LLM Boundary
- **Context:** Generative models frequently hallucinate numerical PM2.5 doses, EPA AQI category thresholds, and emission factors.
- **Decision:** All AQI interpolation (`bands.ts`), diurnal curves (`baseline.ts`), ventilation/purifier impact (`impact.ts`, `cadr.ts`), inversion risk (`inversion.ts`), and commute dose/CO2e comparisons (`commuteCompare.ts`) live in pure TypeScript under `src/lib/aqi/`. Gemini receives live tool results and curated markdown docs (`content/**/*.md`) and is guarded by `numberFirewall.ts`.
- **Consequence:** Core health and environmental guidance remain 100% deterministic, testable, and functional even with zero API keys configured.

## ADR-002: Next.js App Router + System Font Stack Under Strict CSP
- **Context:** External Google Fonts requests introduce third-party network latency and broaden CSP `font-src` surface.
- **Decision:** Use a crisp system font stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`) paired with strict `Content-Security-Policy`, `Strict-Transport-Security`, `COOP`, `CORP`, and `Permissions-Policy` in `next.config.ts`.
- **Consequence:** Fast FCP/LCP with zero external font requests and `0` console/CSP errors verified in Playwright.

## ADR-003: Server-Side Multi-Provider AQI Chain + Bounded LRU TTL Cache
- **Context:** Free-tier AQI APIs (IQAir, OpenWeather, OpenAQ, AirNow) impose strict rate limits and intermittent timeouts.
- **Decision:** Encapsulate provider adapters server-side in `src/lib/providers/` behind a `4s` abort timeout, deterministic city baseline fallback, and a 60-minute `TtlCache` capped at `100` LRU entries plus a 10-minute SHA-256 fallback response cache (`hash.ts`, `chatFallbackStream.ts`).
- **Consequence:** API keys stay strictly server-side (`process.env`) and repeat city lookups resolve from memory without hitting provider quotas.

## ADR-004: Zero-Trust API Request Admission Gate
- **Context:** Public `/api/chat` routes risk CSRF cross-origin quota drain and oversized JSON denial-of-service payloads.
- **Decision:** `src/lib/http/guard.ts` enforces `application/json` (`415`), `Origin` / `Sec-Fetch-Site` same-origin checks (`403`), pre-parse `8 KB` byte limits (`413`), and Zod schema validation (`400`) with `Cache-Control: no-store`.
- **Consequence:** Malformed, cross-origin, and oversized requests fail before touching rate-limit quota or upstream LLMs.

## ADR-005: WCAG 2.2 AA Twin Representation & Focus-Preserving Controls
- **Context:** Inline charts (`<svg>`) can hide hourly data from screen readers, and `disabled` buttons drop keyboard focus during async fetches.
- **Decision:** Pair `<svg aria-hidden="true">` charts with a structured `.sr-only` `<ul>` readout (`ForecastChart.tsx`), keep `>= 44px` touch targets, enforce `>= 4.5:1` light-theme contrast (`#0369A1`), use `aria-disabled` on busy submit buttons, and verify in Chromium via `@axe-core/playwright`.
- **Consequence:** Zero accessibility violations across desktop and mobile viewports.
