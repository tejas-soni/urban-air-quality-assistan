# PLAN.md — BreatheWise: Urban Air Quality Assistant

> Blueprint adapted strictly from `hackathon-prep/examples/PLAN.template-skeleton.md` & `hackathon-prep/PLAN.md`.

## Problem restated (1 sentence)
Help families, commuters, and community groups navigate severe winter smog and urban air pollution with tailored, low-emission daily routines, indoor air hacks, and sustainable alternatives — always backed by live/cached AQI data and a quantified, cited impact explanation.

## How our solution solves it — "BreatheWise"
- **Surface 1 (`/` + `/onboarding`):** Instant city AQI lookup paired with a calm, 3-step persona onboarding (`Family`, `Commuter`, `Community`) that captures location, household sensitivities (kids/elderly), indoor air equipment (HEPA / DIY Corsi-Rosenthal / none), and commute flexibility.
- **Surface 2 (`/dashboard`):** Persona-tailored command center showing live AQI (multi-provider with 60-min cache & fallback chain), WHO 2021 guideline comparison (`15 µg/m³` 24h PM2.5), an accessible 24-hour winter inversion curve (SVG), and ranked routine/impact cards with exact quantified reductions and cited `/content` sources.
- **Surface 3 (`/chat`):** Streaming AI assistant via Vercel AI SDK + Google Gemini (`gemini-2.5-flash`) with live `get_live_aqi` and `search_knowledge_base` tool calls, grounded strictly in `/content` markdown docs (48 docs) and an offline deterministic local RAG fallback when `GEMINI_API_KEY` is absent or rate-limited.
- **Surface 4 (`/community`):** Shareable smog-action plans for schools, neighborhoods, and commuter pools with collective PM2.5 & CO2e estimates, print stylesheet support, and one-click WhatsApp summary export.
- **Why it's not just a chatbot or AQI viewer:** Every routine card, commute shift, and AI recommendation runs through a deterministic pure-function engine + cited WHO/EPA/DEFRA markdown KB so users get verifiable impact math (`"ventilate at 2 PM instead of 8 AM -> ~40% less indoor PM2.5 intake"`) and zero hallucinated statistics.

## AI usage (must work WITHOUT AI)
- **Default / zero-key fallback:** Deterministic RAG retriever (`src/lib/rag/search.ts`) + live/cached AQI lookup (`src/lib/providers/client.ts`) + pure impact engine (`src/lib/aqi/*`) generate complete grounded responses via the same UI stream protocol with **0 API calls** if `GEMINI_API_KEY` is missing or errors.
- **Live Gemini (server-side API route `/api/chat`):** `streamText` with `google('gemini-2.5-flash')`, tool calling (`get_live_aqi`, `search_knowledge_base`), per-IP/session sliding-window rate limit (15 RPM), input clamping (max 800 chars), and prompt-injection framing.

## Tech stack
- Next.js 16 (App Router) + React 19 + TypeScript (`strict: true`) + Tailwind CSS v4
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) + `zod` + `lucide-react`
- Vitest + `@vitest/coverage-v8` + Testing Library + `vitest-axe`
- Playwright + `@axe-core/playwright` + ESLint (`jsx-a11y`, `--max-warnings 0`) + Prettier
- No database: 60-min server in-memory TTL cache for AQI providers + `localStorage` for user profile preferences. Inline SVG only (zero heavy chart/image libs; repo < 10 MB).

## File structure
```text
content/
  health-guidance/*.md     # 16 WHO/EPA clinical & AQI threshold docs with ## Sources
  indoor-hacks/*.md        # 16 ventilation, HEPA, Corsi-Rosenthal, kitchen docs with ## Sources
  impact-data/*.md         # 16 commute, anti-idling, emission factor docs with ## Sources
src/
  app/
    layout.tsx             # Light-theme shell, Inter font, top nav + persona switcher, skip link
    globals.css            # Warm white (#FAFBFC), focus rings, reduced-motion, print styles
    page.tsx               # Landing + instant city AQI lookup + persona quick-start
    onboarding/page.tsx    # Persona + location + lifestyle questions
    dashboard/page.tsx     # Live AQI card + 24h SVG profile + routine impact cards
    chat/page.tsx          # Streaming AI SDK chat with live tools & citations
    community/page.tsx     # Collective smog-action plan generator + print / WhatsApp export
    api/aqi/route.ts       # Server-side IQAir/OpenWeather/OpenAQ/AirNow adapter + 60m cache
    api/chat/route.ts      # Streaming Gemini AI SDK route + tool calling + rate limit + fallback
  components/              # Thin render-only components (all <= 120 LOC where practical)
    layout/{Navbar,Footer}.tsx
    aqi/{AqiBadge,AqiCard,ForecastChart,CitySearchForm}.tsx
    dashboard/{RoutineCard,ImpactSummary,PersonaSwitcher}.tsx
    chat/{ChatPanel,MessageBubble,SuggestedPrompts}.tsx
    community/{CommunityPlanner,ShareCard}.tsx
  lib/                     # Pure domain logic + adapters (target >= 95% coverage)
    types.ts
    schemas.ts
    aqi/{bands,impact,routines,baseline}.ts
    providers/{cache,mappers,client}.ts
    rag/{parser,search,loader}.ts
    agents/{prompts,rateLimit,fallback,tools}.ts
    storage/profile.ts
  test/setup.ts
tests/                     # Component, API route, RAG, and vitest-axe integration tests
e2e/app.spec.ts            # Playwright multi-page journey + @axe-core/playwright WCAG AA scan
```

## Function signatures (pure engine & adapters)
```ts
// src/lib/aqi/bands.ts
export function pm25ToUsAqi(pm25: number): number;
export function classifyAqi(aqi: number): AqiBandInfo;
export function whoGuidelineRatio(pm25: number): number;

// src/lib/aqi/impact.ts
export function estimateVentilationImpact(morningPm25: number, afternoonPm25: number): ImpactEstimate;
export function estimatePurifierImpact(outdoorPm25: number, method: PurifierType): ImpactEstimate;
export function estimateCommuteImpact(distanceKm: number, mode: CommuteMode, shiftLater: boolean): ImpactEstimate;
export function estimateCommunityImpact(households: number, carTripsReplaced: number): ImpactEstimate;

// src/lib/aqi/routines.ts
export function buildPersonaRoutines(reading: AqiReading, profile: UserProfile): RoutineRecommendation[];

// src/lib/aqi/baseline.ts
export function buildBaselineReading(city: string, now?: Date): AqiReading;

// src/lib/providers/cache.ts
export class TtlCache<T> { get(key: string): T | null; set(key: string, value: T): void; clear(): void; }

// src/lib/providers/mappers.ts
export function normalizeIqAir(payload: unknown): Partial<AqiReading> | null;
export function normalizeOpenWeather(current: unknown, forecast: unknown): Partial<AqiReading> | null;
export function normalizeOpenAq(payload: unknown): Partial<AqiReading> | null;
export function normalizeAirNow(payload: unknown): Partial<AqiReading> | null;

// src/lib/rag/parser.ts & search.ts
export function parseMarkdownDoc(slug: string, category: KbCategory, raw: string): KbDoc;
export function searchDocs(docs: KbDoc[], query: string, options?: SearchOptions): KbCitation[];

// src/lib/agents/rateLimit.ts, prompts.ts & fallback.ts
export function checkRateLimit(key: string, nowMs?: number): { allowed: boolean; remaining: number };
export function sanitizeUserQuery(text: string): string;
export function buildPersonaSystemPrompt(profile: UserProfile, aqiContext?: AqiReading): string;
export function buildFallbackAnswer(query: string, profile: UserProfile, aqi: AqiReading, citations: KbCitation[]): string;
```

## Test list (enforced >=95% `src/lib/**`, >=80% global)
- [ ] `bands.test.ts`: `pm25ToUsAqi` breakpoints (0, 9.0, 35.4, 55.4, 150.4, 250.4, 500+), `classifyAqi` all 6 EPA bands + labels + icons, `whoGuidelineRatio`
- [ ] `impact.test.ts`: ventilation shift math, HEPA vs DIY Corsi-Rosenthal vs none, commute emission factors & time shift, community collective math, zero/negative guards
- [ ] `routines.test.ts`: tailored recommendations for `family`, `commuter`, `community` across Good/Unhealthy/Hazardous AQI
- [ ] `baseline.test.ts`: deterministic known cities + unknown city hash fallback + 24h diurnal curve
- [ ] `cache.test.ts` & `mappers.test.ts` & `client.test.ts`: 60-min TTL expiry, all 4 provider normalizers, missing keys -> baseline, provider failure -> next provider fallback
- [ ] `parser.test.ts` & `search.test.ts` & `loader.test.ts`: frontmatter/sources parsing, BM25 ranking + persona boost, loading all 48 `/content` docs & verifying every doc has `sources.length >= 1`
- [ ] `prompts.test.ts` & `rateLimit.test.ts` & `fallback.test.ts`: 15 RPM limit enforcement, input clamp & injection sanitization, grounded citation output
- [ ] `schemas.test.ts`: Zod validation rejects invalid payloads & clamps bounds
- [ ] `tests/*.test.tsx`: Component + API route + `vitest-axe` 0-violation accessibility checks
- [ ] `e2e/app.spec.ts`: Full Playwright E2E flow across `/`, `/onboarding`, `/dashboard`, `/chat`, `/community` + `@axe-core/playwright` 0 WCAG 2.1 AA violations

## Build order (commit + tag after each GREEN gate)
1. [ ] Scaffold Next.js + configs + `verify` gate + CI -> `git tag stable-0`
2. [ ] `src/lib/**` pure engine + unit tests (>=95% coverage) -> `git tag stable-1`
3. [ ] Seed 48 curated `/content` markdown docs + RAG tests -> `git tag stable-2`
4. [ ] Server API routes (`/api/aqi`, `/api/chat`) + provider fallback tests -> `git tag stable-3`
5. [ ] Accessible light-theme UI (`/`, `/onboarding`, `/dashboard`, `/chat`, `/community`) + component/axe tests -> `git tag stable-4`
6. [ ] Playwright E2E + `@axe-core/playwright` + `audit.mjs` + filled 6 rubric docs -> `git tag stable-5`

## Accessibility notes specific to THIS app
- Light theme only (`#FAFBFC` background, `#FFFFFF` cards, `#0284C7` `sky-600` primary, contrast >= 4.5:1).
- Standard AQI color badges ALWAYS include text band name + icon + AQI integer (never color-only).
- Skip-to-content link, landmark layout (`<header>`, `<nav>`, `<main>`, `<footer>`), one `<h1>` per route, associated `<label>` on every control, `aria-live="polite"` on chat stream & AQI updates, `@media (prefers-reduced-motion: reduce)`.

## Definition of Done (per step)
Runs · `npm run verify` GREEN (pasted output) · lint 0 warnings · `node audit.mjs` 0 HIGH risk · committed + tagged on `main`.
