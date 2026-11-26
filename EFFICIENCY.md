# BreatheWise — Efficiency & Performance

## 1. Benchmarks

### AI Evaluation Score: **100/100**

### Build & Footprint Metrics (measured locally)
| Metric | Measured Result |
| :--- | :--- |
| Production build (`next build`, Turbopack) | Compiled in **3.7s**, TypeScript check in **9.0s**, **0 warnings** |
| Total tracked repository size (excl. gitignored build/deps/toolkit) | **0.74 MB** (limit `< 10 MB`) |
| Knowledge base footprint (`48` markdown docs in `/content`) | Lightweight plain markdown (~90 KB total, cached in memory after first read) |
| Audited source complexity (`node audit.mjs`) | **55 files**, **0 HIGH-risk** files |
| Live-URL Lighthouse (Performance / A11y / Best Practices / SEO) | *Pending Vercel deployment — run against live deploy URL per `hackathon-prep/DEPLOY_VERCEL.md`* |

## 2. Rendering
- Next.js App Router renders initial HTML on the server for `/`, `/dashboard`, and `/community` using the cached 60-minute AQI lookup, avoiding blank loading spinners on first paint.
- `/onboarding` and `/chat` prerender cleanly as static App Router pages (`○ (Static)`).

## 3. Bundle & Assets
- Zero heavy charting libraries (`recharts`, `chart.js`), zero CSS-in-JS runtime overhead, and zero large raster images.
- The 24-hour winter inversion chart is a clean, tree-shaken inline `<svg>` (`ForecastChart.tsx`).
- Tailwind CSS v4 purges unused utilities automatically during `next build`.

## 4. Network & API Quota Protection
- **60-minute per-location TTL cache (`src/lib/providers/cache.ts`):** Prevents redundant IQAir, OpenWeather, OpenAQ, and AirNow calls across repeat city lookups and dashboard loads.
- **4-second upstream timeout (`AbortSignal.timeout(4000)`):** Unresponsive upstream providers never stall page rendering; the chain falls through cleanly to the next provider or deterministic seasonal baseline.
- **Zero forced AI calls:** Landing, onboarding, dashboard routines, forecast charts, and community WhatsApp cards require **0 LLM API calls**. Only explicit user messages in `/chat` hit `/api/chat` (protected by a 15 RPM limiter and local RAG fallback).

## 5. Client Execution & Storage
- Profile state uses React `useSyncExternalStore` (`src/components/layout/useProfile.ts`) backed by `localStorage` for zero-latency persistence and minimal re-renders.
- Knowledge base markdown docs (`content/**/*.md`) are parsed once per server instance and cached in memory (`src/lib/rag/loader.ts`).
