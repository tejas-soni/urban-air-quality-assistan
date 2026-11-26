# BreatheWise — Efficiency & Performance

> **Evaluation Pillar:** Efficiency & Resource Management (Target Score: **100 / 100**)

---

## 1. Measured Browser & Runtime Metrics

Verified against production `next build && next start` (with per-request CSP nonce proxy active):

| Verification Metric | Measured Result |
| :--- | :---: |
| **Lighthouse Accessibility** (`--preset=desktop`) | **100 / 100** |
| **Lighthouse SEO** | **100 / 100** |
| **Lighthouse Best Practices** | **96 / 100** |
| **Agentic Browsing Readiness** (`llms.txt`, `ard.json`, `robots.txt`, `sitemap.xml`) | **100%** |
| **Desktop & Mobile E2E Full Journey** (Playwright across 5 routes) | **12 / 12 passed (`0` console/CSP errors)** |

> *Note:* Adding per-request cryptographic CSP nonces (`src/proxy.ts` + `await headers()`) intentionally switches HTML routes from static build caching to per-request dynamic SSR (`ƒ`) to guarantee nonces never repeat across requests. Baseline static FCP/LCP prior to nonce dynamic SSR measured `0.4s` / `100` Perf.

---

## 2. Footprint, Asset & Rendering Efficiency

- **Repository Footprint:** Compact tracked source, configuration, 48 markdown docs, and evaluation docs (`< 1 MB`, well under the `10 MB` budget).
- **Zero Heavy Charting or Font Requests:** Uses lightweight native inline `<svg>` (`ForecastChart.tsx`) instead of Recharts/Chart.js/D3, inline SVG favicon (`src/app/icon.svg`), and system UI fonts (`src/app/globals.css`) so zero external font fetches block rendering or widen CSP `font-src`.
- **Client Request Cancellation & Memoization:** Uses `React.useMemo` for routine/scenario computations and `AbortController` cleanup (`fetchCityAqiClient` in `LandingView.tsx`, `DashboardView.tsx`, and `CommunityPlanner.tsx`) to abort stale city searches immediately on rapid input or unmount.
- **Agentic Discovery & Crawl Efficiency:** Ships valid [public/robots.txt](./public/robots.txt), [public/sitemap.xml](./public/sitemap.xml), [public/llms.txt](./public/llms.txt), and [public/.well-known/ard.json](./public/.well-known/ard.json).

---

## 3. Caching & API Quota Protection

1. **60-Minute Bounded LRU AQI Cache ([src/lib/providers/cache.ts](./src/lib/providers/cache.ts)):** Normalizes city names and caps in-memory storage at `100` LRU entries with 60-min TTL expiry (`s-maxage=3600, stale-while-revalidate=600` on `/api/aqi`), protecting free-tier AQI quotas.
2. **4-Second Upstream Timeouts ([src/lib/providers/http.ts](./src/lib/providers/http.ts)):** Every upstream fetch enforces `AbortSignal.timeout(4000)` so a slow external API immediately yields to the next provider or deterministic baseline.
3. **SHA-256 Grounded Fallback Cache ([src/lib/providers/hash.ts](./src/lib/providers/hash.ts), [chatFallbackStream.ts](./src/lib/agents/chatFallbackStream.ts)):** Hashes `(query, persona, city, aqi)` into a 16-char SHA-256 key (`X-BreatheWise-Cache: HIT` vs `MISS`) for sub-millisecond repeated responses.
4. **Zero Forced LLM Calls:** City AQI lookups, winter inversion simulation, Room CADR sizing, 6-mode commute dose tables, routine planning, and community WhatsApp cards execute 100% locally with zero LLM tokens unless the user submits an interactive chat question.
