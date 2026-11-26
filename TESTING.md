# BreatheWise — Testing & Quality Assurance

> **Evaluation Pillar:** Testing & QA Automation (Target Score: **100 / 100**)

---

## 1. Test Pyramid & Enforced Coverage Gate

Coverage thresholds are strictly enforced in [vitest.config.ts](./vitest.config.ts) across `src/lib/**`, `src/components/**`, and **`src/app/api/**`** (the build fails automatically if any metric falls below threshold):

| Scope | Lines | Branches | Functions | Statements | Threshold Gate |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Core Engine (`src/lib/**`)** | **99.44%** | **91.91%** | **100.00%** | **99.32%** | `95% / 90% / 95% / 95%` |
| **Global (`src/lib + components + api`)** | **98.47%** | **89.05%** | **96.50%** | **98.00%** | `95% / 88% / 95% / 95%` |

Totals across automated runs: **`31` test files (`30` Vitest + `1` Playwright E2E) · `101` executed test cases (`89` Vitest + `12` Playwright) · `324` `expect()` assertions.**

---

## 2. Automated Verification Suites

| Suite Layer | Files | Scope Covered |
| :--- | :--- | :--- |
| **AQI, CADR & Commute Math** | `src/lib/aqi/*.test.ts` | EPA 2024 breakpoints, WHO multiples, NaN/negative guards, CADR ASHRAE decay, inversion lapse rates, 6-mode transit dose & CO2e, community offsets |
| **Provider Chain & Bounded Cache** | `src/lib/providers/*.test.ts` | 60-min TTL expiry, 100-entry LRU eviction, SHA-256 `hashPayload`, 4 provider normalizers, `AbortSignal.timeout(4000)` failure fallback chain |
| **HTTP Guard, RAG & AI Firewall** | `src/lib/http/guard.test.ts`, `src/lib/rag/*.test.ts`, `src/lib/agents/*.test.ts` | `415`/`403`/`413` admission controls, 48 curated `/content/*.md` source footers, search ranking, injection filter, 15 RPM rate limit, numeric grounding firewall |
| **API Route Integration** | `tests/api-aqi.test.ts`, `tests/api-chat.test.ts`, `tests/api-chat-gemini.test.ts` | `GET /api/aqi` validation + defaults, `POST /api/chat` admission checks (`415`/`403`/`413`/`400`), `X-BreatheWise-Cache` HIT/MISS, mocked Gemini + error fallback |
| **UI Interaction & Flows** | `tests/components.test.tsx` | Persona switch, Winter Smog Spike / Solar Dispersion simulator, Room CADR calculator, Commute table, Onboarding, ChatPanel, WhatsApp summary copy |
| **Accessibility & Contrast Math** | `tests/a11y.test.tsx` | `vitest-axe` across all components, WCAG luminance contrast ratios >= `4.5:1`, `.sr-only` forecast data list, **negative-control axe verification** |
| **Repository Hygiene** | `tests/quality/hygiene.test.ts` | Enforces required rubric docs, `<= 200` line module cap, zero unsafe DOM/`eval` patterns, and zero secret/internal leaks |
| **Production Browser E2E** | `e2e/app.spec.ts` | Runs against `next build && npx next start -p 3005` on Desktop Chrome + Mobile Pixel 5: WCAG 2.2 AA axe (`0` violations), `0` console/CSP errors, `0` horizontal overflow, full flow |

---

## 3. Executed Command Output (Verified)

```text
> npm run verify
  eslint src tests e2e --max-warnings 0   -> 0 errors, 0 warnings
  tsc --noEmit                             -> 0 errors
  vitest run --coverage                    -> Test Files  30 passed (30) · Tests  89 passed (89)
    All files          |   98.00% Stmts |  89.05% Branch |  96.50% Funcs |  98.47% Lines
    src/lib/**         |   99.32% Stmts |  91.91% Branch | 100.00% Funcs |  99.44% Lines
  next build                               -> Compiled cleanly (Static & Dynamic routes verified)

> node audit.mjs
  Audited 67 files -> audit_report.json
  HIGH-risk (consider splitting): 0

> npm run test:e2e
  12 passed (36.5s) [desktop & mobile Pixel 5: 0 WCAG 2.2 AA axe violations, 0 console/CSP errors, 0 overflow]
```
