# Problem Alignment & Requirements Traceability Matrix (RTM) — BreatheWise

> **Evaluation Pillar:** Problem Statement Alignment  
> **Challenge:** Challenge 6 — Urban Air Quality Assistant

---

## 1. Challenge Brief & Operational Problem

Urban households, daily commuters, and school/neighborhood groups face severe winter smog episodes driven by nocturnal radiation cooling and thermal temperature inversions that trap fine particulate matter (PM2.5, PM10) and traffic NO2 near street level. Standard AQI apps only report raw numbers without actionable exposure math, indoor clean-room sizing, or source-grounded explanations.

**BreatheWise** pairs live multi-provider AQI telemetry (with 60-min caching and deterministic winter baselines) with pure TypeScript exposure/CADR/emission math, a 48-document cited WHO/EPA/DEFRA knowledge base in `content/`, and streaming Vercel AI SDK tool calling protected by a programmatic number firewall.

---

## 2. Requirements Traceability Matrix (RTM)

| Req ID | Requirement | Target Persona | Implementation Files | Verification Suite | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | City AQI lookup with IQAir, OpenWeather, OpenAQ, AirNow fallback chain + 60-min bounded LRU cache | All | `src/lib/providers/client.ts`, `chain.ts`, `cache.ts`, `src/app/api/aqi/route.ts` | `client.test.ts`, `mappers.test.ts`, `cache.test.ts`, `api-aqi.test.ts` | Verified |
| **REQ-02** | Family-focused daily routines (school runs, outdoor play windows, afternoon ventilation) | Families | `src/lib/aqi/routineFamily.ts`, `src/lib/aqi/impact.ts`, `content/indoor-hacks/` | `routines.test.ts`, `impact.test.ts`, `components.test.tsx` | Verified |
| **REQ-03** | Interactive Room CADR & DIY Corsi-Rosenthal clearance calculator ($t = -\ln(1-\eta)V/\text{CADR} \times 60$) | Families / Schools | `src/lib/aqi/cadr.ts`, `src/components/aqi/IaqCadrCalculator.tsx` | `cadr.test.ts`, `components.test.tsx`, `e2e/app.spec.ts` | Verified |
| **REQ-04** | Low-emission commute timing shifts & 6-mode transit PM2.5 dose / CO2e table | Commuters | `src/lib/aqi/routineCommuter.ts`, `commuteCompare.ts`, `CommuteExposureTable.tsx` | `commuteCompare.test.ts`, `impact.test.ts`, `components.test.tsx` | Verified |
| **REQ-05** | Thermal inversion stagnation detection + interactive smog spike / solar dispersion simulator | All | `src/lib/aqi/inversion.ts`, `InversionBanner.tsx`, `DashboardView.tsx`, `ForecastChart.tsx` | `inversion.test.ts`, `components.test.tsx`, `e2e/app.spec.ts` | Verified |
| **REQ-06** | Community & school anti-idling action planner with print & WhatsApp share cards | Community Groups | `src/lib/aqi/community.ts`, `routineCommunity.ts`, `CommunityPlanner.tsx`, `ShareCard.tsx` | `community.test.ts`, `components.test.tsx`, `e2e/app.spec.ts` | Verified |
| **REQ-07** | Streaming AI coach (`get_live_aqi` + `search_knowledge_base`) with zero-key local RAG fallback | All | `src/app/api/chat/route.ts`, `tools.ts`, `fallback.ts`, `chatFallbackStream.ts` | `tools.test.ts`, `fallback.test.ts`, `api-chat.test.ts`, `api-chat-gemini.test.ts` | Verified |
| **REQ-08** | Grounded citation discipline & programmatic AI number firewall (never invent unsupported numbers) | All | `src/lib/agents/numberFirewall.ts`, `prompts.ts`, `content/**/*.md` (48 files) | `numberFirewall.test.ts`, `prompts.test.ts`, `loader.test.ts`, `search.test.ts` | Verified |
| **REQ-09** | Zero-trust request gate (`415`/`403`/`413`), strict CSP/HSTS, rate limit, prompt injection guard | Security | `src/lib/http/guard.ts`, `rateLimit.ts`, `next.config.ts`, `.github/workflows/codeql.yml` | `guard.test.ts`, `rateLimit.test.ts`, `api-chat.test.ts` | Verified |
| **REQ-10** | WCAG 2.2 AA accessibility with light theme, `.sr-only` chart twins, contrast math, and 0 violations | Screen Readers / Mobile | `src/app/globals.css`, `ForecastChart.tsx`, `tests/a11y.test.tsx`, `e2e/app.spec.ts` | `tests/a11y.test.tsx`, `e2e/app.spec.ts` | Verified |

---

## 3. Published vs. Model Assumption Provenance

All figures presented in routines and calculators trace explicitly to named standards (`[published]`) or transparent physical bounds (`[assumption]`):

| Metric / Constant | Classification | Citation / Reference |
| :--- | :--- | :--- |
| WHO 24-hour PM2.5 guideline ($15\ \mu\text{g/m}^3$) | `[published]` | WHO Global Air Quality Guidelines (2021) |
| US EPA PM2.5 AQI breakpoints (2024 revision) | `[published]` | US EPA Final Reconsideration of the PM NAAQS (2024) |
| DIY Corsi-Rosenthal 4x MERV-13 CADR ($\approx 480\ \text{m}^3/\text{h}$) | `[published]` | Dal Porto et al. (2022), *Aerosol Sci. Technol.* 56(6) |
| Clean-room target 4.8 ACH & inhalation rates | `[published]` | ASHRAE Clean Room Guidance / US EPA Exposure Factors Handbook (2011) |
| Modal car/bus/metro $\text{g CO}_2\text{e}/\text{pkm}$ factors | `[published]` | UK DESNZ/DEFRA Greenhouse Gas Conversion Factors (2024) |
| In-cabin recirculation & single-zone uniform mixing | `[assumption]` | Explicitly tagged as `[assumption]` in UI & `src/lib/aqi/cadr.ts` |
